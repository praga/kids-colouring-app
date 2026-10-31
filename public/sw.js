const CACHE_NAME = 'kids-colouring-cache-v3';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/colouring-pages/pages.json',
  '/colouring-pages/kpop-huntrix-heroes.png',
  '/colouring-pages/kpop-huntrix-concert.png',
  '/colouring-pages/kpop-rumi-superstar.png',
  '/colouring-pages/kpop-rumi-half-demon.png',
  '/colouring-pages/kpop-rumi-singing.png',
  '/colouring-pages/kpop-mira-warrior.png',
  '/colouring-pages/kpop-mira-ramyeon.png',
  '/colouring-pages/kpop-zoey-shinkal.png',
  '/colouring-pages/kpop-zoey-portrait.png',
  '/colouring-pages/kpop-zoey-singing.png',
  '/colouring-pages/kpop-saja-boys-band.png',
  '/colouring-pages/kpop-jinu-sunglasses.png',
  '/colouring-pages/kpop-baby-saja.png',
  '/colouring-pages/kpop-rumi-jinu-duet.png',
  '/colouring-pages/kpop-derpy-tiger.png',
  '/colouring-pages/kpop-derpy-wizard.png',
  '/colouring-pages/kpop-sussie-pigeon.png',
  '/colouring-pages/unicorn.svg',
  '/colouring-pages/dinosaur.svg',
  '/colouring-pages/princess-castle.svg',
  '/colouring-pages/puppy-kitten.svg',
  '/colouring-pages/space-rocket.svg',
  '/colouring-pages/ocean-turtle.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Navigation fallback & cache-first for assets
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        // Fetch in background to revalidate cache
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const resClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
            }
          })
          .catch(() => {});
        return cached;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return networkResponse;
        })
        .catch(() => {
          // Fallback for document requests when offline
          if (event.request.destination === 'document') {
            return caches.match('/index.html');
          }
        });
    })
  );
});
