const CACHE_NAME = "book-a-boo-static-v4";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  // Do not let one missing optional asset break service-worker installation.
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.add(OFFLINE_URL).catch(() => undefined))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith("book-a-boo-static-") && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Keep navigation and account data online-first; never cache private pages.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        return (await cache.match(OFFLINE_URL)) || Response.error();
      })
    );
    return;
  }

  // Always refresh the app icons and logo so a new release cannot be hidden
  // behind an old cached image.
  const isBrandAsset =
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/book-a-boo-logo.svg" ||
    url.pathname === "/book-a-boo-logo-white.svg";

  if (isBrandAsset) {
    event.respondWith(
      fetch(request).then(async (response) => {
        if (response.ok && response.type === "basic") {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, response.clone());
        }
        return response;
      }).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        return (await cache.match(request)) || Response.error();
      })
    );
    return;
  }

  // Hashed Next.js assets are immutable and safe to cache by URL.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok && response.type === "basic") {
          await cache.put(request, response.clone());
        }
        return response;
      })
    );
  }
});
