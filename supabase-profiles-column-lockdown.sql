-- Craft & Cup - lock down profiles columns that should not be world-readable.
-- RAN 2026-09-01, verified: anon now gets 401 on friend_code, role and plan;
-- display columns still work; signed-in friend-code lookup still returns 200.
--
-- WHY: an anonymous penetration test against the REST API found that any
-- visitor could read friend_code, role and plan for every public profile.
-- friend_code is the private code used to add someone as a friend, so it was
-- harvestable at scale. role publicly identified the owner account, which just
-- hands an attacker the target. plan is billing state. None are needed by an
-- anonymous visitor.
--
-- RLS controls which ROWS are visible. This controls which COLUMNS. The
-- table-level grant has to be revoked first: in Postgres a table-wide SELECT
-- overrides column-level rules, so revoking single columns while it is in
-- place silently does nothing.
--
-- authenticated is deliberately untouched: the add-friend-by-code lookup
-- queries friend_code, and the app reads its own role and plan.
--
-- Paired with a code change (commit a62cda4) that stopped the public profile
-- page requesting friend_code. That had to land FIRST: the page fetched the
-- column without ever using it, and would have errored on a bare revoke.

revoke select on public.profiles from anon;
grant select (id, screenname, bio, is_public, avatar_url, created_at, updated_at)
  on public.profiles to anon;

-- Report: anon reads the display columns and nothing else.
select
  'anon can read screenname' as check,
  case when has_column_privilege('anon','public.profiles','screenname','select')
       then 'yes' else 'NO (BAD)' end as actual, 'yes' as expected
union all select 'anon can read friend_code',
  case when has_column_privilege('anon','public.profiles','friend_code','select')
       then 'YES (BAD)' else 'no' end, 'no'
union all select 'anon can read role',
  case when has_column_privilege('anon','public.profiles','role','select')
       then 'YES (BAD)' else 'no' end, 'no'
union all select 'anon can read plan',
  case when has_column_privilege('anon','public.profiles','plan','select')
       then 'YES (BAD)' else 'no' end, 'no'
union all select 'authenticated keeps friend_code',
  case when has_column_privilege('authenticated','public.profiles','friend_code','select')
       then 'yes' else 'NO (BAD)' end, 'yes';
