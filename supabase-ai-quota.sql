-- Craft & Cup - Freemium AI quota (per-user monthly flavor-map limit)
-- Run this in the Supabase SQL editor BEFORE deploying the matching code.
-- (If code deploys first, the endpoint falls back to a temporary in-memory limiter,
--  so AI keeps working - but run this to turn on the real monthly quota.)

-- 1) Plan on profiles: 'free' | 'paid'. Flip a user to paid by hand for now
--    (update public.profiles set plan = 'paid' where id = '<user-uuid>';) until
--    Stripe is wired up.
alter table public.profiles
  add column if not exists plan text not null default 'free';

-- 2) Monthly usage counter, one row per user per calendar month (UTC).
create table if not exists public.ai_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  period  text not null,               -- 'YYYY-MM' (UTC)
  count   int  not null default 0,
  primary key (user_id, period)
);

alter table public.ai_usage enable row level security;

-- Users may READ their own usage (for the "X of 10 used" meter). All writes go
-- through consume_ai_credit() below, so no insert/update policy is granted.
drop policy if exists "read own ai usage" on public.ai_usage;
create policy "read own ai usage" on public.ai_usage
  for select using (auth.uid() = user_id);

-- 3) Atomic check-and-increment. Free users are capped at FREE_LIMIT per month;
--    paid users are unmetered. Returns the decision plus counts as JSON.
--    >> TO CHANGE THE FREE LIMIT: edit FREE_LIMIT below and re-run this block. <<
create or replace function public.consume_ai_credit()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  FREE_LIMIT constant int := 10;
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
    insert into public.ai_usage (user_id, period, count) values (v_uid, v_period, 1)
      on conflict (user_id, period) do update set count = ai_usage.count + 1
      returning count into v_count;
    return jsonb_build_object('allowed', true, 'plan', 'paid', 'used', v_count, 'limit', null);
  end if;

  -- Free: enforce the monthly cap.
  select count into v_count from public.ai_usage where user_id = v_uid and period = v_period;
  v_count := coalesce(v_count, 0);

  if v_count >= FREE_LIMIT then
    return jsonb_build_object('allowed', false, 'reason', 'limit_reached', 'plan', 'free', 'used', v_count, 'limit', FREE_LIMIT);
  end if;

  insert into public.ai_usage (user_id, period, count) values (v_uid, v_period, 1)
    on conflict (user_id, period) do update set count = ai_usage.count + 1
    returning count into v_count;
  return jsonb_build_object('allowed', true, 'plan', 'free', 'used', v_count, 'limit', FREE_LIMIT);
end;
$$;

grant execute on function public.consume_ai_credit() to authenticated;
