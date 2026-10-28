const CACHE_NAME = 'spotlight-v1';
const urlsToCache = [
  './staff.html',
  './staff.css',
  './staff.js',
  './logo-blanco.jpg'
];

// Instala el Service Worker y guarda en caché los archivos base
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Intercepta las peticiones para servir desde caché si está offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});