// Service Worker for AllCattle PWA
const CACHE_NAME = 'allcattle-v1.0.0'
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/animals',
  '/analytics',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName))
        )
      })
      .then(() => self.clients.claim())
  )
})

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request)
          .then((fetchResponse) => {
            // Cache successful responses
            if (fetchResponse.status === 200) {
              const responseClone = fetchResponse.clone()
              caches.open(CACHE_NAME)
                .then((cache) => cache.put(event.request, responseClone))
            }
            return fetchResponse
          })
      })
      .catch(() => {
        // Return offline page for navigation requests
        if (event.request.destination === 'document') {
          return caches.match('/')
        }
      })
  )
})

// Background sync for offline data
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-farm-data') {
    event.waitUntil(syncFarmData())
  }
})

async function syncFarmData() {
  try {
    // Sync offline animal data
    const animalData = await getOfflineAnimalData()
    if (animalData.length > 0) {
      await syncAnimalData(animalData)
    }

    // Sync offline health events
    const healthData = await getOfflineHealthData()
    if (healthData.length > 0) {
      await syncHealthData(healthData)
    }

    console.log('Background sync completed successfully')
  } catch (error) {
    console.error('Background sync failed:', error)
  }
}

async function getOfflineAnimalData() {
  // Get data from IndexedDB
  return []
}

async function getOfflineHealthData() {
  // Get data from IndexedDB
  return []
}

async function syncAnimalData(data) {
  // Sync with server
  return fetch('/api/animals/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
}

async function syncHealthData(data) {
  // Sync with server
  return fetch('/api/health/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
}

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New notification from AllCattle',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Details',
        icon: '/icons/icon-72x72.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/icon-72x72.png'
      }
    ]
  }

  event.waitUntil(
    self.registration.showNotification('AllCattle Farm Alert', options)
  )
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/dashboard')
    )
  } else if (event.action === 'close') {
    // Just close the notification
  } else {
    // Default action - open app
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})
