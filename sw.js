/* MEME ARENA 3D — service worker (offline-first) */
const CACHE = 'meme-arena-3d-v49';
const ASSETS = [
  './', './index.html', './css/style.css', './css/season67.css', './css/hub.css', './manifest.webmanifest', './privacidade.html', './termos.html',
  './assets/favicon.svg', './assets/icon-192.png', './assets/icon-512.png', './assets/splash-season67.jpg', './assets/hub-season67.jpg', './assets/screens/00-season67.jpg', './assets/skins/doge.glb', './assets/skins/tralalero.glb', './assets/skins/tung.glb', './assets/skins/bombardiro.glb',
  './assets/skins/kenney-blocky/character-a.glb', './assets/skins/kenney-blocky/character-b.glb', './assets/skins/kenney-blocky/character-c.glb', './assets/skins/kenney-blocky/character-d.glb', './assets/skins/kenney-blocky/character-e.glb', './assets/skins/kenney-blocky/character-f.glb', './assets/skins/kenney-blocky/character-g.glb', './assets/skins/kenney-blocky/character-h.glb', './assets/skins/kenney-blocky/character-i.glb', './assets/skins/kenney-blocky/character-j.glb', './assets/skins/kenney-blocky/character-k.glb', './assets/skins/kenney-blocky/character-l.glb', './assets/skins/kenney-blocky/character-m.glb', './assets/skins/kenney-blocky/character-n.glb', './assets/skins/kenney-blocky/character-o.glb', './assets/skins/kenney-blocky/character-p.glb', './assets/skins/kenney-blocky/character-q.glb', './assets/skins/kenney-blocky/character-r.glb',
  './lib/three.min.js', './lib/GLTFLoader.js', './lib/SkeletonUtils.js',
  './src/utils.js', './src/config.js', './src/data.js', './src/maps.js', './src/items.js', './src/season.js',
  './src/audio.js', './src/faces.js', './src/textures.js', './src/cityassets.js', './src/world.js', './src/builds.js', './src/weapons3d.js', './src/armor3d.js', './src/skinmodels.js', './src/entities.js',
  './src/net.js', './src/profile.js', './src/ui.js', './src/pbuilds.js', './src/previews.js', './src/goals.js', './src/market.js', './src/multi.js', './src/mod.js', './src/mpui.js', './src/metaui.js', './src/game.js',
  './assets/kaykit-city/citybits_texture.png',
  './assets/kaykit-city/building_A.gltf', './assets/kaykit-city/building_A.bin', './assets/kaykit-city/building_B.gltf', './assets/kaykit-city/building_B.bin',
  './assets/kaykit-city/building_C.gltf', './assets/kaykit-city/building_C.bin', './assets/kaykit-city/building_D.gltf', './assets/kaykit-city/building_D.bin',
  './assets/kaykit-city/building_E.gltf', './assets/kaykit-city/building_E.bin', './assets/kaykit-city/road_straight.gltf', './assets/kaykit-city/road_straight.bin',
  './assets/kaykit-city/road_straight_crossing.gltf', './assets/kaykit-city/road_straight_crossing.bin', './assets/kaykit-city/road_junction.gltf', './assets/kaykit-city/road_junction.bin',
  './assets/kaykit-city/road_corner.gltf', './assets/kaykit-city/road_corner.bin', './assets/kaykit-city/streetlight.gltf', './assets/kaykit-city/streetlight.bin',
  './assets/kaykit-city/trafficlight_A.gltf', './assets/kaykit-city/trafficlight_A.bin', './assets/kaykit-city/bench.gltf', './assets/kaykit-city/bench.bin',
  './assets/kaykit-city/dumpster.gltf', './assets/kaykit-city/dumpster.bin', './assets/kaykit-city/firehydrant.gltf', './assets/kaykit-city/firehydrant.bin',
  './assets/kaykit-city/car_sedan.gltf', './assets/kaykit-city/car_sedan.bin', './assets/kaykit-city/car_taxi.gltf', './assets/kaykit-city/car_taxi.bin',
  './assets/kaykit-city/car_police.gltf', './assets/kaykit-city/car_police.bin'
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
      if (res && res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      }
      return res;
    }).catch(() => caches.match(req).then(hit => {
      if (hit) return hit;
      return req.mode === 'navigate' ? caches.match('./index.html') : Response.error();
    }))
  );
});
