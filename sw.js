/* MEME ARENA 3D — service worker (offline-first) */
const CACHE = 'meme-arena-3d-v27';
const ASSETS = [
  './', './index.html', './css/style.css', './css/season67.css', './manifest.webmanifest', './privacidade.html',
  './assets/favicon.svg', './assets/icon-192.png', './assets/icon-512.png', './lib/three.min.js',
  './src/utils.js', './src/config.js', './src/data.js', './src/maps.js', './src/items.js', './src/season.js',
  './src/audio.js', './src/faces.js', './src/textures.js', './src/world.js', './src/builds.js', './src/weapons3d.js', './src/armor3d.js', './src/entities.js',
  './src/net.js', './src/profile.js', './src/ui.js', './src/pbuilds.js', './src/previews.js', './src/goals.js', './src/market.js', './src/multi.js', './src/mod.js', './src/mpui.js', './src/metaui.js', './src/game.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Rede primeiro para os arquivos do proprio site: assim uma atualizacao
   chega na hora. O cache fica como reserva para quando estiver sem internet. */
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const mesmaOrigem = new URL(req.url).origin === self.location.origin;
  if (!mesmaOrigem) return;

  e.respondWith(
    fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(req).then(hit => hit || caches.match('./index.html')))
  );
});
