-- Craft & Cup - friendship consent bypass via INSERT. FIXED AND VERIFIED
-- 2026-09-01. HIGH: this was live cross-user data access.
--
-- THE EXPLOIT: skip the request/accept handshake by inserting a friendship
-- that is ALREADY accepted:
--
--   POST /rest/v1/friendships
--   { "requester_id": "<me>", "receiver_id": "<victim>", "status": "accepted" }
--
-- Verified: the row was created with status 'accepted' and the attacker could
-- immediately read the victim's friends-only activity. No consent, no
-- notification, nothing the victim could see or refuse.
--
-- SAME ROOT CAUSE AS THE SIGNUP ESCALATION (see
-- supabase-signup-escalation-fix.sql): the guard trigger fired BEFORE UPDATE
-- only. Its whole design compares against OLD.receiver_id to defeat the
-- direction-swap attack, and OLD does not exist on an INSERT, so the entire
-- guard was simply absent from the insert path.
--
-- This is the second instance of one pattern found in the same sweep: a
-- control written for the operation where a bug was FOUND, rather than for
-- every operation that can reach the same state. Worth remembering when
-- adding any future guard: enumerate the events, do not assume UPDATE.
--
-- FIX: the trigger now fires on INSERT as well. A newly inserted friendship
-- is always forced to 'pending', and the requester must be the caller.
-- Acceptance stays where it belongs, with the receiver, on UPDATE.
--
-- VERIFIED AFTER: a forced insert lands as 'pending'; self-accept is blocked;
-- forging a request in someone else's name is blocked; the victim's
-- friends-only posts are no longer visible (0); and the legitimate path, the
-- receiver accepting, still works.
--
-- FOLLOW-UP (same day): the first version of this trigger raised on ANY insert
-- where requester_id did not equal auth.uid(), including server-side inserts
-- where auth.uid() is null. That broke admin and migration paths. The null
-- check above is the correction. Re-verified afterwards: a server-side insert
-- works, and a client forcing status=accepted still lands on pending.
--
-- VISIBILITY MATRIX re-tested after this change, all seven cases correct:
--   pending=0, accepted=1, accepted-reverse-direction=1, declined=0,
--   unfriended=0, comments-pending=0, comments-accepted=1.

create or replace function public.guard_friendship_accept()
returns trigger language plpgsql security definer set search_path to 'public','pg_temp'
as $fn$
begin
  -- No authenticated caller means this is a server-side path (service role,
  -- migration, admin function). Those already bypass RLS and are trusted, so
  -- the client-facing guards below do not apply. Without this the trigger
  -- blocked legitimate server-side inserts, which the first version did.
  if auth.uid() is null then
    return new;
  end if;

  if TG_OP = 'INSERT' then
    -- A friendship can only ever START as pending. Consent is the receiver
    -- moving it to accepted, handled by the UPDATE branch below.
    if new.status is distinct from 'pending' then
      new.status := 'pending';
    end if;
    -- You may only create a request in which you are the requester.
    if new.requester_id is distinct from auth.uid() then
      raise exception 'you can only send friend requests as yourself';
    end if;
    return new;
  end if;

  -- UPDATE: only the row's ORIGINAL receiver may move it to accepted.
  -- Comparing against OLD.receiver_id defeats the direction-swap variant,
  -- where an attacker rewrites requester/receiver and status in one statement.
  if new.status = 'accepted' and old.status is distinct from 'accepted' then
    if auth.uid() is distinct from old.receiver_id then
      raise exception 'only the recipient can accept a friend request';
    end if;
  end if;
  return new;
end
$fn$;

drop trigger if exists guard_friendship_accept_trg on public.friendships;
create trigger guard_friendship_accept_trg
  before insert or update on public.friendships
  for each row execute function public.guard_friendship_accept();

-- Report
select 'guard fires on insert' as check,
  case when (select (tgtype & 4) = 4 from pg_trigger
              where tgname='guard_friendship_accept_trg' and not tgisinternal)
       then 'yes' else 'NO (BAD)' end as actual, 'yes' as expected
union all select 'guard fires on update',
  case when (select (tgtype & 16) = 16 from pg_trigger
              where tgname='guard_friendship_accept_trg' and not tgisinternal)
       then 'yes' else 'NO (BAD)' end, 'yes';
