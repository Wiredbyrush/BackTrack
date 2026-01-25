// BackTrack Service Worker - PWA Offline Support
const CACHE_NAME = 'backtrack-v1';
const OFFLINE_URL = 'offline.html';

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/browse.html',
  '/submit.html',
  '/claim.html',
  '/login.html',
  '/signup.html',
  '/profile.html',
  '/admin.html',
  '/map.html',
  '/features.html',
  '/sources.html',
  '/offline.html',
  '/logo.png',
  '/js/supabase.js',
  '/js/nav-auth.js',
  '/js/accessibility.js',
  '/js/3d-animation.js',
  '/manifest.json'
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching core assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip external requests (Supabase API, etc.)
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response for caching
        const responseToCache = response.clone();

        // Cache successful responses
        if (response.status === 200) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }

        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request).then((response) => {
          if (response) {
            return response;
          }

          // If it's a navigation request, show offline page
          if (event.request.mode === 'navigate') {
            return caches.match(OFFLINE_URL);
          }

          // Return a fallback for images
          if (event.request.destination === 'image') {
            return new Response(
              '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect fill="#1a1a1a" width="200" height="200"/><text fill="#666" x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="system-ui" font-size="14">Offline</text></svg>',
              { headers: { 'Content-Type': 'image/svg+xml' } }
            );
          }
        });
      })
  );
});

// Handle push notifications (future feature)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/logo.png',
      badge: '/logo.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/'
      }
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'BackTrack', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});

// Background sync for offline submissions (future feature)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-items') {
    event.waitUntil(syncItems());
  }
});

async function syncItems() {
  // This would sync any offline-submitted items when back online
  console.log('[SW] Background sync triggered');
}
