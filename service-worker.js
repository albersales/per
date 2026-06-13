// PER - Parañaque Emergency Ready
// Service Worker v2.0 - Full Offline Support

const CACHE_NAME = 'per-v2.0';

// All assets to cache on install
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-72.png',
  './icons/icon-96.png',
  './icons/icon-128.png',
  './icons/icon-144.png',
  './icons/icon-152.png',
  './icons/icon-192.png',
  './icons/icon-384.png',
  './icons/icon-512.png'
];

// INSTALL - cache everything immediately
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// ACTIVATE - remove old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// FETCH - cache first, ALWAYS serve offline
self.addEventListener('fetch', event => {
  // Skip non-GET and tel: links
  if (event.request.method !== 'GET') return;
  if (event.request.url.startsWith('tel:')) return;
  if (event.request.url.startsWith('chrome-extension:')) return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // Return cached version immediately if available
      if (cachedResponse) {
        // Try to update cache in background
        fetch(event.request).then(response => {
          if (response && response.status === 200) {
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, response.clone());
            });
          }
        }).catch(() => {});
        return cachedResponse;
      }
      // Not in cache - try network
      return fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          // Offline fallback - return main app
          return caches.match('./index.html');
        });
    })
  );
});
