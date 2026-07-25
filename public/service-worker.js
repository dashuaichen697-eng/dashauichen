const CACHE_NAME = 'stellar-rpg-pwa-v11';
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/maskable-icon.png',
  '/icons/icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

function shouldBypass(requestUrl) {
  return requestUrl.origin !== self.location.origin || requestUrl.pathname.startsWith('/api/');
}

function cacheResponse(request, response) {
  if (!response?.ok) return response;
  const copy = response.clone();
  caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
  return response;
}

function refreshCache(request) {
  return fetch(request)
    .then((response) => cacheResponse(request, response))
    .catch(() => undefined);
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);
  if (shouldBypass(requestUrl)) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html').then((cached) => {
        const network = fetch(event.request)
          .then((response) => {
            const contentType = response.headers.get('content-type') ?? '';
            if (contentType.includes('text/html')) cacheResponse('/index.html', response.clone());
            return response;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  const cacheableDestinations = new Set(['document', 'script', 'style', 'image', 'manifest', 'font']);
  if (!cacheableDestinations.has(event.request.destination) && !APP_SHELL.includes(requestUrl.pathname)) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = refreshCache(event.request);
      if (cached) return cached;
      return network.then((response) => response || caches.match('/index.html'));
    })
  );
});
