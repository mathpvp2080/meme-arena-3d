/* =====================================================================
   MEME ARENA 3D — modelos procedurais exclusivos das armas

   Todas apontam para -Z. O retorno contém o grupo visual, a ponta usada
   para criar projéteis e o clarão do disparo. Nenhuma textura externa.
   ===================================================================== */
(function (MA) {
  'use strict';

  const PI = Math.PI;

  function mat(color, opts) {
    opts = opts || {};
    return new THREE.MeshStandardMaterial({
      color: color,
      roughness: opts.rough === undefined ? .34 : opts.rough,
      metalness: opts.metal === undefined ? .76 : opts.metal,
      emissive: opts.emissive === undefined ? 0x000000 : opts.emissive,
      emissiveIntensity: opts.ei === undefined ? .55 : opts.ei,
      transparent: opts.opacity !== undefined,
      opacity: opts.opacity === undefined ? 1 : opts.opacity,
      side: opts.side || THREE.FrontSide
    });
  }

  function basic(color, opacity) {
    return new THREE.MeshBasicMaterial({
      color: color, transparent: opacity !== undefined,
      opacity: opacity === undefined ? 1 : opacity,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
  }

  function add(group, geometry, material, position, rotation, scale) {
    const mesh = new THREE.Mesh(geometry, material);
    if (position) mesh.position.set(position[0], position[1], position[2]);
    if (rotation) mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
    if (scale) mesh.scale.set(scale[0], scale[1], scale[2]);
    mesh.castShadow = true;
    group.add(mesh);
    return mesh;
  }

  function box(group, size, material, position, rotation) {
    return add(group, new THREE.BoxGeometry(size[0], size[1], size[2]), material, position, rotation);
  }

  /* CylinderGeometry nasce no eixo Y; esta função o aponta no eixo Z. */
  function tube(group, radius, length, material, position, segments) {
    return add(group, new THREE.CylinderGeometry(radius, radius, length, segments || 16),
      material, position, [PI / 2, 0, 0]);
  }

  function ring(group, radius, thickness, material, z, segments) {
    return add(group, new THREE.TorusGeometry(radius, thickness, 8, segments || 24),
      material, [0, 0, z]);
  }

  function bolt(group, x, y, z, material, radius) {
    return add(group, new THREE.SphereGeometry(radius || .045, 8, 6), material, [x, y, z]);
  }

  function finish(group, color, tipPosition) {
    const tip = new THREE.Object3D();
    tip.position.set(tipPosition[0], tipPosition[1], tipPosition[2]);
    group.add(tip);

    const muzzle = new THREE.Sprite(new THREE.SpriteMaterial({
      map: MA.Tex.glow('#ffffff'), color: color, transparent: true,
      blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0
    }));
    muzzle.position.copy(tip.position);
    muzzle.scale.setScalar(.82);
    group.add(muzzle);
    return { group, tip, muzzle, rotor: group.userData.rotor || null,
      energy: group.userData.energy || null };
  }

  function laser(def) {
    const g = new THREE.Group();
    const dark = mat(0x111628, { rough: .25, metal: .9 });
    const gold = mat(0xe7b82f, { rough: .2, metal: .88, emissive: 0x4d3500, ei: .45 });
    const glow = mat(def.color, { rough: .12, metal: .55, emissive: def.color, ei: 1.35 });
    const rubber = mat(0x25283a, { rough: .86, metal: .12 });

    /* silhueta de rifle sci-fi, com corpo chanfrado em camadas */
    box(g, [.34, .32, 1.20], dark, [0, .02, -.48]);
    box(g, [.42, .13, .72], gold, [0, .19, -.43]);
    box(g, [.27, .08, 1.25], glow, [0, -.12, -.55]);
    box(g, [.12, .10, .88], glow, [0, .19, -.45]);
    box(g, [.24, .42, .24], rubber, [0, -.27, -.12], [-.24, 0, 0]);
    box(g, [.26, .20, .42], dark, [0, .01, .34]);
    box(g, [.37, .09, .38], gold, [0, .11, .34]);
    tube(g, .11, .54, dark, [0, .01, -1.31], 18);
    ring(g, .14, .045, gold, -1.54);
    [-1, 1].forEach(s => {
      box(g, [.07, .18, .68], gold, [s * .20, .01, -.55]);
      bolt(g, s * .205, .02, -.27, glow, .05);
    });
    /* célula de energia doge */
    const core = tube(g, .095, .42, glow, [0, -.11, -.05], 14);
    core.rotation.x = 0;
    g.userData.energy = core;
    return finish(g, def.color, [0, .01, -1.62]);
  }

  function shotgun(def) {
    const g = new THREE.Group();
    const dark = mat(0x121722, { rough: .32, metal: .88 });
    const steel = mat(0x708795, { rough: .2, metal: .95 });
    const aqua = mat(def.color, { rough: .16, metal: .68, emissive: def.color, ei: .9 });
    const grip = mat(0x273541, { rough: .82, metal: .16 });

    /* coronha robusta e receptor */
    box(g, [.38, .36, .74], grip, [0, -.01, .33]);
    box(g, [.48, .42, .68], dark, [0, .04, -.25]);
    box(g, [.54, .10, .53], aqua, [0, .24, -.27]);
    box(g, [.26, .48, .24], grip, [0, -.29, .08], [-.28, 0, 0]);
    /* canos duplos claramente visíveis */
    [-1, 1].forEach(s => {
      tube(g, .115, 1.18, steel, [s * .14, .04, -1.12], 18);
      ring(g, .115, .027, aqua, -1.72);
    });
    const pump = box(g, [.52, .30, .40], grip, [0, -.08, -.78]);
    for (let i = -2; i <= 2; i++)
      box(pump, [.54, .018, .025], aqua, [0, -.15 + (i + 2) * .075, i * .035]);
    box(g, [.12, .10, .28], aqua, [0, .34, -.12]);
    bolt(g, -.19, .06, -.20, aqua, .052); bolt(g, .19, .06, -.20, aqua, .052);
    return finish(g, def.color, [0, .04, -1.78]);
  }

  function rocket(def) {
    const g = new THREE.Group();
    const dark = mat(0x161521, { rough: .32, metal: .82 });
    const steel = mat(0x69717c, { rough: .3, metal: .9 });
    const pink = mat(def.color, { rough: .2, metal: .72, emissive: 0x62102e, ei: .7 });
    const warn = mat(0xffc42e, { rough: .3, metal: .7, emissive: 0x5f3a00, ei: .45 });

    tube(g, .25, 1.72, dark, [0, .02, -.48], 24);
    tube(g, .19, 1.80, steel, [0, .02, -.50], 22);
    ring(g, .29, .07, pink, .33, 28);
    ring(g, .30, .07, pink, -1.30, 28);
    ring(g, .245, .035, warn, -.72, 24);
    /* foguete visível dentro do tubo */
    const nose = add(g, new THREE.ConeGeometry(.18, .48, 16), pink,
      [0, .02, -1.50], [-PI / 2, 0, 0]);
    nose.castShadow = true;
    [-1, 1].forEach(s => {
      box(g, [.08, .26, .40], warn, [s * .18, .02, -1.12], [0, 0, s * .35]);
    });
    box(g, [.24, .46, .23], dark, [0, -.34, -.22], [-.20, 0, 0]);
    /* mira holográfica */
    box(g, [.08, .25, .08], steel, [0, .31, -.30]);
    const sight = ring(g, .13, .025, pink, -.30, 20);
    sight.rotation.x = PI / 2; sight.position.y = .48;
    box(g, [.50, .08, .18], warn, [0, -.26, .10]);
    return finish(g, def.color, [0, .02, -1.77]);
  }

  function minigun(def) {
    const g = new THREE.Group();
    const dark = mat(0x10111b, { rough: .24, metal: .94 });
    const steel = mat(0x8791a0, { rough: .18, metal: .98 });
    const pink = mat(def.color, { rough: .16, metal: .65, emissive: def.color, ei: 1.15 });
    const yellow = mat(0xffd43b, { rough: .27, metal: .78, emissive: 0x4a3300, ei: .45 });

    box(g, [.62, .54, .67], dark, [0, .02, -.14]);
    box(g, [.48, .18, .75], pink, [0, .20, -.19]);
    box(g, [.25, .50, .28], dark, [0, -.34, .02], [-.25, 0, 0]);
    const rotor = new THREE.Group();
    rotor.position.z = -.35; g.add(rotor); g.userData.rotor = rotor;
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * PI * 2;
      const x = Math.cos(a) * .19, y = Math.sin(a) * .19;
      tube(rotor, .055, 1.40, steel, [x, y, -.68], 12);
    }
    ring(rotor, .29, .055, yellow, -.12, 26);
    ring(rotor, .27, .045, pink, -1.36, 26);
    tube(g, .16, .28, dark, [0, .02, -.39], 18);
    /* caixa de munição e cinta */
    box(g, [.53, .58, .42], dark, [-.47, -.05, .18]);
    box(g, [.42, .08, .32], yellow, [-.47, .22, .18]);
    for (let i = 0; i < 5; i++) bolt(g, -.26 + i * .10, -.14 - i * .035, .02 - i * .07, yellow, .045);
    return finish(g, def.color, [0, .02, -1.78]);
  }

  function railgun(def) {
    const g = new THREE.Group();
    const black = mat(0x0c1420, { rough: .18, metal: .96 });
    const steel = mat(0x71879a, { rough: .16, metal: .98 });
    const cyan = mat(def.color, { rough: .08, metal: .55, emissive: def.color, ei: 1.55 });
    const violet = mat(0x6a5bff, { rough: .13, metal: .65, emissive: 0x251b91, ei: 1.1 });

    box(g, [.36, .40, 1.18], black, [0, .01, -.39]);
    box(g, [.22, .13, 1.38], cyan, [0, .20, -.58]);
    box(g, [.24, .46, .25], black, [0, -.31, .02], [-.24, 0, 0]);
    box(g, [.34, .24, .48], steel, [0, .01, .37]);
    /* trilhos longos com espaço luminoso no centro */
    [-1, 1].forEach(s => {
      box(g, [.115, .17, 1.58], steel, [s * .23, .01, -1.04]);
      box(g, [.055, .08, 1.48], cyan, [s * .23, .01, -1.05]);
      for (let z = -.42; z > -1.72; z -= .32) bolt(g, s * .23, .12, z, violet, .045);
    });
    const core = tube(g, .075, 1.38, cyan, [0, .01, -1.04], 12);
    g.userData.energy = core;
    [ -.54, -.88, -1.22, -1.56 ].forEach(z => ring(g, .32, .032, violet, z, 24));
    /* mira e aletas traseiras */
    box(g, [.08, .30, .08], steel, [0, .35, -.10]);
    const sight = ring(g, .14, .025, cyan, -.10, 20);
    sight.rotation.x = PI / 2; sight.position.y = .52;
    [-1, 1].forEach(s => box(g, [.10, .38, .36], black, [s * .28, .02, .29], [0, 0, s * .22]));
    return finish(g, def.color, [0, .01, -1.90]);
  }

  /* Temporada 67: rifle de pulso original com dois núcleos assimétricos.
     O anel representa o 6 e os trilhos angulares formam o gesto gráfico do 7. */
  function pulse67(def) {
    const g = new THREE.Group();
    const ink = mat(0x151a43, { rough: .18, metal: .94 });
    const steel = mat(0xe7ecff, { rough: .13, metal: .92 });
    const blue = mat(0x6572ff, { rough: .07, metal: .44, emissive: 0x2833a6, ei: 1.10 });
    const pink = mat(0xff4fbd, { rough: .08, metal: .46, emissive: 0x921b60, ei: 1.08 });
    const cyan = mat(0x2de2ff, { rough: .06, metal: .36, emissive: 0x087c94, ei: 1.55 });
    const glass = basic(0xd8faff, .76);

    box(g, [.44, .42, 1.08], ink, [0, 0, -.34]);
    box(g, [.54, .12, .88], steel, [0, .24, -.45]);
    box(g, [.27, .47, .25], ink, [0, -.34, .06], [-.22, 0, 0]);
    box(g, [.32, .20, .42], ink, [0, .02, .43]);

    /* núcleo "6" */
    const six = new THREE.Group();
    six.position.set(-.26, .02, -.55); g.add(six);
    const sixRing = ring(six, .18, .052, blue, 0, 22);
    tube(six, .052, .52, blue, [-.13, .16, -.12], 10).rotation.set(0, 0, -.42);
    g.userData.energy = sixRing;

    /* trilhos em "7", mantidos como detalhe abstrato e legível */
    box(g, [.42, .07, .10], pink, [.23, .20, -.60]);
    box(g, [.07, .43, .10], pink, [.27, .01, -.68], [0, 0, -.42]);

    [-1, 1].forEach(s => {
      box(g, [.105, .15, 1.25], s < 0 ? blue : pink, [s * .24, .01, -1.10]);
      box(g, [.06, .07, 1.18], glass, [s * .24, .02, -1.12]);
      bolt(g, s * .24, .17, -.97, s < 0 ? blue : pink, .055);
    });
    [ -.62, -.98, -1.34, -1.66 ].forEach((z, i) =>
      ring(g, .31 - i * .018, .025, i % 2 ? pink : blue, z, 24));
    tube(g, .075, 1.42, cyan, [0, .01, -1.05], 12);
    box(g, [.40, .07, .28], pink, [0, -.24, .22]);

    return finish(g, def.color, [0, .01, -1.88]);
  }

  const BUILDERS = { laser, shot: shotgun, rpg: rocket, mini: minigun, rail: railgun, pulse67 };

  MA.createWeaponModel = function (weapon) {
    const def = typeof weapon === 'string'
      ? MA.WEAPONS.find(w => w.id === weapon)
      : weapon;
    const safe = def || MA.WEAPONS[0];
    const build = BUILDERS[safe.id] || BUILDERS[safe.kind] || laser;
    const model = build(safe);
    model.group.userData.weaponId = safe.id;
    return model;
  };

  /* Mostra no suporte do jogador apenas o modelo atualmente selecionado. */
  MA.syncWeaponModel = function (player) {
    if (!player || !player.weaponVisuals || !player.weaponVisuals.length) return;
    let index = Number.isFinite(player.weapon) ? player.weapon : 0;
    index = Math.max(0, Math.min(player.weaponVisuals.length - 1, index));
    player.weaponVisuals.forEach((v, i) => { v.group.visible = i === index; });
    const active = player.weaponVisuals[index];
    player.tip = active.tip;
    player.muzzle = active.muzzle;
    player._visualWeapon = index;
  };

  MA.animateWeaponModel = function (player, dt, firing) {
    if (!player || !player.weaponVisuals) return;
    if (player._visualWeapon !== player.weapon) MA.syncWeaponModel(player);
    const active = player.weaponVisuals[player._visualWeapon || 0];
    if (!active) return;
    player._weaponSpin = Math.max(0, (player._weaponSpin || 0) - dt * 8);
    if (firing) player._weaponSpin = Math.min(22, player._weaponSpin + dt * 75);
    if (active.rotor) active.rotor.rotation.z += dt * (2.5 + player._weaponSpin);
    if (active.energy) active.energy.rotation.y += dt * (1.3 + player._weaponSpin * .15);
  };
})(window.MA);
