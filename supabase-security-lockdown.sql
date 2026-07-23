-- ============================================================================
-- Craft & Cup - Security lockdown + verification (idempotent, safe to re-run)
-- ----------------------------------------------------------------------------
-- Supersedes supabase-security-fixes.sql (2026-07-22). Every statement here is
-- guarded, so running it once or five times gives the same result and it will
-- NOT error if a fix was already applied on 7/22.
--
--   PART A applies the six Security Advisor fixes.
--   PART B is a read-only report so you can SEE the final state in one grid.
--
-- Paste the whole thing into Supabase > SQL Editor and Run. Read the report
-- grid at the bottom (every row should say OK / present / yes / enabled), then
-- re-run Advisors > Security to confirm the warnings are gone.
-- ============================================================================


-- ══ PART A: apply the fixes ═════════════════════════════════════════════════

-- 1) rls_auto_enable(): a SECURITY DEFINER function callable by anon +
--    authenticated (advisor warnings 5, 6). It runs with owner privileges and
--    your app never calls it. Revoke execute so no anonymous visitor can run it.
do $$
begin
  if exists (
    select 1 from pg_proc
    where proname = 'rls_auto_enable' and pronamespace = 'public'::regnamespace
  ) then
    execute 'revoke execute on function public.rls_auto_enable() from anon, authenticated, public';
    -- It is an unused leftover. To remove it entirely, uncomment the next line:
    -- execute 'drop function if exists public.rls_auto_enable()';
  end if;
end $$;

-- 2) notifications INSERT policy was WITH CHECK (true) (advisor warning 2): any
--    signed-in user could forge a notification attributed to someone else.
--    Recreate it so a user may only insert rows where they are the actor.
--    Broadcasts + owner DMs are unaffected (those run through SECURITY DEFINER
--    functions, which do not go through this client policy).
drop policy if exists "Users can insert notifications" on public.notifications;
create policy "Users can insert notifications"
  on public.notifications
  for insert
  to authenticated
  with check ( auth.uid() = actor_id );

-- 3) Public storage buckets allowed listing every file (advisor warnings 3, 4).
--    The app only uses upload() + getPublicUrl(), never list(), and public URLs
--    do not go through RLS, so dropping the listing policies is safe. Guarded,
--    so no error if they were already removed on 7/22.
drop policy if exists "Bean images are publicly viewable"   on storage.objects;
drop policy if exists "Recipe images are publicly viewable" on storage.objects;

-- 4) generate_friend_code() had a mutable search_path (advisor warning 1). Pin
--    it. Using 'public, pg_temp' (not '') so it works whether or not the body
--    schema-qualifies its table names; it still satisfies the advisor.
do $$
begin
  if exists (
    select 1 from pg_proc
    where proname = 'generate_friend_code' and pronamespace = 'public'::regnamespace
  ) then
    execute 'alter function public.generate_friend_code() set search_path = public, pg_temp';
  end if;
end $$;


-- ══ PART B: verification report (read-only) ═════════════════════════════════
-- One grid, top to bottom. Every row should read OK / present / yes / enabled.
-- Anything else tells you exactly which file to run.
--
-- If row 2 shows a "WEAK: true" alongside the OK one, there is a second, older
-- insert policy still open; list them with:
--   select policyname, with_check from pg_policies
--   where schemaname='public' and tablename='notifications' and cmd='INSERT';
-- and drop the permissive one by name.

