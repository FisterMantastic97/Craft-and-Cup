-- Craft & Cup - align AI quotas with what the UI promises.
-- RAN AND VERIFIED 2026-09-01.
--
-- This is a FUNCTION bug found during the security sweep, not a vulnerability.
-- It is recorded here because the mismatch was silent and would have been read
-- as a bug report from a confused admin rather than as a config problem.
--
-- THE MISMATCH: the client has always told owners and admins their AI use is
-- unlimited (index.jsx:11016, rendered at :11057 as "Owner, unlimited"). The
-- server only ever exempted plan='paid'. Verified: an account with role='owner'
-- and plan='free' was refused at call 11 while the meter said unlimited.
--
-- Resolved by moving the SERVER to the promise rather than the UI to the
-- server: owner and admin accounts are few, deliberately appointed, and
-- trusted. Making them count against a ten-call consumer quota served no
-- purpose and produced a confusing dead end.
--
-- THE GLOBAL CEILING STILL APPLIES TO THEM. That check sits after the
-- per-user branch precisely so it binds everyone, including owners: it is a
-- spend guard, not a plan feature. Verified: with the counter at its ceiling,
-- an owner is refused with reason='global_limit'.
--
-- VERIFIED: owner not blocked in 15 consecutive calls; a free user still
-- refused at call 11; owner refused at the global ceiling. Live: three
-- consecutive /api/analyze calls all returned 200.

create or replace function public.consume_ai_credit()
returns jsonb language plpgsql security definer set search_path to 'public','pg_temp'
as $fn$
declare
  FREE_LIMIT   constant int := 10;
  GLOBAL_LIMIT constant int := 5000;
  v_uid uuid := auth.uid();
  v_period text := to_char(now() at time zone 'utc','YYYY-MM');
  v_plan text; v_role text; v_unlimited boolean; v_count int;
begin
  if v_uid is null then
    return jsonb_build_object('allowed', false, 'reason', 'unauthenticated');
  end if;

  select plan, role into v_plan, v_role from public.profiles where id = v_uid;
  v_unlimited := coalesce(v_plan,'') = 'paid'
              or coalesce(v_role,'') in ('admin','owner');

  if not v_unlimited then
    select count into v_count from public.ai_usage where user_id=v_uid and period=v_period;
    v_count := coalesce(v_count,0);
    if v_count >= FREE_LIMIT then
      return jsonb_build_object('allowed', false, 'reason','limit_reached',
                                'plan','free','used',v_count,'limit',FREE_LIMIT);
    end if;
  end if;

  -- Applies to EVERYONE, owners included: a spend guard, not a plan feature.
  if not public.check_global_cap('ai_analyze', GLOBAL_LIMIT) then
    return jsonb_build_object('allowed', false, 'reason', 'global_limit');
  end if;

  insert into public.ai_usage (user_id, period, count) values (v_uid, v_period, 1)
    on conflict (user_id, period) do update set count = ai_usage.count + 1
    returning count into v_count;

  return jsonb_build_object('allowed', true,
    'plan', coalesce(v_plan,'free'), 'used', v_count,
    'limit', case when v_unlimited then null else FREE_LIMIT end);
end $fn$;

create or replace function public.consume_rec_credit()
returns jsonb language plpgsql security definer set search_path to 'public','pg_temp'
as $fn$
declare
  REC_FREE_LIMIT constant int := 5;
  GLOBAL_LIMIT   constant int := 2000;
  v_uid uuid := auth.uid();
  v_period text := to_char(now() at time zone 'utc','YYYY-MM');
  v_plan text; v_role text; v_unlimited boolean; v_count int;
begin
  if v_uid is null then
    return jsonb_build_object('allowed', false, 'reason', 'unauthenticated');
  end if;

  select plan, role into v_plan, v_role from public.profiles where id = v_uid;
  v_unlimited := coalesce(v_plan,'') = 'paid'
              or coalesce(v_role,'') in ('admin','owner');

  if not v_unlimited then
    select count into v_count from public.rec_usage where user_id=v_uid and period=v_period;
    v_count := coalesce(v_count,0);
    if v_count >= REC_FREE_LIMIT then
      return jsonb_build_object('allowed', false, 'reason','limit_reached',
                                'plan','free','used',v_count,'limit',REC_FREE_LIMIT);
    end if;
  end if;

  if not public.check_global_cap('ai_recommend', GLOBAL_LIMIT) then
    return jsonb_build_object('allowed', false, 'reason', 'global_limit');
  end if;

  insert into public.rec_usage (user_id, period, count) values (v_uid, v_period, 1)
    on conflict (user_id, period) do update set count = rec_usage.count + 1
    returning count into v_count;

  return jsonb_build_object('allowed', true,
    'plan', coalesce(v_plan,'free'), 'used', v_count,
    'limit', case when v_unlimited then null else REC_FREE_LIMIT end);
end $fn$;
