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

const cacheName = 'focus-four-v2'; // Changed to v2 to force a refresh
const assets = [
  '/',
  '../index.html',
  '../login.html',
  '../register.html',
  '../dashboard.html',
  '../session.html',
  '../aboutus.html',
  'manifest.json',
  'icon-192.png',
  'icon-fixed-512.png',
  'screenshot-wide.png',     
  'screenshot-mobile.png',   
  '../JS/auth.js',
  '../JS/dashboard.js',
  '../JS/session.js',
];

self.addEventListener('install', evt => {
  evt.waitUntil(
    caches.open(cacheName).then(cache => {
      return cache.addAll(assets);
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