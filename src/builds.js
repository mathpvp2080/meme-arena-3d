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
      const skin = M(c.def.color, { rough: .75 });
      const dark = M(MA.shade(c.def.color, -45), { rough: .8 });
      /* cabeça larga e achatada de sapo */
      c.head.scale.set(1.5, .92, 1.15);
      /* olhos esbugalhados no topo */
      [-1, 1].forEach(sg => {
        const eye = S(c.HR * .46, M(0xffffff, { rough: .25 }), 16);
        eye.position.set(sg * c.HR * .62, c.headY + c.HR * .66, c.HR * .12);
        c.add(eye);
        const lid = S(c.HR * .48, skin, 16);
        lid.scale.set(1, .55, 1);
        lid.position.set(sg * c.HR * .62, c.headY + c.HR * .88, c.HR * .10);
        c.add(lid);
        const pup = S(c.HR * .17, M(0x101010, { rough: .2 }), 12);
        pup.position.set(sg * c.HR * .62, c.headY + c.HR * .62, c.HR * .50);
        c.add(pup);
      });
      /* boca larga */
      const mouth = new THREE.Mesh(
        new THREE.TorusGeometry(c.HR * .78, c.HR * .09, 8, 22, Math.PI * .85),
        dark
      );
      mouth.position.set(0, c.headY + c.HR * .12, c.HR * .52);
      mouth.rotation.set(Math.PI, 0, Math.PI * 1.08);
      mouth.scale.set(1, .6, 1);
      c.add(mouth);
      /* camisa vermelha de gola */
      const shirt = C(c.R * .9, c.R * .95, c.R * .55, M(0xc0392b, { rough: .7 }));
      shirt.position.y = c.R * 1.62; c.add(shirt);
      const belly = S(c.R * .64, M(0xbdf0b0, { rough: .8 }));
      belly.scale.set(1, .85, .62); belly.position.set(0, c.R * 1.0, c.R * .56); c.add(belly);
      /* pés palmados */
      [-1, 1].forEach(sg => {
        const foot = S(c.R * .4, dark);
        foot.scale.set(1.35, .35, 1.8);
        foot.position.set(sg * c.R * .45, c.R * .1, c.R * .3); c.add(foot);
      });
    },

    /* 🐕 DOGE — orelhas, rabo e patas */
    doge(c) {
      const fur = M(c.def.color, { rough: .9 });
      const cream = M(0xf6e3bb, { rough: .9 });
      const dark = M(MA.shade(c.def.color, -45), { rough: .85 });
      /* focinho do shiba */
      const snout = new THREE.Mesh(new THREE.CapsuleGeometry(c.HR * .30, c.HR * .26, 5, 12), cream);
      snout.rotation.x = Math.PI / 2;
      snout.position.set(0, c.headY - c.HR * .12, c.HR * .78);
      c.add(snout);
      const nose = S(c.HR * .13, M(0x241a14, { rough: .35 }), 12);
      nose.position.set(0, c.headY - c.HR * .06, c.HR * 1.02); c.add(nose);
      /* manchas claras das sobrancelhas */
      [-1, 1].forEach(sg => {
        const spot = S(c.HR * .2, cream, 12);
        spot.scale.set(1, .7, .5);
        spot.position.set(sg * c.HR * .33, c.headY + c.HR * .34, c.HR * .72);
        c.add(spot);
      });
      /* orelhas triangulares em pé */
      [-1, 1].forEach(sg => {
        const ear = Cone(c.HR * .3, c.HR * .78, fur, 4);
        ear.position.set(sg * c.HR * .60, c.headY + c.HR * .84, -c.HR * .06);
        ear.rotation.set(-.12, Math.PI / 4, sg * .3);
        c.add(ear);
        const inner = Cone(c.HR * .17, c.HR * .5, M(0xd9a06b, { rough: .9 }), 4);
        inner.position.set(sg * c.HR * .60, c.headY + c.HR * .82, c.HR * .06);
        inner.rotation.set(-.12, Math.PI / 4, sg * .3);
        c.add(inner);
      });
      /* peito creme e patas */
      const chest = S(c.R * .62, cream);
      chest.scale.set(.9, 1.05, .55);
      chest.position.set(0, c.R * 1.2, c.R * .6); c.add(chest);
      [-1, 1].forEach(sg => {
        const paw = S(c.R * .26, cream);
        paw.scale.set(1, .6, 1.5);
        paw.position.set(sg * c.R * .34, c.R * .1, c.R * .25); c.add(paw);
      });
      /* rabo enrolado */
      const tail = new THREE.Mesh(new THREE.TorusGeometry(c.R * .42, c.R * .17, 8, 16, Math.PI * 1.5), fur);
      tail.position.set(0, c.R * 1.5, -c.R * .92);
      tail.rotation.set(.4, 0, .2);
      c.add(tail);
      c.anim.push((o, t) => { tail.rotation.z = .2 + Math.sin(t * 9) * .45; });
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
      /* gato pop-tart: torrada retangular + cabeça de gato + arco-íris */
      const gray = M(0xa9b2bd, { rough: .7 });
      c.body.visible = false;
      c.head.material = gray;
      c.head.scale.set(1.05, .95, 1);
      const tart = B(c.R * 1.5, c.R * 1.1, c.R * .8, M(0xf2b8d6, { rough: .8 }));
      tart.position.y = c.R * 1.35; tart.castShadow = true; c.add(tart);
      const crust = B(c.R * 1.62, c.R * 1.22, c.R * .7, M(0xe5a96a, { rough: .9 }));
      crust.position.y = c.R * 1.35; c.add(crust);
      const icing = B(c.R * 1.3, c.R * .95, c.R * .84, M(0xff8fc8, { rough: .6 }));
      icing.position.y = c.R * 1.35; c.add(icing);
      /* confeitos */
      for (let i = 0; i < 14; i++) {
        const sp = B(c.R * .09, c.R * .09, c.R * .06,
          M([0xffe14d, 0x49ffb0, 0x6ab7ff, 0xffffff][i % 4], { rough: .4 }));
        sp.position.set(MA.rand(-.55, .55) * c.R, c.R * 1.35 + MA.rand(-.35, .35) * c.R, c.R * .44);
        sp.rotation.z = MA.rand(0, TAU); c.add(sp);
      }
      /* orelhas e patinhas de gato */
      [-1, 1].forEach(sg => {
        const ear = Cone(c.HR * .26, c.HR * .5, gray, 4);
        ear.position.set(sg * c.HR * .5, c.headY + c.HR * .8, 0);
        ear.rotation.y = Math.PI / 4; c.add(ear);
        const paw = S(c.R * .2, gray, 10);
        paw.position.set(sg * c.R * .78, c.R * .85, c.R * .2); c.add(paw);
        c.anim.push((o, t) => { paw.position.y = c.R * .85 + Math.sin(t * 12 + sg) * c.R * .12; });
      });
      const tail = new THREE.Mesh(new THREE.CapsuleGeometry(c.R * .14, c.R * .8, 5, 10), gray);
      tail.position.set(0, c.R * 1.6, -c.R * .9); tail.rotation.x = -.7; c.add(tail);
      c.anim.push((o, t) => { tail.rotation.z = Math.sin(t * 8) * .5; });
      /* rastro de arco-íris */
      const cores = [0xff2d6f, 0xff8a3d, 0xffe14d, 0x49ffb0, 0x6ab7ff, 0xb46cff];
      cores.forEach((col, i) => {
        const seg = B(c.R * 1.5, c.R * .17, c.R * .12,
          new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: .85 }));
        seg.position.set(0, c.R * 1.75 - i * c.R * .18, -c.R * 1.35);
        c.add(seg);
        c.anim.push((o, t) => {
          seg.position.z = -c.R * 1.35 - Math.abs(Math.sin(t * 8 + i * .5)) * c.R * .25;
        });
      });
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
      /* Meme Man: cabeça lisa cinza, nariz grande, terno */
      const skin = M(0xdfe3e6, { rough: .35, metal: .1 });
      c.head.material = skin;
      c.head.scale.set(1.05, 1.25, 1.05);
      const nose = Cone(c.HR * .22, c.HR * .6, skin, 8);
      nose.rotation.x = Math.PI / 2.1;
      nose.position.set(0, c.headY - c.HR * .05, c.HR * .92); c.add(nose);
      /* terno escuro */
      const suit = C(c.R * .92, c.R * .98, c.R * 1.7, M(0x23283a, { rough: .65 }));
      suit.position.y = c.R * 1.2; c.add(suit);
      const shirt = B(c.R * .5, c.R * 1.1, c.R * .2, M(0xf2f4f7, { rough: .6 }));
      shirt.position.set(0, c.R * 1.55, c.R * .78); c.add(shirt);
      const tie = B(c.R * .18, c.R * .9, c.R * .1, M(0xc0392b, { rough: .5 }));
      tie.position.set(0, c.R * 1.45, c.R * .88); c.add(tie);
      [-1, 1].forEach(sg => {
        const lapel = B(c.R * .3, c.R * .9, c.R * .12, M(0x171b29, { rough: .6 }));
        lapel.position.set(sg * c.R * .35, c.R * 1.6, c.R * .8);
        lapel.rotation.z = sg * .22; c.add(lapel);
      });
      /* seta verde subindo */
      const arrow = new THREE.Group();
      const shaft = C(c.R * .09, c.R * .09, c.R * 1.5, M(0x39ff88, { rough: .2, emissive: 0x0d7a3c, ei: .9 }), 8);
      shaft.rotation.z = -.7; arrow.add(shaft);
      const tip = Cone(c.R * .26, c.R * .55, M(0x39ff88, { rough: .2, emissive: 0x0d7a3c, ei: .9 }), 8);
      tip.position.set(c.R * .62, c.R * .62, 0); tip.rotation.z = -.7; arrow.add(tip);
      arrow.position.set(-c.R * 1.5, c.R * 2.3, 0); c.add(arrow);
      c.anim.push((o, t) => { arrow.position.y = c.R * 2.3 + Math.sin(t * 2.5) * c.R * .25; });
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
      /* bolha roxa gigante com olhos grandes e braços curtos */
      const purple = M(c.def.color, { rough: .55 });
      c.body.visible = false; c.head.visible = false;
      const blob = S(c.R * 1.45, purple, 24);
      blob.scale.set(1, 1.18, .95);
      blob.position.y = c.R * 1.6; blob.castShadow = true; c.add(blob);
      /* olhos enormes */
      [-1, 1].forEach(sg => {
        const w = S(c.R * .42, M(0xffffff, { rough: .2 }), 16);
        w.scale.set(1, 1.2, .7);
        w.position.set(sg * c.R * .48, c.R * 2.25, c.R * 1.02); c.add(w);
        const p = S(c.R * .2, M(0x120a1a), 12);
        p.position.set(sg * c.R * .5, c.R * 2.22, c.R * 1.3); c.add(p);
      });
      /* boca sorridente */
      const mouth = new THREE.Mesh(
        new THREE.TorusGeometry(c.R * .45, c.R * .11, 8, 20, Math.PI),
        M(MA.shade(c.def.color, -55), { rough: .7 })
      );
      mouth.position.set(0, c.R * 1.58, c.R * 1.2);
      mouth.rotation.set(0, 0, Math.PI);
      c.add(mouth);
      /* bracinhos */
      c.a1.scale.set(.8, .65, .8); c.a2.scale.set(.8, .65, .8);
      c.a1.position.y = c.R * 1.5; c.a2.position.y = c.R * 1.5;
      c.l1.scale.set(1.1, .55, 1.1); c.l2.scale.set(1.1, .55, 1.1);
      c.anim.push((o, t) => { blob.scale.y = 1.18 + Math.sin(t * 3.4) * .06; });
    },

    /* 🦈 TRALALERO — tubarão com tênis */
    tralala(c) {
      /* tubarão azul de três tênis — corpo deitado */
      const skin = M(c.def.color, { rough: .5, metal: .1 });
      const pale = M(0xdfeef7, { rough: .6 });
      c.body.visible = false; c.head.visible = false;
      c.a1.visible = c.a2.visible = false;
      c.l1.visible = c.l2.visible = false;

      const body = new THREE.Mesh(new THREE.CapsuleGeometry(c.R * .8, c.R * 1.9, 8, 18), skin);
      body.rotation.x = Math.PI / 2;
      body.position.y = c.R * 1.75; body.castShadow = true; c.add(body);
      /* barriga clara */
      const belly = new THREE.Mesh(new THREE.CapsuleGeometry(c.R * .6, c.R * 1.6, 6, 14), pale);
      belly.rotation.x = Math.PI / 2;
      belly.position.set(0, c.R * 1.5, 0); c.add(belly);
      /* focinho pontudo */
      const snout = Cone(c.R * .78, c.R * 1.15, skin, 14);
      snout.rotation.x = Math.PI / 2;
      snout.position.set(0, c.R * 1.8, c.R * 2.0); c.add(snout);
      /* boca com dentes */
      const mouth = new THREE.Mesh(new THREE.BoxGeometry(c.R * 1.0, c.R * .18, c.R * .7), M(0x3a1020, { rough: .7 }));
      mouth.position.set(0, c.R * 1.42, c.R * 1.72); mouth.rotation.x = .18; c.add(mouth);
      for (let i = 0; i < 7; i++) {
        const t2 = Cone(c.R * .07, c.R * .2, M(0xffffff, { rough: .3 }), 4);
        t2.position.set((i - 3) * c.R * .15, c.R * 1.5, c.R * 1.9);
        t2.rotation.x = Math.PI; c.add(t2);
      }
      /* barbatana dorsal + laterais + cauda */
      const dorsal = Cone(c.R * .55, c.R * 1.1, skin, 4);
      dorsal.position.set(0, c.R * 2.6, -c.R * .2);
      dorsal.rotation.y = Math.PI / 4; dorsal.scale.set(.35, 1, 1); c.add(dorsal);
      [-1, 1].forEach(sg => {
        const fin = Cone(c.R * .45, c.R * .9, skin, 4);
        fin.position.set(sg * c.R * .85, c.R * 1.5, c.R * .35);
        fin.rotation.set(Math.PI / 2.1, Math.PI / 4, sg * 1.25);
        fin.scale.set(.3, 1, 1); c.add(fin);
      });
      const tail = new THREE.Group();
      [1, -1].forEach(sg => {
        const tf = Cone(c.R * .42, c.R * 1.25, skin, 4);
        tf.rotation.set(0, Math.PI / 4, sg * .55);
        tf.position.set(0, sg * c.R * .5, 0);
        tf.scale.set(.3, 1, 1); tail.add(tf);
      });
      tail.position.set(0, c.R * 1.8, -c.R * 2.2); c.add(tail);
      c.anim.push((o, t) => { tail.rotation.y = Math.sin(t * 7) * .5; });
      /* três tênis azuis */
      [-1, 0, 1].forEach((sg, i) => {
        const leg = C(c.R * .14, c.R * .14, c.R * .9, pale, 8);
        leg.position.set(sg * c.R * .55, c.R * .95, (i === 1 ? -c.R * .5 : c.R * .35));
        c.add(leg);
        const shoe = new THREE.Group();
        const sole = B(c.R * .5, c.R * .16, c.R * 1.0, M(0xffffff, { rough: .5 }));
        sole.position.y = c.R * .08; shoe.add(sole);
        const upper = B(c.R * .46, c.R * .3, c.R * .75, M(0x1b63d8, { rough: .55 }));
        upper.position.set(0, c.R * .28, -c.R * .08); shoe.add(upper);
        const swoosh = B(c.R * .04, c.R * .12, c.R * .5, M(0xffffff, { rough: .4 }));
        swoosh.position.set(c.R * .24, c.R * .26, 0); shoe.add(swoosh);
        shoe.position.set(sg * c.R * .55, c.R * .1, (i === 1 ? -c.R * .5 : c.R * .35) + c.R * .15);
        c.add(shoe);
        c.anim.push((o, t) => {
          const sw = Math.sin(t * 11 + i * 2) * .3;
          leg.rotation.x = sw; shoe.position.z = (i === 1 ? -c.R * .5 : c.R * .35) + c.R * .15 + sw * c.R * .5;
        });
      });
    },

    /* 🪵 TUNG TUNG SAHUR — tronco com taco de beisebol */
    tung(c) {
      /* Tung Tung Sahur: tora de madeira com olhos esbugalhados e taco */
      const wood = M(c.def.color, { rough: .95 });
      const darkw = M(MA.shade(c.def.color, -38), { rough: .95 });
      c.body.visible = false; c.head.visible = false;

      const log = C(c.R * .95, c.R * 1.05, c.R * 2.4, wood, 12);
      log.position.y = c.R * 1.5; log.castShadow = true; c.add(log);
      /* anéis de madeira */
      [0.6, 1.5, 2.3].forEach(h => {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(c.R * 1.0, c.R * .05, 6, 16), darkw);
        ring.rotation.x = Math.PI / 2; ring.position.y = c.R * h; c.add(ring);
      });
      /* topo com veios */
      const top = C(c.R * .95, c.R * .95, c.R * .12, M(MA.shade(c.def.color, 22), { rough: .9 }), 12);
      top.position.y = c.R * 2.72; c.add(top);
      /* olhos arregalados */
      [-1, 1].forEach(sg => {
        const e = S(c.R * .33, M(0xffffff, { rough: .25 }), 14);
        e.position.set(sg * c.R * .38, c.R * 2.2, c.R * .78); c.add(e);
        const p = S(c.R * .15, M(0x0d0d0d), 10);
        p.position.set(sg * c.R * .40, c.R * 2.18, c.R * 1.02); c.add(p);
        const brow = B(c.R * .42, c.R * .1, c.R * .1, darkw);
        brow.position.set(sg * c.R * .38, c.R * 2.56, c.R * .92);
        brow.rotation.z = -sg * .28; c.add(brow);
      });
      /* boca aberta gritando */
      const mouth = new THREE.Mesh(new THREE.SphereGeometry(c.R * .34, 14, 10), M(0x2a1208, { rough: .8 }));
      mouth.scale.set(1, 1.25, .5);
      mouth.position.set(0, c.R * 1.58, c.R * .84); c.add(mouth);
      /* bracinhos finos */
      c.a1.scale.set(.55, 1.1, .55); c.a2.scale.set(.55, 1.1, .55);
      c.a1.material = darkw; c.a2.material = darkw;
      /* taco de beisebol na mão direita */
      const bat = new THREE.Group();
      const handle = C(c.R * .08, c.R * .1, c.R * 1.0, M(0xc9a36a, { rough: .9 }), 8);
      handle.position.y = c.R * .5; bat.add(handle);
      const barrel = C(c.R * .22, c.R * .14, c.R * 1.2, M(0xa9763d, { rough: .9 }), 10);
      barrel.position.y = c.R * 1.55; bat.add(barrel);
      bat.position.set(c.R * .95, c.R * 1.35, c.R * .15);
      bat.rotation.z = -.5; bat.rotation.x = -.35;
      c.add(bat);
      c.anim.push((o, t) => { bat.rotation.x = -.35 + Math.sin(t * 6) * .5; });
      /* pezinhos */
      c.l1.scale.set(.8, .7, .8); c.l2.scale.set(.8, .7, .8);
    },

    /* 🐊 BOMBARDIRO — crocodilo-avião com hélices e bombas */
    bombard(c) {
      /* crocodilo-avião: fuselagem, asas, hélice e bombas */
      const green = M(c.def.color, { rough: .65 });
      const dark = M(MA.shade(c.def.color, -45), { rough: .7 });
      const metal = M(0x7c8894, { rough: .35, metal: .85 });
      c.body.visible = false; c.head.visible = false;
      c.a1.visible = c.a2.visible = false;
      c.l1.visible = c.l2.visible = false;

      const fuse = new THREE.Mesh(new THREE.CapsuleGeometry(c.R * .78, c.R * 2.1, 8, 16), green);
      fuse.rotation.x = Math.PI / 2;
      fuse.position.y = c.R * 1.9; fuse.castShadow = true; c.add(fuse);
      const belly = new THREE.Mesh(new THREE.CapsuleGeometry(c.R * .55, c.R * 1.7, 6, 12), M(0xd9d6a8, { rough: .8 }));
      belly.rotation.x = Math.PI / 2; belly.position.y = c.R * 1.6; c.add(belly);

      /* focinho de jacaré: mandíbula de cima e de baixo */
      const jawTop = B(c.R * .9, c.R * .3, c.R * 1.5, green);
      jawTop.position.set(0, c.R * 2.0, c.R * 2.0); c.add(jawTop);
      const jawBot = B(c.R * .82, c.R * .26, c.R * 1.35, dark);
      jawBot.position.set(0, c.R * 1.68, c.R * 1.95); c.add(jawBot);
      c.anim.push((o, t) => { jawBot.rotation.x = -.12 + Math.abs(Math.sin(t * 2.2)) * .22; });
      for (let i = 0; i < 6; i++) {
        const tt = Cone(c.R * .07, c.R * .22, M(0xfdf6e3, { rough: .4 }), 4);
        tt.position.set((i % 3 - 1) * c.R * .28, c.R * 1.85, c.R * (1.5 + (i < 3 ? .35 : .9)));
        tt.rotation.x = i < 3 ? Math.PI : 0;
        c.add(tt);
      }
      /* olhos em cima da cabeça */
      [-1, 1].forEach(sg => {
        const e = S(c.R * .2, M(0xffe14d, { rough: .25, emissive: 0x6b5b00, ei: .6 }), 12);
        e.position.set(sg * c.R * .3, c.R * 2.25, c.R * 1.5); c.add(e);
        const p = S(c.R * .09, M(0x111111), 8);
        p.position.set(sg * c.R * .3, c.R * 2.27, c.R * 1.66); c.add(p);
      });
      /* asas */
      [-1, 1].forEach(sg => {
        const wing = B(c.R * 2.5, c.R * .16, c.R * .9, green);
        wing.position.set(sg * c.R * 1.6, c.R * 1.95, -c.R * .1);
        wing.rotation.z = sg * .07; c.add(wing);
        const tip = B(c.R * .3, c.R * .4, c.R * .6, dark);
        tip.position.set(sg * c.R * 2.75, c.R * 2.05, -c.R * .1); c.add(tip);
        /* bomba pendurada */
        const bomb = new THREE.Mesh(new THREE.CapsuleGeometry(c.R * .2, c.R * .5, 6, 10), M(0x3b3f45, { rough: .5, metal: .6 }));
        bomb.rotation.x = Math.PI / 2;
        bomb.position.set(sg * c.R * 1.5, c.R * 1.55, c.R * .1); c.add(bomb);
      });
      /* cauda vertical e horizontal */
      const tailV = B(c.R * .14, c.R * 1.1, c.R * .8, green);
      tailV.position.set(0, c.R * 2.6, -c.R * 2.1); c.add(tailV);
      const tailH = B(c.R * 1.5, c.R * .12, c.R * .5, green);
      tailH.position.set(0, c.R * 2.0, -c.R * 2.2); c.add(tailH);
      /* hélice girando */
      const hub = C(c.R * .16, c.R * .16, c.R * .25, metal, 10);
      hub.rotation.x = Math.PI / 2; hub.position.set(0, c.R * 2.0, c.R * 2.9); c.add(hub);
      const prop = new THREE.Group();
      [0, 1].forEach(i => {
        const bl = B(c.R * .1, c.R * 2.0, c.R * .06, metal);
        bl.rotation.z = i * Math.PI / 2; prop.add(bl);
      });
      prop.position.set(0, c.R * 2.0, c.R * 3.0); c.add(prop);
      c.anim.push((o, t, dt) => { prop.rotation.z += dt * 22; });
    },

    /* 🤪 GOOFY — pernas compridas e chapéu torto */
    goofy(c) {
      const fur = M(c.def.color, { rough: .8 });
      const dark = M(MA.shade(c.def.color, -40), { rough: .85 });
      /* focinho comprido */
      const snout = new THREE.Mesh(new THREE.CapsuleGeometry(c.HR * .26, c.HR * .7, 6, 12), M(0xf2d7b0, { rough: .8 }));
      snout.rotation.x = Math.PI / 2.1;
      snout.position.set(0, c.headY - c.HR * .22, c.HR * .85); c.add(snout);
      const nose = S(c.HR * .17, M(0x1d1410, { rough: .35 }), 12);
      nose.position.set(0, c.headY - c.HR * .02, c.HR * 1.3); c.add(nose);
      /* dois dentes */
      [-1, 1].forEach(sg => {
        const t2 = B(c.HR * .14, c.HR * .18, c.HR * .07, M(0xffffff, { rough: .3 }));
        t2.position.set(sg * c.HR * .1, c.headY - c.HR * .5, c.HR * 1.08); c.add(t2);
      });
      /* orelhas caídas */
      [-1, 1].forEach(sg => {
        const ear = new THREE.Mesh(new THREE.CapsuleGeometry(c.HR * .2, c.HR * .6, 6, 10), dark);
        ear.position.set(sg * c.HR * .85, c.headY + c.HR * .05, 0);
        ear.rotation.z = sg * .25; c.add(ear);
        c.anim.push((o, t) => { ear.rotation.x = Math.sin(t * 5 + sg) * .3; });
      });
      /* chapéu amassado */
      const hat = C(c.HR * .55, c.HR * .6, c.HR * .5, M(0x2f8f5f, { rough: .8 }), 12);
      hat.position.y = c.headY + c.HR * 1.05; hat.rotation.z = .12; c.add(hat);
      const brim = C(c.HR * .85, c.HR * .85, c.HR * .08, M(0x2f8f5f, { rough: .8 }), 14);
      brim.position.y = c.headY + c.HR * .8; brim.rotation.z = .12; c.add(brim);
      /* colete e luvas brancas */
      const vest = C(c.R * .88, c.R * .92, c.R * .8, M(0xe8622a, { rough: .75 }));
      vest.position.y = c.R * 1.5; c.add(vest);
      [-1, 1].forEach(sg => {
        const glove = S(c.R * .26, M(0xffffff, { rough: .5 }), 12);
        glove.position.set(sg * c.R * 1.05, c.R * .95, 0); c.add(glove);
      });
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

    dogeboss(c) { BUILDS.doge(c); },

    tralaboss(c) { BUILDS.tralala(c); },

    tungboss(c) { BUILDS.tung(c); },

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
