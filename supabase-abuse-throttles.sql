-- Craft & Cup - abuse throttles. RAN AND VERIFIED 2026-09-01.
--
-- FOUND by attack: lifetime row caps existed but nothing per-hour. 250 DMs and
-- 250 comments both landed unopposed in seconds, and 300 notifications reached
-- one victim's bell. That is harassment, not a data breach, but it drives users
-- away just as effectively.
--
-- LIMITS (per hour). Roughly 3-5x enthusiastic real use, so an active user never
-- notices while a flood stops in seconds. The PER-TARGET limits matter more than
-- the global ones: 20 DMs to ONE person is what stops harassment; 50 overall
-- only stops broad spam.
--   comments        30 overall,  10 per post
--   direct sends    50 overall,  20 per recipient
--   reactions      100 overall  (schema also enforces one per post)
--   notifications  200 overall,  30 per recipient  (see supabase-notify-function.sql)
--
-- Bucketed counters: every check is one O(1) primary-key upsert, so cost does
-- not grow with volume. Buckets are pruned nightly.
--
-- ERROR CODE: throttles raise the default P0001, deliberately distinct from the
-- check_violation used by row caps and real CHECK constraints. The client shows
-- the message for P0001 only (see friendlyDbError in index.jsx), so a user gets
-- 'please wait a few minutes' instead of 'try again', and a raw Postgres error
-- can never reach them. Without this the throttle worked but taught nothing: the
-- user saw a generic failure and simply retried.
--
-- REACTIONS NOTE: reactions already carry UNIQUE (user_id, activity_id) and a
-- CHECK on allowed values, so reaction spam was never possible. The throttle is
-- belt-and-braces.
--
-- VERIFIED: of 250 attempts each, 20 DMs and 10 comments were accepted and the
-- rest refused; a normal comment from another user was unaffected.

create table if not exists public.rate_bucket (
  bucket text primary key,
  n      int  not null default 0
);
alter table public.rate_bucket enable row level security;  -- no policy: server-only

-- Returns true while the caller is still UNDER the limit.
create or replace function public.check_rate(p_key text, p_limit int)
returns boolean
language plpgsql security definer set search_path to 'public','pg_temp'
as $$
declare v_n int;
begin
  insert into public.rate_bucket (bucket, n)
  values (p_key || ':' || to_char(date_trunc('hour', now()), 'YYYYMMDDHH24'), 1)
    on conflict (bucket) do update set n = rate_bucket.n + 1
    returning n into v_n;
  return v_n <= p_limit;
end $$;

revoke execute on function public.check_rate(text,int) from public, anon, authenticated;

create or replace function public.throttle_comment()
returns trigger language plpgsql security definer set search_path to 'public','pg_temp'
as $$
begin
  if auth.uid() is null then return new; end if;
  if not public.check_rate('c:'||new.user_id::text, 30) then
    raise exception 'You are commenting too quickly. Please wait a few minutes.';
  end if;
  if not public.check_rate('ca:'||new.user_id::text||':'||new.activity_id::text, 10) then
    raise exception 'You have commented on this post several times already. Please wait a few minutes.';
  end if;
  return new;
end $$;

create or replace function public.throttle_shared_item()
returns trigger language plpgsql security definer set search_path to 'public','pg_temp'
as $$
begin
  if auth.uid() is null then return new; end if;
  if not public.check_rate('sp:'||new.sender_id::text||':'||new.receiver_id::text, 20) then
    raise exception 'You have sent this person several items already. Please wait a few minutes.';
  end if;
  if not public.check_rate('s:'||new.sender_id::text, 50) then
    raise exception 'You are sending too quickly. Please wait a few minutes.';
  end if;
  return new;
end $$;

create or replace function public.throttle_reaction()
returns trigger language plpgsql security definer set search_path to 'public','pg_temp'
as $$
begin
  if auth.uid() is null then return new; end if;
  if not public.check_rate('r:'||new.user_id::text, 100) then
    raise exception 'You are reacting too quickly. Please wait a few minutes.';
  end if;
  return new;
end $$;

drop trigger if exists comments_throttle     on public.comments;
drop trigger if exists shared_items_throttle on public.shared_items;
drop trigger if exists reactions_throttle    on public.reactions;

create trigger comments_throttle     before insert on public.comments
  for each row execute function public.throttle_comment();
create trigger shared_items_throttle before insert on public.shared_items
  for each row execute function public.throttle_shared_item();
create trigger reactions_throttle    before insert on public.reactions
  for each row execute function public.throttle_reaction();

-- Keep the counter table bounded.
create or replace function public.prune_rate_buckets()
returns void language plpgsql security definer set search_path to 'public','pg_temp'
as $$
begin
  delete from public.rate_bucket
   where right(bucket, 10) < to_char(now() - interval '2 hours', 'YYYYMMDDHH24');
end $$;

revoke execute on function public.prune_rate_buckets() from public, anon, authenticated;

select cron.schedule('prune-rate-buckets', '31 4 * * *', $$select public.prune_rate_buckets()$$);

-- Report
select 'rate_bucket table' as check,
  case when to_regclass('public.rate_bucket') is not null then 'present' else 'MISSING' end as actual,
  'present' as expected
union all select 'throttle triggers',
  (select count(*)::text from pg_trigger
    where tgname in ('comments_throttle','shared_items_throttle','reactions_throttle')
      and not tgisinternal), '3';
