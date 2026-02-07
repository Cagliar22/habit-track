self.addEventListener("install", e => {
  e.waitUntil(
    caches.open("habits-v2").then(cache =>
      cache.addAll(["./","./index.html","./style.css","./app.js"])
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key!=="habits-v2").map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});
