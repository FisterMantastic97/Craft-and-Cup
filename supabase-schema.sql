-- Craft & Cup - full database schema, dumped from production 2026-09-01.
--
-- WHY THIS FILE EXISTS: the schema used to live only inside the Supabase
-- dashboard. Fifteen tables holding every bean, recipe, profile and message,
-- plus the 39 RLS policies protecting them, existed nowhere in version
-- control. If the project were lost there was no way to rebuild it, and
-- nobody could review the policies guarding user data without clicking
-- through the dashboard UI.
--
-- This is a REFERENCE dump, not a migration. It is NOT idempotent and running
-- it against the live database is not the intended use. Use it to review the
-- security model, to diff against after a change, or to rebuild from scratch.
-- Incremental changes still belong in their own supabase-*.sql files.
--
-- Verified at dump time: RLS enabled on all 15 tables, every table carries at
-- least one policy, and an anonymous REST probe returned zero rows from every
-- table holding user data.
--
-- NOTE: cupping_sessions and cupping_entries exist but are never queried by
-- the app. They look like abandoned early work; decide whether to keep them.

-- ============================================================
-- TABLES
-- ============================================================

create table if not exists public.activity (
  id uuid not null default gen_random_uuid(),
  user_id uuid,
  type text,
  item_data jsonb,
  is_public boolean default false,
  created_at timestamp with time zone default now()
);

create table if not exists public.ai_usage (
  user_id uuid not null,
  period text not null,
  count integer not null default 0
);

create table if not exists public.beans (
  id uuid not null default gen_random_uuid(),
  user_id uuid,
  local_id text,
  brand text,
  name text,
  origin text,
  roast text,
  brew_method text,
  notes text,
  flavor_text text,
  flavor_data jsonb,
  scores jsonb,
  is_example boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  visibility text default 'private'::text,
  image_url text
);

