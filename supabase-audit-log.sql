-- Craft & Cup - append-only audit log for privileged actions.
-- RAN AND VERIFIED 2026-09-01. Closes audit checks 148, 149 and 150.
--
-- WHY: administrative operations left no trace. If an admin account were
-- compromised, or an operator made a mistake, there was no way to establish
-- what was done, when, or by whom. That also meant no answer to the first
-- question of any incident: what did the attacker touch?
--
-- IMPLEMENTED AS TRIGGERS, NOT INSIDE THE ADMIN FUNCTIONS. Auditing inside
-- admin_set_user would only cover admin_set_user. A trigger covers every path
-- that can ever change the row, including direct REST writes and future code
-- that has not been written yet. This is the same reasoning that closed the
-- INSERT bypasses found in the same sweep: cover the STATE CHANGE, not the
-- function you happened to be looking at.
--
-- APPEND-ONLY BY CONSTRUCTION. Admins may SELECT. No role holds INSERT, UPDATE
-- or DELETE, and rows arrive only through SECURITY DEFINER triggers. An audit
-- log that a compromised admin can edit is not an audit log.
--
-- WHAT IS CAPTURED:
--   role_change / plan_change   any change to a profile's role or plan
--   report_resolved             moderation decisions
--   account_deleted             including whether it was self-service
--
-- VERIFIED: a real admin action recorded actor, target, old and new values,
-- and timestamp. An ordinary user reads 0 rows; an admin reads them. Update,
-- delete and forged insert are all refused. Note the row count went 1 -> 2
-- during testing because the test's own cleanup UPDATE was itself audited,
-- which is the intended behaviour.

create table if not exists public.audit_log (
  id           bigserial primary key,
  occurred_at  timestamptz not null default now(),
  actor_id     uuid,
  actor_name   text,
  action       text not null,
  target_id    uuid,
  target_name  text,
  detail       jsonb not null default '{}'::jsonb
);
create index if not exists audit_log_occurred_idx on public.audit_log (occurred_at desc);
create index if not exists audit_log_actor_idx    on public.audit_log (actor_id, occurred_at desc);

alter table public.audit_log enable row level security;

drop policy if exists "admins read audit log" on public.audit_log;
create policy "admins read audit log" on public.audit_log
  for select to authenticated
  using (exists (select 1 from public.profiles p
                  where p.id = auth.uid() and p.role in ('admin','owner')));

revoke all on public.audit_log from anon, authenticated;
grant select on public.audit_log to authenticated;
revoke all on sequence public.audit_log_id_seq from anon, authenticated;

-- Role and plan changes -----------------------------------------------------
create or replace function public.audit_profile_change()
returns trigger language plpgsql security definer set search_path to 'public','pg_temp'
as $fn$
declare v_actor uuid := auth.uid(); v_actor_name text;
begin
  if new.role is not distinct from old.role and new.plan is not distinct from old.plan then
    return new;
  end if;
  select screenname into v_actor_name from public.profiles where id = v_actor;
  insert into public.audit_log(actor_id, actor_name, action, target_id, target_name, detail)
  values (v_actor,
          coalesce(v_actor_name, case when v_actor is null then 'server' else 'unknown' end),
          case when new.role is distinct from old.role then 'role_change' else 'plan_change' end,
          old.id, old.screenname,
          jsonb_strip_nulls(jsonb_build_object(
            'role_from', case when new.role is distinct from old.role then old.role end,
            'role_to',   case when new.role is distinct from old.role then new.role end,
            'plan_from', case when new.plan is distinct from old.plan then old.plan end,
            'plan_to',   case when new.plan is distinct from old.plan then new.plan end)));
  return new;
end $fn$;

drop trigger if exists audit_profile_change_trg on public.profiles;
create trigger audit_profile_change_trg
  after update on public.profiles
  for each row execute function public.audit_profile_change();

-- Moderation decisions ------------------------------------------------------
create or replace function public.audit_report_change()
returns trigger language plpgsql security definer set search_path to 'public','pg_temp'
as $fn$
declare v_actor uuid := auth.uid(); v_name text;
begin
  if new.status is not distinct from old.status then return new; end if;
  select screenname into v_name from public.profiles where id = v_actor;
  insert into public.audit_log(actor_id, actor_name, action, target_id, detail)
  values (v_actor, coalesce(v_name,'server'), 'report_resolved', old.reporter_id,
          jsonb_build_object('from', old.status, 'to', new.status,
                             'comment_id', old.comment_id));
  return new;
end $fn$;

drop trigger if exists audit_report_change_trg on public.reports;
create trigger audit_report_change_trg
  after update on public.reports
  for each row execute function public.audit_report_change();

-- Account deletion ----------------------------------------------------------
-- BEFORE delete: the row is about to vanish, so it must be read first.
create or replace function public.audit_profile_delete()
returns trigger language plpgsql security definer set search_path to 'public','pg_temp'
as $fn$
declare v_actor uuid := auth.uid(); v_name text;
begin
  select screenname into v_name from public.profiles where id = v_actor;
  insert into public.audit_log(actor_id, actor_name, action, target_id, target_name, detail)
  values (v_actor, coalesce(v_name, case when v_actor is null then 'server' else 'unknown' end),
          case when v_actor = old.id then 'account_self_deleted' else 'account_deleted' end,
          old.id, old.screenname,
          jsonb_build_object('role', old.role, 'plan', old.plan));
  return old;
end $fn$;

drop trigger if exists audit_profile_delete_trg on public.profiles;
create trigger audit_profile_delete_trg
  before delete on public.profiles
  for each row execute function public.audit_profile_delete();

-- Read path for the admin dashboard ------------------------------------------
create or replace function public.admin_audit_log(p_limit int default 100)
returns jsonb language plpgsql security definer set search_path to 'public','pg_temp'
as $fn$
declare v_rows jsonb;
begin
  if not exists (select 1 from public.profiles
                  where id = auth.uid() and role in ('admin','owner')) then
    raise exception 'not authorised';
  end if;
  select coalesce(jsonb_agg(t order by t.occurred_at desc), '[]'::jsonb) into v_rows
    from (
      select occurred_at, actor_name, action, target_name, detail
        from public.audit_log
       order by occurred_at desc
       limit greatest(1, least(coalesce(p_limit,100), 500))
    ) t;
  return v_rows;
end $fn$;

revoke execute on function public.admin_audit_log(int) from public, anon;
grant  execute on function public.admin_audit_log(int) to authenticated;

-- Report
select 'audit_log table' as check,
  case when to_regclass('public.audit_log') is not null then 'present' else 'MISSING' end as actual,
  'present' as expected
union all select 'clients cannot write',
  case when has_table_privilege('authenticated','public.audit_log','insert,update,delete')
       then 'WRITABLE (BAD)' else 'read only' end, 'read only'
union all select 'audit triggers',
  (select count(*)::text from pg_trigger where tgname like 'audit!_%' escape '!' and not tgisinternal), '3';
