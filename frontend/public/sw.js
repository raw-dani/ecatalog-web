const CACHE_NAME = 'ecatalog-v2';
const OFFLINE_URL = '/offline.html';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  OFFLINE_URL,
  '/manifest.json',
  '/favicon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).then(() => self.skipWaiting());
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Simpan respons ke cache (abaikan kegagalan)
async function putInCache(request, response) {
  if (response && response.status === 200) {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  // ===== Navigasi halaman (SPA / document) =====
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((response) => putInCache(request, response))
        .catch(async () => {
          const cached = await caches.match(request);
          return (
            cached ||
            (await caches.match('/index.html')) ||
            (await caches.match(OFFLINE_URL)) ||
            new Response('Anda sedang offline.', {
              status: 503,
              headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            })
          );
        })
    );
    return;
  }

  // ===== Aset statis lokal: cache-first =====
  if (url.origin === self.location.origin) {
    if (['script', 'style', 'image', 'font', 'manifest'].includes(request.destination)) {
      event.respondWith(
        caches.open(CACHE_NAME).then(async (cache) => {
          const cached = await cache.match(request);
          if (cached) return cached;
          try {
            const response = await fetch(request);
            return await putInCache(request, response);
          } catch {
            return cached || Response.error();
          }
        })
      );
      return;
    }
  }

  // ===== Google Fonts: stale-while-revalidate =====
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((response) => putInCache(request, response))
          .catch(() => undefined);
        return cached || (await network) || Response.error();
      })
    );
    return;
  }

  // ===== Gambar dari storage/API: cache-first agar produk tetap tampil offline =====
  if (request.destination === 'image') {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const response = await fetch(request);
          return await putInCache(request, response);
        } catch {
          return Response.error();
        }
      })
    );
    return;
  }

  // ===== API: network-first, fallback ke cache, lalu payload kosong =====
  if (url.hostname === 'api-ecatalog.gmteknologi.com') {
    event.respondWith(
      fetch(request)
        .then((response) => putInCache(request, response))
        .catch(async () => {
          const cached = await caches.match(request);
          return (
            cached ||
            new Response(JSON.stringify({ data: [] }), {
              headers: { 'Content-Type': 'application/json' },
            })
          );
        })
    );
  }
});