create table if not exists public.collections (
  id uuid not null default gen_random_uuid(),
  user_id uuid,
  name text,
  description text,
  is_public boolean default false,
  beans jsonb default '[]'::jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.comments (
  id uuid not null default gen_random_uuid(),
  activity_id uuid,
  user_id uuid,
  content text not null,
  is_deleted boolean default false,
  is_edited boolean default false,
  edited_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

create table if not exists public.cupping_entries (
  id uuid not null default gen_random_uuid(),
  session_id uuid,
  user_id uuid,
  scores jsonb,
  notes text,
  flavor_data jsonb,
  created_at timestamp with time zone default now()
);

create table if not exists public.cupping_sessions (
  id uuid not null default gen_random_uuid(),
  host_id uuid,
  name text,
  bean_data jsonb,
  status text default 'open'::text,
  created_at timestamp with time zone default now()
);

create table if not exists public.friendships (
  id uuid not null default gen_random_uuid(),
  requester_id uuid,
  receiver_id uuid,
  status text default 'pending'::text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.notifications (
  id uuid not null default gen_random_uuid(),
  user_id uuid,
  type text,
  actor_id uuid,
  reference_id text,
  message text,
  read boolean default false,
  created_at timestamp with time zone default now()
);

create table if not exists public.profiles (
  id uuid not null,
  screenname text,
  bio text,
  is_public boolean default false,
  avatar_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  friend_code text,
  plan text not null default 'free'::text,
  role text not null default 'user'::text
);

create table if not exists public.reactions (
  id uuid not null default gen_random_uuid(),
  user_id uuid,
  activity_id uuid,
  reaction text,
  created_at timestamp with time zone default now()
);

create table if not exists public.rec_usage (
  user_id uuid not null,
  period text not null,
  count integer not null default 0
);

create table if not exists public.recipes (
  id uuid not null default gen_random_uuid(),
  user_id uuid,
  local_id text,
  name text,
  type text,
  shots integer,
  yield_g integer,
  milk text,
  milk_oz numeric,
  temp text,
  syrup text,
  extras text,
  steps text,
  rating integer,
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  visibility text default 'private'::text,
  image_url text,
  flavor_text text,
  flavor_data jsonb,
  milk_unit text default 'oz'::text,
  tags text[] not null default '{}'::text[],
  versions jsonb not null default '[]'::jsonb
);

create table if not exists public.reports (
  id uuid not null default gen_random_uuid(),
  reporter_id uuid,
  comment_id uuid,
  reason text,
  created_at timestamp with time zone default now(),
  status text not null default 'open'::text
);

create table if not exists public.shared_items (
  id uuid not null default gen_random_uuid(),
  sender_id uuid,
  receiver_id uuid,
  item_type text,
  item_data jsonb,
  message text,
  read boolean default false,
  created_at timestamp with time zone default now()
);

-- ============================================================
-- CONSTRAINTS
-- ============================================================

-- activity
alter table activity add constraint activity_pkey PRIMARY KEY (id);
alter table activity add constraint activity_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table activity add constraint activity_type_check CHECK ((type = ANY (ARRAY['logged_bean'::text, 'logged_recipe'::text, 'joined'::text])));

-- ai_usage
alter table ai_usage add constraint ai_usage_pkey PRIMARY KEY (user_id, period);
alter table ai_usage add constraint ai_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- beans
alter table beans add constraint beans_pkey PRIMARY KEY (id);
alter table beans add constraint beans_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table beans add constraint beans_visibility_check CHECK ((visibility = ANY (ARRAY['private'::text, 'friends'::text, 'public'::text])));

-- collections
alter table collections add constraint collections_pkey PRIMARY KEY (id);
alter table collections add constraint collections_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- comments
alter table comments add constraint comments_pkey PRIMARY KEY (id);
alter table comments add constraint comments_activity_id_fkey FOREIGN KEY (activity_id) REFERENCES activity(id) ON DELETE CASCADE;
alter table comments add constraint comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- cupping_entries
alter table cupping_entries add constraint cupping_entries_session_id_user_id_key UNIQUE (session_id, user_id);
alter table cupping_entries add constraint cupping_entries_pkey PRIMARY KEY (id);
alter table cupping_entries add constraint cupping_entries_session_id_fkey FOREIGN KEY (session_id) REFERENCES cupping_sessions(id) ON DELETE CASCADE;
alter table cupping_entries add constraint cupping_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- cupping_sessions
alter table cupping_sessions add constraint cupping_sessions_pkey PRIMARY KEY (id);
alter table cupping_sessions add constraint cupping_sessions_host_id_fkey FOREIGN KEY (host_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table cupping_sessions add constraint cupping_sessions_status_check CHECK ((status = ANY (ARRAY['open'::text, 'closed'::text])));

-- friendships
alter table friendships add constraint friendships_requester_id_receiver_id_key UNIQUE (requester_id, receiver_id);
alter table friendships add constraint friendships_pkey PRIMARY KEY (id);
alter table friendships add constraint friendships_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table friendships add constraint friendships_requester_id_fkey FOREIGN KEY (requester_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table friendships add constraint friendships_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'declined'::text])));

-- notifications
alter table notifications add constraint notifications_pkey PRIMARY KEY (id);
alter table notifications add constraint notifications_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table notifications add constraint notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table notifications add constraint notifications_type_check CHECK ((type = ANY (ARRAY['reaction'::text, 'comment'::text, 'friend_request'::text, 'friend_accepted'::text, 'inbox'::text, 'announcement'::text])));

-- profiles
alter table profiles add constraint profiles_friend_code_key UNIQUE (friend_code);
alter table profiles add constraint profiles_screenname_key UNIQUE (screenname);
alter table profiles add constraint profiles_pkey PRIMARY KEY (id);
alter table profiles add constraint profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- reactions
alter table reactions add constraint reactions_user_id_activity_id_key UNIQUE (user_id, activity_id);
alter table reactions add constraint reactions_pkey PRIMARY KEY (id);
alter table reactions add constraint reactions_activity_id_fkey FOREIGN KEY (activity_id) REFERENCES activity(id) ON DELETE CASCADE;
alter table reactions add constraint reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table reactions add constraint reactions_reaction_check CHECK ((reaction = ANY (ARRAY['love'::text, 'want_to_try'::text, 'interesting'::text])));

-- rec_usage
alter table rec_usage add constraint rec_usage_pkey PRIMARY KEY (user_id, period);
alter table rec_usage add constraint rec_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- recipes
alter table recipes add constraint recipes_pkey PRIMARY KEY (id);
alter table recipes add constraint recipes_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table recipes add constraint recipes_visibility_check CHECK ((visibility = ANY (ARRAY['private'::text, 'friends'::text, 'public'::text])));

-- reports
alter table reports add constraint reports_pkey PRIMARY KEY (id);
alter table reports add constraint reports_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE;
alter table reports add constraint reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- shared_items
alter table shared_items add constraint shared_items_pkey PRIMARY KEY (id);
alter table shared_items add constraint shared_items_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table shared_items add constraint shared_items_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table shared_items add constraint shared_items_item_type_check CHECK ((item_type = ANY (ARRAY['bean'::text, 'recipe'::text, 'message'::text])));

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.activity enable row level security;
alter table public.ai_usage enable row level security;
alter table public.beans enable row level security;
alter table public.collections enable row level security;
alter table public.comments enable row level security;
alter table public.cupping_entries enable row level security;
alter table public.cupping_sessions enable row level security;
alter table public.friendships enable row level security;
alter table public.notifications enable row level security;
alter table public.profiles enable row level security;
alter table public.reactions enable row level security;
alter table public.rec_usage enable row level security;
alter table public.recipes enable row level security;
alter table public.reports enable row level security;
alter table public.shared_items enable row level security;

-- ============================================================
-- POLICIES
-- ============================================================

-- activity
create policy "Users can insert own activity" on public.activity
  for insert to public
  with check ((auth.uid() = user_id));
create policy "Users can view activity" on public.activity
  for select to public
  using (((auth.uid() = user_id) OR (is_public = true) OR (EXISTS ( SELECT 1
   FROM friendships
  WHERE ((friendships.status = 'accepted'::text) AND (((friendships.requester_id = auth.uid()) AND (friendships.receiver_id = activity.user_id)) OR ((friendships.receiver_id = auth.uid()) AND (friendships.requester_id = activity.user_id))))))));

-- ai_usage
create policy "read own ai usage" on public.ai_usage
  for select to public
  using ((auth.uid() = user_id));

-- beans
create policy "Users can delete own beans" on public.beans
  for delete to public
  using ((auth.uid() = user_id));
create policy "Users can insert own beans" on public.beans
  for insert to public
  with check ((auth.uid() = user_id));
create policy "Users can update own beans" on public.beans
  for update to public
  using ((auth.uid() = user_id));
create policy "Users can view own beans" on public.beans
  for select to public
  using ((auth.uid() = user_id));

-- collections
create policy "Users can manage own collections" on public.collections
  for all to public
  using ((auth.uid() = user_id));
create policy "Users can view public collections" on public.collections
  for select to public
  using (((is_public = true) OR (auth.uid() = user_id)));

-- comments
create policy "Anyone can view comments" on public.comments
  for select to public
  using (true);
create policy "Users can delete own comments" on public.comments
  for delete to public
  using ((auth.uid() = user_id));
create policy "Users can post comments" on public.comments
  for insert to public
  with check ((auth.uid() = user_id));
create policy "Users can update own comments" on public.comments
  for update to public
  using ((auth.uid() = user_id));

-- cupping_entries
create policy "Users can submit entries" on public.cupping_entries
  for insert to public
  with check ((auth.uid() = user_id));
create policy "Users can view entries in their sessions" on public.cupping_entries
  for select to public
  using (((auth.uid() = user_id) OR (EXISTS ( SELECT 1
   FROM cupping_sessions
  WHERE ((cupping_sessions.id = cupping_entries.session_id) AND (cupping_sessions.host_id = auth.uid()))))));

-- cupping_sessions
create policy "Users can create sessions" on public.cupping_sessions
  for insert to public
  with check ((auth.uid() = host_id));
create policy "Users can view sessions they are part of" on public.cupping_sessions
  for select to public
  using (((auth.uid() = host_id) OR (EXISTS ( SELECT 1
   FROM cupping_entries
  WHERE ((cupping_entries.session_id = cupping_sessions.id) AND (cupping_entries.user_id = auth.uid()))))));

-- friendships
create policy "Users can delete their own friendships" on public.friendships
  for delete to public
  using (((auth.uid() = requester_id) OR (auth.uid() = receiver_id)));
create policy "Users can send friend requests" on public.friendships
  for insert to public
  with check ((auth.uid() = requester_id));
create policy "Users can update their own friendships" on public.friendships
  for update to public
  using (((auth.uid() = requester_id) OR (auth.uid() = receiver_id)));
create policy "Users can view their own friendships" on public.friendships
  for select to public
  using (((auth.uid() = requester_id) OR (auth.uid() = receiver_id)));

-- notifications
create policy "Users can insert notifications" on public.notifications
  for insert to authenticated
  with check ((auth.uid() = actor_id));
create policy "Users can update own notifications" on public.notifications
  for update to public
  using ((auth.uid() = user_id));
create policy "Users can view own notifications" on public.notifications
  for select to public
  using ((auth.uid() = user_id));

-- profiles
create policy "Public profiles are viewable by everyone" on public.profiles
  for select to public
  using ((is_public = true));
create policy "Users can insert own profile" on public.profiles
  for insert to public
  with check ((auth.uid() = id));
create policy "Users can update own profile" on public.profiles
  for update to public
  using ((auth.uid() = id));
create policy "Users can view own profile" on public.profiles
  for select to public
  using ((auth.uid() = id));

-- reactions
create policy "Anyone can view reactions" on public.reactions
  for select to public
  using (true);
create policy "Users can manage own reactions" on public.reactions
  for all to public
  using ((auth.uid() = user_id));

-- rec_usage
create policy "read own rec usage" on public.rec_usage
  for select to public
  using ((auth.uid() = user_id));

-- recipes
create policy "Users can delete own recipes" on public.recipes
  for delete to public
  using ((auth.uid() = user_id));
create policy "Users can insert own recipes" on public.recipes
  for insert to public
  with check ((auth.uid() = user_id));
create policy "Users can update own recipes" on public.recipes
  for update to public
  using ((auth.uid() = user_id));
create policy "Users can view own recipes" on public.recipes
  for select to public
  using ((auth.uid() = user_id));

-- reports
create policy "Users can submit reports" on public.reports
  for insert to public
  with check ((auth.uid() = reporter_id));

-- shared_items
create policy "Users can send items" on public.shared_items
  for insert to public
  with check ((auth.uid() = sender_id));
create policy "Users can update read status" on public.shared_items
  for update to public
  using ((auth.uid() = receiver_id));
create policy "Users can view their shared items" on public.shared_items
  for select to public
  using (((auth.uid() = sender_id) OR (auth.uid() = receiver_id)));

-- ============================================================
-- FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION public.admin_list_reports()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('comment_id',r.comment_id::text,'reason',r.reason,'reporter',rp.screenname,
    'author',ca.screenname,'content',c.content,'deleted',coalesce(c.is_deleted,false)) order by r.created_at desc)
    from public.reports r
    left join public.comments c on c.id = r.comment_id
    left join public.profiles rp on rp.id = r.reporter_id
    left join public.profiles ca on ca.id = c.user_id
    where r.status='open'),'[]'::jsonb);
