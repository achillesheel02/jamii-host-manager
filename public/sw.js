/**
 * Jamii Service Worker — Offline App Shell
 *
 * Strategy: Cache-first for app shell (HTML, JS, CSS, images),
 * network-first for API calls. PowerSync handles data sync separately —
 * this SW only handles the app shell so the UI loads offline.
 */
const CACHE_NAME = "jamii-v1";

const APP_SHELL = [
  "/",
  "/index.html",
];

// Install: pre-cache app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)),
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
      ),
    ),
  );
  self.clients.claim();
});

// Fetch: cache-first for navigation/assets, network-first for API
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== "GET") return;

  // Skip PowerSync and Supabase requests — PowerSync handles its own sync
  if (
    url.hostname.includes("powersync") ||
    url.hostname.includes("supabase") ||
    url.pathname.startsWith("/api/")
  ) {
    return;
  }

  // For navigation requests, serve the cached index.html (SPA routing)
  if (event.request.mode === "navigate") {
    event.respondWith(
      caches.match("/index.html").then((cached) =>
        cached || fetch(event.request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("/index.html", clone));
          return response;
        }),
      ),
    );
    return;
  }

  // For assets: cache-first, then network with cache update
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        // Only cache same-origin successful responses
        if (response.ok && url.origin === self.location.origin) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // If offline and not cached, return a basic offline page for navigation
        if (event.request.mode === "navigate") {
          return caches.match("/index.html");
        }
        return new Response("", { status: 503, statusText: "Offline" });
      });
    }),
  );
});