with report as (
  select 1 as ord, '1. rls_auto_enable exposed to anon' as check_item,
    case
      when not exists (select 1 from pg_proc where proname='rls_auto_enable' and pronamespace='public'::regnamespace)
        then 'OK - not present'
      when exists (
        select 1 from pg_proc p
        where p.proname='rls_auto_enable' and p.pronamespace='public'::regnamespace
          and (has_function_privilege('anon', p.oid, 'execute')
            or has_function_privilege('authenticated', p.oid, 'execute'))
      ) then 'STILL EXPOSED - re-run PART A step 1'
      else 'OK - execute revoked'
    end as status

  union all
  select 2, '2. notifications insert policy',
    coalesce((
      select string_agg(
        case when with_check ilike '%actor_id%' then 'OK - actor-checked'
             else 'WEAK: ' || coalesce(with_check,'(null)') end, ' | ')
      from pg_policies
      where schemaname='public' and tablename='notifications' and cmd='INSERT'
    ), 'NO INSERT POLICY FOUND')

  union all
  select 3, '3. storage listing (bean/recipe images)',
    case when exists (
      select 1 from pg_policies
      where schemaname='storage' and tablename='objects' and cmd in ('SELECT','ALL')
        and (coalesce(qual,'') ilike '%bean-images%' or coalesce(qual,'') ilike '%recipe-images%')
    ) then 'STILL LISTABLE - review policy names'
    else 'OK - no bean/recipe listing policy' end

  union all
  select 4, '4. generate_friend_code search_path',
    coalesce((
      select case when array_to_string(proconfig,',') ilike '%search_path%'
                  then 'OK - pinned' else 'NOT PINNED' end
      from pg_proc where proname='generate_friend_code' and pronamespace='public'::regnamespace
    ), 'function not present')

  union all
  select 5, '5. notifications allows announcement',
    case
      when exists (
        select 1 from pg_constraint
        where conname='notifications_type_check' and conrelid=to_regclass('public.notifications')
          and pg_get_constraintdef(oid) ilike '%announcement%'
      ) then 'OK - allowed'
      when not exists (
        select 1 from pg_constraint
        where conname='notifications_type_check' and conrelid=to_regclass('public.notifications')
      ) then 'no type constraint (also fine)'
      else 'NOT ALLOWED - run supabase-notifications-hotfix.sql'
    end

  union all
  select 6, '6. freemium: profiles.plan column',
    case when exists (select 1 from information_schema.columns
      where table_schema='public' and table_name='profiles' and column_name='plan')
      then 'present' else 'MISSING - run supabase-ai-quota.sql' end

  union all
  select 7, '7. freemium: ai_usage table',
    case when to_regclass('public.ai_usage') is not null
      then 'present' else 'MISSING - run supabase-ai-quota.sql' end

  union all
  select 8, '8. freemium: consume_ai_credit fn',
    case when exists (select 1 from pg_proc where proname='consume_ai_credit' and pronamespace='public'::regnamespace)
      then 'present' else 'MISSING - run supabase-ai-quota.sql' end

  union all
  select 9, '9. owner: profiles.role column',
    case when exists (select 1 from information_schema.columns
      where table_schema='public' and table_name='profiles' and column_name='role')
      then 'present' else 'MISSING - run supabase-owner-role.sql' end

  union all
  select 10, '10. owner: founder pinned to owner',
    coalesce((
      select case when role='owner' then 'yes'
                  else 'NO - founder role is '||coalesce(role,'(null)') end
      from public.profiles where id='c54ef74b-de38-425f-b536-6854b5e5d75e'
    ), 'founder row not found')

  union all
  select 11, '11. owner: guard_profile_role trigger',
    case when exists (select 1 from pg_trigger where tgname='guard_profile_role_trg' and not tgisinternal)
      then 'present' else 'MISSING - run migrations.sql section 5' end

  union all
  select 12, '12. admin: admin_message_user fn',
    case when exists (select 1 from pg_proc where proname='admin_message_user' and pronamespace='public'::regnamespace)
      then 'present' else 'MISSING - run supabase-notifications-hotfix.sql' end

  union all
  select 13, '13. activity feed RLS enabled',
    coalesce((
      select case when relrowsecurity then 'enabled'
                  else 'DISABLED - feed relies on client filter only' end
      from pg_class where oid = to_regclass('public.activity')
    ), 'activity table not found')
)
select check_item, status from report order by ord;
