// Import Workbox libraries
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');

if (workbox) {
  console.log('Workbox is loaded');
  
  // Initialize workbox
  const { precacheAndRoute, cleanupOutdatedCaches } = workbox.precaching;
  const { registerRoute } = workbox.routing;
  const { CacheFirst, StaleWhileRevalidate } = workbox.strategies;
  const { BackgroundSync, Queue } = workbox.backgroundSync;

  // Precache all static assets
  cleanupOutdatedCaches();
  precacheAndRoute(self.__WB_MANIFEST);

  // Cache strategy for static assets (images, fonts, etc.)
  registerRoute(
    ({ request }) => request.destination === 'image' || request.destination === 'font',
    new CacheFirst({
      cacheName: 'static-assets',
      plugins: [{
        cacheKeyWillBeUsed: async ({ request }) => {
          return `${request.url}?v=${Date.now()}`;
        }
      }]
    })
  );

  // Cache strategy for API calls
  registerRoute(
    ({ url }) => url.pathname.startsWith('/api/'),
    new StaleWhileRevalidate({
      cacheName: 'api-cache',
      plugins: [{
        cacheWillUpdate: async ({ response }) => {
          return response.status === 200 ? response : null;
        }
      }]
    })
  );

  // Background Sync for offline memory creation
  const bgSync = new BackgroundSync('memories-queue', {
    maxRetentionTime: 24 * 60 // Retry for max of 24 Hours (specified in minutes)
  });

  // Queue for offline memory requests
  const queue = new Queue('memories-queue', {
    onSync: async ({ queue }) => {
      let entry;
      while ((entry = await queue.shiftRequest())) {
        try {
          await fetch(entry.request);
          console.log('Offline memory synced successfully');
        } catch (error) {
          console.error('Failed to sync offline memory:', error);
          await queue.unshiftRequest(entry);
          throw error;
        }
      }
    }
  });

  // Intercept POST requests to /api/memories and add to queue if offline
  self.addEventListener('fetch', (event) => {
    if (event.request.method === 'POST' && event.request.url.includes('/api/memories')) {
      const bgSyncLogic = async () => {
        try {
          const response = await fetch(event.request.clone());
          return response;
        } catch (error) {
          await queue.pushRequest({ request: event.request });
          return new Response(
            JSON.stringify({ message: 'Memory saved offline, will sync when online' }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }
      };
      event.respondWith(bgSyncLogic());
    }
  });

  // Navigation fallback
  self.addEventListener('fetch', (event) => {
    if (event.request.mode === 'navigate') {
      event.respondWith(
        fetch(event.request).catch(() => {
          return caches.match('/offline.html');
        })
      );
    }
  });
} else {
  console.log('Workbox failed to load');
}

// Push notification handling (placeholder)
self.addEventListener('push', (event) => {
  const options = {
    body: 'Registration successful',
    icon: '/icon-192.svg',
    badge: '/icon-192.svg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Abrir SoulNet',
        icon: '/icon-192.svg'
      },
      {
        action: 'close',
        title: 'Fechar'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('SoulNet', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  }
});

// Skip waiting and claim clients immediately
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});