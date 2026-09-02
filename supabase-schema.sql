-- Craft & Cup - live schema inventory. Regenerated 2026-09-01 from the running
-- database, replacing a dump that had gone badly stale.
--
-- WHAT THIS FILE IS: an accurate index of every object in the public schema and
-- the file that creates it. It is NOT a runnable dump and never was: the
-- previous version was a partial snapshot that drifted, listed two tables that
-- had been dropped, and omitted six that had been added. A dump nobody
-- regenerates is worse than no dump, because it invites the belief that the
-- repository describes production when it does not.
--
-- TO REBUILD FROM SCRATCH: run migrations.sql first, then the supabase-*.sql
-- files in the order listed below. Each is idempotent and each carries the
-- reasoning for what it changes, including the exploit it closed where
-- applicable.
--
-- LIVE INVENTORY AT REGENERATION:
--   20 tables, 37 policies, 33 functions, 43 indexes, 15 triggers, 4 cron jobs
--   RLS enabled on 20 of 20 tables

-- ============================================================
-- TABLES (20)
-- ============================================================
-- User data
--   profiles          identity, role, plan. Column grants restrict role/plan.
--   beans             journal entries
--   recipes           brew recipes
--   collections       user-curated bean groups
--   activity          the feed. is_public drives visibility.
--   comments          scoped to parent activity visibility
--   reactions         scoped to parent activity visibility
--   friendships       consent handshake, guarded on INSERT and UPDATE
--   shared_items      direct sends. `read` belongs to the recipient.
--   notifications     server-derived text only, written via notify()
--   reports           moderation queue. `status` is not client-settable.
--
-- Quota and usage
--   ai_usage          per-user monthly analyze count
--   rec_usage         per-user monthly recommend count
--   global_usage      aggregate ceiling. RLS on, NO policy: server only.
--
-- Rate limiting (all: RLS on, NO policy, written only by definer functions)
--   rate_bucket       comment/send/reaction throttles
--   notify_rate       notification throttles
--   error_rate        error-report throttles
--
-- Observability
--   error_group       one row per distinct error, admin read
--   error_event       bounded samples, admin read
--   audit_log         append-only. Admin READ only; no role can write.
--
-- NOTE ON THE FOUR TABLES WITH NO POLICY (global_usage, rate_bucket,
-- notify_rate, error_rate): the absence of a policy IS the control. RLS is
-- enabled and no policy exists, so no client role can reach them at all;
-- every write goes through a SECURITY DEFINER function. The Supabase advisor
-- reports these as rls_enabled_no_policy, which is expected here.

-- ============================================================
-- FILE ORDER FOR A REBUILD
-- ============================================================
--  1. migrations.sql                          base tables and policies
--  2. supabase-ai-quota.sql                   ai_usage, consume_ai_credit
--  3. supabase-rec-quota.sql                  rec_usage, consume_rec_credit
--  4. supabase-recipe-tags-versions.sql       recipe tags and versioning
--  5. supabase-owner-role.sql                 profiles.role, founder pin
--  6. supabase-admin.sql                      admin functions
--  7. supabase-notifications-hotfix.sql       notification type constraint
--  8. supabase-security-lockdown.sql          the original six advisor fixes
--  9. supabase-definer-grants-lockdown.sql    definer EXECUTE grants
-- 10. supabase-profiles-column-lockdown.sql   profiles column grants
-- 11. supabase-security-hardening-2026-09-01.sql  plan escalation, storage limits
-- 12. supabase-notify-function.sql            server-derived notifications
-- 13. supabase-error-monitoring.sql           error tables, alerting, retention
-- 14. supabase-admin-usage.sql                admin spend read path
-- 15. supabase-indexes.sql                    composite indexes for real queries
-- 16. supabase-cost-controls.sql              global ceiling, row caps, file caps
-- 17. supabase-abuse-throttles.sql            per-hour throttles
-- 18. supabase-storage-owner-read.sql         storage SELECT policies
-- 19. supabase-private-buckets.sql            buckets set private
-- 20. supabase-drop-cupping.sql               removes unused tables
-- 21. supabase-account-deletion.sql           atomic delete incl. auth.users
-- 22. supabase-table-grant-lockdown.sql       revokes TRUNCATE and friends
-- 23. supabase-signup-escalation-fix.sql      CRITICAL: owner-at-signup
-- 24. supabase-friendship-consent-fix.sql     consent bypass via INSERT
-- 25. supabase-insert-column-lockdown.sql     report status, read flags
-- 26. supabase-role-hierarchy-fix.sql         admin self-promotion, constraints
-- 27. supabase-quota-role-alignment.sql       owner/admin unlimited AI
-- 28. supabase-audit-log.sql                  append-only audit trail

