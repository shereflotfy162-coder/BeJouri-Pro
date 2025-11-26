self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('bejouri-store-v3').then((cache) => cache.addAll([
      './',
      './index.html',
      './manifest.json'
    ])),
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});