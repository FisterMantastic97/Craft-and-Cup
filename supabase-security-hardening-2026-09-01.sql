-- Craft & Cup - security hardening, 2026-09-01. ALL FOUR RAN AND VERIFIED.
--
-- These came out of an adversarial pass: instead of reviewing config, each
-- item was found by attempting the attack against production, then re-tested
-- after the fix to confirm it actually failed. Two were exploitable.
--
-- Root cause shared by items 2 and 4: RLS is ROW level, not COLUMN level.
-- The policies correctly answered "which rows may I touch" and said nothing
-- about "which columns may I set, and to what". That gap is invisible when
-- reading policies, because the policies are not wrong.

-- ============================================================
-- 1. Storage upload limits (abuse vector)
-- ============================================================
-- Both buckets were public with no server-side size or MIME limit. The app
-- checks 5MB and image-only in the browser, but that is advisory: a signed-in
-- user could bypass it with a direct storage call and host arbitrary files of
-- arbitrary size on the domain.
-- VERIFIED AFTER: text/html upload rejected 'invalid_mime_type'; 6MB rejected.

update storage.buckets
set file_size_limit    = 5242880,  -- 5 MB, matching the client-side check
    allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif']
where name in ('bean-images','recipe-images');

-- ============================================================
-- 2. Profile privilege escalation (EXPLOITED)
-- ============================================================
-- Any signed-in user could run
--   PATCH /rest/v1/profiles?id=eq.<their own id>  {"plan":"paid"}
-- and grant themselves an unmetered AI quota, billing to the Anthropic
-- account. Confirmed live: HTTP 200, value changed. guard_profile_role()
-- covered `role`. Nothing covered `plan`.
-- VERIFIED AFTER: same request now returns 403 permission denied; bio edits
-- still work.

revoke update on public.profiles from authenticated;
grant update (screenname, bio, is_public, updated_at)
  on public.profiles to authenticated;

-- ============================================================
-- 3. Friend-request consent bypass (EXPLOITED)
-- ============================================================
-- The requester could send a request and immediately set status='accepted'
-- on their own row, forcing into someone's friends list and their
-- friends-only feed without consent.
--
-- A policy alone cannot fix this. The UPDATE policy must allow either party
-- (friends.js lets either side revive a declined row, which swaps requester
-- and receiver). A WITH CHECK only sees the NEW row, so an attacker can set
-- status='accepted' AND swap receiver_id to themselves in one statement and
-- satisfy any check written against the new values. A trigger can compare
-- against OLD, which is the state before the swap.
-- VERIFIED AFTER: self-accept blocked, swap-then-accept blocked, receiver
-- accept still works, reactivate still works.

create or replace function public.guard_friendship_accept()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
begin
  if new.status = 'accepted' and old.status is distinct from 'accepted' then
    if auth.uid() is not null and auth.uid() is distinct from old.receiver_id then
      raise exception 'only the recipient can accept a friend request';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_friendship_accept_trg on public.friendships;
create trigger guard_friendship_accept_trg
  before update on public.friendships
  for each row execute function public.guard_friendship_accept();

revoke execute on function public.guard_friendship_accept() from public, anon, authenticated;

-- ============================================================
-- 4. Comments leaked from private posts
-- ============================================================
-- The comments SELECT policy was `using (true)`, so any anonymous visitor
-- with the publishable key could read EVERY comment, including those on
-- friends-only and private activity. The activity table has a careful
-- visibility rule; comments ignored it. The policy below mirrors that rule so
-- the two cannot drift into disagreeing about who may see what.
-- VERIFIED AFTER: anon sees 0 comments on a private post, still sees comments
-- on public posts, owner still sees their own.

drop policy if exists "Anyone can view comments" on public.comments;

create policy "View comments on visible activity" on public.comments
  for select to public
  using (
    exists (
      select 1 from public.activity a
      where a.id = comments.activity_id
        and (
          a.user_id = auth.uid()
          or a.is_public = true
          or exists (
            select 1 from public.friendships f
            where f.status = 'accepted'
              and (
                (f.requester_id = auth.uid() and f.receiver_id = a.user_id)
                or (f.receiver_id = auth.uid() and f.requester_id = a.user_id)
              )
          )
        )
    )
  );

-- ============================================================
-- KNOWN, NOT YET FIXED: notification forgery
-- ============================================================
-- The notifications INSERT policy checks only auth.uid() = actor_id. It does
-- not constrain user_id (the recipient) or message, and sendNotification()
-- passes arbitrary text that renders straight into the bell. Any signed-in
-- user can push arbitrary text to any other user, which is a phishing
-- channel. React escapes the string, so there is no XSS.
--
-- Correct fix is a SECURITY DEFINER function taking (recipient, type,
-- reference) that builds the message server-side, with direct INSERT revoked
-- from authenticated. That touches all ten sendNotification() call sites, so
-- it is a code change, not a migration.
