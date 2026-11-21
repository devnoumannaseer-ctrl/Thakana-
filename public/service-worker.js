// THIKANA PWA SERVICE WORKER (v3.0.0)
const CACHE_NAME = 'thikana-pwa-v3';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/roommate-match.html',
  '/parent-portal.html',
  '/student-pass.html',
  '/owner-portal.html',
  '/offline.html',
  '/manifest.json',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png',
  '/assets/icons/icon.svg'
];

// Install Event: Pre-cache static shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Thikana SW] Pre-caching offline app shell');
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[Thikana SW] Pre-cache warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Clean up old cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('[Thikana SW] Removing legacy cache:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Intelligent Strategy
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // IMPORTANT: NEVER intercept POST, PUT, DELETE, or PATCH mutations!
  // Let the browser deliver mutation payloads directly to Express API without service worker body interference.
  if (req.method !== 'GET') {
    return;
  }

  const url = new URL(req.url);

  // 1. API Endpoints (GET Only): Network-First with Offline JSON Fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          if (networkRes.status === 200) {
            const resClone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          }
          return networkRes;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          if (cached) return cached;
          return new Response(
            JSON.stringify({
              success: false,
              offline: true,
              message: 'You are currently offline. Please reconnect to the internet to perform live operations.'
            }),
            { headers: { 'Content-Type': 'application/json' }, status: 503 }
          );
        })
    );
    return;
  }

  // 2. Navigation Requests (HTML Pages): Network-First with Offline Fallback
  if (req.mode === 'navigate' || req.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          const resClone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          return networkRes;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          if (cached) return cached;
          return caches.match('/offline.html');
        })
    );
    return;
  }

  // 3. Static Assets (CSS, JS, Fonts, Images): Cache-First with Network Revalidation
  event.respondWith(
    caches.match(req).then((cachedRes) => {
      if (cachedRes) return cachedRes;
      return fetch(req).then((networkRes) => {
        if (networkRes.status === 200 && req.method === 'GET') {
          const resClone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        }
        return networkRes;
      }).catch(() => {
        return new Response('', { status: 404 });
      });
    })
  );
});

// 4. Web Push Notification Engine
self.addEventListener('push', (event) => {
  let data = {
    title: 'THIKANA VERIFIED ALERT',
    body: 'New verified student activity in Johar Town Hub!',
    url: '/index.html'
  };
  try {
    if (event.data) {
      data = Object.assign(data, event.data.json());
    }
  } catch (e) {
    if (event.data) data.body = event.data.text();
  }

  const options = {
    body: data.body,
    icon: '/assets/icons/icon-192.png',
    badge: '/assets/icons/icon-192.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/' }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});