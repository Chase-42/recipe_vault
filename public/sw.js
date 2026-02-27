// @ts-nocheck
const STATIC_CACHE = 'rv-static-v1';
const IMAGE_CACHE = 'rv-images-v1';
const CURRENT_CACHES = [STATIC_CACHE, IMAGE_CACHE];
const IMAGE_HOSTS = new Set(['utfs.io', 'ucarecdn.com']);

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => !CURRENT_CACHES.includes(k))
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Never intercept API, auth, or Next.js internal routes
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/_next/data/') ||
    url.pathname.startsWith('/sign-') ||
    url.pathname === '/sso-callback'
  ) {
    return;
  }

  // Cache-first for content-hashed Next.js static assets
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) =>
        cache.match(request).then(
          (cached) =>
            cached ??
            fetch(request).then((response) => {
              if (response.ok) cache.put(request, response.clone());
              return response;
            })
        )
      )
    );
    return;
  }

  // Cache-first + background revalidate for CDN recipe images
  if (IMAGE_HOSTS.has(url.hostname)) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          const fresh = fetch(request).then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          });
          return cached ?? fresh;
        })
      )
    );
    return;
  }
});
