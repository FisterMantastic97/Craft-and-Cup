-- Craft & Cup - stop clients setting server/recipient state AT INSERT.
-- RAN AND VERIFIED 2026-09-01.
--
-- Found by applying one question to every write path: which columns can a
-- caller SET AT INSERT that represent state they should not choose? The same
-- question found the signup escalation and the friendship consent bypass; these
-- two are the low-severity remainder of the same sweep.
--
-- 1. reports.status
--    A user could submit a report already marked 'resolved', so it never
--    entered the moderation queue. Moderation state is not the reporter's to
--    set. (Hard to weaponise, since a caller can only insert their OWN report,
--    but it is wrong and the queue should be trustworthy.)
--
-- 2. shared_items.read
--    A SENDER could mark an item read on send, so it never appeared in the
--    RECIPIENT's unread badge. Verified: the item was delivered with unread=0.
--    Whether something has been read belongs to the recipient, and the UPDATE
--    policy already scopes that correctly to auth.uid() = receiver_id.
--
-- WHY COLUMN GRANTS RATHER THAN A TRIGGER: an RLS policy answers which ROWS
-- you may write; only column grants answer which FIELDS. A WITH CHECK could
-- have covered this too, but grants fail closed at the privilege layer, before
-- any policy expression runs.
--
-- VERIFIED AFTER: forcing status='resolved' and read=true are both refused
-- (SQLSTATE 42501); a normal report lands as status='open' and a normal send
-- arrives with unread=1.

-- reports: the reporter supplies what they are reporting and why, nothing else.
revoke insert on public.reports from authenticated;
grant insert (id, reporter_id, comment_id, reason, created_at)
  on public.reports to authenticated;

-- shared_items: the sender supplies the item; `read` belongs to the recipient.
revoke insert on public.shared_items from authenticated;
grant insert (id, sender_id, receiver_id, item_type, item_data, message, created_at)
  on public.shared_items to authenticated;

-- Report
select 'reports.status insertable' as check,
  case when has_column_privilege('authenticated','public.reports','status','insert')
       then 'YES (BAD)' else 'no' end as actual, 'no' as expected
union all select 'shared_items.read insertable',
  case when has_column_privilege('authenticated','public.shared_items','read','insert')
       then 'YES (BAD)' else 'no' end, 'no'
union all select 'reports.reason still insertable',
  case when has_column_privilege('authenticated','public.reports','reason','insert')
       then 'yes' else 'NO (BAD)' end, 'yes'
union all select 'shared_items.item_data still insertable',
  case when has_column_privilege('authenticated','public.shared_items','item_data','insert')
       then 'yes' else 'NO (BAD)' end, 'yes';
