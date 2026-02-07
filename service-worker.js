// Install the service worker and cache all important files
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open("habits-cache").then(cache => {
      return cache.addAll([
        "./",
        "./index.html",
        "./style.css",
        "./app.js",
        "./manifest.json"
      ]);
    })
  );
});

// Activate service worker
self.addEventListener("activate", event => {
  event.waitUntil(self.clients.claim());
});

// Intercept network requests and serve from cache if available
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(cachedResp => {
      return cachedResp || fetch(event.request);
    })
  );
});
