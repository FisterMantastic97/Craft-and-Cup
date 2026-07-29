-- ============================================================
-- Craft & Cup: SECURITY DEFINER execute-grant lockdown
-- Written 2026-07-29. RAN 2026-07-29: report grid verified, advisor
-- went from 20 security warnings to 8 accepted (see notes at bottom).
-- Idempotent: safe to run more than once.
-- ============================================================

-- A1: strip PUBLIC and anon from every flagged function.
do $$
declare
  fn text;
  fns text[] := array[
    'public.consume_ai_credit()',
    'public.is_admin()',
    'public.broadcast_notification(text)',
    'public.admin_overview()',
    'public.admin_list_users()',
    'public.admin_set_user(uuid, text, text)',
    'public.admin_list_reports()',
    'public.admin_resolve_report(text, boolean)',
    'public.admin_message_user(uuid, text)',
    'public.guard_profile_role()'
  ];
begin
  foreach fn in array fns loop
    if to_regprocedure(fn) is not null then
      execute format('revoke execute on function %s from public, anon', fn);
    end if;
  end loop;
end $$;

-- A2: the client-called set keeps authenticated. Each admin function
-- raises internally unless is_admin() passes; consume_ai_credit keys
-- off auth.uid(). This is the standard Supabase RPC pattern.
do $$
declare
  fn text;
  fns text[] := array[
    'public.consume_ai_credit()',
    'public.broadcast_notification(text)',
    'public.admin_overview()',
    'public.admin_list_users()',
    'public.admin_set_user(uuid, text, text)',
    'public.admin_list_reports()',
    'public.admin_resolve_report(text, boolean)',
    'public.admin_message_user(uuid, text)'
  ];
begin
  foreach fn in array fns loop
    if to_regprocedure(fn) is not null then
      execute format('grant execute on function %s to authenticated', fn);
    end if;
  end loop;
end $$;

-- A3: owner-internal only. No client role may execute these at all.
-- is_admin() is called only inside the DEFINER functions (owner context);
-- guard_profile_role() is a trigger function.
do $$
begin
  if to_regprocedure('public.is_admin()') is not null then
    revoke execute on function public.is_admin() from authenticated;
  end if;
  if to_regprocedure('public.guard_profile_role()') is not null then
    revoke execute on function public.guard_profile_role() from authenticated;
  end if;
end $$;

-- A4: root cause. From now on, new functions in public start locked
-- instead of world-executable. NOTE: every future RPC function needs an
-- explicit "grant execute on function ... to authenticated;" in its
-- migration (the coffee agent's consume_rec_credit will need one).
alter default privileges in schema public revoke execute on functions from public;

-- B: report grid. Every row should match its "expected" column.
select
  t.fn as function,
  case when to_regprocedure(t.fn) is null then 'MISSING'
       when has_function_privilege('anon', to_regprocedure(t.fn), 'execute')
       then 'YES (BAD)' else 'no (ok)' end as anon_exec,
  case when to_regprocedure(t.fn) is null then 'MISSING'
       when has_function_privilege('authenticated', to_regprocedure(t.fn), 'execute')
       then 'yes' else 'no' end as authenticated_exec,
  t.expected
from (values
  ('public.consume_ai_credit()',                     'auth yes, anon no'),
  ('public.broadcast_notification(text)',            'auth yes, anon no'),
  ('public.admin_overview()',                        'auth yes, anon no'),
  ('public.admin_list_users()',                      'auth yes, anon no'),
  ('public.admin_set_user(uuid, text, text)',        'auth yes, anon no'),
  ('public.admin_list_reports()',                    'auth yes, anon no'),
  ('public.admin_resolve_report(text, boolean)',     'auth yes, anon no'),
  ('public.admin_message_user(uuid, text)',          'auth yes, anon no'),
  ('public.is_admin()',                              'auth no, anon no'),
  ('public.guard_profile_role()',                    'auth no, anon no')
) as t(fn, expected);

-- ============================================================
-- Outcome (verified live via the platform lint API, 2026-07-29):
-- All 10 anon_security_definer_function_executable warnings cleared.
-- authenticated_* cleared for is_admin and guard_profile_role.
-- 8 authenticated_* warnings remain BY DESIGN on the client-called RPC
-- functions above; their defense is the internal is_admin()/auth.uid()
-- gate (verified in supabase-admin.sql). Accepted, documented posture.
-- ============================================================
