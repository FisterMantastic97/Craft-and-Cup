-- Craft & Cup - admin read path for usage counters. RAN AND VERIFIED 2026-09-01.
--
-- global_usage has RLS with NO policy at all: every write goes through
-- check_global_cap(), which is SECURITY DEFINER, so nothing can read the table
-- from a client. This function is the read path, and it exists so spend can be
-- watched accruing on the admin dashboard rather than discovered on a bill.
--
-- The admin check is INLINED rather than calling is_admin(). is_admin() had its
-- EXECUTE revoked from authenticated during the 2026-07-29 definer lockdown. A
-- SECURITY DEFINER function could still call it, but inlining keeps the pattern
-- consistent with the error_log policies, where calling is_admin() from an RLS
-- policy silently locked admins out of their own table.
--
-- The ceilings are duplicated here because they live as constants inside
-- consume_ai_credit() and consume_rec_credit(). If you change one, change it
-- here too. Hoisting them into a settings table would be cleaner but adds a
-- lookup to every quota check, which runs on the hot path.
--
-- VERIFIED: returns the counters for an admin; a signed-in non-admin is
-- refused; anon cannot execute it at all.

create or replace function public.admin_usage()
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
declare
  v_period text := to_char(now() at time zone 'utc','YYYY-MM');
  v_analyze   int;
  v_recommend int;
begin
  if not exists (select 1 from public.profiles
                  where id = auth.uid() and role in ('admin','owner')) then
    raise exception 'not authorised';
  end if;

  select coalesce(n,0) into v_analyze
    from public.global_usage where key='ai_analyze'   and period = v_period;
  select coalesce(n,0) into v_recommend
    from public.global_usage where key='ai_recommend' and period = v_period;

  return jsonb_build_object(
    'period',           v_period,
    'analyze_used',     coalesce(v_analyze,0),
    'analyze_limit',    5000,
    'recommend_used',   coalesce(v_recommend,0),
    'recommend_limit',  2000,
    -- who is actually consuming it this month
    'top_users', coalesce((
      select jsonb_agg(t) from (
        select p.screenname, a.count as ai_calls
          from public.ai_usage a
          join public.profiles p on p.id = a.user_id
         where a.period = v_period
         order by a.count desc
         limit 5
      ) t), '[]'::jsonb),
    -- storage footprint, the other thing that costs money
    'storage_objects', (select count(*) from storage.objects),
    'storage_bytes',   (select coalesce(sum((metadata->>'size')::bigint),0) from storage.objects)
  );
end $$;

revoke execute on function public.admin_usage() from public, anon;
grant  execute on function public.admin_usage() to authenticated;

-- Report
select 'admin_usage exists' as check,
  case when to_regprocedure('public.admin_usage()') is not null then 'present' else 'MISSING' end as actual,
  'present' as expected
union all select 'anon cannot call',
  case when has_function_privilege('anon', to_regprocedure('public.admin_usage()'), 'execute')
       then 'YES (BAD)' else 'no' end, 'no';
