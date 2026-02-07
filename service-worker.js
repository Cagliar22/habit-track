self.addEventListener("install", e => {
  e.waitUntil(
    caches.open("habits").then(cache =>
      cache.addAll(["./", "./index.html", "./style.css", "./app.js"])
    )
  );
});
