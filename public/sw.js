/*
 * Salia Admin — minimal service worker.
 *
 * SECURITY: this dashboard shows sensitive admin/business data, so the SW is
 * deliberately narrow. It NEVER caches:
 *   - API responses (the API is a different origin — those requests are ignored
 *     entirely below),
 *   - auth tokens (they live in sessionStorage, never in the Cache API),
 *   - navigations / HTML of dashboard pages (always network; only a static,
 *     data-free offline page is served if the network is down),
 *   - booking / customer data.
 *
 * It only precaches a tiny, non-sensitive app shell (offline page + icons +
 * manifest) and runtime-caches Next's content-hashed build assets (/_next/static/),
 * which are immutable and contain no user data. Everything else falls through to
 * the network, so the app works normally even if the SW is unavailable.
 */
const VERSION = "salia-admin-v1";
const SHELL_CACHE = `${VERSION}-shell`;
const ASSET_CACHE = `${VERSION}-assets`;

const SHELL = [
  "/offline.html",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== SHELL_CACHE && k !== ASSET_CACHE).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only ever touch same-origin GETs. Cross-origin (the API on Railway, fonts,
  // Cloudinary) is left completely to the network — no caching of any data.
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // Navigations (dashboard HTML): network-only so no sensitive page is stored.
  // If offline, show the static, data-free offline page.
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("/offline.html")));
    return;
  }

  // Immutable, content-hashed build assets: cache-first (safe, no user data).
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.open(ASSET_CACHE).then(async (cache) => {
        const hit = await cache.match(request);
        if (hit) return hit;
        const res = await fetch(request);
        if (res && res.ok) cache.put(request, res.clone());
        return res;
      })
    );
    return;
  }

  // Precached shell files (icons, manifest, offline page): cache, then network.
  if (SHELL.includes(url.pathname)) {
    event.respondWith(caches.match(request).then((hit) => hit || fetch(request)));
    return;
  }

  // Everything else: straight to the network.
});
