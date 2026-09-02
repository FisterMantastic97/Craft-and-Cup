-- Craft & Cup - CRITICAL: privilege escalation at signup. FIXED AND VERIFIED
-- 2026-09-01.
--
-- THE EXPLOIT: any brand new user could make themselves an owner on their
-- first sign-in, simply by creating their own profile row:
--
--   POST /rest/v1/profiles
--   { "id": "<their own uid>", "screenname": "x", "role": "owner", "plan": "paid" }
--
-- Verified: the insert succeeded and produced role=owner, plan=paid. That
-- grants admin_list_users (every user's data), admin_set_user (change anyone's
-- role), broadcast_notification, admin_message_user, and unmetered AI.
-- Complete administrative compromise, available to anyone who signs up.
--
-- WHY THREE CONTROLS ALL MISSED IT:
--
-- 1. The column lockdown revoked UPDATE on role and plan but NOT INSERT. That
--    was my own incomplete fix: the escalation found earlier was an UPDATE, so
--    the fix addressed UPDATE and stopped there.
--
-- 2. The INSERT policy checks only `auth.uid() = id`, which is satisfied: the
--    attacker is inserting their OWN row. RLS was working exactly as written.
--
-- 3. guard_profile_role_trg fired BEFORE UPDATE only. A first-sign-in insert
--    walked straight past the guard that exists precisely to stop this.
--
-- The FK to auth.users is not a defence: a real new user genuinely exists in
-- auth.users and genuinely has no profile row yet. That is the normal state of
-- every signup.
--
-- FIX 1: column grants. INSERT is now restricted to the columns a user may
-- legitimately set for themselves, mirroring the UPDATE grant.
-- FIX 2: the trigger now fires on INSERT as well, forcing role='user' and
-- plan='free' on any self-created profile. Two independent layers, because
-- either one alone was what failed here.
--
-- VERIFIED AFTER: the insert is refused (SQLSTATE 42501), the resulting
-- account has no admin access, and a normal signup still works and lands on
-- role='user'. Live check through the production API: an escalation PATCH
-- returns 403 while an ordinary bio edit returns 204.

-- FIX 1 ------------------------------------------------------------------
revoke insert on public.profiles from authenticated;
grant insert (id, screenname, bio, is_public, avatar_url, created_at, updated_at)
  on public.profiles to authenticated;

-- FIX 2 ------------------------------------------------------------------
create or replace function public.guard_profile_role()
returns trigger language plpgsql security definer set search_path to 'public','pg_temp'
as $fn$
declare FOUNDER constant uuid := 'c54ef74b-de38-425f-b536-6854b5e5d75e';
begin
  if TG_OP = 'INSERT' then
    -- A self-created profile is always an ordinary free user. Roles and plans
    -- are assigned by admin functions or by hand, never by the row's own owner.
    new.role := 'user';
    new.plan := 'free';
    return new;
  end if;

  -- UPDATE: nobody may change their own role or plan, and the founder cannot
  -- be demoted by another admin.
  if new.role is distinct from old.role or new.plan is distinct from old.plan then
    if old.id = FOUNDER and new.role is distinct from old.role then
      raise exception 'founder role is pinned';
    end if;
    if not exists (select 1 from public.profiles p
                    where p.id = auth.uid() and p.role in ('admin','owner')) then
      new.role := old.role;
      new.plan := old.plan;
    end if;
  end if;
  return new;
end
$fn$;

drop trigger if exists guard_profile_role_trg on public.profiles;
create trigger guard_profile_role_trg
  before insert or update on public.profiles
  for each row execute function public.guard_profile_role();

-- Report
select 'role insertable by user' as check,
  case when has_column_privilege('authenticated','public.profiles','role','insert')
       then 'YES (BAD)' else 'no' end as actual, 'no' as expected
union all select 'plan insertable by user',
  case when has_column_privilege('authenticated','public.profiles','plan','insert')
       then 'YES (BAD)' else 'no' end, 'no'
union all select 'screenname still insertable',
  case when has_column_privilege('authenticated','public.profiles','screenname','insert')
       then 'yes' else 'NO (BAD)' end, 'yes'
union all select 'guard fires on insert',
  case when (select (tgtype & 4) = 4 from pg_trigger
              where tgname='guard_profile_role_trg' and not tgisinternal)
       then 'yes' else 'NO (BAD)' end, 'yes';