-- ============================================================
-- CLIENT-CALLABLE FUNCTIONS (the API surface)
-- ============================================================
-- anon + authenticated:
--   log_client_error        error reporting, rate limited, PII scrubbed client-side
--
-- authenticated only:
--   consume_ai_credit       analyze quota. owner/admin unlimited; global cap applies.
--   consume_rec_credit      recommend quota, same rules
--   notify                  server-derives the message; caller cannot choose text
--   delete_my_account       atomic, includes the auth.users row
--   admin_overview          admin only, verified server-side
--   admin_list_users        admin only
--   admin_list_reports      admin only
--   admin_resolve_report    admin only
--   admin_set_user          admin only. Cannot change own role; only an owner
--                           may grant 'owner'. Enforced by trigger, not here.
--   admin_message_user      admin only
--   admin_usage             admin only, spend counters
--   admin_audit_log         admin only, reads the audit trail
--   broadcast_notification  admin only
--
-- NOT callable by any client (server and trigger use only):
--   check_global_cap, check_rate, enforce_row_cap, enforce_storage_cap,
--   guard_profile_role, guard_friendship_accept, generate_friend_code,
--   audit_profile_change, audit_profile_delete, audit_report_change,
--   throttle_comment, throttle_reaction, throttle_shared_item,
--   alert_new_errors, prune_error_log, prune_notifications,
--   prune_rate_buckets, is_admin, rls_auto_enable

-- ============================================================
-- TRIGGERS (15)
-- ============================================================
-- profiles      guard_profile_role_trg      BEFORE INSERT+UPDATE   role/plan guard
--               audit_profile_change_trg    AFTER  UPDATE          audit
--               audit_profile_delete_trg    BEFORE DELETE          audit
--               set_friend_code             BEFORE INSERT          friend code
-- friendships   guard_friendship_accept_trg BEFORE INSERT+UPDATE   consent guard
-- reports       audit_report_change_trg     AFTER  UPDATE          audit
-- beans         beans_row_cap               BEFORE INSERT          2000 rows
-- recipes       recipes_row_cap             BEFORE INSERT          2000 rows
-- activity      activity_row_cap            BEFORE INSERT          5000 rows
-- collections   collections_row_cap         BEFORE INSERT          200 rows
-- comments      comments_row_cap            BEFORE INSERT          5000 rows
--               comments_throttle           BEFORE INSERT          30/hr, 10/post
-- shared_items  shared_items_row_cap        BEFORE INSERT          2000 rows
--               shared_items_throttle       BEFORE INSERT          50/hr, 20/recipient
-- reactions     reactions_throttle          BEFORE INSERT          100/hr
--
-- BOTH GUARD TRIGGERS FIRE ON INSERT AND UPDATE. Each originally covered only
-- UPDATE, and each gap was a live exploit: a first-sign-in INSERT could set
-- role='owner', and a pre-accepted INSERT could force a friendship. When adding
-- any guard, enumerate the events rather than assuming the one you found a bug in.

-- ============================================================
-- SCHEDULED JOBS (pg_cron)
-- ============================================================
--   alert-new-errors     */5 * * * *   Discord alert per NEW error group
--   prune-error-log      17 4 * * *    error retention
--   prune-notifications  23 4 * * *    read notifications after 90 days
--   prune-rate-buckets   31 4 * * *    stale throttle counters

-- ============================================================
-- VERIFY THE LIVE STATE MATCHES THIS FILE
-- ============================================================
select 'tables'   as object, count(*)::text as live, '20' as expected from pg_tables where schemaname='public'
union all select 'policies',  count(*)::text, '37' from pg_policies where schemaname='public'
union all select 'functions', count(*)::text, '33' from pg_proc p
  join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prokind='f'
union all select 'triggers',  count(*)::text, '15' from pg_trigger t
  join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace
  where not t.tgisinternal and n.nspname='public'
union all select 'rls tables', count(*)::text, '20' from pg_class c
  join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public' and c.relkind='r' and c.relrowsecurity
union all select 'anon-callable definers', count(*)::text, '1' from pg_proc p
  join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.prosecdef
    and has_function_privilege('anon', p.oid, 'execute');
