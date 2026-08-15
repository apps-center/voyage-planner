const CACHE = 'escapade-v5';
const RUNTIME = 'escapade-runtime-v5';
const RUNTIME_MAX = 150;
const CORE = ['./', './index.html', './styles.css', './app.js', './manifest.webmanifest', './icon.svg', './icon-512.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE && key !== RUNTIME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

async function trimCache(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  if (keys.length <= max) return;
  for (const key of keys.slice(0, keys.length - max)) await cache.delete(key);
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const sameOrigin = new URL(request.url).origin === self.location.origin;

  if (sameOrigin) {
    // App shell: network-first so deploys are visible on the next reload,
    // falling back to cache when offline.
    event.respondWith(
      fetch(request).then(response => {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(request, copy));
        return response;
      }).catch(() => caches.match(request).then(cached => cached || (request.mode === 'navigate' ? caches.match('./index.html') : Response.error())))
    );
    return;
  }

  // Cross-origin runtime assets (Leaflet CDN, map tiles): cache-first, bounded.
  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request).then(response => {
      const copy = response.clone();
      caches.open(RUNTIME).then(cache => cache.put(request, copy).then(() => trimCache(RUNTIME, RUNTIME_MAX)));
      return response;
    }).catch(() => Response.error()))
  );
});
