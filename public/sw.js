// Service worker Yâmarché
// Rôle : (1) rendre l'app installable en PWA, (2) mettre en cache l'app shell
// pour un chargement plus rapide et un minimum de résilience hors-ligne.
// Le contenu dynamique (Firestore, images Cloudinary) n'est volontairement
// pas mis en cache ici : on privilégie toujours le réseau pour ces requêtes.

const CACHE_VERSION = 'yamarche-v1'
const APP_SHELL = ['/', '/index.html', '/manifest.json', '/icon-192.png', '/icon-512.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  // On ne touche qu'aux requêtes same-origin (jamais Firebase/Firestore/Cloudinary).
  if (url.origin !== self.location.origin) return

  // Navigations (changement de page / ouverture de l'app) : réseau d'abord,
  // avec repli sur le shell mis en cache si hors-ligne.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/index.html'))
    )
    return
  }

  // Assets statiques : cache d'abord, puis réseau + mise à jour du cache.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone()
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone))
          }
          return response
        })
        .catch(() => cached)
      return cached || network
    })
  )
})
