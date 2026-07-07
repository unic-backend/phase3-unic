// Service Worker UniC Plaquiste — v2
// Stratégie : réseau d'abord, cache en secours.
// v1 avait un bug : le fallback cache ne trouvait jamais rien car
// aucune réponse n'était jamais mise en cache. v2 écrit le cache.
const CACHE_NAME = 'unic-v2'

// Installation : activer immédiatement + pré-cacher la coquille de l'app
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(['/'])).catch(() => {})
  )
  self.skipWaiting()
})

// Activation : prendre le contrôle + purger les anciens caches (unic-v1...)
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

// Fetch : réseau d'abord ; en cas de succès on met en cache (GET même origine
// uniquement — jamais Firestore/API/extensions) ; en échec on sert le cache.
// Les navigations (pages) retombent sur '/' pour que la SPA démarre hors-ligne.
self.addEventListener('fetch', (e) => {
  const { request } = e
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return // API externes : ne pas toucher

  e.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && (response.type === 'basic' || response.type === 'default')) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch(() => {})
        }
        return response
      })
      .catch(() =>
        caches.match(request).then((cached) => {
          if (cached) return cached
          if (request.mode === 'navigate') return caches.match('/')
          return Response.error()
        })
      )
  )
})
