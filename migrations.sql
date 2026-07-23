-- ============================================================================
-- Craft & Cup - consolidated schema migrations (canonical record)
-- ============================================================================
-- Order matches how they were applied to the live Supabase project.
-- Sections 2-4 are verbatim what was run and are safe to re-run.
-- Section 1 (security) is reconstructed from the remediation notes; Supabase
-- auto-names some policies, so verify the exact policy/function names against
-- your DB before re-running section 1 on a fresh project:
--   select policyname from pg_policies where schemaname = 'storage' and tablename = 'objects';
--   select policyname from pg_policies where tablename = 'notifications';
-- Run in the Supabase SQL editor.
-- ============================================================================


-- ── 1) Security remediation (cleared 6 Supabase Advisor warnings) ───────────

-- 1a. Lock down the unused SECURITY DEFINER rls_auto_enable() (was callable by
--     anon via /rest/v1/rpc). If you have since DROPPED this function, remove
--     this line.
revoke execute on function public.rls_auto_enable() from anon, authenticated, public;

-- 1b. Notifications: only allow inserting a notification you are the actor of
--     (was WITH CHECK (true), which let any signed-in user forge notifications).
alter policy "Users can insert notifications" on public.notifications
  with check (auth.uid() = actor_id);

-- 1c. Storage: drop the over-broad "publicly viewable" listing policies on the
--     image buckets. The app only uploads + reads public URLs, never list(), so
--     this is safe. (Exact names were environment-specific - adjust if yours differ.)
drop policy if exists "Bean images are publicly viewable" on storage.objects;
drop policy if exists "Recipe images are publicly viewable" on storage.objects;

-- 1d. Pin the search_path on generate_friend_code() (mutable search_path warning).
alter function public.generate_friend_code() set search_path = public, pg_temp;


-- ── 2) S3: milk unit on recipes ─────────────────────────────────────────────
alter table public.recipes
  add column if not exists milk_unit text default 'oz';


-- ── 3) Phase 3: recipe tags + versioning ────────────────────────────────────
alter table public.recipes
  add column if not exists tags text[] not null default '{}';

alter table public.recipes
  add column if not exists versions jsonb not null default '[]'::jsonb;


-- ── 4) Freemium AI monthly quota ────────────────────────────────────────────

-- 4a. Plan on profiles: 'free' | 'paid'. Flip a user to paid by hand for now:
--     update public.profiles set plan = 'paid' where id = '<user-uuid>';
alter table public.profiles
  add column if not exists plan text not null default 'free';

-- 4b. Monthly usage counter (one row per user per UTC month).
create table if not exists public.ai_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  period  text not null,               -- 'YYYY-MM' (UTC)
  count   int  not null default 0,
  primary key (user_id, period)
);

alter table public.ai_usage enable row level security;

-- Users may READ their own usage (for the meter). Writes happen only through the
-- SECURITY DEFINER function below.
drop policy if exists "read own ai usage" on public.ai_usage;
create policy "read own ai usage" on public.ai_usage
  for select using (auth.uid() = user_id);

-- 4c. Atomic check-and-increment. Free users capped at FREE_LIMIT/month; paid
--     unmetered. >> To change the free limit: edit FREE_LIMIT and re-run. <<
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

  if v_plan = 'paid' then
    insert into public.ai_usage (user_id, period, count) values (v_uid, v_period, 1)
      on conflict (user_id, period) do update set count = ai_usage.count + 1
      returning count into v_count;
    return jsonb_build_object('allowed', true, 'plan', 'paid', 'used', v_count, 'limit', null);
  end if;

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


-- ── 5) Owner / admin role ───────────────────────────────────────────────────
-- Role is separate from billing plan: 'user' (default) | 'admin' | 'owner'.
-- Owner/admin get unlimited AI. The consume_ai_credit() below SUPERSEDES the
-- section-4 version (last definition wins when run top-to-bottom).

alter table public.profiles
  add column if not exists role text not null default 'user';

-- Privilege-escalation guard: a regular client CANNOT change any profile's role.
-- Role changes are allowed only from the SQL editor / service context
-- (auth.uid() is null) or by a caller who is already an admin/owner.
create or replace function public.guard_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- The founder account is permanently owner and cannot be toggled off (by
  -- anyone, via any path - even a direct SQL update is reverted here).
  if old.id = 'c54ef74b-de38-425f-b536-6854b5e5d75e' then
    new.role := 'owner';
    return new;
  end if;
  -- Otherwise a regular client can't change any profile's role.
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not exists (
       select 1 from public.profiles p
       where p.id = auth.uid() and p.role in ('admin', 'owner')
     ) then
    new.role := old.role;  -- revert unauthorized role change
  end if;
  return new;
end;
$$;

drop trigger if exists guard_profile_role_trg on public.profiles;
create trigger guard_profile_role_trg
  before update on public.profiles
  for each row execute function public.guard_profile_role();

-- AI quota now treats admin/owner as unmetered (like paid).
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
  v_role   text;
  v_count  int;
