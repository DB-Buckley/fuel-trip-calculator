const CACHE_NAME = 'fuel-trip-cache-v1';
const urlsToCache = [
const urlsToCache = [
  '/fuel-trip-calculator/',
  '/fuel-trip-calculator/index.html',
  '/fuel-trip-calculator/styles.css',
  '/fuel-trip-calculator/script.js',
  '/fuel-trip-calculator/manifest.json',
  '/fuel-trip-calculator/icons/icon-192.png',
  '/fuel-trip-calculator/icons/icon-512.png'
];

];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
