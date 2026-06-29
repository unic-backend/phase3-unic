// Service Worker UniC Plaquiste
const CACHE_NAME = 'unic-v1'

// Installation
self.addEventListener('install', (e) => {
  self.skipWaiting()
})

// Activation
self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim())
})

// Fetch — réseau d'abord, cache en fallback
self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  )
})
