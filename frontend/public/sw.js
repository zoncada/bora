const CACHE_NAME = 'bora-v1';
const STATIC_ASSETS = ['/', '/logo.png', '/manifest.json'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('/api/')) return;

  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});

// Push notifications
self.addEventListener('push', (e) => {
  const data = e.data?.json() || {};
  e.waitUntil(
    self.registration.showNotification(data.title || 'Bora!', {
      body: data.body || 'Você tem uma nova votação.',
      icon: '/logo.png',
      badge: '/logo.png',
      data: data.data || {},
      vibrate: [100, 50, 100],
    })
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const pollId = e.notification.data?.pollId;
  const url = pollId ? `/poll/${pollId}` : '/home';
  e.waitUntil(clients.openWindow(url));
});
