// Signed URLs for user-uploaded images.
//
// The buckets are PRIVATE. A stored image is referenced by its path
// ("bean-images/<uid>/<uuid>.png"), never by a permanent public URL, and a
// short-lived signed URL is minted when it is actually displayed.
//
// WHY: previously the buckets were public, so every photo had a permanent
// world-readable URL. Randomising the filename removed the practical guessing
// attack, but a URL that leaked by any other route (a shared link, a proxy log,
// someone's browser history) worked forever. Signed URLs expire, so a leak has a
// lifetime measured in minutes instead of years.
//
// Only signed-in users ever render an uploaded image: the public profile page
// shows none, and activity snapshots deliberately exclude image_url. That is why
// this can sign client-side against the storage SELECT policy (owners read their
// own folder) without needing a server-side signing route.

import { supabase } from "./supabase";

const TTL_SECONDS = 60 * 60; // 1 hour
// Re-sign a little before expiry so an image never breaks mid-view.
const REFRESH_BEFORE_MS = 5 * 60 * 1000;

// path -> { url, expiresAt }
const cache = new Map();

// Requests made in the same tick are grouped into one API call per bucket, so
// rendering a list of fifty beans costs one round trip rather than fifty.
let pending = [];
let flushTimer = null;

function flush() {
  const batch = pending;
  pending = [];
  flushTimer = null;

  const byBucket = new Map();
  for (const item of batch) {
    if (!byBucket.has(item.bucket)) byBucket.set(item.bucket, []);
    byBucket.get(item.bucket).push(item);
  }

  for (const [bucket, items] of byBucket) {
    const keys = items.map((i) => i.key);
    supabase.storage
      .from(bucket)
      .createSignedUrls(keys, TTL_SECONDS)
      .then(({ data, error }) => {
        if (error || !data) {
          for (const i of items) i.resolve(null);
          return;
        }
        // createSignedUrls returns results in the order requested.
        data.forEach((row, idx) => {
          const item = items[idx];
          if (!item) return;
          const url = row?.signedUrl || null;
          if (url) {
            cache.set(item.path, { url, expiresAt: Date.now() + TTL_SECONDS * 1000 });
          }
          item.resolve(url);
        });
      })
      .catch(() => {
        for (const i of items) i.resolve(null);
      });
  }
}

// Split "bean-images/uid/file.png" into its bucket and key.
function splitPath(path) {
  const slash = path.indexOf("/");
  if (slash < 1) return null;
  return { bucket: path.slice(0, slash), key: path.slice(slash + 1) };
}

// Returns a usable image URL for a stored value, or null.
//
// Accepts either a path (the current format) or a full http(s) URL (the legacy
// public-bucket format), so any row written before the switch still renders.
export function signedImageUrl(stored) {
  if (!stored || typeof stored !== "string") return Promise.resolve(null);
  if (/^https?:\/\//i.test(stored)) return Promise.resolve(stored);
  if (stored.startsWith("blob:") || stored.startsWith("data:")) {
    return Promise.resolve(stored);
  }

  const hit = cache.get(stored);
  if (hit && hit.expiresAt - Date.now() > REFRESH_BEFORE_MS) {
    return Promise.resolve(hit.url);
  }

  const parts = splitPath(stored);
  if (!parts) return Promise.resolve(null);

  return new Promise((resolve) => {
    pending.push({ path: stored, bucket: parts.bucket, key: parts.key, resolve });
    if (!flushTimer) flushTimer = setTimeout(flush, 0);
  });
}

// Drop everything on sign-out so one account's signed URLs are never reachable
// from the next session on a shared device.
export function clearImageCache() {
  cache.clear();
}
