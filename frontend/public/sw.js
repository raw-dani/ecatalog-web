const CACHE_NAME = 'ecatalog-v1';

const PRECACHE_URLS = [
  '/',
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

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  if (url.origin === self.location.origin) {
    if (request.destination === 'document') {
      event.respondWith(
        fetch(request).then((response) => {
          if (response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone);
            });
          }
          return response;
        }).catch(() => {
          return caches.match(request).then((cached) => {
            return cached || caches.match('/index.html');
          });
        })
      );
      return;
    }

    if (['script', 'style', 'image', 'font'].includes(request.destination)) {
      event.respondWith(
        caches.open(CACHE_NAME).then((cache) => {
          return cache.match(request).then((cached) => {
            if (cached) return cached;
            return fetch(request).then((response) => {
              if (response.status === 200) {
                cache.put(request, response.clone());
              }
              return response;
            });
          });
        })
      );
      return;
    }
  }

  if (url.hostname === 'api-ecatalog.gmteknologi.com') {
    event.respondWith(
      fetch(request).then((response) => {
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone);
          });
        }
        return response;
      }).catch(() => {
        return caches.match(request).then((cached) => {
          return cached || new Response(JSON.stringify({ data: [] }), {
            headers: { 'Content-Type': 'application/json' },
          });
        });
      })
    );
    return;
  }
});
