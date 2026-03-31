/**
 * Jamii Service Worker — Offline App Shell + Asset Caching
 *
 * Strategy:
 *   Navigation requests  -> serve cached index.html (SPA routing)
 *   WASM files           -> cache-first (large, content-hashed, immutable)
 *   JS/CSS/other assets  -> stale-while-revalidate (instant + fresh)
 *   PowerSync/Supabase   -> pass through (PowerSync handles its own sync)
 *
 * The WASM files for PowerSync SQLite are 1-2.5 MB each. After the first
 * load they're cached here so the app boots instantly offline.
 */
const CACHE_NAME = "jamii-v3";

const APP_SHELL = [
  "/index.html",
  "/manifest.json",
];

// Install: pre-cache the minimal app shell.
// Hashed Vite bundles and WASM are cached lazily on first fetch.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)),
  );
  self.skipWaiting();
});

// Activate: clean old caches and take control immediately
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

// Helper: cache a response
function putInCache(request, response) {
  caches.open(CACHE_NAME).then((cache) => cache.put(request, response));
}

// Strip redirect flag — Safari refuses to serve redirected responses from SW
function cleanResponse(response) {
  if (response.redirected) {
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  }
  return response;
}

// Fetch handler
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET
  if (event.request.method !== "GET") return;

  // Skip cross-origin sync requests — PowerSync handles its own sync
  if (
    url.hostname.includes("powersync") ||
    url.hostname.includes("supabase") ||
    url.pathname.startsWith("/api/")
  ) {
    return;
  }

  // Skip other external origins
  if (url.origin !== self.location.origin) return;

  // ---- Navigation -> cached index.html (SPA) ----
  if (event.request.mode === "navigate") {
    event.respondWith(
      caches.match("/index.html").then((cached) => {
        if (cached) {
          // Serve from cache, update in background
          fetch("/index.html")
            .then((res) => { if (res.ok) putInCache("/index.html", cleanResponse(res)); })
            .catch(() => {});
          return cached;
        }
        return fetch("/index.html").then((response) => {
          const clean = cleanResponse(response);
          putInCache("/index.html", clean.clone());
          return clean;
        }).catch(() =>
          new Response(
            '<html><body style="font-family:system-ui;text-align:center;padding:4rem">' +
            '<h1 style="color:#f59e0b">Jamii</h1>' +
            '<p>You are offline. Please connect to the internet for the first load.</p>' +
            '</body></html>',
            { headers: { "Content-Type": "text/html" } },
          )
        );
      }),
    );
    return;
  }

  // ---- WASM files -> cache-first (immutable, content-hashed) ----
  if (url.pathname.endsWith(".wasm")) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.ok) putInCache(event.request, response.clone());
          return response;
        }).catch(() => new Response("", { status: 503, statusText: "Offline" }));
      }),
    );
    return;
  }

  // ---- All other same-origin assets -> stale-while-revalidate ----
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response.ok) putInCache(event.request, response.clone());
          return response;
        })
        .catch(() => {
          if (cached) return cached;
          return new Response("", { status: 503, statusText: "Offline" });
        });

      // Return cached immediately if available, otherwise wait for network
      return cached || networkFetch;
    }),
  );
});
