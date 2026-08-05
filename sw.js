const CACHE_NAME = 'student-progress-v3';
const FILES_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  // The app's HTML page: always try the network first so updates show up
  // right away. Only fall back to the cached copy if there's no internet.
  if (req.mode === 'navigate' || req.destination === 'document') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          // Clone synchronously, right here, before any async gap —
          // otherwise the response body may already be consumed by the
          // time the async caches.open() promise resolves.
          const resToCache = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resToCache));
          return res;
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match('./index.html')))
    );
    return;
  }
  // Icons/manifest change rarely, so cache-first is fine (and faster) for those.
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});
