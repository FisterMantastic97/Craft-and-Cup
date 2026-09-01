-- Craft & Cup - server-derived notifications. RAN AND VERIFIED 2026-09-01.
--
-- BEFORE: the notifications INSERT policy checked only auth.uid() = actor_id.
-- It did not constrain user_id (the recipient) or message, and the client
-- passed the message text, which renders straight into the recipient's bell.
-- Any signed-in user could therefore push arbitrary text to any other user:
-- "Your account is suspended, verify at ..." to every account. React escapes
-- the string so there was no XSS, but it was a clean phishing channel.
--
-- AFTER: the server derives the wording from the type and the ACTOR'S OWN
-- screenname. A caller chooses who to notify and which event happened; it can
-- no longer choose what the recipient reads.
--
-- VERIFIED: a direct forged insert returns 403 (RLS), an unknown type raises,
-- and a poisoned p_item_type of 'evil.com click here' is discarded for the
-- literal 'item'. Legitimate notifications still deliver.
--
-- Paired with a code change (commit 926451d) that rewrote sendNotification()
-- and all 8 call sites to call this instead of inserting directly.
--
-- 'announcement' is deliberately absent: broadcasts come from
-- broadcast_notification(), which is SECURITY DEFINER and bypasses this path.

create or replace function public.notify(
  p_recipient uuid,
  p_type      text,
  p_reference text default null,
  p_item_type text default null   -- only consulted for the 'inbox' type
)
returns void
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
declare
  v_actor uuid := auth.uid();
  v_name  text;
  v_msg   text;
begin
  if v_actor is null then
    raise exception 'not authenticated';
  end if;

  -- Never notify yourself, and never aim at a non-existent user.
  if p_recipient is null or p_recipient = v_actor then
    return;
  end if;
  if not exists (select 1 from public.profiles where id = p_recipient) then
    raise exception 'unknown recipient';
  end if;

  select screenname into v_name from public.profiles where id = v_actor;
  v_name := coalesce(nullif(trim(v_name), ''), 'Someone');

  v_msg := case p_type
    when 'friend_request'  then '@' || v_name || ' sent you a friend request'
    when 'friend_accepted' then '@' || v_name || ' accepted your friend request'
    when 'comment'         then '@' || v_name || ' commented on your post'
    when 'reaction'        then '@' || v_name || ' reacted to your post'
    when 'inbox'           then '@' || v_name || ' sent you a ' ||
      case when p_item_type in ('bean', 'recipe') then p_item_type else 'item' end
    else null
  end;

  if v_msg is null then
    raise exception 'unknown notification type: %', p_type;
  end if;

  insert into public.notifications (user_id, type, actor_id, reference_id, message)
  values (p_recipient, p_type, v_actor, p_reference, v_msg);
end;
$$;

revoke execute on function public.notify(uuid, text, text, text) from public, anon;
grant  execute on function public.notify(uuid, text, text, text) to authenticated;

-- Remove direct writes. With RLS on and no INSERT policy, no client role can
-- insert. The SECURITY DEFINER paths (notify, broadcast_notification,
-- admin_message_user) run as the owner and are unaffected.
drop policy if exists "Users can insert notifications" on public.notifications;

-- Report
select 'notify() exists' as check,
  case when to_regprocedure('public.notify(uuid,text,text,text)') is not null
       then 'present' else 'MISSING' end as actual, 'present' as expected
union all select 'anon can call notify',
  case when has_function_privilege('anon', to_regprocedure('public.notify(uuid,text,text,text)'), 'execute')
       then 'YES (BAD)' else 'no' end, 'no'
union all select 'direct insert policy removed',
  case when exists (select 1 from pg_policies where schemaname='public'
                    and tablename='notifications' and cmd='INSERT')
       then 'STILL THERE (BAD)' else 'removed' end, 'removed';
