-- Craft & Cup - blocking. RAN AND VERIFIED 2026-09-01.
-- Closes audit finding M-2, the last unaddressed user-safety gap.
--
-- WHY: per-hour throttles limit how MUCH someone can send you. They do not
-- limit WHO can reach you. A person being harassed had no self-service remedy;
-- the only recourse was the report queue, which is reactive and needs the
-- operator to act. Sustained low-volume harassment was possible within limits.
--
-- DESIGN DECISIONS, stated so they are easy to change:
--
--   * A block is MUTUAL in effect but ONE-DIRECTIONAL in record. Either party
--     blocking stops interaction both ways. is_blocked() checks both columns.
--
--   * The blocked person is NOT told. They see no error naming a block; the
--     notification path drops silently rather than raising. Discovering a block
--     is frequently what escalates harassment, so this is deliberate.
--
--   * Blocking SEVERS an existing friendship, in both directions. Leaving one
--     in place would keep granting friends-only visibility to someone you just
--     blocked, which would make the feature actively misleading.
--
--   * A block hides the blocker's posts from the blocked person, but does NOT
--     hide public posts from the wider world. Blocking is not deletion.
--
--   * Unblocking fully restores normal interaction. It does not restore the
--     severed friendship, which must be re-requested.
--
-- ENFORCED AT FIVE SURFACES. Anything less leaves a channel open, and a
-- partial block is worse than none because it implies safety it does not
-- provide:
--   comments      throttle_comment      (BEFORE INSERT)
--   reactions     throttle_reaction     (BEFORE INSERT)
--   direct sends  throttle_shared_item  (BEFORE INSERT)
--   friend reqs   guard_friendship_accept (BEFORE INSERT)
--   feed          the activity SELECT policy
-- Comments and reactions additionally inherit feed visibility, because both
-- policies scope to the parent activity.
--
-- NOTE ON THE GRANT TO anon: the activity SELECT policy applies to every role,
-- so every role must be able to EXECUTE is_blocked() or the policy errors
-- instead of denying. This was the third instance in one session of a policy
-- calling a function the querying role could not execute (see the is_admin()
-- note in supabase-admin-usage.sql). It is safe: the function returns false
-- for a null caller and reveals nothing beyond whether two ids are blocked.
--
-- VERIFIED, all ten conditions: a blocked user cannot comment, react, send an
-- item, or send a friend request; notifications reaching the victim = 0; the
-- blocked user sees 0 of the victim's posts; the existing friendship was
-- removed; anonymous visitors still see the public post; the owner still sees
-- their own; and after unblocking, commenting works again.

create table if not exists public.blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint blocks_not_self check (blocker_id <> blocked_id)
);
create index if not exists blocks_blocked_idx on public.blocks (blocked_id);

alter table public.blocks enable row level security;

-- You see and manage only your OWN block list, so the blocked person cannot
-- discover the block by reading the table.
drop policy if exists "manage own blocks" on public.blocks;
create policy "manage own blocks" on public.blocks
  for all to authenticated
  using (auth.uid() = blocker_id) with check (auth.uid() = blocker_id);

revoke all on public.blocks from anon, authenticated;
grant select, insert, delete on public.blocks to authenticated;

create or replace function public.is_blocked(p_a uuid, p_b uuid)
returns boolean language sql stable security definer set search_path to 'public','pg_temp'
as $fn$
  select case when p_a is null or p_b is null then false else exists (
    select 1 from public.blocks
     where (blocker_id = p_a and blocked_id = p_b)
        or (blocker_id = p_b and blocked_id = p_a)) end;
$fn$;

revoke execute on function public.is_blocked(uuid,uuid) from public;
grant  execute on function public.is_blocked(uuid,uuid) to anon, authenticated;

-- Blocking severs any existing friendship in both directions.
create or replace function public.on_block_created()
returns trigger language plpgsql security definer set search_path to 'public','pg_temp'
as $fn$
begin
  delete from public.friendships
   where (requester_id = new.blocker_id and receiver_id = new.blocked_id)
      or (requester_id = new.blocked_id and receiver_id = new.blocker_id);
  return new;
end $fn$;

revoke execute on function public.on_block_created() from public, anon, authenticated;

drop trigger if exists on_block_created_trg on public.blocks;
create trigger on_block_created_trg after insert on public.blocks
  for each row execute function public.on_block_created();

-- Feed visibility -----------------------------------------------------------
drop policy if exists "Users can view activity" on public.activity;
create policy "Users can view activity" on public.activity
  for select
  using (
    (auth.uid() = user_id)
    or (
      not public.is_blocked(auth.uid(), user_id)
      and (
        is_public = true
        or exists (
          select 1 from public.friendships f
           where f.status = 'accepted'
             and ((f.requester_id = auth.uid() and f.receiver_id = activity.user_id)
               or (f.receiver_id  = auth.uid() and f.requester_id = activity.user_id))
        )
      )
    )
  );

-- The block checks inside throttle_comment, throttle_reaction,
-- throttle_shared_item, guard_friendship_accept and notify() are applied in
-- the same migration run; see those functions for the current bodies.

-- Report
select 'blocks table' as check,
  case when to_regclass('public.blocks') is not null then 'present' else 'MISSING' end as actual,
  'present' as expected
union all select 'anon can evaluate is_blocked',
  case when has_function_privilege('anon','public.is_blocked(uuid,uuid)','execute')
       then 'yes' else 'NO (policy would error)' end, 'yes'
union all select 'friendship-sever trigger',
  case when exists (select 1 from pg_trigger where tgname='on_block_created_trg' and not tgisinternal)
       then 'present' else 'MISSING' end, 'present';
