-- Craft & Cup - role hierarchy and column validation. VERIFIED 2026-09-01.
--
-- FINDING 1 (MEDIUM): an admin could promote THEMSELVES to owner.
--   admin_set_user checked that the CALLER was an admin. It never checked that
--   the TARGET was someone else, nor that granting 'owner' required being one.
--   Verified: a user with role='admin' called admin_set_user on their own id
--   with role='owner' and became owner. Any admin could also mint other owners,
--   which makes the admin/owner distinction decorative.
--
-- FINDING 2 (LOW): profiles had NO check constraints at all. role and plan
--   accepted any string. The function validated them, so nothing invalid got
--   in, but the column itself had no opinion: one code path that skipped the
--   function would have written anything.
--
-- FIXED IN THE TRIGGER, NOT THE FUNCTION. A guard in admin_set_user only
-- covers admin_set_user. The trigger covers every path that can ever update
-- the row, which is the lesson from the two INSERT bypasses found in the same
-- sweep (see supabase-signup-escalation-fix.sql and
-- supabase-friendship-consent-fix.sql).
--
-- RULES NOW ENFORCED AT THE DATA LAYER:
--   * nobody changes their own role, admin or not
--   * only an owner may grant the owner role
--   * the founder cannot be demoted by anyone
--   * plan changes are an admin power, but not for yourself
--   * role and plan are constrained to known values
--
-- VERIFIED: owner promotes to admin (works); admin self-promote to owner
-- (blocked); admin self-grants paid (reverted); admin demotes founder
-- (blocked); owner grants owner (works); invalid role (blocked by constraint).
-- Live: admin_overview, admin_list_users and admin_usage all still return 200.
--
-- FOLLOW-UP (same day): the first version forced role=user on EVERY insert,
-- including server-side ones, so seeding an admin account silently produced a
-- normal user. The null-caller check above is the correction. Re-verified:
-- a server-side seed keeps role=admin, the client escalation is still refused
-- (42501), and an ordinary signup still lands on role=user.

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add  constraint profiles_role_check
  check (role in ('user','admin','owner'));
alter table public.profiles drop constraint if exists profiles_plan_check;
alter table public.profiles add  constraint profiles_plan_check
  check (plan in ('free','paid'));

create or replace function public.guard_profile_role()
returns trigger language plpgsql security definer set search_path to 'public','pg_temp'
as $fn$
declare
  FOUNDER constant uuid := 'c54ef74b-de38-425f-b536-6854b5e5d75e';
  v_caller uuid := auth.uid();
  v_caller_role text;
begin
  -- Server-side paths (service role, migrations, admin seeding) have no
  -- auth.uid() and already bypass RLS, so the client guards below do not apply.
  -- Without this, a seeded admin account was silently downgraded to 'user',
  -- which the first version of this trigger did.
  if v_caller is null then
    return new;
  end if;

  if TG_OP = 'INSERT' then
    -- A self-created profile is always an ordinary free user.
    new.role := 'user';
    new.plan := 'free';
    return new;
  end if;

  if new.role is distinct from old.role then
    if old.id = FOUNDER then
      raise exception 'founder role is pinned';
    end if;

    select role into v_caller_role from public.profiles where id = v_caller;

    -- Nobody changes their OWN role. This is the actual fix: admin_set_user
    -- verified the caller was an admin but not that the target was someone else.
    if old.id = v_caller then
      raise exception 'you cannot change your own role';
    end if;

    -- Only an owner may mint another owner.
    if new.role = 'owner' and coalesce(v_caller_role,'') <> 'owner' then
      raise exception 'only an owner can grant the owner role';
    end if;

    if coalesce(v_caller_role,'') not in ('admin','owner') then
      new.role := old.role;
    end if;
  end if;

  -- Plan changes remain an admin power, but not for yourself.
  if new.plan is distinct from old.plan then
    select role into v_caller_role from public.profiles where id = v_caller;
    if coalesce(v_caller_role,'') not in ('admin','owner') or old.id = v_caller then
      new.plan := old.plan;
    end if;
  end if;

  return new;
end
$fn$;

-- Report
select 'role check constraint' as check,
  case when exists (select 1 from pg_constraint
        where conrelid='public.profiles'::regclass and conname='profiles_role_check')
       then 'present' else 'MISSING' end as actual, 'present' as expected
union all select 'plan check constraint',
  case when exists (select 1 from pg_constraint
        where conrelid='public.profiles'::regclass and conname='profiles_plan_check')
       then 'present' else 'MISSING' end, 'present';
