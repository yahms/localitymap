// Offline shell: the app and Leaflet are cached; OSM API calls and map tiles always go to the network.
const CACHE = 'localitymap-v12';
const SHELL = [
  './', './index.html', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'
];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  const shell = url.origin === location.origin || (url.hostname === 'cdnjs.cloudflare.com' || url.hostname === 'cdn.jsdelivr.net');
  if (!shell) return;
  // network first so updates arrive, cache when offline
  e.respondWith(fetch(e.request).then(r => { if (r.ok && url.search === '') { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); } return r; })
    .catch(() => caches.match(e.request, { ignoreSearch: true })));
});
