const CACHE = 'escapade-v2';
const RUNTIME = 'escapade-runtime-v2';
const RUNTIME_MAX = 150;
const CORE = ['./', './index.html', './styles.css', './app.js', './manifest.webmanifest', './icon.svg'];

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
  const isCore = CORE.some(path => request.url.endsWith(path.replace('./', '/')) || request.url.endsWith('/'));
  event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
    const copy = response.clone();
    const bucket = isCore ? CACHE : RUNTIME;
    caches.open(bucket).then(cache => cache.put(request, copy).then(() => { if (bucket === RUNTIME) trimCache(RUNTIME, RUNTIME_MAX); }));
    return response;
  }).catch(() => request.mode === 'navigate' ? caches.match('./index.html') : Response.error())));
});
