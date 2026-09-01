-- Craft & Cup - let owners READ their own storage objects.
-- RAN AND VERIFIED 2026-09-01 (pen test finding 1, High).
--
-- THE BUG: storage.objects had INSERT and DELETE policies but NO SELECT
-- policy. The Storage API must read an object's row before it can delete it,
-- so every delete failed with AccessDenied and every list() returned empty.
--
-- WHY THAT MATTERED: account deletion called .list(user.id), got an empty
-- array, and the guard `if (files?.length)` meant .remove() never ran. The
-- whole block sat in `try {} catch {}` with an empty handler, so the failure
-- was invisible. Net effect: a user deleted their account, every database row
-- was removed, and their PHOTOS stayed published on the internet with no row
-- left pointing at them. Nobody could find or delete them afterwards.
--
-- The buckets are public, so those orphaned files were world-readable by URL.
-- This also contradicted the Privacy Policy at /privacy, which promises to
-- delete personal information on account closure.
--
-- Users also could not delete individual photos. That feature never worked.
--
-- PROVEN BEFORE: owner DELETE returned 403 AccessDenied; bulk delete returned
-- 200 with [] having removed nothing; an anonymous fetch of the file returned
-- 200 with the bytes.
-- PROVEN AFTER: owner lists 2 files, deletes both, folder empty, and the
-- previously public URL returns 400.
--
-- Scoped by PATH, matching the existing INSERT and DELETE policies, so this
-- grants no visibility into anyone else's folder. Regression tested: another
-- signed-in user sees 0 of the victim's files and anon sees 0 overall, so
-- bucket enumeration stays blocked.

drop policy if exists "Users can list own bean images"   on storage.objects;
drop policy if exists "Users can list own recipe images" on storage.objects;

create policy "Users can list own bean images" on storage.objects
  for select to authenticated
  using (bucket_id = 'bean-images'
         and (auth.uid())::text = (storage.foldername(name))[1]);

create policy "Users can list own recipe images" on storage.objects
  for select to authenticated
  using (bucket_id = 'recipe-images'
         and (auth.uid())::text = (storage.foldername(name))[1]);

-- PAIRED CODE CHANGE (commit eed934a):
--   * account deletion now reports failure instead of swallowing it, and
--     stops before deleting any rows so nothing is half-deleted
--   * upload paths use crypto.randomUUID() instead of Date.now(). The bucket
--     is public and the folder is the user's UUID, which is readable from
--     their public profile, so a millisecond timestamp left roughly 40k
--     guesses to find a private bean's photo if you knew when it was uploaded
--
-- STILL OPEN (pen test finding 2, Medium): the buckets remain public, so any
-- URL that leaks works forever. The durable fix is private buckets with signed
-- URLs, sequenced with the next/image migration since both touch every image
-- render path.
--
-- REMEDIATION FOR EXISTING DATA: accounts deleted before this fix left
-- orphaned files. Find them by listing each bucket with the service role and
-- removing folders whose UUID no longer appears in public.profiles.

-- Report
select 'bean-images select policy' as check,
  case when exists (select 1 from pg_policies where schemaname='storage'
        and tablename='objects' and policyname='Users can list own bean images')
       then 'present' else 'MISSING' end as actual, 'present' as expected
union all select 'recipe-images select policy',
  case when exists (select 1 from pg_policies where schemaname='storage'
        and tablename='objects' and policyname='Users can list own recipe images')
       then 'present' else 'MISSING' end, 'present'
union all select 'anon has no select policy',
  case when exists (select 1 from pg_policies where schemaname='storage'
        and tablename='objects' and cmd='SELECT' and roles::text like '%anon%')
       then 'EXPOSED (BAD)' else 'none' end, 'none';
