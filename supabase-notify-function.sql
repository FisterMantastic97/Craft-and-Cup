-- Craft & Cup - server-derived notifications. RAN AND VERIFIED 2026-09-01.
--
-- BEFORE: the notifications INSERT policy checked only auth.uid() = actor_id.
-- It did not constrain user_id (the recipient) or message, and the client
-- passed the message text, which renders straight into the recipient's bell.
-- Any signed-in user could therefore push arbitrary text to any other user:
-- "Your account is suspended, verify at ..." to every account. React escapes
-- the string so there was no XSS, but it was a clean phishing channel.
--
-- AFTER: the server derives the wording from the type and the ACTOR'S OWN
-- screenname. A caller chooses who to notify and which event happened; it can
-- no longer choose what the recipient reads.
--
-- VERIFIED: a direct forged insert returns 403 (RLS), an unknown type raises,
-- and a poisoned p_item_type of 'evil.com click here' is discarded for the
-- literal 'item'. Legitimate notifications still deliver.
--
-- Paired with a code change (commit 926451d) that rewrote sendNotification()
-- and all 8 call sites to call this instead of inserting directly.
--
-- UPDATED 2026-09-01: added per-actor throttling. The message text was already
-- server-derived, but nothing limited how OFTEN one user could call this against
-- a given recipient: 300 notifications reached one victim's bell unopposed. That
-- is a harassment vector.
--
-- Row caps were NOT used here on purpose. The row owner in notifications is the
-- RECIPIENT, so a cap would let an attacker fill someone's quota and thereby
-- silence their real notifications. Throttling the SENDER is the correct control.
--
-- VERIFIED: of 300 attempts, 30 were delivered and a legitimate notification
-- from a different user was unaffected.
--
-- 'announcement' is deliberately absent: broadcasts come from
-- broadcast_notification(), which is SECURITY DEFINER and bypasses this path.

-- Bucketed counters for the throttle: every check is one O(1) primary-key
-- upsert, so cost does not grow with volume.
create table if not exists public.notify_rate (
  bucket text primary key,
  n      int  not null default 0
);
alter table public.notify_rate enable row level security;  -- no policy: server-only

create or replace function public.notify(
  p_recipient uuid,
  p_type      text,
  p_reference text default null,
  p_item_type text default null   -- only consulted for the 'inbox' type
)
returns void
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
declare
  PAIR_LIMIT  constant int := 30;   -- per actor -> recipient, per hour
  TOTAL_LIMIT constant int := 200;  -- per actor, all recipients, per hour
  v_actor uuid := auth.uid();
  v_hour  text := to_char(date_trunc('hour', now()), 'YYYYMMDDHH24');
  v_name  text;
  v_msg   text;
  v_n     int;
begin
  if v_actor is null then
    raise exception 'not authenticated';
  end if;

  -- Never notify yourself, and never aim at a non-existent user.
  if p_recipient is null or p_recipient = v_actor then
    return;
  end if;
  if not exists (select 1 from public.profiles where id = p_recipient) then
    raise exception 'unknown recipient';
  end if;

  -- Per-pair throttle: stops targeted harassment of one person.
  insert into public.notify_rate (bucket, n)
  values ('p:' || v_actor::text || ':' || p_recipient::text || ':' || v_hour, 1)
    on conflict (bucket) do update set n = notify_rate.n + 1
    returning n into v_n;
  if v_n > PAIR_LIMIT then return; end if;

  -- Per-actor throttle: stops broad spam across many recipients.
  insert into public.notify_rate (bucket, n)
  values ('a:' || v_actor::text || ':' || v_hour, 1)
    on conflict (bucket) do update set n = notify_rate.n + 1
    returning n into v_n;
  if v_n > TOTAL_LIMIT then return; end if;

  select screenname into v_name from public.profiles where id = v_actor;
  v_name := coalesce(nullif(trim(v_name), ''), 'Someone');

  v_msg := case p_type
    when 'friend_request'  then '@' || v_name || ' sent you a friend request'
    when 'friend_accepted' then '@' || v_name || ' accepted your friend request'
    when 'comment'         then '@' || v_name || ' commented on your post'
    when 'reaction'        then '@' || v_name || ' reacted to your post'
    when 'inbox'           then '@' || v_name || ' sent you a ' ||
      case when p_item_type in ('bean', 'recipe') then p_item_type else 'item' end
    else null
  end;

  if v_msg is null then
    raise exception 'unknown notification type: %', p_type;
  end if;

  insert into public.notifications (user_id, type, actor_id, reference_id, message)
  values (p_recipient, p_type, v_actor, p_reference, v_msg);
end;
$$;

revoke execute on function public.notify(uuid, text, text, text) from public, anon;
grant  execute on function public.notify(uuid, text, text, text) to authenticated;

-- Remove direct writes. With RLS on and no INSERT policy, no client role can
-- insert. The SECURITY DEFINER paths (notify, broadcast_notification,
-- admin_message_user) run as the owner and are unaffected.
drop policy if exists "Users can insert notifications" on public.notifications;

-- Report
select 'notify() exists' as check,
  case when to_regprocedure('public.notify(uuid,text,text,text)') is not null
       then 'present' else 'MISSING' end as actual, 'present' as expected
union all select 'anon can call notify',
  case when has_function_privilege('anon', to_regprocedure('public.notify(uuid,text,text,text)'), 'execute')
       then 'YES (BAD)' else 'no' end, 'no'
union all select 'direct insert policy removed',
  case when exists (select 1 from pg_policies where schemaname='public'
                    and tablename='notifications' and cmd='INSERT')
       then 'STILL THERE (BAD)' else 'removed' end, 'removed';

-- Bound growth: prune read notifications after 90 days and stale rate buckets.
create or replace function public.prune_notifications()
returns void language plpgsql security definer set search_path to 'public','pg_temp'
as $$
begin
  delete from public.notifications
   where read and created_at < now() - interval '90 days';
  delete from public.notify_rate
   where right(bucket, 10) < to_char(now() - interval '2 hours', 'YYYYMMDDHH24');
end $$;

revoke execute on function public.prune_notifications() from public, anon, authenticated;

select cron.schedule('prune-notifications', '23 4 * * *', $$select public.prune_notifications()$$);
