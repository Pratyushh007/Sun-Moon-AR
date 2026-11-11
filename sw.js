const CACHE_NAME = 'sun-moon-ar-v3';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg',
  './js/main.js?v=3',
  './js/sensors.js?v=3',
  './js/mathx.js',
  './js/ephemeris.js',
  './js/declination.js',
  './js/projection.js',
  './js/overlay.js',
  './js/calibration.js',
  './js/ui.js?v=3',
  './js/vendor/suncalc.js',
  './js/vendor/geomagnetism.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(
        ASSETS.map((url) => cache.add(new Request(url, { cache: 'reload' })))
      )
    )
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
  const reqUrl = new URL(event.request.url);
  const networkPromise =
    reqUrl.origin === self.location.origin
      ? fetch(event.request.url, { cache: 'no-cache', credentials: 'same-origin' })
      : fetch(event.request);

  event.respondWith(
    networkPromise
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
