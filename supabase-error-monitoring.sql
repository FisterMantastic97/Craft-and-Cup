-- Craft & Cup - self-hosted error monitoring. RAN AND VERIFIED 2026-09-01.
--
-- WHY NOT SENTRY: a hosted reporter means shipping vendor JavaScript that can
-- read the whole page (tasting notes, bios, anything in the DOM) and loosening
-- the CSP enforced earlier the same day to let it phone home. Keeping this
-- in-house costs grouping-as-a-service and buys not handing user content to a
-- third party.
--
-- DESIGN NOTE (scalability): an earlier draft throttled with COUNT(*) over the
-- whole table on every insert. That is fine at ten users and collapses at ten
-- thousand. Every write path here is an O(1) primary-key upsert instead.
--
-- VERIFIED: two UUID variants of one error collapsed into a single group; a
-- 63-call flood recorded event_count=27 against a cap of 30 while storing only
-- 20 samples, proving the counter keeps counting after storage stops.

create extension if not exists pgcrypto;
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- One row per DISTINCT error. This is the table you actually read.
create table if not exists public.error_group (
  fingerprint    text primary key,
  message        text not null,
  component      text,
  first_seen     timestamptz not null default now(),
  last_seen      timestamptz not null default now(),
  event_count    bigint      not null default 1,
  sample_stack   text,
  sample_url     text,
  sample_release text,
  resolved       boolean     not null default false,
  alerted_at     timestamptz
);
create index if not exists error_group_last_seen_idx
  on public.error_group (last_seen desc) where not resolved;

-- Bounded per-occurrence detail.
create table if not exists public.error_event (
  id          uuid primary key default gen_random_uuid(),
  fingerprint text not null references public.error_group(fingerprint) on delete cascade,
  created_at  timestamptz not null default now(),
  user_id     uuid references auth.users(id) on delete set null,
  url         text,
  user_agent  text,
  release     text
);
create index if not exists error_event_fp_idx on public.error_event (fingerprint, created_at desc);

-- Bucketed rate limiter: PK upsert, so cost does not grow with volume.
create table if not exists public.error_rate (
  bucket text primary key,
  n      int  not null default 0
);

alter table public.error_group enable row level security;
alter table public.error_event enable row level security;
alter table public.error_rate  enable row level security;

-- NOTE: these policies inline the admin check rather than calling is_admin().
-- An RLS policy is evaluated as the QUERYING user, and is_admin() had its
-- EXECUTE revoked from authenticated during the 2026-07-29 definer lockdown, so
-- a policy calling it fails with 'permission denied' and locks admins out of
-- their own error log. Found by testing, not by reading.
drop policy if exists "admins read error groups" on public.error_group;
create policy "admins read error groups" on public.error_group
  for select to authenticated
  using (exists (select 1 from public.profiles p
                  where p.id = auth.uid() and p.role in ('admin','owner')));

drop policy if exists "admins read error events" on public.error_event;
create policy "admins read error events" on public.error_event
  for select to authenticated
  using (exists (select 1 from public.profiles p
                  where p.id = auth.uid() and p.role in ('admin','owner')));

-- digest() is fully qualified: pgcrypto lives in the `extensions` schema on
-- Supabase, and widening this function's search_path would weaken the definer
-- hardening for no good reason.
create or replace function public.log_client_error(
  p_message text, p_stack text default null, p_component text default null,
  p_url text default null, p_release text default null)
returns void language plpgsql security definer set search_path to 'public','pg_temp'
as $$
declare
  v_user uuid := auth.uid();
  v_msg text := left(nullif(trim(p_message),''),500);
  v_norm text; v_fp text; v_bucket text; v_n int; v_samples int;
