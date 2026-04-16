/*
PURPOSE:
Enables Progressive Web App (PWA) features.

RESPONSIBILITIES:
- Register service worker
- (Optional) Cache assets for offline use

NOTES FOR TEAM:
- Minimum requirement: file must exist and register successfully
- Advanced caching is optional
*/

const cacheName = 'focus-four-v1';
const assets = [
  '/',
  '/index.html',
  '/login.html',
  '/register.html',
  '/dashboard.html',
  '/session.html',
  '/PWA/icon-192.png',
  '/PWA/icon-512.png',
  '/JS/auth.js',
  '/JS/dashboard.js',
  '/JS/session.js',
  '/JS/storage.js'
];

self.addEventListener('install', evt => {
  evt.waitUntil(
    caches.open(cacheName).then(cache => {
      console.log('Caching FocusFour assets');
      cache.addAll(assets);
    })
  );
});

self.addEventListener('fetch', evt => {
  evt.respondWith(
    caches.match(evt.request).then(cacheRes => {
      return cacheRes || fetch(evt.request);
    })
  );
});