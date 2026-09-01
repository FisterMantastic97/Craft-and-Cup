-- Craft & Cup - cost controls. RAN AND VERIFIED 2026-09-01.
--
-- WHY: per-user quotas already capped what ONE account could spend. They did
-- nothing about N accounts, and signup is open with no CAPTCHA, so aggregate
-- AI spend was unbounded. Separately, one account inserted 500 beans with no
-- limit, and file COUNT was uncapped even though file SIZE was not.
--
-- VERIFIED: a normal call returns allowed:true; once the global counter hits
-- its ceiling the same user gets allowed:false reason:global_limit. Row caps
-- fire exactly at the ceiling (2 existing + 1 probe + 1997 = 2000) and normal
-- inserts are untouched.

-- ============================================================
-- 1. Global usage ceiling (the kill switch)
-- ============================================================
-- An O(1) counter rather than a sum over a table, so the check costs the same
-- at any volume. This is the difference between a per-user quota and an actual
-- spend guard.
create table if not exists public.global_usage (
  key    text not null,
  period text not null,
  n      int  not null default 0,
  primary key (key, period)
);
alter table public.global_usage enable row level security;  -- no policy: server-only

create or replace function public.check_global_cap(p_key text, p_limit int)
returns boolean
language plpgsql security definer set search_path to 'public','pg_temp'
as $$
declare v_period text := to_char(now() at time zone 'utc','YYYY-MM'); v_n int;
begin
  insert into public.global_usage (key, period, n) values (p_key, v_period, 1)
    on conflict (key, period) do update set n = global_usage.n + 1
    returning n into v_n;
  return v_n <= p_limit;
end $$;

revoke execute on function public.check_global_cap(text,int) from public, anon, authenticated;

-- ============================================================
-- 2. Per-user row caps
-- ============================================================
-- BUG WORTH REMEMBERING: the first version read the owner with
--   case TG_TABLE_NAME when 'shared_items' then new.sender_id else new.user_id end
-- PL/pgSQL resolves record fields when it COMPILES the expression, not lazily,
-- so this raised 'record new has no field sender_id' on every table lacking
-- that column, blocking all inserts in production. to_jsonb(new) looks the
-- column up at runtime instead and works for any table shape.
--
-- Counting uses the (user_id, created_at) indexes from supabase-indexes.sql,
-- so it reads only that user's rows, never the whole table.
create or replace function public.enforce_row_cap()
returns trigger
language plpgsql security definer set search_path to 'public','pg_temp'
as $$
declare
  v_cap   int  := coalesce(nullif(TG_ARGV[0],'')::int, 1000);
  v_col   text := coalesce(nullif(TG_ARGV[1],''), 'user_id');
  v_owner uuid;
  v_count int;
begin
  v_owner := (to_jsonb(new) ->> v_col)::uuid;
  if v_owner is null then return new; end if;

  execute format('select count(*) from public.%I where %I = $1', TG_TABLE_NAME, v_col)
    into v_count using v_owner;

  if v_count >= v_cap then
    raise exception 'limit reached: at most % rows in %', v_cap, TG_TABLE_NAME
      using errcode = 'check_violation';
  end if;
  return new;
end $$;

drop trigger if exists beans_row_cap        on public.beans;
drop trigger if exists recipes_row_cap      on public.recipes;
drop trigger if exists activity_row_cap     on public.activity;
drop trigger if exists comments_row_cap     on public.comments;
drop trigger if exists collections_row_cap  on public.collections;
drop trigger if exists shared_items_row_cap on public.shared_items;

create trigger beans_row_cap        before insert on public.beans
  for each row execute function public.enforce_row_cap('2000','user_id');
create trigger recipes_row_cap      before insert on public.recipes
  for each row execute function public.enforce_row_cap('2000','user_id');
create trigger activity_row_cap     before insert on public.activity
  for each row execute function public.enforce_row_cap('5000','user_id');
create trigger comments_row_cap     before insert on public.comments
  for each row execute function public.enforce_row_cap('5000','user_id');
create trigger collections_row_cap  before insert on public.collections
  for each row execute function public.enforce_row_cap('200','user_id');
create trigger shared_items_row_cap before insert on public.shared_items
  for each row execute function public.enforce_row_cap('2000','sender_id');

-- ============================================================
-- 3. Per-user storage file cap
-- ============================================================
-- File SIZE was already capped at 5MB with an image-only MIME allowlist
-- (see supabase-security-hardening-2026-09-01.sql). Nothing capped COUNT, so
-- 1000 uploads was 5GB. Ownership comes from the path, matching the existing
-- storage policies.
create or replace function public.enforce_storage_cap()
returns trigger
language plpgsql security definer set search_path to 'public','pg_temp','storage'
as $$
declare v_owner text := (storage.foldername(new.name))[1]; v_count int;
begin
  if v_owner is null then return new; end if;
  select count(*) into v_count from storage.objects
   where bucket_id = new.bucket_id and (storage.foldername(name))[1] = v_owner;
  if v_count >= 500 then
    raise exception 'upload limit reached: at most 500 files per bucket'
      using errcode = 'check_violation';
  end if;
  return new;
end $$;

drop trigger if exists storage_file_cap on storage.objects;
create trigger storage_file_cap before insert on storage.objects
  for each row execute function public.enforce_storage_cap();

-- ============================================================
-- 4. Wire the ceiling into both AI paths
-- ============================================================
-- The full bodies of consume_ai_credit() and consume_rec_credit() live in
-- supabase-ai-quota.sql and supabase-rec-quota.sql. Both now call
-- check_global_cap() AFTER the per-user quota (so one abuser exhausts their
-- own allowance first) and BEFORE returning allowed (so the API route never
-- reaches the billable call once the ceiling is hit).
--
--   ai_analyze   ceiling: 5000/month
--   ai_recommend ceiling: 2000/month
--
-- Haiku at max_tokens 1000 is roughly $0.001-$0.005 per call, so 5000/month is
-- about $5-$25 worst case. The ceiling applies to PAID accounts too: it is a
-- spend guard, not a plan feature.
--
-- STILL UNBOUNDED, by nature: Vercel bandwidth and function invocations cannot
-- be limited from inside the app. Set a spend cap in the Vercel dashboard under
-- Settings > Billing. That is the only true ceiling on platform spend.

-- Report
select 'global_usage table' as check,
  case when to_regclass('public.global_usage') is not null then 'present' else 'MISSING' end as actual,
  'present' as expected
union all select 'row cap triggers',
  (select count(*)::text from pg_trigger where tgname like '%!_row!_cap' escape '!' and not tgisinternal), '6'
union all select 'storage cap trigger',
  case when exists (select 1 from pg_trigger where tgname='storage_file_cap' and not tgisinternal)
       then 'present' else 'MISSING' end, 'present';