begin
  if v_uid is null then
    return jsonb_build_object('allowed', false, 'reason', 'unauthenticated');
  end if;

  select plan, role into v_plan, v_role from public.profiles where id = v_uid;

  if v_plan = 'paid' or v_role in ('admin', 'owner') then
    insert into public.ai_usage (user_id, period, count) values (v_uid, v_period, 1)
      on conflict (user_id, period) do update set count = ai_usage.count + 1
      returning count into v_count;
    return jsonb_build_object('allowed', true, 'plan', coalesce(v_plan,'free'), 'role', coalesce(v_role,'user'), 'used', v_count, 'limit', null);
  end if;

  select count into v_count from public.ai_usage where user_id = v_uid and period = v_period;
  v_count := coalesce(v_count, 0);

  if v_count >= FREE_LIMIT then
    return jsonb_build_object('allowed', false, 'reason', 'limit_reached', 'plan', 'free', 'role', coalesce(v_role,'user'), 'used', v_count, 'limit', FREE_LIMIT);
  end if;

  insert into public.ai_usage (user_id, period, count) values (v_uid, v_period, 1)
    on conflict (user_id, period) do update set count = ai_usage.count + 1
    returning count into v_count;
  return jsonb_build_object('allowed', true, 'plan', 'free', 'role', coalesce(v_role,'user'), 'used', v_count, 'limit', FREE_LIMIT);
end;
$$;

-- Bootstrap: make nicholassmitchell@gmail.com the owner.
update public.profiles set role = 'owner'
where id = 'c54ef74b-de38-425f-b536-6854b5e5d75e';


-- ── 6) Admin capabilities (owner/admin only) ────────────────────────────────
-- Broadcast, user management, and moderation. Every function checks is_admin().

alter table public.reports add column if not exists status text not null default 'open';

-- Allow 'announcement' notifications (broadcasts + owner direct messages).
-- The original CHECK constraint on notifications.type didn't include
-- 'announcement', so broadcast_notification() and admin_message_user() failed
-- with error 23514 ("violates check constraint notifications_type_check").
-- This rebuilds the constraint from the union of the app's known types and
-- whatever already exists in the table, so it can never fail on existing rows.
do $$
declare v_types text;
begin
  select string_agg(quote_literal(t), ',') into v_types
  from (
    select unnest(array[
      'reaction','comment','friend_request','friend_accepted','inbox','announcement'
    ]) as t
    union
    select type from public.notifications where type is not null
  ) s;
  execute 'alter table public.notifications drop constraint if exists notifications_type_check';
  execute 'alter table public.notifications add constraint notifications_type_check check (type in (' || v_types || '))';
end $$;

create or replace function public.is_admin()
returns boolean language sql security definer set search_path = public, pg_temp stable
as $$ select exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','owner')); $$;

create or replace function public.broadcast_notification(p_message text)
returns int language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_count int;
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  if p_message is null or length(trim(p_message)) = 0 then raise exception 'empty message'; end if;
  insert into public.notifications (user_id, type, actor_id, reference_id, message, read)
    select id, 'announcement', auth.uid(), auth.uid(), left(trim(p_message), 500), false from public.profiles;
  get diagnostics v_count = row_count;
  return v_count;
end; $$;

create or replace function public.admin_overview()
returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  return jsonb_build_object(
    'users', (select count(*) from public.profiles),
    'beans', (select count(*) from public.beans),
    'recipes', (select count(*) from public.recipes),
    'activity', (select count(*) from public.activity),
    'open_reports', (select count(*) from public.reports where status = 'open'));
end; $$;

create or replace function public.admin_list_users()
returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'screenname', p.screenname, 'plan', p.plan, 'role', p.role) order by p.screenname nulls last) from public.profiles p), '[]'::jsonb);
end; $$;

create or replace function public.admin_set_user(p_user uuid, p_plan text, p_role text)
returns void language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  if p_plan is not null and p_plan not in ('free','paid') then raise exception 'bad plan'; end if;
  if p_role is not null and p_role not in ('user','admin','owner') then raise exception 'bad role'; end if;
  update public.profiles set plan = coalesce(p_plan, plan), role = coalesce(p_role, role) where id = p_user;
end; $$;

create or replace function public.admin_list_reports()
returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object(
    'comment_id', r.comment_id::text, 'reason', r.reason, 'reporter', rp.screenname,
    'author', ca.screenname, 'content', c.content, 'deleted', coalesce(c.is_deleted, false)) order by r.created_at desc)
    from public.reports r
    left join public.comments c on c.id = r.comment_id
    left join public.profiles rp on rp.id = r.reporter_id
    left join public.profiles ca on ca.id = c.user_id
    where r.status = 'open'), '[]'::jsonb);
end; $$;

create or replace function public.admin_resolve_report(p_comment_id text, p_remove boolean)
returns void language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  if p_remove then update public.comments set is_deleted = true, content = '' where id::text = p_comment_id; end if;
  update public.reports set status = 'resolved' where comment_id::text = p_comment_id;
end; $$;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.broadcast_notification(text) to authenticated;
grant execute on function public.admin_overview() to authenticated;
grant execute on function public.admin_list_users() to authenticated;
grant execute on function public.admin_set_user(uuid, text, text) to authenticated;
grant execute on function public.admin_list_reports() to authenticated;
grant execute on function public.admin_resolve_report(text, boolean) to authenticated;

-- Direct-message a single user (lands in their notifications).
create or replace function public.admin_message_user(p_user uuid, p_message text)
returns void language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  if p_message is null or length(trim(p_message)) = 0 then raise exception 'empty message'; end if;
  insert into public.notifications (user_id, type, actor_id, reference_id, message, read)
    values (p_user, 'announcement', auth.uid(), auth.uid(), left(trim(p_message), 500), false);
end; $$;
grant execute on function public.admin_message_user(uuid, text) to authenticated;
