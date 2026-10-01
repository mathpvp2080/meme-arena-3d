/* =====================================================================
   MEME ARENA 3D — peças 3D exclusivas de cada meme

   createEnemy() monta o corpo genérico e depois chama
   MA.BUILDS[def.id](ctx) para pendurar as partes que dão a silhueta
   característica: o vaso do Skibidi, o taco do Tung Tung, as asas do
   Bombardiro, o arco-íris do Nyan Cat...

   ctx = { g, body, head, a1, a2, l1, l2, R, HR, sc, def, isBoss, elite,
           headY, mat(color, opts), add(mesh) }
   Tudo que for animado entra em ctx.anim (lista de funções (o, t, dt)).
   ===================================================================== */
(function (MA) {
  'use strict';
  const TAU = Math.PI * 2;

  function M(color, o) {
    o = o || {};
    return new THREE.MeshStandardMaterial({
      color: color,
      roughness: o.rough !== undefined ? o.rough : .6,
      metalness: o.metal !== undefined ? o.metal : .2,
      emissive: o.emissive !== undefined ? o.emissive : 0x000000,
      emissiveIntensity: o.ei !== undefined ? o.ei : .6,
      transparent: !!o.opacity, opacity: o.opacity !== undefined ? o.opacity : 1,
      side: o.side || THREE.FrontSide,
      flatShading: !!o.flat
    });
  }
  function B(w, h, d, mat) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); }
  function C(rt, rb, h, mat, seg) { return new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 14), mat); }
  function S(r, mat, seg) { return new THREE.Mesh(new THREE.SphereGeometry(r, seg || 14, seg || 12), mat); }
  function Cone(r, h, mat, seg) { return new THREE.Mesh(new THREE.ConeGeometry(r, h, seg || 10), mat); }
  function Tor(r, t, mat) { return new THREE.Mesh(new THREE.TorusGeometry(r, t, 8, 20), mat); }
  function Pl(w, h, mat) { return new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); }

  const BUILDS = {

    /* 🚽 SKIBIDI — cabeça saindo de um vaso sanitário */
    skibidi(c) {
      const porcelain = M(0xf2f4f6, { rough: .25, metal: .1 });
      c.body.visible = false;
      c.l1.visible = c.l2.visible = false;
      c.a1.visible = c.a2.visible = false;

      const base = C(c.R * 1.0, c.R * 1.25, c.R * 1.1, porcelain, 18);
      base.position.y = c.R * .62; c.add(base);

      const bowl = C(c.R * 1.15, c.R * .9, c.R * .85, porcelain, 20);
      bowl.position.y = c.R * 1.55; c.add(bowl);

      const rim = Tor(c.R * 1.12, c.R * .13, porcelain);
      rim.rotation.x = Math.PI / 2; rim.position.y = c.R * 1.95; c.add(rim);

      const water = new THREE.Mesh(
        new THREE.CircleGeometry(c.R * 1.0, 18),
        M(0x2f6f9f, { rough: .1, metal: .4, emissive: 0x11384f, ei: .5 })
      );
      water.rotation.x = -Math.PI / 2; water.position.y = c.R * 1.9; c.add(water);

      /* caixa acoplada atrás */
      const tank = B(c.R * 1.5, c.R * 1.2, c.R * .55, porcelain);
      tank.position.set(0, c.R * 2.0, -c.R * 1.15); c.add(tank);
      const lid = B(c.R * 1.65, c.R * .18, c.R * .7, porcelain);
      lid.position.set(0, c.R * 2.66, -c.R * 1.15); c.add(lid);
      const flush = C(c.R * .12, c.R * .12, c.R * .18, M(0xb9c4cc, { metal: .9, rough: .2 }));
      flush.rotation.z = Math.PI / 2;
      flush.position.set(c.R * .72, c.R * 2.5, -c.R * 1.15); c.add(flush);

      /* pescoço esticado saindo da água */
      const neck = C(c.HR * .42, c.HR * .5, c.R * 1.0, M(0xe9d9c6, { rough: .7 }));
      neck.position.y = c.R * 2.25; c.add(neck);

      c.head.position.y = c.R * 2.9 + c.HR * .5;
      c.anim.push((o, t) => { c.head.position.y = c.R * 2.9 + c.HR * .5 + Math.sin(t * 5) * c.R * .12; });
    },

    /* 🔺 AMOGUS — corpo de gota, mochila e pernas curtas */
    sus(c) {
      const main = M(c.def.color, { rough: .4, metal: .15, emissive: MA.shade(c.def.color, -70), ei: .55 });
      c.body.visible = false;
      c.a1.visible = c.a2.visible = false;
      c.head.visible = false;

      /* corpo em gota (mais largo embaixo) */
      const torso = new THREE.Mesh(new THREE.CapsuleGeometry(c.R * .85, c.R * 1.15, 8, 20), main);
      torso.position.y = c.R * 1.5; torso.castShadow = true; c.add(torso);
      const belly = S(c.R * .9, main);
      belly.scale.set(1, .8, .95); belly.position.y = c.R * 1.05; c.add(belly);

      /* mochila */
      const back = new THREE.Mesh(new THREE.CapsuleGeometry(c.R * .4, c.R * .95, 6, 14), main);
      back.position.set(0, c.R * 1.55, -c.R * .85); c.add(back);

      /* viseira grande, bem na frente */
      const visor = new THREE.Mesh(
        new THREE.SphereGeometry(c.R * .62, 20, 14),
        M(0x9fdcf5, { rough: .06, metal: .8, emissive: 0x2f7fa8, ei: .75 })
      );
      visor.scale.set(1.08, .62, .5);
      visor.position.set(0, c.R * 1.95, c.R * .62);
      c.add(visor);
      const rim = new THREE.Mesh(
        new THREE.TorusGeometry(c.R * .64, c.R * .07, 8, 22),
        M(MA.shade(c.def.color, -55), { rough: .5 })
      );
      rim.scale.set(1.08, .62, 1);
      rim.position.set(0, c.R * 1.95, c.R * .60);
      c.add(rim);
      /* brilho */
      const shine = S(c.R * .14, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .75 }));
      shine.scale.set(1.5, .7, .4);
      shine.position.set(-c.R * .25, c.R * 2.05, c.R * .92); c.add(shine);

      c.l1.position.set(-c.R * .42, c.R * .32, 0);
      c.l2.position.set(c.R * .42, c.R * .32, 0);
      c.l1.scale.setScalar(1.15); c.l2.scale.setScalar(1.15);
    },

    /* 🐸 PEPE — barriga clara e pés de sapo */
    pepe(c) {
      const belly = S(c.R * .62, M(0xa8e6a8, { rough: .7 }));
      belly.scale.set(1, .82, .6); belly.position.set(0, c.R * 1.0, c.R * .55); c.add(belly);
      [-1, 1].forEach(s => {
        const foot = S(c.R * .36, M(MA.shade(c.def.color, -40), { rough: .8 }));
        foot.scale.set(1.3, .45, 1.6);
        foot.position.set(s * c.R * .42, c.R * .12, c.R * .22); c.add(foot);
      });
    },

    /* 🐕 DOGE — orelhas, rabo e patas */
    doge(c) {
      const fur = M(MA.shade(c.def.color, -14), { rough: .85 });
      [-1, 1].forEach(s => {
        const ear = Cone(c.HR * .34, c.HR * .72, fur, 7);
        ear.position.set(s * c.HR * .62, c.headY + c.HR * .78, -c.HR * .12);
        ear.rotation.z = s * .38; c.add(ear);
      });
      const tail = new THREE.Mesh(new THREE.CapsuleGeometry(c.R * .2, c.R * .9, 5, 10), fur);
      tail.position.set(0, c.R * 1.25, -c.R * .95);
      tail.rotation.x = -.9; c.add(tail);
      c.anim.push((o, t) => { tail.rotation.z = Math.sin(t * 9) * .55; });
    },

    /* 😈 TROLLFACE — preto e branco, mãos atrás */
    troll(c) {
      c.body.material = M(0x1a1a1a, { rough: .5 });
      const shirt = C(c.R * .72, c.R * .78, c.R * .5, M(0xf2f2ef, { rough: .6 }));
      shirt.position.y = c.R * 1.72; c.add(shirt);
    },

    /* 😏 RIZZLER — corrente de ouro e cabelo */
    rizz(c) {
      const gold = M(0xffd400, { metal: 1, rough: .12, emissive: 0x6b5500, ei: .5 });
      const chain = Tor(c.R * .62, c.R * .075, gold);
      chain.rotation.x = Math.PI / 2 - .25;
      chain.position.y = c.R * 1.78; c.add(chain);
      const pend = S(c.R * .16, gold);
      pend.position.set(0, c.R * 1.52, c.R * .55); c.add(pend);

      const hair = new THREE.Mesh(
        new THREE.SphereGeometry(c.HR * 1.03, 16, 12, 0, TAU, 0, Math.PI * .52),
        M(0x17121f, { rough: .75 })
      );
      hair.position.y = c.headY + c.HR * .12; c.add(hair);
    },

    /* 🌈 NYAN CAT — torrada, orelhas e rastro de arco-íris */
    nyan(c) {
      c.body.visible = false;
      c.l1.visible = c.l2.visible = false;
      const tart = B(c.R * 1.5, c.R * 1.05, c.R * .55, M(0xf7b9d8, { rough: .6, emissive: 0x7a3a58, ei: .3 }));
      tart.position.y = c.R * 1.25; tart.castShadow = true; c.add(tart);

      [-1, 1].forEach(s => {
        const ear = Cone(c.HR * .28, c.HR * .5, M(0x9a9a9a, { rough: .7 }), 6);
        ear.position.set(s * c.HR * .55, c.headY + c.HR * .82, 0); c.add(ear);
      });

      const RB = ['#ff0000', '#ff9900', '#ffff00', '#33dd33', '#0099ff', '#6633ff'];
      const trail = [];
      RB.forEach((col, i) => {
        const seg = Pl(c.R * 1.5, c.R * .17, new THREE.MeshBasicMaterial({
          color: col, side: THREE.DoubleSide, transparent: true, opacity: .85
        }));
        seg.position.set(0, c.R * 1.25 + (2.5 - i) * c.R * .17, -c.R * 1.25);
        trail.push(seg); c.add(seg);
      });
      c.anim.push((o, t) => {
        trail.forEach((s, i) => { s.position.y = c.R * 1.25 + (2.5 - i) * c.R * .17 + Math.sin(t * 8 + i * .6) * c.R * .07; });
      });

      const tail = new THREE.Mesh(new THREE.CapsuleGeometry(c.R * .14, c.R * .7, 4, 8), M(0x9a9a9a, { rough: .7 }));
      tail.position.set(0, c.R * 1.5, -c.R * 1.0); tail.rotation.x = -.6; c.add(tail);
    },

    /* 💀 BLUESCREEN — corpo de monitor CRT */
    crash(c) {
      c.body.visible = false; c.head.visible = false;
      c.a1.visible = c.a2.visible = false;
      const plastic = M(0xd8d2c4, { rough: .75 });
      const shell = B(c.R * 2.0, c.R * 1.7, c.R * 1.5, plastic);
      shell.position.y = c.R * 1.5; shell.castShadow = true; c.add(shell);
      const screen = Pl(c.R * 1.6, c.R * 1.25, new THREE.MeshBasicMaterial({
        map: MA.Tex.face(c.def, null, null, c.elite), toneMapped: false
      }));
      screen.position.set(0, c.R * 1.5, c.R * .76); c.add(screen);
      const stand = C(c.R * .3, c.R * .55, c.R * .6, plastic);
      stand.position.y = c.R * .3; c.add(stand);
      c.anim.push((o, t) => { screen.material.opacity = 1; shell.position.x = Math.sin(t * 33) * c.R * .035; });
    },

    /* 🌽 OHIO — espiga de milho nas costas e palha */
    ohio(c) {
      const husk = M(0x5a8f3a, { rough: .8 });
      [-1, 1].forEach(s => {
        const leaf = Pl(c.R * .5, c.R * 1.5, M(0x6aa845, { rough: .85, side: THREE.DoubleSide }));
        leaf.position.set(s * c.R * .85, c.R * 1.3, -c.R * .3);
        leaf.rotation.set(.2, s * .7, s * .3); c.add(leaf);
      });
      const cob = C(c.R * .3, c.R * .34, c.R * 1.2, M(0xffc42e, { rough: .5, emissive: 0x5a3700, ei: .3 }));
      cob.position.set(0, c.R * 1.5, -c.R * .8); c.add(cob);
      const top = Cone(c.R * .3, c.R * .4, husk, 8);
      top.position.set(0, c.R * 2.2, -c.R * .8); c.add(top);
    },

    /* 📈 STONKS — terno, gravata e seta flutuante */
    stonks(c) {
      c.body.material = M(0x6b7a8c, { rough: .7 });
      const lapel = B(c.R * 1.1, c.R * .8, c.R * .12, M(0x4a5869, { rough: .6 }));
      lapel.position.set(0, c.R * 1.45, c.R * .7); c.add(lapel);
      const tie = B(c.R * .22, c.R * .85, c.R * .1, M(0xc0392b, { rough: .5 }));
      tie.position.set(0, c.R * 1.3, c.R * .78); c.add(tie);

      const arrowMat = M(0x2ecc71, { emissive: 0x2ecc71, ei: 1.1, rough: .3 });
      const arrow = new THREE.Group();
      const shaft = B(c.R * .14, c.R * 1.1, c.R * .14, arrowMat);
      shaft.position.y = c.R * .55; arrow.add(shaft);
      const tip = Cone(c.R * .3, c.R * .5, arrowMat, 6);
      tip.position.y = c.R * 1.3; arrow.add(tip);
      arrow.rotation.z = -.5;
      arrow.position.set(c.R * 1.3, c.R * 1.9, 0);
      c.add(arrow);
      c.anim.push((o, t) => { arrow.position.y = c.R * 1.9 + Math.sin(t * 2.4) * c.R * .3; arrow.rotation.y = t * 1.6; });
    },

    /* 🕶️ SIGMA — ombros largos, terno preto e aura fria */
    sigma(c) {
      c.body.scale.set(1.25, 1, .95);
      c.body.material = M(0x16161e, { rough: .45, metal: .35 });
      [-1, 1].forEach(s => {
        const shoulder = S(c.R * .42, M(0x1f1f2b, { rough: .4, metal: .4 }));
        shoulder.position.set(s * c.R * 1.0, c.R * 1.8, 0); c.add(shoulder);
      });
      const ring = Tor(c.R * 1.5, c.R * .05, new THREE.MeshBasicMaterial({ color: 0x00e5ff }));
      ring.rotation.x = Math.PI / 2; ring.position.y = c.R * .1; c.add(ring);
      c.anim.push((o, t) => { ring.rotation.z = t * 1.2; ring.position.y = c.R * (.1 + Math.abs(Math.sin(t * 1.3)) * .25); });
    },

    /* 🥤 GRIMACE — copo de milkshake com canudo */
    grimace(c) {
      const cupMat = M(0x8e2dc4, { rough: .35, emissive: 0x3d0b5c, ei: .5 });
      c.body.visible = false;
      const cup = C(c.R * 1.05, c.R * .72, c.R * 1.7, cupMat, 20);
      cup.position.y = c.R * 1.2; cup.castShadow = true; c.add(cup);
      const band = C(c.R * 1.08, c.R * 1.08, c.R * .3, M(0xffffff, { rough: .5 }), 20);
      band.position.y = c.R * 1.6; c.add(band);
      const dome = S(c.R * 1.06, M(0xd98cf0, { rough: .4 }));
      dome.scale.y = .55; dome.position.y = c.R * 2.0; c.add(dome);
      const straw = C(c.R * .13, c.R * .13, c.R * 2.1, M(0xff4da6, { rough: .3, emissive: 0x7a1148, ei: .5 }));
      straw.position.set(c.R * .35, c.R * 2.6, 0); straw.rotation.z = .22; c.add(straw);
      c.head.position.y = c.R * 2.35 + c.HR * .5;
    },

    /* 🦈 TRALALERO — tubarão com tênis */
    tralala(c) {
      const skin = M(c.def.color, { rough: .45 });
      c.body.scale.set(1, 1, 1.5);
      const fin = Cone(c.R * .42, c.R * 1.1, skin, 4);
      fin.position.set(0, c.R * 2.0, -c.R * .25); fin.rotation.y = Math.PI / 4; c.add(fin);
      [-1, 1].forEach(s => {
        const side = Cone(c.R * .3, c.R * .8, skin, 4);
        side.position.set(s * c.R * .9, c.R * 1.2, 0);
        side.rotation.z = s * Math.PI / 2.1; side.rotation.y = Math.PI / 4; c.add(side);
      });
      const tail = Cone(c.R * .55, c.R * 1.0, skin, 4);
      tail.position.set(0, c.R * 1.2, -c.R * 1.5); tail.rotation.x = -Math.PI / 2; c.add(tail);
      /* tênis azuis */
      [-1, 1].forEach(s => {
        const shoe = B(c.R * .46, c.R * .3, c.R * .8, M(0x1b63d8, { rough: .6 }));
        shoe.position.set(s * c.R * .42, c.R * .15, c.R * .18); c.add(shoe);
        const sole = B(c.R * .5, c.R * .12, c.R * .86, M(0xffffff, { rough: .7 }));
        sole.position.set(s * c.R * .42, c.R * .04, c.R * .18); c.add(sole);
      });
      c.anim.push((o, t) => { tail.rotation.z = Math.sin(t * 7) * .4; });
    },

    /* 🪵 TUNG TUNG SAHUR — tronco com taco de beisebol */
    tung(c) {
      c.body.visible = false;
      const wood = M(c.def.color, { rough: .95, flat: true });
      const log = C(c.R * .95, c.R * 1.0, c.R * 2.0, wood, 12);
      log.position.y = c.R * 1.4; log.castShadow = true; c.add(log);
      const topRing = C(c.R * .96, c.R * .96, c.R * .1, M(MA.shade(c.def.color, 35), { rough: .9 }), 12);
      topRing.position.y = c.R * 2.4; c.add(topRing);

      /* taco na mão direita */
      const bat = new THREE.Group();
      const handle = C(c.R * .1, c.R * .14, c.R * 1.0, M(0x6b4423, { rough: .8 }));
      handle.position.y = c.R * .5; bat.add(handle);
      const barrel = C(c.R * .26, c.R * .18, c.R * 1.2, M(0x8a5a2b, { rough: .75 }));
      barrel.position.y = c.R * 1.55; bat.add(barrel);
      bat.position.set(c.R * 1.25, c.R * 1.1, c.R * .2);
      bat.rotation.z = -.45; c.add(bat);
      c.anim.push((o, t) => { bat.rotation.x = Math.sin(t * 6) * .5; });
      c.head.position.y = c.R * 2.6 + c.HR * .45;
    },

    /* 🐊 BOMBARDIRO — crocodilo-avião com hélices e bombas */
    bombard(c) {
      const metal = M(0x4a6b3a, { rough: .4, metal: .6 });
      c.body.scale.set(1, .9, 1.4);
      /* asas */
      [-1, 1].forEach(s => {
        const wing = B(c.R * 1.9, c.R * .14, c.R * .7, metal);
        wing.position.set(s * c.R * 1.5, c.R * 1.35, 0);
        wing.rotation.z = s * .08; c.add(wing);
        /* motor + hélice */
        const eng = C(c.R * .2, c.R * .2, c.R * .5, M(0x2b2b2b, { metal: .9, rough: .3 }));
        eng.rotation.x = Math.PI / 2;
        eng.position.set(s * c.R * 2.1, c.R * 1.35, c.R * .25); c.add(eng);
        const prop = new THREE.Group();
        [0, 1].forEach(i => {
          const blade = B(c.R * .08, c.R * 1.0, c.R * .05, M(0xcfd8dc, { metal: .8, rough: .3 }));
          blade.rotation.z = i * Math.PI / 2; prop.add(blade);
        });
        prop.position.set(s * c.R * 2.1, c.R * 1.35, c.R * .55); c.add(prop);
        c.anim.push((o, t, dt) => { prop.rotation.z += dt * 26; });
      });
      /* cauda vertical */
      const tail = B(c.R * .12, c.R * .9, c.R * .6, metal);
      tail.position.set(0, c.R * 2.0, -c.R * 1.1); c.add(tail);
      /* bomba pendurada */
      const bomb = new THREE.Mesh(new THREE.CapsuleGeometry(c.R * .22, c.R * .5, 5, 10), M(0x2b2b2b, { metal: .7, rough: .4 }));
      bomb.rotation.x = Math.PI / 2;
      bomb.position.set(0, c.R * .62, 0); c.add(bomb);
      const fuse = Cone(c.R * .16, c.R * .3, M(0xff5a1f, { emissive: 0xff5a1f, ei: 1 }), 6);
      fuse.position.set(0, c.R * .62, -c.R * .5); fuse.rotation.x = -Math.PI / 2; c.add(fuse);
    },

    /* 🤪 GOOFY — pernas compridas e chapéu torto */
    goofy(c) {
      c.l1.scale.y = 1.8; c.l2.scale.y = 1.8;
      c.l1.position.y = c.R * .62; c.l2.position.y = c.R * .62;
      const hat = C(c.HR * .42, c.HR * .42, c.HR * .5, M(0x2e8b57, { rough: .7 }));
      hat.position.set(c.HR * .18, c.headY + c.HR * .95, 0); hat.rotation.z = .35; c.add(hat);
      const brim = C(c.HR * .75, c.HR * .75, c.HR * .08, M(0x2e8b57, { rough: .7 }));
      brim.position.set(c.HR * .1, c.headY + c.HR * .72, 0); brim.rotation.z = .35; c.add(brim);
      c.anim.push((o, t) => { c.head.rotation.z = Math.sin(t * 4) * .22; });
    },

    /* ======================================================== CHEFES === */

    bigskibidi(c) {
      BUILDS.skibidi(c);
      const aura = new THREE.Mesh(
        new THREE.IcosahedronGeometry(c.R * 1.9, 1),
        new THREE.MeshBasicMaterial({ color: 0x3d6fa0, wireframe: true, transparent: true, opacity: .3 })
      );
      aura.position.y = c.R * 1.6; c.add(aura);
      c.anim.push((o, t, dt) => { aura.rotation.y += dt * .8; });
    },

    gigachad(c) {
      c.body.scale.set(1.5, 1.05, 1.1);
      c.body.material = M(0xb9c4cc, { rough: .35, metal: .55 });
      [-1, 1].forEach(s => {
        const pec = S(c.R * .55, M(0xc9d4dc, { rough: .35, metal: .5 }));
        pec.scale.set(1, .8, .6);
        pec.position.set(s * c.R * .5, c.R * 1.5, c.R * .75); c.add(pec);
        const delt = S(c.R * .52, M(0xb9c4cc, { rough: .35, metal: .55 }));
        delt.position.set(s * c.R * 1.5, c.R * 1.7, 0); c.add(delt);
      });
      c.a1.scale.set(1.7, 1.2, 1.7); c.a2.scale.set(1.7, 1.2, 1.7);
    },

    tralaboss(c) { BUILDS.tralala(c); },

    bombaboss(c) { BUILDS.bombard(c); },

    /* O ALGORITMO — núcleo com anéis girando e satélites */
    brainrot(c) {
      c.body.visible = false;
      c.a1.visible = c.a2.visible = c.l1.visible = c.l2.visible = false;
      const core = new THREE.Mesh(
        new THREE.IcosahedronGeometry(c.R * 1.1, 1),
        M(0xff3ca6, { emissive: 0xff3ca6, ei: .9, rough: .3, flat: true })
      );
      core.position.y = c.R * 1.5; c.add(core);

      const rings = [];
      [[0, 0], [1.2, .5], [.6, 1.3]].forEach((r, i) => {
        const ring = Tor(c.R * (1.7 + i * .35), c.R * .07,
          new THREE.MeshBasicMaterial({ color: [0x00e5ff, 0xff00c8, 0xffe600][i], transparent: true, opacity: .8 }));
        ring.rotation.set(r[0], r[1], 0);
        ring.position.y = c.R * 1.5; rings.push(ring); c.add(ring);
      });
      c.anim.push((o, t, dt) => {
        rings.forEach((r, i) => { r.rotation.z += dt * (.6 + i * .45); r.rotation.x += dt * .2 * (i % 2 ? -1 : 1); });
        core.rotation.y += dt * .9;
        core.scale.setScalar(1 + Math.sin(t * 3) * .07);
      });

      /* "telas" girando em volta — o feed infinito */
      const screens = [];
      for (let i = 0; i < 6; i++) {
        const sc = Pl(c.R * .7, c.R * 1.2, new THREE.MeshBasicMaterial({
          color: 0xffffff, transparent: true, opacity: .5, side: THREE.DoubleSide
        }));
        screens.push(sc); c.add(sc);
      }
      c.anim.push((o, t) => {
        screens.forEach((s, i) => {
          const a = t * .7 + i / 6 * TAU;
          s.position.set(Math.cos(a) * c.R * 2.6, c.R * (1.2 + Math.sin(t * 1.4 + i) * .5), Math.sin(a) * c.R * 2.6);
          s.lookAt(0, c.R * 1.5, 0);
        });
      });
      c.head.position.y = c.R * 1.5;
    }
  };

  MA.BUILDS = BUILDS;
})(window.MA);
