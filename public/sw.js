// Bump this version on any change that must invalidate cached assets. Changing
// it is what triggers the activate handler below to purge every older cache, so
// a deploy reliably reaches returning users instead of serving a stale shell.
const CACHE_NAME = 'craft-cup-v3';

const PRECACHE_URLS = [
  '/',
  '/manifest.json',
];

// Install: precache essentials, then activate immediately instead of waiting for
// every old tab to close.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate: delete every cache that is not the current version, then take control
// of all open pages right away so the new worker is in charge without a manual
// refresh.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

// Fetch: network-first for pages/data, stale-while-revalidate for static assets.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests.
  if (event.request.method !== 'GET') return;

  // Skip API calls, auth, and third-party data - always go to network.
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/auth/') ||
    url.hostname.includes('supabase') ||
    url.hostname.includes('anthropic') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('discord')
  ) {
    return;
  }

  // Page navigations: network-first, so a new deploy's HTML (and the fresh asset
  // URLs it points at) always win when online; fall back to cache only offline.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() =>
          caches.match(event.request).then((cached) => cached || caches.match('/'))
        )
    );
    return;
  }

  // Static assets (JS, CSS, fonts, images): stale-while-revalidate. Serve the
  // cached copy instantly for speed, but always refetch in the background and
  // update the cache, so a stale asset heals itself on the next load instead of
  // persisting until the cache version changes.
  if (
    url.pathname.match(/\.(js|css|woff2?|png|jpg|jpeg|svg|ico|webp|gif)$/) ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com')
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const network = fetch(event.request)
          .then((response) => {
            if (response && response.status === 200) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            }
            return response;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  // Everything else: network-first with cache fallback.
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
