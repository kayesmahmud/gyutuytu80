/**
 * Service worker, served from a route handler rather than /public.
 *
 * Two things the static file could not do:
 *  1. Embed the build ID in the cache name. The old sw.js had a hardcoded
 *     `CACHE_VERSION = 'v2'`, so every deploy shipped a byte-identical file,
 *     the browser saw no change, never reinstalled, and the `activate` handler
 *     that purges old caches never ran. Stale (and poisoned) entries survived
 *     forever. Now every deploy changes these bytes, which forces a reinstall
 *     and a full cache purge for every user.
 *  2. Send Cache-Control: no-cache, so browsers pick the new worker up promptly
 *     instead of sitting on a 4-hour cached copy.
 */

export const dynamic = 'force-dynamic';

const BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID || 'dev';

const SERVICE_WORKER = `
// Thulo Bazaar PWA service worker — generated per build.
const CACHE_NAME = 'thulobazaar-${BUILD_ID}';

const STATIC_ASSETS = [
  '/offline.html',
  '/logo.png',
  '/icons/apple-touch-icon.png',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      // A failed precache must not block activation — otherwise a single 404
      // asset pins every user to the previous worker.
      .catch(() => undefined)
      .then(() => self.skipWaiting())
  );
});

// Delete every cache that isn't this build's. This is the global purge.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.origin !== location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  // Next.js build output is content-hashed and served immutable. Letting the
  // service worker cache it too is what produces "new HTML, old JS chunk"
  // breakage after a deploy — leave these to the browser's HTTP cache.
  if (url.pathname.startsWith('/_next/')) return;

  // Pages: network-first, falling back to cache only when the network fails.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Only cache real successes. fetch() resolves for 4xx/5xx too, so
          // without this check a 502 during a deploy gets written into the
          // cache and served back to the user afterwards.
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match('/offline.html'))
        )
    );
    return;
  }

  // Everything else (images, fonts, /public assets): stale-while-revalidate.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
`.trim();

export async function GET() {
  return new Response(SERVICE_WORKER, {
    headers: {
      'Content-Type': 'text/javascript; charset=utf-8',
      // Must revalidate every time or users stay on the old worker.
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Service-Worker-Allowed': '/',
    },
  });
}