end; $function$;

CREATE OR REPLACE FUNCTION public.admin_list_users()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'screenname',p.screenname,'plan',p.plan,'role',p.role) order by p.screenname nulls last) from public.profiles p),'[]'::jsonb);
end; $function$;

CREATE OR REPLACE FUNCTION public.admin_message_user(p_user uuid, p_message text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  if p_message is null or length(trim(p_message)) = 0 then raise exception 'empty message'; end if;
  insert into public.notifications (user_id, type, actor_id, reference_id, message, read)
    values (p_user, 'announcement', auth.uid(), auth.uid(), left(trim(p_message), 500), false);
end;
$function$;

CREATE OR REPLACE FUNCTION public.admin_overview()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  return jsonb_build_object('users',(select count(*) from public.profiles),'beans',(select count(*) from public.beans),
    'recipes',(select count(*) from public.recipes),'activity',(select count(*) from public.activity),
    'open_reports',(select count(*) from public.reports where status='open'));
end; $function$;

CREATE OR REPLACE FUNCTION public.admin_resolve_report(p_comment_id text, p_remove boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  if p_remove then update public.comments set is_deleted = true, content = '' where id::text = p_comment_id; end if;
  update public.reports set status = 'resolved' where comment_id::text = p_comment_id;
end; $function$;

CREATE OR REPLACE FUNCTION public.admin_set_user(p_user uuid, p_plan text, p_role text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  if p_plan is not null and p_plan not in ('free','paid') then raise exception 'bad plan'; end if;
  if p_role is not null and p_role not in ('user','admin','owner') then raise exception 'bad role'; end if;
  update public.profiles set plan = coalesce(p_plan, plan), role = coalesce(p_role, role) where id = p_user;
end; $function$;

CREATE OR REPLACE FUNCTION public.broadcast_notification(p_message text)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_count int;
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  if p_message is null or length(trim(p_message)) = 0 then raise exception 'empty message'; end if;
  insert into public.notifications (user_id, type, actor_id, reference_id, message, read)
    select id, 'announcement', auth.uid(), auth.uid(), left(trim(p_message), 500), false from public.profiles;
  get diagnostics v_count = row_count;
  return v_count;
end; $function$;

CREATE OR REPLACE FUNCTION public.consume_ai_credit()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  FREE_LIMIT constant int := 10;
  v_uid uuid := auth.uid();
  v_period text := to_char(now() at time zone 'utc', 'YYYY-MM');
  v_plan text; v_role text; v_count int;
begin
  if v_uid is null then return jsonb_build_object('allowed', false, 'reason', 'unauthenticated'); end if;
  select plan, role into v_plan, v_role from public.profiles where id = v_uid;
  if v_plan = 'paid' or v_role in ('admin','owner') then
    insert into public.ai_usage (user_id, period, count) values (v_uid, v_period, 1)
      on conflict (user_id, period) do update set count = ai_usage.count + 1 returning count into v_count;
    return jsonb_build_object('allowed', true, 'plan', coalesce(v_plan,'free'), 'role', coalesce(v_role,'user'), 'used', v_count, 'limit', null);
  end if;
  select count into v_count from public.ai_usage where user_id = v_uid and period = v_period;
  v_count := coalesce(v_count, 0);
  if v_count >= FREE_LIMIT then
    return jsonb_build_object('allowed', false, 'reason', 'limit_reached', 'plan', 'free', 'role', coalesce(v_role,'user'), 'used', v_count, 'limit', FREE_LIMIT);
  end if;
  insert into public.ai_usage (user_id, period, count) values (v_uid, v_period, 1)
    on conflict (user_id, period) do update set count = ai_usage.count + 1 returning count into v_count;
  return jsonb_build_object('allowed', true, 'plan', 'free', 'role', coalesce(v_role,'user'), 'used', v_count, 'limit', FREE_LIMIT);
end; $function$;

CREATE OR REPLACE FUNCTION public.consume_rec_credit()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  REC_FREE_LIMIT constant int := 5;
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
    insert into public.rec_usage (user_id, period, count) values (v_uid, v_period, 1)
      on conflict (user_id, period) do update set count = rec_usage.count + 1
      returning count into v_count;
    return jsonb_build_object('allowed', true, 'plan', 'paid', 'used', v_count, 'limit', null);
  end if;

  select count into v_count from public.rec_usage where user_id = v_uid and period = v_period;
  v_count := coalesce(v_count, 0);

  if v_count >= REC_FREE_LIMIT then
    return jsonb_build_object('allowed', false, 'reason', 'limit_reached', 'plan', 'free', 'used', v_count, 'limit', REC_FREE_LIMIT);
  end if;

  insert into public.rec_usage (user_id, period, count) values (v_uid, v_period, 1)
    on conflict (user_id, period) do update set count = rec_usage.count + 1
    returning count into v_count;
  return jsonb_build_object('allowed', true, 'plan', 'free', 'used', v_count, 'limit', REC_FREE_LIMIT);
end;
$function$;

CREATE OR REPLACE FUNCTION public.generate_friend_code()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  NEW.friend_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 4) || '-' || SUBSTRING(MD5(RANDOM()::TEXT), 1, 4));
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.guard_profile_role()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  -- Founder is permanently owner; cannot be toggled off by anyone.
  if old.id = 'c54ef74b-de38-425f-b536-6854b5e5d75e' then
    new.role := 'owner';
    return new;
  end if;
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','owner')) then
    new.role := old.role;
  end if;
  return new;
end; $function$;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$ select exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','owner')); $function$;

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$;

-- ============================================================
-- TRIGGERS
-- ============================================================

CREATE TRIGGER guard_profile_role_trg BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION guard_profile_role();
CREATE TRIGGER set_friend_code BEFORE INSERT ON public.profiles FOR EACH ROW WHEN ((new.friend_code IS NULL)) EXECUTE FUNCTION generate_friend_code();
