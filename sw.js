// Service worker do Roteiro Roma 2026 — cache-first para o "app shell"
// (HTML, CSS, fontes, Leaflet, ícones). Áudio fica fora do precache: é
// grande, opcional, e cada trilha só entra no cache do navegador se a
// pessoa realmente tocar o episódio.
const CACHE_VERSION = 'roma2026-v2';
const PRECACHE = [
  'index.html',
  'historia.html',
  'manifest.json',
  'vendor/fonts/fonts.css',
  'vendor/fonts/files/f01.woff2',
  'vendor/fonts/files/f02.woff2',
  'vendor/fonts/files/f03.woff2',
  'vendor/fonts/files/f04.woff2',
  'vendor/fonts/files/f05.woff2',
  'vendor/fonts/files/f06.woff2',
  'vendor/fonts/files/f07.woff2',
  'vendor/fonts/files/f08.woff2',
  'vendor/fonts/files/f09.woff2',
  'vendor/fonts/files/f10.woff2',
  'vendor/fonts/files/f11.woff2',
  'vendor/fonts/files/f12.woff2',
  'vendor/fonts/files/f13.woff2',
  'vendor/leaflet/leaflet.css',
  'vendor/leaflet/leaflet.js',
  'vendor/leaflet/images/layers.png',
  'vendor/leaflet/images/layers-2x.png',
  'vendor/leaflet/images/marker-icon.png',
  'vendor/leaflet/images/marker-icon-2x.png',
  'vendor/leaflet/images/marker-shadow.png',
  'icons/icon-192.png',
  'icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(names.filter(n => n !== CACHE_VERSION).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // mapa/tiles externos: deixa passar direto
  if (url.pathname.includes('/audio/')) return; // áudio: nunca via cache-first, sempre rede/cache HTTP nativo

  // navegação direta (abrir a aba do zero): tenta o cache da própria página primeiro
  if (req.mode === 'navigate') {
    event.respondWith(
      caches.match(req).then(cached => cached || fetch(req).catch(() => caches.match('index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(req, copy));
        }
        return res;
      }).catch(() => cached);
    })
  );
});
