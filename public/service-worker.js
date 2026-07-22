const CACHE_NAME = 'stellar-rpg-pwa-v10';
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

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);
  if (shouldBypass(requestUrl)) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const contentType = response.headers.get('content-type') ?? '';
          if (contentType.includes('text/html')) cacheResponse('/index.html', response.clone());
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  const cacheableDestinations = new Set(['document', 'script', 'style', 'image', 'manifest', 'font']);
  if (!cacheableDestinations.has(event.request.destination) && !APP_SHELL.includes(requestUrl.pathname)) return;

  const networkFirst = ['script', 'style', 'manifest'].includes(event.request.destination);

  if (networkFirst) {
    event.respondWith(
      fetch(event.request)
        .then((response) => cacheResponse(event.request, response))
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) =>
      cached ||
      fetch(event.request)
        .then((response) => cacheResponse(event.request, response))
        .catch(() => caches.match('/index.html'))
    )
  );
});
