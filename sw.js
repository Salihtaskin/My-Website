/* ======================================================
   sw.js — PWA service worker.
   Sadece statik dosyalar (css/js/görsel) cache'lenir ve
   "stale-while-revalidate" ile arka planda güncellenir.
   API istekleri ve HTML sayfaları HER ZAMAN ağdan gelir —
   oturum/giriş durumu ve admin panelindeki dinamik veriler
   asla cache'den servis edilmez.
====================================================== */

const CACHE_NAME = 'salihtaskin-static-v1';
const STATIC_ASSETS = [
  '/css/style.css',
  '/js/translations.js',
  '/js/main.js',
  '/js/session-ui.js',
  '/favicon.svg',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // API istekleri asla cache'lenmez
  if (url.pathname.startsWith('/api/')) return;

  // Sadece bilinen statik dosya uzantıları cache'lenir; HTML sayfaları
  // (index/login/dashboard/blog vb.) her zaman ağdan taze gelir.
  const isStaticAsset = /\.(css|js|svg|png|jpg|jpeg|json)$/.test(url.pathname);
  if (!isStaticAsset) return;

  event.respondWith(
    caches.match(req).then(cached => {
      const networkFetch = fetch(req).then(response => {
        if (response && response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
        }
        return response;
      }).catch(() => cached);

      return cached || networkFetch;
    })
  );
});
