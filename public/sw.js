// public/sw.js - Mnemo service worker
// Network-first for HTML navigations (so app-shell updates reach users),
// cache-first for everything else (Next.js assets are hashed → safe).
const CACHE_NAME = 'mnemo-v3';
const PRECACHE_URLS = ['/', '/capture', '/archive'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // Same-origin only - never cache cross-origin requests (analytics, fonts CDN, etc.)
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Network-first for HTML navigations: always try fresh, fall back to cache offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.ok && res.type === 'basic') {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return res;
        })
        .catch(() =>
          caches.match(req).then((cached) => cached || caches.match('/'))
        )
    );
    return;
  }

  // Cache-first for assets (JS/CSS/icons). Next.js asset URLs are content-hashed.
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          if (res && res.ok && res.type === 'basic') {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return res;
        })
        .catch(() => cached || Response.error());
    })
  );
});

// ─── Web Push ──────────────────────────────────────────────────────────────
// Payload: { title, body, url? }. Url defaults to '/'.
self.addEventListener('push', (event) => {
  let payload = {};
  if (event.data) {
    try {
      payload = event.data.json();
    } catch {
      payload = { title: 'Mnemo', body: event.data.text() };
    }
  }
  const title = payload.title || 'Mnemo';
  const body = payload.body || '';
  const url = payload.url || '/';
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          try {
            const u = new URL(client.url);
            if (u.origin === self.location.origin && 'focus' in client) {
              client.navigate(target).catch(() => {});
              return client.focus();
            }
          } catch {
            /* ignore malformed client URL */
          }
        }
        if (self.clients.openWindow) return self.clients.openWindow(target);
        return null;
      })
  );
});
