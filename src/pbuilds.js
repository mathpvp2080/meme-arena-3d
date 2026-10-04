/* =====================================================================
   MEME ARENA 3D — peças 3D exclusivas de cada SKIN do jogador

   createPlayer() monta o boneco base e depois chama
   MA.PBUILDS[skin.id](ctx) para pendurar o que caracteriza o meme:
   as orelhas do Doge, o nariz do palhaço, o terno do Sigma...

   ctx = { g, body, head, neck, hood, armL, armR, legL, legR, gun,
           skin, trans, add(mesh), anim(fn), mat(cor, opts) }
   A FRENTE do boneco é -Z.
   ===================================================================== */
(function (MA) {
  'use strict';
  const TAU = Math.PI * 2;

  function M(color, o) {
    o = o || {};
    const metal = o.metal !== undefined ? o.metal : .07;
    const opacity = o.opacity !== undefined ? o.opacity : 1;
    return new THREE.MeshPhysicalMaterial({
      color: color,
      roughness: o.rough !== undefined ? o.rough : .34,
      metalness: metal,
      clearcoat: o.clear !== undefined ? o.clear : (metal > .5 ? .44 : .22),
      clearcoatRoughness: o.clearRough !== undefined ? o.clearRough : .22,
      emissive: o.emissive !== undefined ? o.emissive : 0x000000,
      emissiveIntensity: o.ei !== undefined ? o.ei : .6,
      transparent: opacity < 1, opacity,
      depthWrite: opacity >= .98,
      side: o.side || THREE.FrontSide
    });
  }
  /* Caixa com cantos suavemente chanfrados. É usada por todas as skins para
     bolsos, óculos e detalhes sem voltar ao visual rígido de blocos puros. */
  function roundedBox(w, h, d) {
    const r = Math.max(.003, Math.min(w, h) * .10);
    const sh = new THREE.Shape();
    const x = -w / 2, y = -h / 2;
    sh.moveTo(x + r, y);
    sh.lineTo(x + w - r, y); sh.quadraticCurveTo(x + w, y, x + w, y + r);
    sh.lineTo(x + w, y + h - r); sh.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    sh.lineTo(x + r, y + h); sh.quadraticCurveTo(x, y + h, x, y + h - r);
    sh.lineTo(x, y + r); sh.quadraticCurveTo(x, y, x + r, y);
    const bevel = Math.min(r * .42, d * .18);
    const geo = new THREE.ExtrudeGeometry(sh, {
      depth: Math.max(.002, d - bevel * 2), steps: 1,
      bevelEnabled: true, bevelSegments: 2,
      bevelSize: bevel, bevelThickness: bevel, curveSegments: 4
    });
    geo.translate(0, 0, -d / 2 + bevel);
    geo.computeVertexNormals();
    return geo;
  }
  const B = (w, h, d, m) => new THREE.Mesh(roundedBox(w, h, d), m);
  const C = (rt, rb, h, m, s) => new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, s || 14), m);
  const S = (r, m, s) => new THREE.Mesh(new THREE.SphereGeometry(r, s || 16, s || 12), m);
  const Cone = (r, h, m, s) => new THREE.Mesh(new THREE.ConeGeometry(r, h, s || 10), m);
  const Cap = (r, l, m) => new THREE.Mesh(new THREE.CapsuleGeometry(r, l, 6, 12), m);
  const Tor = (r, t, m, seg) => new THREE.Mesh(new THREE.TorusGeometry(r, t, 8, seg || 22), m);

  /* alturas de referência do boneco base */
  const HEAD_Y = 2.13, BODY_Y = 1.19;

  const PBUILDS = {

    /* 😎 CHILL GUY — visual inicial limpo, sem peças que deformem a base. */
    chill(c) {
      const blue = M(0x287fd6, { rough: .34, clear: .22 });
      [c.legL, c.legR].forEach(l => { l.material = blue; });
      /* punhos e barra discretos; o torso continua liso e legível */
      [-1, 1].forEach(s => {
        const cuff = C(.23, .23, .10, M(0x4b5cc0, { rough: .32 }), 18);
        cuff.position.set(0, -.34, 0); (s < 0 ? c.armL : c.armR).add(cuff);
      });
      const hem = C(.50, .50, .08, M(0x4b5cc0, { rough: .34 }), 24);
      hem.position.y = .69; c.add(hem);
    },

    /* 💻 HACKER — capuz fechado, rosto na sombra e brilho verde */
    hacker(c) {
      const cloth = M(0x15181d, { rough: .95 });
      /* capuz grande por cima da cabeça */
      const cowl = new THREE.Mesh(
        new THREE.SphereGeometry(.66, 28, 18, 0, TAU, 0, Math.PI * .60), cloth);
      cowl.position.set(0, 2.13, .06);
      cowl.rotation.x = -.18;
      c.add(cowl);
      /* aba frontal do capuz */
      const brim = new THREE.Mesh(
        new THREE.TorusGeometry(.55, .115, 10, 28, Math.PI * 1.15), cloth);
      brim.position.set(0, 2.17, -.25);
      brim.rotation.set(Math.PI / 2 - .35, 0, Math.PI * .92);
      c.add(brim);
      /* sombra dentro do capuz + óculos verdes brilhando */
      [-1, 1].forEach(s => {
        const eye = B(.17, .07, .04, new THREE.MeshBasicMaterial({ color: 0x39ff88 }));
        eye.position.set(s * .18, 2.15, -.49); c.add(eye);
      });
      /* zíper e detalhes neon no peito */
      const zip = B(.05, .84, .04, M(0x39ff88, { emissive: 0x0d7a3c, ei: 1 }));
      zip.position.set(0, 1.20, -.575); c.add(zip);
      /* laptop embaixo do braço */
      const lap = new THREE.Group();
      const base = B(.5, .04, .36, M(0x2a2f36, { rough: .4, metal: .7 }));
      const lid = B(.5, .36, .04, M(0x2a2f36, { rough: .4, metal: .7 }));
      lid.position.set(0, .18, -.17);
      const scr = B(.44, .3, .01, new THREE.MeshBasicMaterial({ color: 0x39ff88 }));
      scr.position.set(0, .18, -.14);
      lap.add(base, lid, scr);
      lap.position.set(-.95, 1.15, 0);
      lap.rotation.z = .35; lap.rotation.y = .5;
      c.add(lap);
      /* pulseiras de circuito ligam o hacker ao equipamento */
      [c.armL, c.armR].forEach((arm, i) => {
        const cuff = Tor(.205, .035, M(0x39ff88, { emissive: 0x0d7a3c, ei: 1.3, metal: .55 }), 18);
        cuff.rotation.x = Math.PI / 2; cuff.position.y = -.34; arm.add(cuff);
        const node = S(.055, new THREE.MeshBasicMaterial({ color: 0x39ff88 }), 8);
        node.position.set(i ? .17 : -.17, -.34, -.08); arm.add(node);
      });
      c.anim(t => {
        const pulse = 1 + Math.sin(t * 5) * .035;
        scr.scale.setScalar(pulse);
        lap.rotation.x = Math.sin(t * 2.2) * .035;
      });
    },

    /* 🐕 DOGE — orelhas, focinho e rabo de shiba */
    doge(c) {
      /* esta skin é pelo, não moletom: remove o capuz genérico */
      c.hood.visible = false;
      const fur = M(c.skin.skinTone, { rough: .82 });
      const cream = M(0xf6e3bb, { rough: .88 });
      const snout = Cap(.17, .14, cream);
      snout.rotation.x = Math.PI / 2;
      snout.position.set(0, 2.07, -.60); c.add(snout);
      const nose = S(.084, M(0x241a14, { rough: .26, clear: .34 }), 14);
      nose.position.set(0, 2.11, -.76); c.add(nose);
      [-1, 1].forEach(s => {
        const ear = Cone(.20, .48, fur, 7);
        ear.position.set(s * .41, 2.66, .04);
        ear.rotation.set(.1, Math.PI / 4, s * .28); c.add(ear);
        const inner = Cone(.11, .31, M(0xd68a72, { rough: .62 }), 7);
        inner.position.set(s * .41, 2.65, -.06);
        inner.rotation.set(.1, Math.PI / 4, s * .28); c.add(inner);
      });
      const chest = S(.38, cream);
      chest.scale.set(.9, 1.1, .5);
      chest.position.set(0, 1.2, -.42); c.add(chest);
      const tail = new THREE.Mesh(new THREE.TorusGeometry(.26, .1, 8, 14, Math.PI * 1.5), fur);
      tail.position.set(0, 1.5, .62); tail.rotation.set(.4, 0, .2); c.add(tail);
      /* patas dianteiras e pequenas garras */
      [-1, 1].forEach(s => {
        const paw = S(.23, cream, 12);
        paw.scale.set(1.05, .55, 1.35); paw.position.set(s * .27, .10, -.14); c.add(paw);
        [-1, 0, 1].forEach(i => {
          const claw = Cone(.025, .10, M(0x3a2a21, { rough: .65 }), 6);
          claw.position.set(s * .27 + i * .055, .10, -.38); claw.rotation.x = -Math.PI / 2; c.add(claw);
        });
      });
      c.anim(t => { tail.rotation.z = .2 + Math.sin(t * 9) * .5; });
    },

    /* 🤡 CLOWN — nariz, cabelo, babado e sapatões */
    clown(c) {
      const nose = S(.155, M(0xff2d4d, { rough: .20, clear: .44 }), 18);
      nose.position.set(0, 2.12, -.65); c.add(nose);
      /* cabelo em tufos */
      [-1, 1].forEach(s => {
        [0, 1, 2].forEach(i => {
          const tuft = S(.19 - i * .03, M([0xff3dc8, 0x49c8ff, 0xffe14d][i], { rough: .85 }), 10);
          tuft.position.set(s * (.46 + i * .08), 2.34 - i * .2, .08 + i * .05);
          c.add(tuft);
        });
      });
      /* babado no pescoço */
      const ruff = new THREE.Mesh(new THREE.TorusGeometry(.42, .14, 8, 20), M(0xffffff, { rough: .8 }));
      ruff.rotation.x = Math.PI / 2; ruff.position.y = 1.78; c.add(ruff);
      /* botões */
      [0, 1, 2].forEach(i => {
        const bt = S(.09, M(0xffe14d, { rough: .4 }), 10);
        bt.position.set(0, 1.5 - i * .3, -.52); c.add(bt);
      });
      /* mangas bufantes com punhos dourados */
      [-1, 1].forEach(s => {
        const cuff = Tor(.205, .055, M(0xffe14d, { rough: .3, metal: .7 }), 18);
        cuff.position.set(s * .74, .91, 0); cuff.rotation.x = Math.PI / 2; c.add(cuff);
      });
      /* sapatões vermelhos */
      [-1, 1].forEach(s => {
        const shoe = S(.3, M(0xff2d4d, { rough: .42 }), 14);
        shoe.scale.set(1, .55, 1.9);
        shoe.position.set(s * .28, .12, -.2); c.add(shoe);
      });
      /* duas abas de casaco atrás deixam a silhueta menos genérica */
      [-1, 1].forEach(s => {
        const tail = B(.34, .72, .10, M(s < 0 ? 0x49c8ff : 0xff3dc8, { rough: .78 }));
        tail.position.set(s * .22, .87, .43); tail.rotation.z = s * .15; c.add(tail);
      });
    },

    /* 🔥 RIZZLER — cabelo com franja, óculos e corrente de ouro */
    rizzler(c) {
      const hair = M(0x241c17, { rough: .8 });
      const cap = new THREE.Mesh(
        new THREE.SphereGeometry(.63, 28, 18, 0, TAU, 0, Math.PI * .50), hair);
      cap.position.y = 2.13; cap.scale.z = .92; c.add(cap);
      const fringe = B(.98, .21, .23, hair);
      fringe.position.set(0, 2.45, -.53); fringe.rotation.x = .25; c.add(fringe);
      /* óculos escuros arredondados e destacados da face */
      const bar = B(.98, .055, .05, M(0x14161a, { rough: .18, metal: .5 }));
      bar.position.set(0, 2.18, -.50); c.add(bar);
      [-1, 1].forEach(s => {
        const lens = B(.38, .22, .055, M(0x14161a, { rough: .10, metal: .62, clear: .58 }));
        lens.position.set(s * .24, 2.15, -.52); c.add(lens);
      });
      /* corrente de ouro */
      const chain = new THREE.Mesh(new THREE.TorusGeometry(.34, .045, 8, 22), M(0xffd24d, { rough: .2, metal: .95 }));
      chain.rotation.x = Math.PI / 2.3; chain.position.set(0, 1.62, -.26); c.add(chain);
      const pend = S(.1, M(0xffd24d, { rough: .2, metal: .95 }), 10);
      pend.position.set(0, 1.42, -.5); c.add(pend);
      /* jaqueta aberta com lapelas roxas e ombros marcados */
      [-1, 1].forEach(s => {
        const lapel = B(.18, .72, .09, M(0x34206f, { rough: .55, metal: .18 }));
        lapel.position.set(s * .23, 1.34, -.54); lapel.rotation.z = s * .24; c.add(lapel);
        const shoulder = S(.28, M(0x6f55e8, { rough: .5 }), 14);
        shoulder.scale.set(1.25, .7, 1); shoulder.position.set(s * .75, 1.61, 0); c.add(shoulder);
      });
    },

    /* 🗿 SIGMA — terno, gravata e cara fechada */
    sigma(c) {
      c.hood.visible = false;
      const suit = M(0x1b1f27, { rough: .52, metal: .22 });
      /* cabelo penteado para trás com laterais baixas */
      const hair = new THREE.Mesh(
        new THREE.SphereGeometry(.63, 28, 18, 0, TAU, 0, Math.PI * .46),
        M(0x252a31, { rough: .48, metal: .08 }));
      hair.position.set(0, 2.15, .02); hair.scale.z = .92; hair.rotation.x = -.10; c.add(hair);
      [-1, 1].forEach(s => {
        const side = B(.19, .36, .20, M(0x1b1e23, { rough: .52 }));
        side.position.set(s * .55, 2.28, .03); side.rotation.z = s * .18; c.add(side);
      });
      const jacket = C(.63, .66, 1.12, suit, 18);
      jacket.position.y = 1.18; c.add(jacket);
      const shirt = B(.34, .8, .14, M(0xf2f4f7, { rough: .6 }));
      shirt.position.set(0, 1.42, -.52); c.add(shirt);
      const tie = B(.13, .62, .07, M(0x2b2f45, { rough: .5 }));
      tie.position.set(0, 1.34, -.58); c.add(tie);
      [-1, 1].forEach(s => {
        const lapel = B(.22, .62, .1, M(0x12151b, { rough: .6 }));
        lapel.position.set(s * .23, 1.5, -.55);
        lapel.rotation.z = s * .2; c.add(lapel);
      });
      /* óculos escuros finos */
      const bar = B(.94, .045, .045, M(0x0d0f12, { rough: .12, metal: .62, clear: .55 }));
      bar.position.set(0, 2.17, -.50); c.add(bar);
    },

    /* 👻 GHOST — lençol ondulado em vez de pernas */
    ghost(c) {
      c.legL.visible = c.legR.visible = false;
      c.armL.visible = c.armR.visible = false;
      c.body.visible = c.hood.visible = c.neck.visible = false;
      const sheet = M(0xdfe6f2, { rough: .9, opacity: .72 });
      const cloak = C(.52, 1.05, 1.5, sheet, 22);
      cloak.position.y = .95; c.add(cloak);
      /* barra do lençol: bolhas arredondadas que ondulam (nada de espinhos) */
      const pontas = [];
      for (let i = 0; i < 11; i++) {
        const a = i / 11 * TAU;
        const tip = S(.22, sheet, 12);
        tip.scale.set(1, .85, 1);
        tip.position.set(Math.cos(a) * .98, .22, Math.sin(a) * .98);
        c.add(tip); pontas.push({ m: tip, a });
      }
      c.anim(t => {
        pontas.forEach((p, i) => { p.m.position.y = .18 + Math.sin(t * 4 + i) * .09; });
      });
      /* mãos de névoa flutuam separadas do lençol */
      const wisps = [];
      [-1, 1].forEach(s => {
        const hand = S(.19, M(0xdfe6f2, { rough: .75, opacity: .58 }), 12);
        hand.position.set(s * .86, 1.18, -.10); c.add(hand); wisps.push({ hand, s });
      });
      /* flutua */
      c.anim(t => {
        c.head.position.y = HEAD_Y + Math.sin(t * 2.4) * .07;
        wisps.forEach((w, i) => {
          w.hand.position.y = 1.18 + Math.sin(t * 2.8 + i * Math.PI) * .12;
          w.hand.position.x = w.s * (.86 + Math.sin(t * 1.7) * .05);
        });
      });
    },

    /* 😈 DEMON — chifres maiores, cauda e brasas */
    demon(c) {
      const skinM = M(c.skin.skinTone, { rough: .6, emissive: 0x3a0a0a, ei: .5 });
      /* cauda com ponta de seta */
      const tail = new THREE.Group();
      const seg = Cap(.08, .9, skinM);
      seg.rotation.x = .6; seg.position.set(0, -.1, .4); tail.add(seg);
      const bar = Cone(.17, .32, skinM, 6);
      bar.position.set(0, -.52, .78); bar.rotation.x = -2.1; tail.add(bar);
      tail.position.set(0, 1.3, .4); c.add(tail);
      c.anim(t => { tail.rotation.y = Math.sin(t * 3.2) * .5; });
      /* ombreiras com espinhos e garras nos pés */
      [-1, 1].forEach(s => {
        const shoulder = S(.30, M(0x4b0a18, { rough: .45, metal: .35 }), 14);
        shoulder.scale.set(1.2, .72, 1); shoulder.position.set(s * .77, 1.63, .02); c.add(shoulder);
        const spike = Cone(.11, .40, M(0x211017, { rough: .5, metal: .45 }), 7);
        spike.position.set(s * .91, 1.91, .02); spike.rotation.z = -s * .55; c.add(spike);
        const hoof = C(.2, .26, .2, M(0x2a1016, { rough: .7 }), 10);
        hoof.position.set(s * .27, .1, 0); c.add(hoof);
      });
      const rune = Tor(.20, .035, M(0xff6a2d, { emissive: 0x8a2100, ei: 1.4, metal: .35 }), 20);
      rune.position.set(0, 1.40, -.58); c.add(rune);
      /* brasas flutuando */
      const fogo = [];
      for (let i = 0; i < 5; i++) {
        const sp = S(.06, new THREE.MeshBasicMaterial({ color: 0xff6a2d, transparent: true, opacity: .8 }), 8);
        c.add(sp); fogo.push(sp);
      }
      c.anim(t => {
        fogo.forEach((s, i) => {
          const a = t * 1.6 + i * 1.3;
          s.position.set(Math.cos(a) * .85, 1 + ((t * .7 + i * .4) % 1.6), Math.sin(a) * .85);
          s.material.opacity = .8 - ((t * .7 + i * .4) % 1.6) / 2.2;
        });
      });
    },

    /* 💪 GIGACHAD — ombros e peitoral enormes, queixo quadrado */
    gigachad(c) {
      const skinM = M(c.skin.skinTone, { rough: .42, metal: .12 });
      c.body.visible = c.hood.visible = false;
      /* tronco em V */
      const torso = C(.95, .6, 1.25, skinM, 20);
      torso.position.y = 1.3; torso.castShadow = true; c.add(torso);
      /* peitoral */
      [-1, 1].forEach(s => {
        const pec = S(.3, skinM, 14);
        pec.scale.set(1.05, .62, .45);
        pec.position.set(s * .32, 1.66, -.52); c.add(pec);
        const delt = S(.34, skinM, 14);
        delt.position.set(s * .92, 1.68, 0); c.add(delt);
        /* braços grossos */
        const arm = s < 0 ? c.armL : c.armR;
        arm.scale.set(1.7, 1.15, 1.7);
        arm.position.x = s * .95;
      });
      /* abdômen */
      [0, 1].forEach(r => [-1, 1].forEach(s => {
        const ab = B(.24, .2, .12, skinM);
        ab.position.set(s * .15, 1.0 - r * .26, -.48); c.add(ab);
      }));
      /* topete curto e sobrancelha 3D reforçam a cabeça */
      const hair = new THREE.Mesh(
        new THREE.SphereGeometry(.63, 28, 18, 0, TAU, 0, Math.PI * .40),
        M(0x30343a, { rough: .48 }));
      hair.position.set(0, 2.14, .02); hair.scale.z = .92; c.add(hair);
      [-1, 1].forEach(s => {
        const brow = B(.27, .058, .065, M(0x35383c, { rough: .42 }));
        brow.position.set(s * .21, 2.23, -.50); brow.rotation.z = -s * .12; c.add(brow);
      });
      /* queixo forte, mas com chanfros de brinquedo */
      const jaw = B(.68, .32, .48, skinM);
      jaw.position.set(0, 1.91, -.44); c.add(jaw);
      /* pernas mais grossas */
      c.legL.scale.set(1.3, 1, 1.3); c.legR.scale.set(1.3, 1, 1.3);
    },

    /* 👑 KING — manto com gola de pele, cetro e barba */
    king(c) {
      const gold = M(0xffd24d, { rough: .22, metal: .95 });
      /* gola de pele branca */
      const collar = new THREE.Mesh(new THREE.TorusGeometry(.56, .17, 8, 22), M(0xf7f3ea, { rough: .95 }));
      collar.rotation.x = Math.PI / 2; collar.position.y = 1.8; c.add(collar);
      /* ombreiras reais com rubis */
      [-1, 1].forEach(s => {
        const shoulder = S(.34, gold, 16);
        shoulder.scale.set(1.25, .62, 1.0); shoulder.position.set(s * .79, 1.68, .02); c.add(shoulder);
        const ruby = S(.09, M(0xff2d6f, { rough: .08, metal: .35, emissive: 0x8a002d, ei: 1.2 }), 10);
        ruby.position.set(s * .81, 1.72, -.29); c.add(ruby);
      });
      /* faixa dourada no peito */
      const sash = B(.22, 1.2, .1, gold);
      sash.position.set(.1, 1.25, -.5); sash.rotation.z = .3; c.add(sash);
      /* barba */
      const beard = new THREE.Mesh(
        new THREE.SphereGeometry(.44, 16, 12, 0, TAU, Math.PI * .45, Math.PI * .55),
        M(0xf1ece0, { rough: .95 }));
      beard.position.set(0, 2.03, -.42); beard.scale.set(1.08, 1.28, .72); c.add(beard);
      /* cetro na mão direita */
      const scepter = new THREE.Group();
      const rod = C(.05, .05, 1.5, gold, 8);
      scepter.add(rod);
      const orb = S(.16, M(0xb46cff, { rough: .2, emissive: 0x4a1f8a, ei: .8 }), 12);
      orb.position.y = .82; scepter.add(orb);
      const cross = B(.06, .22, .06, gold);
      cross.position.y = 1.02; scepter.add(cross);
      scepter.position.set(-.95, 1.5, -.1);
      scepter.rotation.z = .25;
      c.add(scepter);
      c.anim(t => { orb.rotation.y = t; scepter.rotation.x = Math.sin(t * 2) * .08; });
    },

    /* 6 — o próprio algarismo virou o corpo do personagem. */
    sixorbit(c) {
      [c.body, c.head, c.neck, c.hood, c.hips].forEach(part => { if (part) part.visible = false; });
      const deep = M(0x102b58, { rough: .24, metal: .58 });
      const blue = M(0x327fda, { rough: .13, metal: .32, emissive: 0x123d82, ei: .58 });
      const cyan = M(0x2de2ff, { rough: .07, metal: .28, emissive: 0x08798f, ei: 1.18 });
      const pearl = M(0xf1fbff, { rough: .12, metal: .18, emissive: 0x2de2ff, ei: .18 });
      const faceInk = M(0x07152e, { rough: .36 });

      /* O bojo e a haste têm duas camadas: contorno escuro e frente luminosa.
         A abertura central permanece grande para a leitura do 6 em qualquer distância. */
      const ringBack = Tor(.46, .19, deep, 40);
      ringBack.position.set(0, 1.27, .03); c.add(ringBack);
      const ring = Tor(.46, .135, blue, 40);
      ring.position.set(0, 1.27, -.085); c.add(ring);
      const stemBack = Cap(.19, .66, deep);
      stemBack.position.set(-.31, 1.88, .03); stemBack.rotation.z = -.19; c.add(stemBack);
      const stem = Cap(.14, .66, blue);
      stem.position.set(-.31, 1.88, -.09); stem.rotation.z = -.19; c.add(stem);
      const join = S(.19, blue, 20);
      join.position.set(-.18, 1.61, -.085); join.scale.set(1.08, 1.25, .92); c.add(join);

      /* Um único rosto mora na parte alta da haste, sem transformar o número
         em uma pessoa vestida de seis. */
      [-1, 1].forEach((side, i) => {
        const eye = S(.078, pearl, 16);
        eye.position.set(-.34 + i * .23, 2.04, -.235); eye.scale.set(.9, 1.08, .58); c.add(eye);
        const pupil = S(.035, faceInk, 12);
        pupil.position.set(-.34 + i * .23, 2.035, -.285); pupil.scale.set(.82, 1.03, .55); c.add(pupil);
      });
      const smile = new THREE.Mesh(new THREE.TorusGeometry(.105, .022, 7, 16, Math.PI), faceInk);
      smile.position.set(-.22, 1.91, -.275); smile.rotation.z = Math.PI; c.add(smile);

      /* Órbita fina e satélite reforçam o tema sem desenhar um segundo corpo. */
      const orbit = new THREE.Mesh(new THREE.TorusGeometry(.66, .025, 7, 44),
        new THREE.MeshBasicMaterial({ color: 0x2de2ff, transparent: true, opacity: .62, depthWrite: false }));
      orbit.position.set(0, 1.27, .08); orbit.rotation.y = .28; c.add(orbit);
      const satellite = S(.085, cyan, 14);
      satellite.position.set(.64, 1.43, -.10); c.add(satellite);
      [-1, 1].forEach(side => {
        const cuff = Tor(.215, .040, side < 0 ? cyan : blue, 20);
        cuff.position.y = -.33; cuff.rotation.x = Math.PI / 2;
        (side < 0 ? c.armL : c.armR).add(cuff);
      });
      c.anim(t => {
        orbit.rotation.z = t * .65;
        const a = t * 1.7;
        satellite.position.set(Math.cos(a) * .66, 1.27 + Math.sin(a) * .66, -.12);
        satellite.scale.setScalar(1 + Math.sin(t * 5) * .08);
      });
    },

    /* 7 — barra e diagonal são o corpo literal do personagem. */
    sevenbreak(c) {
      [c.body, c.head, c.neck, c.hood, c.hips].forEach(part => { if (part) part.visible = false; });
      const ink = M(0x211344, { rough: .23, metal: .58 });
      const violet = M(0x8b57f2, { rough: .10, metal: .35, emissive: 0x44208f, ei: .72 });
      const pink = M(0xff4fbd, { rough: .07, metal: .29, emissive: 0x931a60, ei: 1.04 });
      const pearl = M(0xfaf4ff, { rough: .12, metal: .18, emissive: 0xff4fbd, ei: .14 });
      const faceInk = M(0x170b31, { rough: .38 });

      const topBack = Cap(.20, .94, ink);
      topBack.position.set(0, 2.08, .025); topBack.rotation.z = Math.PI / 2; c.add(topBack);
      const top = Cap(.145, .94, pink);
      top.position.set(0, 2.08, -.095); top.rotation.z = Math.PI / 2; c.add(top);
      const slashBack = Cap(.20, 1.06, ink);
      slashBack.position.set(.10, 1.36, .025); slashBack.rotation.z = -.36; c.add(slashBack);
      const slash = Cap(.145, 1.06, violet);
      slash.position.set(.10, 1.36, -.095); slash.rotation.z = -.36; c.add(slash);
      const joint = S(.19, pink, 18);
      joint.position.set(.34, 1.93, -.09); joint.scale.set(1.15, 1, .92); c.add(joint);

      /* O rosto fica na barra superior, como num brinquedo vivo em forma de 7. */
      [-.22, .08].forEach(x => {
        const eye = S(.08, pearl, 16);
        eye.position.set(x, 2.10, -.245); eye.scale.set(.92, 1.06, .58); c.add(eye);
        const pupil = S(.035, faceInk, 12);
        pupil.position.set(x, 2.095, -.295); pupil.scale.set(.82, 1, .52); c.add(pupil);
      });
      const mouth = Cap(.021, .12, faceInk);
      mouth.position.set(-.07, 1.98, -.275); mouth.rotation.z = Math.PI / 2; c.add(mouth);

      /* Sete prismas orbitais, pequenos o bastante para não esconder a silhueta. */
      const sparks = [];
      for (let i = 0; i < 7; i++) {
        const spark = new THREE.Mesh(new THREE.OctahedronGeometry(.055 + (i % 2) * .012, 0), i % 2 ? pearl : pink);
        c.add(spark); sparks.push(spark);
      }
      [-1, 1].forEach(side => {
        const cuff = Tor(.215, .04, side < 0 ? violet : pink, 20);
        cuff.position.y = -.33; cuff.rotation.x = Math.PI / 2;
        (side < 0 ? c.armL : c.armR).add(cuff);
      });
      c.anim(t => {
        sparks.forEach((spark, i) => {
          const a = i / 7 * TAU + t * .58;
          spark.position.set(Math.cos(a) * .67, 1.48 + Math.sin(a) * .82, .12 + Math.sin(a) * .08);
          spark.rotation.x = spark.rotation.y = t * 1.8 + i;
        });
      });
    },

    /* 67 — dois algarismos literais fundidos por um núcleo compartilhado. */
    duo67(c) {
      [c.body, c.head, c.neck, c.hood, c.hips].forEach(part => { if (part) part.visible = false; });
      const ink = M(0x111633, { rough: .18, metal: .78 });
      const blue = M(0x6572ff, { rough: .07, metal: .48, emissive: 0x2933aa, ei: .94 });
      const pink = M(0xff4fbd, { rough: .06, metal: .42, emissive: 0x991860, ei: .98 });
      const cyan = M(0x2de2ff, { rough: .05, metal: .34, emissive: 0x087f96, ei: 1.25 });
      const pearl = M(0xf8f9ff, { rough: .10, metal: .55, emissive: 0x6572ff, ei: .22 });
      const faceInk = M(0x0a0d24, { rough: .34 });

      /* 6 compacto à esquerda. */
      const sixBack = Tor(.30, .135, ink, 34);
      sixBack.position.set(-.30, 1.28, .035); c.add(sixBack);
      const sixRing = Tor(.30, .095, blue, 34);
      sixRing.position.set(-.30, 1.28, -.075); c.add(sixRing);
      const sixStemBack = Cap(.135, .48, ink);
      sixStemBack.position.set(-.48, 1.73, .035); sixStemBack.rotation.z = -.18; c.add(sixStemBack);
      const sixStem = Cap(.095, .48, cyan);
      sixStem.position.set(-.48, 1.73, -.075); sixStem.rotation.z = -.18; c.add(sixStem);

      /* 7 compacto à direita. */
      const sevenTopBack = Cap(.125, .50, ink);
      sevenTopBack.position.set(.34, 1.98, .035); sevenTopBack.rotation.z = Math.PI / 2; c.add(sevenTopBack);
      const sevenTop = Cap(.088, .50, pearl);
      sevenTop.position.set(.34, 1.98, -.078); sevenTop.rotation.z = Math.PI / 2; c.add(sevenTop);
      const sevenLegBack = Cap(.13, .76, ink);
      sevenLegBack.position.set(.34, 1.42, .035); sevenLegBack.rotation.z = -.34; c.add(sevenLegBack);
      const sevenLeg = Cap(.09, .76, pink);
      sevenLeg.position.set(.34, 1.42, -.078); sevenLeg.rotation.z = -.34; c.add(sevenLeg);

      /* Um olho por algarismo faz os dois números parecerem parceiros fundidos. */
      [[-.46, 1.84, cyan], [.24, 1.99, pink]].forEach(spec => {
        const eye = S(.073, pearl, 16);
        eye.position.set(spec[0], spec[1], -.205); eye.scale.set(.92, 1.05, .58); c.add(eye);
        const pupil = S(.033, faceInk, 12);
        pupil.position.set(spec[0], spec[1] - .004, -.252); pupil.scale.set(.82, 1, .52); c.add(pupil);
      });

      /* Núcleo e órbita unem os números sem alterar a leitura “67”. */
      const core = new THREE.Mesh(new THREE.OctahedronGeometry(.12, 1), cyan);
      core.position.set(.02, 1.27, -.19); c.add(core);
      const coreHalo = Tor(.19, .025, pearl, 26);
      coreHalo.position.set(.02, 1.27, -.12); c.add(coreHalo);
      const orbit = new THREE.Mesh(new THREE.TorusGeometry(.73, .022, 7, 52),
        new THREE.MeshBasicMaterial({ color: 0x9b65ff, transparent: true, opacity: .55, depthWrite: false }));
      orbit.position.set(0, 1.48, .14); orbit.scale.y = .82; orbit.rotation.y = .22; c.add(orbit);
      [-1, 1].forEach(side => {
        const cuff = Tor(.22, .045, side < 0 ? blue : pink, 22);
        cuff.position.y = -.33; cuff.rotation.x = Math.PI / 2;
        (side < 0 ? c.armL : c.armR).add(cuff);
      });
      c.anim(t => {
        core.rotation.x = t * .9; core.rotation.y = t * 1.7;
        coreHalo.rotation.z = -t * 1.35;
        orbit.rotation.z = Math.sin(t * .7) * .16;
        const pulse = 1 + Math.sin(t * 4.2) * .08;
        core.scale.setScalar(pulse);
      });
    },

    /* 67 — corredor party-game inteiramente original, fofo e arredondado. */
    sixtyseven(c) {
      c.hood.visible = false;
      const navy = M(0x151a43, { rough: .24, metal: .18 });
      const blue = M(0x6572ff, { rough: .16, metal: .14, emissive: 0x252d8f, ei: .34 });
      const pink = M(0xff4fbd, { rough: .15, metal: .12, emissive: 0x8a174f, ei: .32 });
      const cyan = M(0x2de2ff, { rough: .12, metal: .20, emissive: 0x08768e, ei: .72 });
      const pearl = M(0xf5f7ff, { rough: .19, metal: .20 });

      /* Touca espacial aberta: enquadra o rosto em vez de escondê-lo. */
      const helmet = new THREE.Mesh(
        new THREE.SphereGeometry(.66, 32, 20, 0, TAU, 0, Math.PI * .37), blue);
      helmet.position.set(0, 2.13, .025); helmet.scale.z = .92; c.add(helmet);
      const faceRim = Tor(.555, .047, cyan, 36);
      faceRim.position.set(0, 2.12, -.505); faceRim.scale.set(1.03, .96, 1); c.add(faceRim);
      [-1, 1].forEach(s => {
        const pod = S(.15, s < 0 ? pink : cyan, 20);
        pod.position.set(s * .685, 2.16, -.015); pod.scale.set(.72, 1, .72); c.add(pod);
        const dot = S(.054, pearl, 14);
        dot.position.set(s * .706, 2.16, -.14); c.add(dot);
      });

      /* Macacão esportivo com alças-cápsula, placa peitoral e identidade 67. */
      [-1, 1].forEach(s => {
        const strap = Cap(.06, .55, s < 0 ? cyan : pink);
        strap.position.set(s * .23, 1.42, -.535); strap.rotation.z = s * .15; c.add(strap);
        const cuff = Tor(.215, .047, s < 0 ? cyan : pink, 22);
        cuff.rotation.x = Math.PI / 2; cuff.position.y = -.34;
        (s < 0 ? c.armL : c.armR).add(cuff);
      });
      const chest = S(.23, navy, 22);
      chest.position.set(0, 1.38, -.56); chest.scale.set(1.12, .74, .16); c.add(chest);
      const six = Tor(.105, .030, cyan, 22);
      six.position.set(-.115, 1.34, -.605); c.add(six);
      const sixStem = Cap(.027, .11, cyan);
      sixStem.position.set(-.17, 1.41, -.605); sixStem.rotation.z = -.30; c.add(sixStem);
      const sevenTop = Cap(.027, .14, pink);
      sevenTop.position.set(.115, 1.41, -.605); sevenTop.rotation.z = Math.PI / 2; c.add(sevenTop);
      const sevenLeg = Cap(.027, .13, pink);
      sevenLeg.position.set(.135, 1.31, -.605); sevenLeg.rotation.z = -.34; c.add(sevenLeg);

      const belt = Tor(.50, .055, pearl, 28);
      belt.position.set(0, .80, 0); belt.rotation.x = Math.PI / 2; belt.scale.z = .90; c.add(belt);
      const buckle = S(.12, pink, 16);
      buckle.position.set(0, .80, -.49); buckle.scale.set(1.18, .82, .42); c.add(buckle);
      const buckleDot = S(.045, cyan, 10);
      buckleDot.position.set(0, .80, -.545); c.add(buckleDot);

      /* Tênis acolchoados bicolores, acompanhando a base arredondada. */
      [-1, 1].forEach(s => {
        const shoe = S(.30, s < 0 ? cyan : pink, 18);
        shoe.scale.set(.90, .52, 1.30); shoe.position.set(s * .29, .09, -.17); c.add(shoe);
        const lace = Tor(.105, .026, pearl, 18);
        lace.position.set(s * .29, .16, -.42); lace.scale.set(1, .52, 1); c.add(lace);
      });

      /* Mini propulsores arredondados dão energia sem uma armadura pesada. */
      const boosters = [];
      [-1, 1].forEach(s => {
        const booster = Cap(.115, .46, s < 0 ? pink : blue);
        booster.position.set(s * .34, 1.34, .50); booster.rotation.z = s * .11; c.add(booster);
        const glow = S(.085, cyan, 12);
        glow.position.set(s * .39, 1.03, .52); c.add(glow);
        boosters.push({ booster, glow, phase: s });
      });
      c.anim(t => {
        buckle.rotation.z = Math.sin(t * 2.4) * .08;
        boosters.forEach((b, i) => {
          const pulse = 1 + Math.sin(t * 5.2 + i * Math.PI) * .10;
          b.glow.scale.setScalar(pulse);
          b.booster.rotation.x = Math.sin(t * 2.8 + b.phase) * .05;
        });
      });
    }
  };

  MA.PBUILDS = PBUILDS;
})(window.MA);
