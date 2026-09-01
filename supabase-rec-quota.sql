-- Craft & Cup - Coffee agent quota (per-user monthly recommendation limit)
-- Run this in the Supabase SQL editor BEFORE deploying /api/recommend.
-- (If code deploys first, the endpoint falls back to a temporary in-memory
--  limiter, so recommendations keep working - but run this for the real quota.)
--
-- Idempotent: safe to run more than once. Ends with a read-only report grid.
--
-- SUPERSEDED IN PART (2026-09-01): consume_rec_credit() now also calls
-- check_global_cap('ai_recommend', 2000) before returning allowed, so aggregate
-- spend across ALL users is capped, not just per-user. A per-user quota does
-- nothing about N accounts, and signup is open. See supabase-cost-controls.sql
-- for the ceiling and the reasoning; the current function body is below.
--
-- DESIGN NOTE: COFFEE_AGENT.md proposed adding a 'kind' column to ai_usage.
-- That table's primary key is (user_id, period), so adding kind would mean
-- dropping and recreating the PK on a live table AND rewriting the working
-- consume_ai_credit() on-conflict clause. A separate rec_usage table gets the
-- same result with zero surgery on the live flavor-map quota. Deliberate.

-- 1) Monthly recommendation counter, one row per user per calendar month (UTC).
--    Mirrors public.ai_usage exactly.
create table if not exists public.rec_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  period  text not null,               -- 'YYYY-MM' (UTC)
  count   int  not null default 0,
  primary key (user_id, period)
);

alter table public.rec_usage enable row level security;

-- Users may READ their own usage (for the "X of 5 used" meter). All writes go
-- through consume_rec_credit() below, so no insert/update policy is granted.
drop policy if exists "read own rec usage" on public.rec_usage;
create policy "read own rec usage" on public.rec_usage
  for select using (auth.uid() = user_id);

-- 2) Atomic check-and-increment. Free users are capped at REC_FREE_LIMIT per
--    month; paid users are unmetered. Returns the decision plus counts as JSON.
--    >> TO CHANGE THE FREE LIMIT: edit REC_FREE_LIMIT below and re-run. <<
create or replace function public.consume_rec_credit()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  REC_FREE_LIMIT constant int := 5;
  GLOBAL_LIMIT   constant int := 2000;
  v_uid    uuid := auth.uid();
  v_period text := to_char(now() at time zone 'utc', 'YYYY-MM');
  v_plan   text;
  v_count  int;
begin
  if v_uid is null then
    return jsonb_build_object('allowed', false, 'reason', 'unauthenticated');
  end if;

  select plan into v_plan from public.profiles where id = v_uid;

  -- Paid: unmetered, but still tracked.
  if v_plan = 'paid' then
    insert into public.rec_usage (user_id, period, count) values (v_uid, v_period, 1)
      on conflict (user_id, period) do update set count = rec_usage.count + 1
      returning count into v_count;
    return jsonb_build_object('allowed', true, 'plan', 'paid', 'used', v_count, 'limit', null);
  end if;

  -- Free: enforce the monthly cap.
  select count into v_count from public.rec_usage where user_id = v_uid and period = v_period;
  v_count := coalesce(v_count, 0);

  if v_count >= REC_FREE_LIMIT then
    return jsonb_build_object('allowed', false, 'reason', 'limit_reached', 'plan', 'free', 'used', v_count, 'limit', REC_FREE_LIMIT);
  end if;

  -- Aggregate ceiling across every user. Applies to paid accounts too: this is
  -- a spend guard, not a plan feature.
  if not public.check_global_cap('ai_recommend', GLOBAL_LIMIT) then
    return jsonb_build_object('allowed', false, 'reason', 'global_limit');
  end if;

  insert into public.rec_usage (user_id, period, count) values (v_uid, v_period, 1)
    on conflict (user_id, period) do update set count = rec_usage.count + 1
    returning count into v_count;
  return jsonb_build_object('allowed', true, 'plan', 'free', 'used', v_count, 'limit', REC_FREE_LIMIT);
end;
$$;

-- 3) Grants. NOTE: default privileges in schema public were hardened on
--    2026-07-29 (supabase-definer-grants-lockdown.sql) so new functions are NOT
--    world-executable. The explicit grant below is REQUIRED, and anon is
--    revoked to match the lockdown posture.
revoke execute on function public.consume_rec_credit() from public, anon;
grant execute on function public.consume_rec_credit() to authenticated;

-- 4) Read-only report. Every row should match its "expected" column.
select
  'rec_usage table' as check,
  case when to_regclass('public.rec_usage') is not null then 'present' else 'MISSING' end as actual,
  'present' as expected
union all
select
  'rec_usage RLS',
  case when coalesce((select relrowsecurity from pg_class where oid = to_regclass('public.rec_usage')), false)
       then 'enabled' else 'DISABLED' end,
  'enabled'
union all
select
  'read own rec usage policy',
  case when exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'rec_usage' and policyname = 'read own rec usage'
  ) then 'present' else 'MISSING' end,
  'present'
union all
select
  'consume_rec_credit function',
  case when to_regprocedure('public.consume_rec_credit()') is not null then 'present' else 'MISSING' end,
  'present'
union all
select
  'anon can execute',
  case when to_regprocedure('public.consume_rec_credit()') is null then 'n/a'
       when has_function_privilege('anon', to_regprocedure('public.consume_rec_credit()'), 'execute')
       then 'YES (BAD)' else 'no' end,
  'no'
union all
select
  'authenticated can execute',
  case when to_regprocedure('public.consume_rec_credit()') is null then 'n/a'
       when has_function_privilege('authenticated', to_regprocedure('public.consume_rec_credit()'), 'execute')
       then 'yes' else 'NO (BAD)' end,
  'yes';
