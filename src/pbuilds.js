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
    return new THREE.MeshStandardMaterial({
      color: color,
      roughness: o.rough !== undefined ? o.rough : .65,
      metalness: o.metal !== undefined ? o.metal : .15,
      emissive: o.emissive !== undefined ? o.emissive : 0x000000,
      emissiveIntensity: o.ei !== undefined ? o.ei : .6,
      transparent: !!o.opacity, opacity: o.opacity !== undefined ? o.opacity : 1,
      side: o.side || THREE.FrontSide
    });
  }
  const B = (w, h, d, m) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  const C = (rt, rb, h, m, s) => new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, s || 14), m);
  const S = (r, m, s) => new THREE.Mesh(new THREE.SphereGeometry(r, s || 16, s || 12), m);
  const Cone = (r, h, m, s) => new THREE.Mesh(new THREE.ConeGeometry(r, h, s || 10), m);
  const Cap = (r, l, m) => new THREE.Mesh(new THREE.CapsuleGeometry(r, l, 6, 12), m);

  /* alturas de referência do boneco base */
  const HEAD_Y = 2.18, BODY_Y = 1.16;

  const PBUILDS = {

    /* 😎 CHILL GUY — moletom com bolso, calça bege e chinelos */
    chill(c) {
      const hood = M(c.skin.hood, { rough: .85 });
      /* bolso canguru na frente */
      const pocket = B(.72, .34, .18, hood);
      pocket.position.set(0, 1.0, -.46); c.add(pocket);
      /* cordões do capuz */
      [-1, 1].forEach(s => {
        const str = C(.035, .035, .42, M(0xf3f3f3, { rough: .8 }), 6);
        str.position.set(s * .17, 1.62, -.42); c.add(str);
        const tip = S(.055, M(0xf3f3f3, { rough: .8 }), 8);
        tip.position.set(s * .17, 1.41, -.42); c.add(tip);
      });
      /* calça bege */
      [c.legL, c.legR].forEach(l => { l.material = M(0xc9a87c, { rough: .9 }); });
      /* chinelos */
      [-1, 1].forEach(s => {
        const foot = B(.34, .08, .5, M(0x6b4f2a, { rough: .9 }));
        foot.position.set(s * .27, .06, -.06); c.add(foot);
      });
      /* mão no bolso: braço esquerdo encostado */
      c.armL.rotation.x = .35; c.armL.position.z = -.12;
    },

    /* 💻 HACKER — capuz fechado, rosto na sombra e brilho verde */
    hacker(c) {
      const cloth = M(0x15181d, { rough: .95 });
      /* capuz grande por cima da cabeça */
      const cowl = new THREE.Mesh(
        new THREE.SphereGeometry(.66, 20, 14, 0, TAU, 0, Math.PI * .62), cloth);
      cowl.position.set(0, 2.22, .06);
      cowl.rotation.x = -.18;
      c.add(cowl);
      /* aba frontal do capuz */
      const brim = new THREE.Mesh(
        new THREE.TorusGeometry(.5, .11, 8, 20, Math.PI * 1.15), cloth);
      brim.position.set(0, 2.2, -.22);
      brim.rotation.set(Math.PI / 2 - .35, 0, Math.PI * .92);
      c.add(brim);
      /* sombra dentro do capuz + óculos verdes brilhando */
      [-1, 1].forEach(s => {
        const eye = B(.17, .07, .04, new THREE.MeshBasicMaterial({ color: 0x39ff88 }));
        eye.position.set(s * .17, 2.2, -.56); c.add(eye);
      });
      /* zíper e detalhes neon no peito */
      const zip = B(.05, .9, .04, M(0x39ff88, { emissive: 0x0d7a3c, ei: 1 }));
      zip.position.set(0, 1.2, -.54); c.add(zip);
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
    },

    /* 🐕 DOGE — orelhas, focinho e rabo de shiba */
    doge(c) {
      const fur = M(c.skin.skinTone, { rough: .9 });
      const cream = M(0xf6e3bb, { rough: .9 });
      const snout = Cap(.17, .14, cream);
      snout.rotation.x = Math.PI / 2;
      snout.position.set(0, 2.1, -.52); c.add(snout);
      const nose = S(.08, M(0x241a14, { rough: .35 }), 10);
      nose.position.set(0, 2.14, -.66); c.add(nose);
      [-1, 1].forEach(s => {
        const ear = Cone(.19, .46, fur, 4);
        ear.position.set(s * .36, 2.62, .04);
        ear.rotation.set(.1, Math.PI / 4, s * .28); c.add(ear);
      });
      const chest = S(.38, cream);
      chest.scale.set(.9, 1.1, .5);
      chest.position.set(0, 1.2, -.42); c.add(chest);
      const tail = new THREE.Mesh(new THREE.TorusGeometry(.26, .1, 8, 14, Math.PI * 1.5), fur);
      tail.position.set(0, 1.5, .62); tail.rotation.set(.4, 0, .2); c.add(tail);
      c.anim(t => { tail.rotation.z = .2 + Math.sin(t * 9) * .5; });
    },

    /* 🤡 CLOWN — nariz, cabelo, babado e sapatões */
    clown(c) {
      const nose = S(.15, M(0xff2d4d, { rough: .3 }), 14);
      nose.position.set(0, 2.14, -.58); c.add(nose);
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
      /* sapatões vermelhos */
      [-1, 1].forEach(s => {
        const shoe = S(.3, M(0xff2d4d, { rough: .5 }), 12);
        shoe.scale.set(1, .55, 1.9);
        shoe.position.set(s * .28, .12, -.2); c.add(shoe);
      });
    },

    /* 🔥 RIZZLER — cabelo com franja, óculos e corrente de ouro */
    rizzler(c) {
      const hair = M(0x241c17, { rough: .8 });
      const cap = new THREE.Mesh(
        new THREE.SphereGeometry(.59, 18, 12, 0, TAU, 0, Math.PI * .55), hair);
      cap.position.y = 2.2; c.add(cap);
      const fringe = B(.9, .2, .22, hair);
      fringe.position.set(0, 2.44, -.42); fringe.rotation.x = .25; c.add(fringe);
      /* óculos escuros */
      const bar = B(.9, .05, .05, M(0x14161a, { rough: .3, metal: .5 }));
      bar.position.set(0, 2.24, -.52); c.add(bar);
      [-1, 1].forEach(s => {
        const lens = B(.34, .2, .05, M(0x14161a, { rough: .15, metal: .7 }));
        lens.position.set(s * .22, 2.2, -.54); c.add(lens);
      });
      /* corrente de ouro */
      const chain = new THREE.Mesh(new THREE.TorusGeometry(.34, .045, 8, 22), M(0xffd24d, { rough: .2, metal: .95 }));
      chain.rotation.x = Math.PI / 2.3; chain.position.set(0, 1.62, -.26); c.add(chain);
      const pend = S(.1, M(0xffd24d, { rough: .2, metal: .95 }), 10);
      pend.position.set(0, 1.42, -.5); c.add(pend);
    },

    /* 🗿 SIGMA — terno, gravata e cara fechada */
    sigma(c) {
      const suit = M(0x1b1f27, { rough: .6 });
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
      const bar = B(.86, .04, .04, M(0x0d0f12, { rough: .2, metal: .6 }));
      bar.position.set(0, 2.24, -.52); c.add(bar);
    },

    /* 👻 GHOST — lençol ondulado em vez de pernas */
    ghost(c) {
      c.legL.visible = c.legR.visible = false;
      c.body.visible = false;
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
      /* flutua */
      c.anim(t => { c.head.position.y = HEAD_Y + Math.sin(t * 2.4) * .07; });
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
      /* garras nos pés */
      [-1, 1].forEach(s => {
        const hoof = C(.2, .26, .2, M(0x2a1016, { rough: .7 }), 10);
        hoof.position.set(s * .27, .1, 0); c.add(hoof);
      });
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
      const skinM = M(c.skin.skinTone, { rough: .5 });
      c.body.visible = false;
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
      /* queixo quadrado */
      const jaw = B(.62, .3, .5, skinM);
      jaw.position.set(0, 1.94, -.12); c.add(jaw);
      /* pernas mais grossas */
      c.legL.scale.set(1.3, 1, 1.3); c.legR.scale.set(1.3, 1, 1.3);
    },

    /* 👑 KING — manto com gola de pele, cetro e barba */
    king(c) {
      const gold = M(0xffd24d, { rough: .22, metal: .95 });
      /* gola de pele branca */
      const collar = new THREE.Mesh(new THREE.TorusGeometry(.56, .17, 8, 22), M(0xf7f3ea, { rough: .95 }));
      collar.rotation.x = Math.PI / 2; collar.position.y = 1.8; c.add(collar);
      /* faixa dourada no peito */
      const sash = B(.22, 1.2, .1, gold);
      sash.position.set(.1, 1.25, -.5); sash.rotation.z = .3; c.add(sash);
      /* barba */
      const beard = new THREE.Mesh(
        new THREE.SphereGeometry(.44, 16, 12, 0, TAU, Math.PI * .45, Math.PI * .55),
        M(0xf1ece0, { rough: .95 }));
      beard.position.set(0, 2.08, -.1); beard.scale.set(1, 1.25, 1.05); c.add(beard);
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
    }
  };

  MA.PBUILDS = PBUILDS;
})(window.MA);
