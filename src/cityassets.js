/* MEME ARENA 3D — cenário urbano KayKit City Builder Bits (CC0 1.0)
   Fonte e licença preservadas em assets/kaykit-city/. */
(function (MA) {
  'use strict';

  const ROOT = 'assets/kaykit-city/';
  const NAMES = [
    'building_A', 'building_B', 'building_C', 'building_D', 'building_E',
    'road_straight', 'road_straight_crossing', 'road_junction', 'road_corner',
    'streetlight', 'trafficlight_A', 'bench', 'dumpster', 'firehydrant',
    'car_sedan', 'car_taxi', 'car_police'
  ];

  /* O pack trabalha em módulos de 2 unidades. Escala 5 transforma cada
     quadra em 10×10 unidades, compatível com a arena de 136×136. */
  const BUILDINGS = [
    ['building_A', -52, -45, 0], ['building_C', -52, -25, 0],
    ['building_B', -52, -5, 0],  ['building_E', -52, 15, 0],
    ['building_D', -52, 35, 0],  ['building_B', 52, -45, Math.PI],
    ['building_D', 52, -25, Math.PI], ['building_A', 52, -5, Math.PI],
    ['building_C', 52, 15, Math.PI],  ['building_E', 52, 35, Math.PI],
    ['building_E', -35, -52, Math.PI / 2], ['building_A', -15, -52, Math.PI / 2],
    ['building_D', 15, -52, Math.PI / 2], ['building_B', 35, -52, Math.PI / 2],
    ['building_C', -35, 52, -Math.PI / 2], ['building_B', -15, 52, -Math.PI / 2],
    ['building_E', 15, 52, -Math.PI / 2], ['building_A', 35, 52, -Math.PI / 2]
  ];
  const COVER = [
    ['car_police', -19, -7, Math.PI / 2, 5], ['car_taxi', 18, 8, -Math.PI / 2, 5],
    ['car_sedan', -8, 20, 0, 5], ['car_sedan', 9, -21, Math.PI, 5],
    ['dumpster', -29, 16, .2, 7], ['dumpster', 30, -15, Math.PI + .2, 7],
    ['bench', -18, 29, Math.PI / 2, 8], ['bench', 19, -30, -Math.PI / 2, 8]
  ];
  const LIGHTS = [
    [-28, -12, 0], [-28, 12, Math.PI], [28, -12, 0], [28, 12, Math.PI],
    [-12, -28, Math.PI / 2], [12, -28, -Math.PI / 2],
    [-12, 28, Math.PI / 2], [12, 28, -Math.PI / 2]
  ];

  const cache = Object.create(null);
  let preloadPromise = null;

  function markShared(root) {
    root.traverse(o => {
      if (o.geometry) o.geometry.userData.shared = true;
      if (o.material) {
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach(m => { m.userData = m.userData || {}; m.userData.shared = true; });
      }
    });
    return root;
  }

  function preload() {
    if (preloadPromise) return preloadPromise;
    if (!THREE.GLTFLoader) return Promise.resolve(0);
    const loader = new THREE.GLTFLoader();
    preloadPromise = Promise.all(NAMES.map(name => new Promise(resolve => {
      loader.load(ROOT + name + '.gltf', gltf => {
        const root = gltf.scene || (gltf.scenes && gltf.scenes[0]);
        cache[name] = root ? markShared(root) : null;
        resolve(root ? 1 : 0);
      }, undefined, err => {
        console.warn('[MemeArena] ativo urbano não carregou:', name, err && err.message ? err.message : err);
        cache[name] = null; resolve(0);
      });
    }))).then(values => values.reduce((sum, n) => sum + n, 0));
    return preloadPromise;
  }

  function instance(name, x, z, rot, scale, quality) {
    const source = cache[name];
    if (!source) return null;
    const obj = source.clone(true);
    obj.position.set(x, .02, z);
    obj.rotation.y = rot || 0;
    const s = scale || 5;
    obj.scale.set(s, name.indexOf('road_') === 0 ? 1 : s, s);
    obj.traverse(o => {
      if (!o.isMesh) return;
      o.castShadow = quality !== 'low';
      o.receiveShadow = quality !== 'low';
    });
    return obj;
  }

  function populate(scene, quality, stillActive) {
    return preload().then(() => {
      if (stillActive && !stillActive()) return 0;
      const group = new THREE.Group();
      group.name = 'KayKit_City_Builder_Bits';
      const add = (name, x, z, rot, scale) => {
        const obj = instance(name, x, z, rot, scale, quality);
        if (obj) group.add(obj);
      };

      /* Malha viária em cruz, com faixas de pedestre e cruzamento central. */
      for (let i = -4; i <= 4; i++) {
        if (i) add(i % 3 === 0 ? 'road_straight_crossing' : 'road_straight', i * 10, 0, Math.PI / 2, 5);
        if (i) add(i % 3 === 0 ? 'road_straight_crossing' : 'road_straight', 0, i * 10, 0, 5);
      }
      add('road_junction', 0, 0, 0, 5);
      [[-40,-40,0],[40,-40,-Math.PI/2],[40,40,Math.PI],[-40,40,Math.PI/2]].forEach(p => add('road_corner', p[0], p[1], p[2], 5));

      BUILDINGS.forEach(p => add(p[0], p[1], p[2], p[3], 5));
      COVER.forEach(p => add(p[0], p[1], p[2], p[3], p[4]));
      LIGHTS.forEach((p, i) => add(i % 3 === 0 ? 'trafficlight_A' : 'streetlight', p[0], p[1], p[2], 5));
      [[-34,-8,0],[34,8,Math.PI],[-8,34,Math.PI/2],[8,-34,-Math.PI/2]].forEach(p => add('firehydrant', p[0], p[1], p[2], 7));

      if (stillActive && !stillActive()) return 0;
      scene.add(group);
      return group.children.length;
    });
  }

  MA.CITY_LAYOUT = { buildings: BUILDINGS, cover: COVER };
  MA.CityAssets = { preload, populate };
})(window.MA);
