-- ============================================================================
-- Craft & Cup - Admin capabilities (owner/admin only)
-- Broadcast announcements, user management, and comment moderation.
-- Every function checks is_admin() first, so a regular client can't call them.
-- Run in the Supabase SQL editor.
-- ============================================================================

-- Track handled state on reports.
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

-- Helper: is the current caller an admin/owner?
create or replace function public.is_admin()
returns boolean
language sql security definer set search_path = public, pg_temp stable
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'owner'));
$$;

-- Broadcast a notification to every user (shows in their notifications bell).
create or replace function public.broadcast_notification(p_message text)
returns int
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_count int;
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  if p_message is null or length(trim(p_message)) = 0 then raise exception 'empty message'; end if;
  insert into public.notifications (user_id, type, actor_id, reference_id, message, read)
    select id, 'announcement', auth.uid(), auth.uid(), left(trim(p_message), 500), false
    from public.profiles;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- Overview counts.
create or replace function public.admin_overview()
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  return jsonb_build_object(
    'users',        (select count(*) from public.profiles),
    'beans',        (select count(*) from public.beans),
    'recipes',      (select count(*) from public.recipes),
    'activity',     (select count(*) from public.activity),
    'open_reports', (select count(*) from public.reports where status = 'open')
  );
end;
$$;

-- List all users for management.
create or replace function public.admin_list_users()
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', p.id, 'screenname', p.screenname, 'plan', p.plan, 'role', p.role
    ) order by p.screenname nulls last)
    from public.profiles p
  ), '[]'::jsonb);
end;
$$;

-- Set a user's plan and/or role (pass null to leave a field unchanged).
create or replace function public.admin_set_user(p_user uuid, p_plan text, p_role text)
returns void
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  if p_plan is not null and p_plan not in ('free', 'paid') then raise exception 'bad plan'; end if;
  if p_role is not null and p_role not in ('user', 'admin', 'owner') then raise exception 'bad role'; end if;
  update public.profiles
     set plan = coalesce(p_plan, plan),
         role = coalesce(p_role, role)
   where id = p_user;
end;
$$;

-- List open reports with the reported comment. comment_id is returned as text so
-- it round-trips regardless of the underlying id type.
create or replace function public.admin_list_reports()
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'comment_id', r.comment_id::text,
      'reason',     r.reason,
      'reporter',   rp.screenname,
      'author',     ca.screenname,
      'content',    c.content,
      'deleted',    coalesce(c.is_deleted, false)
    ) order by r.created_at desc)
    from public.reports r
    left join public.comments c  on c.id = r.comment_id
    left join public.profiles rp on rp.id = r.reporter_id
    left join public.profiles ca on ca.id = c.user_id
    where r.status = 'open'
  ), '[]'::jsonb);
end;
$$;

-- Resolve all open reports for a comment, optionally removing (soft-deleting) it.
create or replace function public.admin_resolve_report(p_comment_id text, p_remove boolean)
returns void
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  if p_remove then
    update public.comments set is_deleted = true, content = '' where id::text = p_comment_id;
  end if;
  update public.reports set status = 'resolved' where comment_id::text = p_comment_id;
end;
$$;

-- Direct-message a single user (lands in their notifications bell).
create or replace function public.admin_message_user(p_user uuid, p_message text)
returns void
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  if p_message is null or length(trim(p_message)) = 0 then raise exception 'empty message'; end if;
  insert into public.notifications (user_id, type, actor_id, reference_id, message, read)
    values (p_user, 'announcement', auth.uid(), auth.uid(), left(trim(p_message), 500), false);
end;
$$;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.broadcast_notification(text) to authenticated;
grant execute on function public.admin_message_user(uuid, text) to authenticated;
grant execute on function public.admin_overview() to authenticated;
grant execute on function public.admin_list_users() to authenticated;
grant execute on function public.admin_set_user(uuid, text, text) to authenticated;
grant execute on function public.admin_list_reports() to authenticated;
grant execute on function public.admin_resolve_report(text, boolean) to authenticated;
