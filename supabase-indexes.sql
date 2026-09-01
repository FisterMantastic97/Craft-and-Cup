-- Craft & Cup - indexes for the queries the app actually runs.
-- RAN AND VERIFIED 2026-09-01.
--
-- WHY: before this, EVERY index in the database was a primary key or a unique
-- constraint. Postgres does not index foreign keys automatically, so the core
-- reads were sequential scans. Confirmed with EXPLAIN before the change:
--   beans by user_id         -> Seq Scan
--   comments by activity_id  -> Seq Scan
--   notifications by user_id -> Sort -> Seq Scan   (scans all to show 20)
--   shared_items by receiver -> Seq Scan
--
-- It compounds. The activity SELECT policy runs a friendships EXISTS for every
-- row it evaluates, so a sequential scan multiplied by a per-row subquery is
-- quadratic. Worse, the cost scaled with TOTAL rows in the table rather than
-- with one user's rows, so every user would have paid for every other user's
-- data. Invisible at 2 rows; fatal at real volume.
--
-- These are COMPOSITE and ordered to match the queries. Every list in the app
-- filters by an owner column and sorts created_at desc, so putting created_at
-- in the index lets Postgres satisfy the ORDER BY from the index and skip the
-- sort entirely. (user_id, created_at desc) beats (user_id) alone for exactly
-- that reason.
--
-- VERIFIED AFTER: with enable_seqscan off to reveal intent at scale, all six
-- core queries plan as Index Scan with NO Sort node, and the unread badge
-- plans as an Index Only Scan (answers the count without touching the table).
--
-- NOTE ON CONCURRENTLY: these were created without it because the tables were
-- nearly empty, making the build instant and the write lock irrelevant. Against
-- a large table, add CONCURRENTLY and run via a direct psql connection: it
-- cannot run inside a transaction block, and the Supabase SQL editor wraps
-- statements in one.

-- Journal, recipes, collections: "my items, newest first"
create index if not exists beans_user_created_idx
  on public.beans (user_id, created_at desc);
create index if not exists recipes_user_created_idx
  on public.recipes (user_id, created_at desc);
create index if not exists collections_user_created_idx
  on public.collections (user_id, created_at desc);

-- Activity feed: own rows, plus the public timeline. The partial index keeps
-- the public feed index small by excluding private rows entirely.
create index if not exists activity_user_created_idx
  on public.activity (user_id, created_at desc);
create index if not exists activity_public_created_idx
  on public.activity (created_at desc) where is_public;

-- Comments and reactions are always fetched for a single post.
create index if not exists comments_activity_created_idx
  on public.comments (activity_id, created_at desc);
create index if not exists reactions_activity_idx
  on public.reactions (activity_id);

-- Notification bell: the list, and the unread badge. The partial index means
-- the badge reads only unread rows instead of the whole table.
create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);
create index if not exists notifications_user_unread_idx
  on public.notifications (user_id) where not read;

-- Inbox: received items, sent items, and the unread badge.
create index if not exists shared_items_receiver_created_idx
  on public.shared_items (receiver_id, created_at desc);
create index if not exists shared_items_receiver_unread_idx
  on public.shared_items (receiver_id) where not read;
create index if not exists shared_items_sender_created_idx
  on public.shared_items (sender_id, created_at desc);

-- Friendships. The existing unique index covers (requester_id, receiver_id),
-- so lookups starting from requester work and the reverse direction does not.
-- The activity RLS policy checks BOTH directions filtered by status, so both
-- must be fast or every feed read pays for it.
create index if not exists friendships_receiver_status_idx
  on public.friendships (receiver_id, status);
create index if not exists friendships_requester_status_idx
  on public.friendships (requester_id, status);

-- Moderation queue.
create index if not exists reports_status_created_idx
  on public.reports (status, created_at desc);

-- Report: confirm a core query plans as an ordered index scan.
-- Expect: Limit -> Index Scan using beans_user_created_idx, and no Sort node.
-- (On a nearly empty table Postgres correctly prefers a Seq Scan, so set
--  enable_seqscan = off first to see what it would do at real volume.)
explain select * from public.beans
 where user_id = auth.uid() order by created_at desc limit 20;
