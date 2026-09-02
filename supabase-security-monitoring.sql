-- Craft & Cup - security event monitoring. RAN AND VERIFIED 2026-09-01.
-- Closes audit checks 152, 153 and 154.
--
-- WHY: the audit log records privileged actions that SUCCEED. Nothing recorded
-- the ones that FAIL. Someone probing the API left no trace at all, which is
-- precisely the condition that let nine exploits sit undiscovered until they
-- were hunted deliberately.
--
-- ============================================================
-- THE ROLLBACK PROBLEM, and why the guards look the way they do
-- ============================================================
-- The obvious implementation is: log the attempt, then RAISE to reject it.
-- That does not work. The RAISE aborts the statement, which rolls back the
-- INSERT that recorded it. Verified directly: log-then-raise left 0 rows.
-- The events that matter most were exactly the ones being discarded.
--
-- dblink would give an autonomous commit, but it requires a stored password:
-- a database credential living in the database, which is the class of thing
-- this whole engagement removed. Rejected.
--
-- The working answer is to stop fighting the rollback. Guards are split by
-- whether the action has an innocent explanation:
--
--   ATTACK SHAPED (setting your own role, forcing a friendship, forging a
--   requester, granting owner without being one): NEUTRALISE and log. A
--   legitimate client never does these, so refusing silently costs no UX, the
--   attacker learns nothing about what tripped, and the log survives.
--
--   USER FACING (rate limits, blocked interactions): RAISE with a readable
--   message, and accept that the event is not recorded. These are expected
--   during normal use and the person needs to be told.
--
-- KNOWN BLIND SPOT: attempts blocked by COLUMN GRANTS fail at the privilege
-- layer with SQLSTATE 42501 before any trigger runs, so they cannot be logged
-- here at all. They surface to the client as 403 and would need client-side
-- reporting to capture. Stated rather than papered over.
--
-- VERIFIED: three simulated attacks produced three events
-- (self_role_change_attempt, forced_friendship_attempt, forged_friend_request)
-- while every defence still held: the admin stayed 'admin', the forced
-- friendship landed as 'pending', and a legitimate owner demotion still worked.

create table if not exists public.security_event (
  id          bigserial primary key,
  occurred_at timestamptz not null default now(),
  actor_id    uuid,
  kind        text not null,
  target_id   uuid,
  detail      jsonb not null default '{}'::jsonb
);
create index if not exists security_event_time_idx  on public.security_event (occurred_at desc);
create index if not exists security_event_actor_idx on public.security_event (actor_id, occurred_at desc);
create index if not exists security_event_kind_idx  on public.security_event (kind, occurred_at desc);

alter table public.security_event enable row level security;

drop policy if exists "admins read security events" on public.security_event;
create policy "admins read security events" on public.security_event
  for select to authenticated
  using (exists (select 1 from public.profiles p
                  where p.id = auth.uid() and p.role in ('admin','owner')));

revoke all on public.security_event from anon, authenticated;
grant select on public.security_event to authenticated;
revoke all on sequence public.security_event_id_seq from anon, authenticated;

-- Never raises: a failure to record must not change the outcome of the thing
-- being guarded, or logging becomes a denial of service against the app.
create or replace function public.log_security_event(
  p_kind text, p_target uuid default null, p_detail jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path to 'public','pg_temp'
as $fn$
begin
  insert into public.security_event(actor_id, kind, target_id, detail)
  values (auth.uid(), p_kind, p_target, coalesce(p_detail,'{}'::jsonb));
exception when others then
  null;
end $fn$;

revoke execute on function public.log_security_event(text,uuid,jsonb)
  from public, anon, authenticated;

-- ============================================================
-- Alerting: patterns, not individual events
-- ============================================================
-- One rate-limit hit is a user typing quickly. Forty in an hour from one actor
-- is someone probing. Escalation attempts alert on the FIRST occurrence,
-- because there is no innocent version of trying to grant yourself owner.
create or replace function public.alert_security_events()
returns void language plpgsql security definer set search_path to 'public','pg_temp'
as $fn$
declare v_hook text; v_lines text; v_urgent int; v_noisy int;
begin
  select count(*) into v_urgent from public.security_event
   where occurred_at > now() - interval '10 minutes'
     and kind in ('signup_privilege_attempt','founder_demotion_attempt',
                  'self_role_change_attempt','owner_grant_attempt',
                  'unauthorised_role_change','forced_friendship_attempt',
                  'forged_friend_request','self_accept_attempt');

  select count(*) into v_noisy from (
    select actor_id from public.security_event
     where occurred_at > now() - interval '1 hour'
     group by actor_id having count(*) >= 40) t;

  if v_urgent = 0 and v_noisy = 0 then return; end if;

  select decrypted_secret into v_hook from vault.decrypted_secrets
   where name = 'discord_error_webhook';
  if v_hook is null then return; end if;

  select string_agg(format('%s x%s (actor %s)', kind, n,
           coalesce(left(actor_id::text,8),'anon')), chr(10))
    into v_lines
    from (select kind, actor_id, count(*) n from public.security_event
           where occurred_at > now() - interval '1 hour'
           group by kind, actor_id order by count(*) desc limit 10) t;

  perform net.http_post(
    url := v_hook,
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := json_build_object('content',
      left('SECURITY: '||v_urgent||' escalation attempt(s) in 10 min, '
        ||v_noisy||' actor(s) over 40 events/hour'||chr(10)||chr(10)
        ||coalesce(v_lines,''), 1900))::jsonb);
end $fn$;

revoke execute on function public.alert_security_events() from public, anon, authenticated;

create or replace function public.prune_security_events()
returns void language plpgsql security definer set search_path to 'public','pg_temp'
as $fn$
begin
  delete from public.security_event where occurred_at < now() - interval '90 days';
end $fn$;
revoke execute on function public.prune_security_events() from public, anon, authenticated;

select cron.schedule('alert-security-events','*/10 * * * *',
  $c$select public.alert_security_events()$c$);
select cron.schedule('prune-security-events','41 4 * * *',
  $c$select public.prune_security_events()$c$);

-- Admin read path -----------------------------------------------------------
create or replace function public.admin_security_events(p_limit int default 100)
returns jsonb language plpgsql security definer set search_path to 'public','pg_temp'
as $fn$
declare v jsonb;
begin
  if not exists (select 1 from public.profiles
                  where id = auth.uid() and role in ('admin','owner')) then
    raise exception 'not authorised';
  end if;
  select coalesce(jsonb_agg(t order by t.occurred_at desc),'[]'::jsonb) into v
    from (select occurred_at, kind, actor_id, detail from public.security_event
           order by occurred_at desc
           limit greatest(1, least(coalesce(p_limit,100), 500))) t;
  return v;
end $fn$;
revoke execute on function public.admin_security_events(int) from public, anon;
grant  execute on function public.admin_security_events(int) to authenticated;

-- The instrumented guard bodies (guard_profile_role, guard_friendship_accept,
-- throttle_comment, throttle_shared_item, throttle_reaction) are applied in the
-- same migration run; see those functions for current definitions.

-- Report
select 'security_event table' as check,
  case when to_regclass('public.security_event') is not null then 'present' else 'MISSING' end as actual,
  'present' as expected
union all select 'clients cannot write',
  case when has_table_privilege('authenticated','public.security_event','insert,update,delete')
       then 'WRITABLE (BAD)' else 'read only' end, 'read only'
union all select 'alert job scheduled',
  case when exists (select 1 from cron.job where jobname='alert-security-events')
       then 'yes' else 'NO' end, 'yes';
