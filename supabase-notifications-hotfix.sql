-- ============================================================================
-- Craft & Cup - HOTFIX: allow 'announcement' notifications
-- ----------------------------------------------------------------------------
-- Why: the broadcast (and the new owner direct-message feature) insert a
-- notification of type 'announcement', but the notifications.type CHECK
-- constraint didn't allow that value, so every send failed with:
--   error 23514  "new row for relation "notifications" violates
--                 check constraint "notifications_type_check""
--
-- This rebuilds the constraint from the union of the app's known notification
-- types and whatever already exists in the table, so it can never fail on your
-- existing rows, and it adds the missing owner direct-message function.
--
-- Safe to run more than once. Paste the whole thing into the Supabase SQL
-- editor and Run.
-- ============================================================================

-- 1) Rebuild the type constraint to include 'announcement'.
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

-- 2) Owner direct-message function (lands in a single user's notifications).
--    Gated to admins/owners via is_admin(). If you've already run the full
--    admin SQL this just refreshes it; if not, this creates it.
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

grant execute on function public.admin_message_user(uuid, text) to authenticated;
