/* FMVA Trainer v2 service worker.
   Network-first for the app shell so updates always arrive when online; cache fallback offline.
   Bump VERSION on every release. Old caches (including v1's "fmva-trainer-v1") are deleted on activate. */
const VERSION = '2.1.0';
const CACHE = 'fmva-trainer-' + VERSION;
const SHELL = ['./', './index.html', './manifest.webmanifest', './css/app.css?v=2.1.0',
  './js/units.js?v=2.1.0', './js/bank.js?v=2.1.0', './js/generators.js?v=2.1.0', './js/cases.js?v=2.1.0', './js/concepts.js?v=2.1.0', './js/app.js?v=2.1.0',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req).then((res) => {
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: req.mode === 'navigate' }).then((r) => r || caches.match('./index.html')))
  );
});