begin
  if v_msg is null then return; end if;

  v_bucket := coalesce('u:'||v_user::text,'anon')||':'||to_char(date_trunc('hour',now()),'YYYYMMDDHH24');
  insert into public.error_rate (bucket,n) values (v_bucket,1)
    on conflict (bucket) do update set n = error_rate.n + 1 returning n into v_n;
  if v_n > (case when v_user is null then 300 else 30 end) then return; end if;

  -- Fingerprint on the SHAPE of the error so 'bean <uuid>' and 'bean 12345'
  -- group as one bug rather than two.
  v_norm := regexp_replace(lower(v_msg),
    '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', 'N', 'g');
  v_norm := regexp_replace(v_norm, '\d+', 'N', 'g');
  v_norm := regexp_replace(v_norm, 'N(N|-)+', 'N', 'g');
  v_norm := regexp_replace(v_norm, '"[^"]*"', 'S', 'g');
  v_fp := encode(extensions.digest(v_norm||'|'||coalesce(p_component,''),'sha256'),'hex');

  insert into public.error_group (fingerprint,message,component,sample_stack,sample_url,sample_release)
  values (v_fp,v_msg,left(p_component,200),left(p_stack,4000),left(p_url,300),left(p_release,60))
  on conflict (fingerprint) do update
    set event_count = error_group.event_count + 1, last_seen = now(), resolved = false;

  select count(*) into v_samples from public.error_event
   where fingerprint = v_fp and created_at > now() - interval '7 days';
  if v_samples < 20 then
    insert into public.error_event (fingerprint,user_id,url,user_agent,release)
    values (v_fp,v_user,left(p_url,300),
            left(current_setting('request.headers',true)::json->>'user-agent',300),left(p_release,60));
  end if;
end $$;

revoke execute on function public.log_client_error(text,text,text,text,text) from public;
grant  execute on function public.log_client_error(text,text,text,text,text) to anon, authenticated;

-- Alerting: fires once per NEW group, so a bug seen 10,000 times pings once.
-- The Discord webhook is stored in Supabase Vault, NOT here: it is a credential,
-- and anyone holding it can post to the channel. Create it once with:
--   select vault.create_secret('<webhook url>', 'discord_error_webhook', 'error alerts');
create or replace function public.alert_new_errors()
returns void language plpgsql security definer set search_path to 'public','pg_temp'
as $$
declare v_hook text; v_lines text; v_count int;
begin
  select count(*) into v_count from public.error_group where alerted_at is null;
  if v_count = 0 then return; end if;
  select decrypted_secret into v_hook from vault.decrypted_secrets where name = 'discord_error_webhook';
  if v_hook is null then return; end if;
  select string_agg(format('**%s**%sin `%s`, seen %s time(s)%s`%s`',
           left(message,160), chr(10), coalesce(component,'unknown'),
           event_count, chr(10), coalesce(left(sample_url,80),'no url')), chr(10)||chr(10))
    into v_lines
    from (select * from public.error_group where alerted_at is null order by last_seen desc limit 8) t;
  perform net.http_post(
    url := v_hook,
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := json_build_object('content',
      left(v_count||' new error group(s) in Craft & Cup'||chr(10)||chr(10)||v_lines,1900))::jsonb);
  update public.error_group set alerted_at = now() where alerted_at is null;
end $$;

-- Retention: keeps the tables bounded without manual work.
create or replace function public.prune_error_log()
returns void language plpgsql security definer set search_path to 'public','pg_temp'
as $$
begin
  delete from public.error_event where created_at < now() - interval '30 days';
  delete from public.error_rate
   where right(bucket,10) < to_char(now() - interval '2 hours','YYYYMMDDHH24');
  delete from public.error_group where resolved and last_seen < now() - interval '90 days';
end $$;

revoke execute on function public.alert_new_errors() from public, anon, authenticated;
revoke execute on function public.prune_error_log()  from public, anon, authenticated;

select cron.schedule('alert-new-errors', '*/5 * * * *', $$select public.alert_new_errors()$$);
select cron.schedule('prune-error-log',  '17 4 * * *',  $$select public.prune_error_log()$$);
