const CACHE_NAME = "mymarket-cache-v3print";
const URLS_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./data.js",
  "./icon-180.png",
  "./icon-192.png",
  "./icon-512.png",
  "./click.wav"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(URLS_TO_CACHE))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
