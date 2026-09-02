-- Craft & Cup - atomic account deletion. RAN AND VERIFIED 2026-09-01.
-- Closes audit checks 16, 29, 97, 128, 129 and 130.
--
-- THREE PROBLEMS IN THE OLD FLOW, all found while remediating the audit:
--
-- 1. THE LOGIN SURVIVED. The client deleted rows from eleven tables and the
--    profile, but never the auth.users row, because a browser client cannot.
--    A user who deleted their account could still sign in afterwards. That
--    directly contradicts the erasure promise in /privacy.
--
-- 2. NOT ATOMIC, AND UNCHECKED. Eleven separate deletes, no error checked on
--    any of them. A failure at step five left the account half-deleted while
--    the user was signed out and told it had worked. One function call is one
--    transaction, so this is now all-or-nothing.
--
-- 3. SENT NOTIFICATIONS SURVIVED. The old code deleted notifications where
--    user_id matched, but notifications this user SENT carry their screenname
--    in the message text and were keyed on actor_id. Identifying data was
--    left behind in other users' inboxes.
--
-- error_event rows are now deleted explicitly. They were ON DELETE SET NULL,
-- which orphaned them with their content intact rather than removing them.
--
-- STORAGE IS STILL CLIENT-SIDE. Supabase blocks direct deletion from
-- storage.objects, so files must go through the Storage API before this is
-- called. That path was fixed separately (see supabase-storage-owner-read.sql)
-- and now fails loudly rather than silently leaving photos published.
--
-- VERIFIED in a rolled-back transaction: beans 3 -> 0, profile removed, and
-- auth.users 1 -> 0. Paired with a client change that calls this once and then
-- signs out with scope 'global', so a session on another device cannot
-- outlive the account.

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path to 'public', 'auth', 'pg_temp'
as $fn$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  delete from public.reactions      where user_id = v_uid;
  delete from public.comments       where user_id = v_uid;
  delete from public.notifications  where user_id = v_uid or actor_id = v_uid;
  delete from public.shared_items   where sender_id = v_uid or receiver_id = v_uid;
  delete from public.friendships    where requester_id = v_uid or receiver_id = v_uid;
  delete from public.activity       where user_id = v_uid;
  delete from public.collections    where user_id = v_uid;
  delete from public.recipes        where user_id = v_uid;
  delete from public.beans          where user_id = v_uid;
  delete from public.ai_usage       where user_id = v_uid;
  delete from public.rec_usage      where user_id = v_uid;
  delete from public.reports        where reporter_id = v_uid;
  delete from public.error_event    where user_id = v_uid;
  delete from public.profiles       where id = v_uid;

  -- The authentication account itself. This is the line the old flow could
  -- not have: a browser client has no privilege to touch auth.users.
  delete from auth.users where id = v_uid;
end
$fn$;

revoke execute on function public.delete_my_account() from public, anon;
grant  execute on function public.delete_my_account() to authenticated;

-- Report
select 'delete_my_account exists' as check,
  case when to_regprocedure('public.delete_my_account()') is not null
       then 'present' else 'MISSING' end as actual, 'present' as expected
union all select 'anon cannot call',
  case when has_function_privilege('anon','public.delete_my_account()','execute')
       then 'YES (BAD)' else 'no' end, 'no'
union all select 'authenticated can call',
  case when has_function_privilege('authenticated','public.delete_my_account()','execute')
       then 'yes' else 'NO (BAD)' end, 'yes';
