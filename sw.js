const CACHE_NAME = 'sun-moon-ar-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg',
  './js/main.js',
  './js/sensors.js',
  './js/mathx.js',
  './js/ephemeris.js',
  './js/declination.js',
  './js/projection.js',
  './js/overlay.js',
  './js/calibration.js',
  './js/ui.js',
  './js/vendor/suncalc.js',
  './js/vendor/geomagnetism.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});

