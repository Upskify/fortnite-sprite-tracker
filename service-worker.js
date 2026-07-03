const CACHE_NAME = 'sprite-tracker-v2';
const APP_SHELL = [
  './',
  './index.html',
  './style.css',
  './src/app.js',
  './src/sprite-logic.js',
  './manifest.webmanifest',
  './data/sprites.json',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(APP_SHELL);
      const res = await fetch('./data/sprites.json');
      const sprites = await res.json();
      await cache.addAll(sprites.map((sprite) => sprite.image));
    })()
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    (async () => {
      const cached = await caches.match(event.request);
      return cached || fetch(event.request);
    })()
  );
});
