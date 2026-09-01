-- Craft & Cup - make the image buckets private. RAN AND VERIFIED 2026-09-01.
-- Closes pen test finding 2 in full (previously only reduced).
--
-- BEFORE: both buckets were public, so every uploaded photo had a PERMANENT
-- world-readable URL. Randomising filenames removed the practical guessing
-- attack, but a URL that leaked by any other route (a shared link, a proxy
-- log, browser history) worked forever, including for photos on beans the
-- owner had marked private.
--
-- AFTER: images are referenced by PATH and a short-lived signed URL is minted
-- at render time. A leak now has a lifetime of an hour instead of years.
--
-- WHY THIS WAS CHEAPER THAN EXPECTED: it was deferred on the assumption that
-- the public profile page renders images and would need a server-side signing
-- route, since anonymous callers cannot sign. Checking showed that page renders
-- ZERO images, and the activity snapshot allowlist deliberately excludes
-- image_url. Only signed-in users ever display an upload, so signing happens
-- client-side against the storage SELECT policy added in
-- supabase-storage-owner-read.sql. No signing route was needed.
--
-- ORDER MATTERS: the application code must ship FIRST. If the buckets are
-- flipped before the client knows how to sign, every image breaks in the gap.
--
-- MIGRATION: none was required. Storage held zero objects and no row carried an
-- image_url, so nothing needed rewriting. That window closes as soon as users
-- upload, which is why this was worth doing immediately rather than later.
-- signedImageUrl() still passes through a full http(s) URL unchanged, so any
-- legacy row written under the old scheme would keep rendering.
--
-- VERIFIED: upload returns 200; the old public URL route returns 400; the owner
-- mints a signed URL and fetches the bytes through it successfully.

update storage.buckets
   set public = false
 where name in ('bean-images', 'recipe-images');

-- Size and MIME limits from supabase-security-hardening-2026-09-01.sql are
-- unaffected and still enforced.

-- Report
select name, public, file_size_limit,
       array_length(allowed_mime_types, 1) as mime_types
  from storage.buckets
 order by name;
-- Expect: public=false, file_size_limit=5242880, mime_types=4 for both.
