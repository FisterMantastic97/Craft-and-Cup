-- Craft & Cup - remove the unused cupping tables. RAN 2026-09-01.
--
-- WHY: cupping_sessions and cupping_entries were abandoned early work. The app
-- never queried either one, both were empty, and no function referenced them.
-- They still carried four RLS policies, which is attack surface nobody reviews
-- and schema nobody maintains. Less code, less to get wrong.
--
-- NOTE ON THE DROP ORDER: the two tables' policies referenced EACH OTHER, so a
-- plain drop failed with "other objects depend on it". The policies are dropped
-- explicitly rather than using DROP ... CASCADE, so nothing unexpected is
-- removed alongside them.
--
-- VERIFIED BEFORE: 0 rows in both, 0 functions referencing them, and the only
-- foreign keys pointed INTO them, so nothing depended on them existing.
-- VERIFIED AFTER: 18 public tables (was 20), 0 orphan policies, and beans,
-- profiles, activity and recipes all still return 200 through the live API.
--
-- The original definitions remain in git history and in the schema dump at the
-- commit prior to this one, should the cupping feature ever be revived.

drop policy if exists "Users can view sessions they are part of" on public.cupping_sessions;
drop policy if exists "Users can create sessions"                on public.cupping_sessions;
drop policy if exists "Users can view entries in their sessions" on public.cupping_entries;
drop policy if exists "Users can submit entries"                 on public.cupping_entries;

drop table if exists public.cupping_entries;   -- child first: it references sessions
drop table if exists public.cupping_sessions;

-- Report
select 'cupping tables removed' as check,
  case when (select count(*) from pg_tables
              where schemaname='public' and tablename like 'cupping%') = 0
       then 'gone' else 'STILL PRESENT' end as actual, 'gone' as expected
union all select 'orphan policies removed',
  case when (select count(*) from pg_policies
              where schemaname='public' and tablename like 'cupping%') = 0
       then 'none' else 'STILL PRESENT' end, 'none';
