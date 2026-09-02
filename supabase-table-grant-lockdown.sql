-- Craft & Cup - strip table grants no client should ever hold.
-- RAN AND VERIFIED 2026-09-01. This is the most serious finding of the audit
-- remediation, and it was not in the audit report: it was found by enumerating
-- every table's grants individually instead of counting tables.
--
-- THE FINDING: anon and authenticated held TRUNCATE on all 19 tables.
--
-- TRUNCATE BYPASSES ROW LEVEL SECURITY COMPLETELY. It is a table-level
-- operation; policies are never consulted. Every RLS policy verified during
-- this audit was irrelevant to it. Proven by attack: as anon, DELETE removed
-- 0 rows (RLS working correctly) while TRUNCATE emptied the table.
--
-- REACHABILITY at the time of discovery: not exploitable through the deployed
-- API. PostgREST exposes no TRUNCATE verb, and no client-callable function
-- used dynamic SQL (checked: all 13 are static). So this was a latent hole,
-- not an open door. It mattered because it meant one dynamic-SQL function,
-- ever, would have turned into total destruction of all user data, with an
-- untested backup as the only recovery.
--
-- ORIGIN: Supabase grants ALL on new tables to anon and authenticated by
-- default. The July 2026 lockdown revoked some of this but not TRUNCATE, and
-- tables created afterwards inherited the defaults again.
--
-- WHY REVOKING INSERT/UPDATE FROM `authenticated` WOULD BE A MISTAKE:
-- revoking a table-level privilege also drops every COLUMN-level grant of the
-- same type. The column lockdown (see supabase-profiles-column-lockdown.sql
-- and supabase-cost-controls.sql) is what stops users writing `plan`, `role`,
-- `created_at` and `is_example`. Those column grants are load-bearing:
-- authenticated holds INSERT on 129 of 139 columns and UPDATE on 123, and the
-- gaps are the protection. Only privileges with no column-level equivalent are
-- revoked from authenticated here.
--
-- VERIFIED AFTER: TRUNCATE denied (SQLSTATE 42501) for both roles, table row
-- count unchanged, and insert/update/select/delete plus anonymous profile
-- reads all still work, confirmed against production.

do $$
declare t record;
begin
  for t in select tablename from pg_tables where schemaname='public' loop
    -- No PostgREST client ever needs these. TRIGGER and REFERENCES would let a
    -- client attach triggers or foreign keys; TRUNCATE ignores RLS.
    execute format('revoke truncate, trigger, references on public.%I from anon, authenticated', t.tablename);

    -- anon must never write. RLS already blocked it, but the grant should not
    -- exist either, so a future permissive policy cannot silently open a path.
    execute format('revoke insert, update, delete on public.%I from anon', t.tablename);
  end loop;
end $$;

-- Stop tables created later from inheriting the same over-broad defaults.
-- This is what allowed the July lockdown to be quietly undone.
alter default privileges in schema public
  revoke truncate, trigger, references on tables from anon, authenticated;
alter default privileges in schema public
  revoke insert, update, delete on tables from anon;

-- Report: expect anon to hold SELECT only, and authenticated to hold no
-- TRUNCATE, TRIGGER or REFERENCES anywhere.
select grantee, privilege_type, count(*)::int as tables
  from information_schema.role_table_grants
 where table_schema='public' and grantee in ('anon','authenticated')
 group by 1,2 order by 1,2;
