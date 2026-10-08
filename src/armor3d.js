/* =====================================================================
   MEME ARENA 3D — armaduras procedurais exclusivas

   Cada armadura tem silhueta, materiais e peças próprias. Braçadeiras e
   grevas são filhas dos membros para acompanharem corrida, pulo e combate.
   A frente do jogador é -Z.
   ===================================================================== */
(function (MA) {
  'use strict';
  const PI = Math.PI;

  function M(color, opts) {
    opts = opts || {};
    const metal = opts.metal === undefined ? .55 : opts.metal;
    const opacity = opts.opacity === undefined ? 1 : opts.opacity;
    return new THREE.MeshPhysicalMaterial({
      color,
      roughness: opts.rough === undefined ? .36 : opts.rough,
      metalness: metal,
      clearcoat: opts.clear === undefined ? (metal > .45 ? .48 : .22) : opts.clear,
      clearcoatRoughness: opts.clearRough === undefined ? .20 : opts.clearRough,
      emissive: opts.emissive === undefined ? 0x000000 : opts.emissive,
      emissiveIntensity: opts.ei === undefined ? .5 : opts.ei,
      transparent: opacity < 1,
      opacity,
      depthWrite: opacity >= .98,
      side: opts.side || THREE.FrontSide,
      flatShading: !!opts.flat
    });
  }
  const B = (w, h, d, m) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  const C = (rt, rb, h, m, seg) => new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 16), m);
  const S = (r, m, seg) => new THREE.Mesh(new THREE.SphereGeometry(r, seg || 16, seg || 12), m);
  const Cone = (r, h, m, seg) => new THREE.Mesh(new THREE.ConeGeometry(r, h, seg || 8), m);
  const Cap = (r, h, m) => new THREE.Mesh(new THREE.CapsuleGeometry(r, h, 6, 16), m);
  const Tor = (r, t, m, seg) => new THREE.Mesh(new THREE.TorusGeometry(r, t, 8, seg || 24), m);

  function attach(parent, mesh, pos, rot, scale) {
    if (pos) mesh.position.set(pos[0], pos[1], pos[2]);
    if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
    if (scale) mesh.scale.set(scale[0], scale[1], scale[2]);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function add(c, mesh, pos, rot, scale) {
    if (pos) mesh.position.set(pos[0], pos[1], pos[2]);
    if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
    if (scale) mesh.scale.set(scale[0], scale[1], scale[2]);
    return c.add(mesh);
  }

  function paired(fn) { [-1, 1].forEach(fn); }

  /* Nas skins-algarismo o centro precisa continuar legível. Em vez de cobrir
     o 6 ou o 7 com um peitoral convencional, a armadura protege membros e
     ombros e acrescenta detalhes próprios nas bordas da silhueta. */
  function numericArmor(c) {
    if (!c.armor || c.armor.id === 'hoodie') return;
    const baseColor = c.armor.color || 0x6572ff;
    const glowIds = ['neon', 'orbit6', 'prism7', 'protocol67'];
    const glow = glowIds.indexOf(c.armor.id) >= 0;
    const plate = M(baseColor, {
      rough: c.armor.id === 'cardboard' ? .94 : .18,
      metal: c.armor.id === 'cardboard' ? .03 : .78,
      emissive: glow ? MA.shade(baseColor, -48) : 0x000000,
      ei: glow ? .86 : .2
    });
    const dark = M(MA.shade(baseColor, -48), { rough: .27, metal: .76 });
    const blocky = ['cardboard', 'pixel', 'prism7'].indexOf(c.armor.id) >= 0;

    paired(side => {
      const shoulder = blocky ? B(.39, .20, .48, plate) : S(.27, plate, 16);
      add(c, shoulder, [side * .76 * c.bulk, 1.61, .02], [0, 0, side * .10],
        blocky ? null : [1.18, .65, 1.02]);
      const arm = side < 0 ? c.armL : c.armR;
      const bracer = blocky ? B(.34, .40, .38, dark) : C(.245, .21, .42, dark, 14);
      attach(arm, bracer, [0, -.16, 0]);
      const rail = Cap(.035, .25, plate);
      attach(arm, rail, [0, -.16, -.235]);
      const leg = side < 0 ? c.legL : c.legR;
      const greave = blocky ? B(.31, .37, .36, dark) : C(.25, .21, .36, dark, 14);
      attach(leg, greave, [0, -.13, -.02]);
      attach(leg, B(.11, .24, .07, plate), [0, -.14, -.235]);
    });

    if (c.armor.id === 'orbit6') {
      const ring = Tor(.32, .055, plate, 28);
      add(c, ring, [-.76 * c.bulk, 1.62, -.03], [PI / 2, 0, 0]);
    } else if (c.armor.id === 'prism7') {
      for (let i = -2; i <= 2; i++) {
        const fin = new THREE.Mesh(new THREE.OctahedronGeometry(.075, 0), i % 2 ? plate : dark);
        add(c, fin, [i * .17, 2.31 - Math.abs(i) * .04, .10], null, [1, 1.55, .72]);
      }
    } else if (c.armor.id === 'protocol67') {
      const core = new THREE.Mesh(new THREE.OctahedronGeometry(.10, 1), plate);
      add(c, core, [0, .78, -.22]);
      c.anim(t => { core.rotation.x = t; core.rotation.y = t * 1.6; });
    } else if (c.armor.id === 'chadplate') {
      paired(side => {
        const spike = Cone(.09, .34, plate, 8);
        add(c, spike, [side * .96, 1.84, .04], [0, 0, -side * .72]);
      });
    }
  }

  const BUILDS = {
    /* Moletom inicial: acabamento de tecido e costuras. A skin Chill já
       fornece bolso e cordões; nas outras, a armadura continua reconhecível. */
    hoodie(c) {
      const cloth = M(c.skin.body, { rough: .94, metal: .02 });
      const dark = M(MA.shade(c.skin.body, -38), { rough: .9, metal: .04 });
      if (c.skin.id !== 'coolfries') {
        const hem = C(.50 * c.bulk, .50 * c.bulk, .11, dark, 24);
        add(c, hem, [0, .69, 0]);
      }
      if (c.skin.id !== 'coolfries') paired(s => {
        const cuff = C(.225 * c.bulk, .225 * c.bulk, .12, dark, 18);
        attach(s < 0 ? c.armL : c.armR, cuff, [0, -.34, 0]);
      });
      if (c.skin.id !== 'coolfries') {
        const pocket = S(.38, cloth, 22);
        add(c, pocket, [0, 1.02, -.55], null, [1.04, .48, .22]);
        const seam = Cap(.018, .48, dark);
        add(c, seam, [0, 1.12, -.625], [0, 0, PI / 2]);
      }
    },

    /* Papelão improvisado: placas tortas, fita adesiva e bordas onduladas. */
    cardboard(c) {
      const card = M(0xb98245, { rough: .98, metal: .02 });
      const light = M(0xd5a15f, { rough: .96, metal: .02 });
      const edge = M(0x604125, { rough: 1, metal: 0 });
      const tape = M(0x9aa0a8, { rough: .42, metal: .62 });

      const front = B(1.12 * c.bulk, .92, .13, card);
      add(c, front, [0, 1.28, -.58], [.02, 0, -.025]);
      const lower = B(.92 * c.bulk, .35, .15, light);
      add(c, lower, [0, .75, -.48], [-.05, 0, .025]);
      /* fita em X de verdade, elevada para não piscar com a placa */
      paired(s => add(c, B(.12, 1.02, .025, tape), [0, 1.30, -.66], [0, 0, s * .54]));
      /* bordas e linhas da ondulação */
      add(c, B(1.16 * c.bulk, .045, .16, edge), [0, 1.75, -.58]);
      add(c, B(1.02 * c.bulk, .04, .17, edge), [0, .57, -.48]);
      for (let i = -3; i <= 3; i++)
        add(c, B(.018, .82, .018, edge), [i * .14, 1.28, -.66]);
      paired(s => {
        const shoulder = B(.46, .16, .58, card);
        add(c, shoulder, [s * .72 * c.bulk, 1.65, 0], [0, 0, s * .12]);
        const bracer = C(.24, .20, .42, card, 8);
        attach(s < 0 ? c.armL : c.armR, bracer, [0, -.13, 0]);
        const strap = C(.246, .246, .07, tape, 10);
        attach(s < 0 ? c.armL : c.armR, strap, [0, -.12, 0]);
      });
      /* parafusos grandes reforçam a estética improvisada */
      paired(s => paired(y => add(c, S(.045, tape, 8), [s * .45, 1.25 + y * .32, -.675])));
    },

    /* Pixel: volumes em degraus, blocos luminosos e acessórios quadrados. */
    pixel(c) {
      const navy = M(0x15314e, { rough: .38, metal: .62 });
      const blue = M(0x237dad, { rough: .28, metal: .68 });
      const cyan = M(0x3bc9ff, { rough: .14, metal: .52, emissive: 0x0875a6, ei: 1.05 });
      const white = M(0xbcefff, { rough: .2, metal: .45, emissive: 0x3bc9ff, ei: .42 });

      /* mosaico 3 x 3 no peito */
      for (let row = 0; row < 3; row++) for (let col = -1; col <= 1; col++) {
        const palette = (row + col + 3) % 3 === 0 ? cyan : (row === 1 ? blue : navy);
        const block = B(.34 * c.bulk, .31, .18, palette);
        add(c, block, [col * .34 * c.bulk, 1.53 - row * .30, -.57 - Math.abs(col) * .015]);
      }
      add(c, B(.92 * c.bulk, .14, .20, white), [0, .70, -.47]);
      paired(s => {
        const shoulder = B(.48, .40, .54, s > 0 ? cyan : blue);
        add(c, shoulder, [s * .78 * c.bulk, 1.62, -.02], [0, 0, s * .11]);
        const fore = B(.38, .48, .42, navy);
        attach(s < 0 ? c.armL : c.armR, fore, [0, -.16, -.02]);
        attach(s < 0 ? c.armL : c.armR, B(.29, .12, .46, cyan), [0, -.17, -.23]);
        const shin = B(.34, .48, .42, navy);
        attach(s < 0 ? c.legL : c.legR, shin, [0, -.15, -.06]);
        attach(s < 0 ? c.legL : c.legR, B(.25, .18, .46, blue), [0, -.12, -.23]);
      });
      /* coração pixelado central */
      [[-.105, 1.53], [.105, 1.53], [0, 1.42]].forEach(p =>
        add(c, B(.19, .17, .06, white), [p[0], p[1], -.70]));
    },

    /* Exoesqueleto Neon: armação preta, tubos de energia e núcleo pulsante. */
    neon(c) {
      const black = M(0x10131c, { rough: .24, metal: .92 });
      const dark = M(0x26233b, { rough: .27, metal: .86 });
      const pink = M(0xff00c8, { rough: .12, metal: .54, emissive: 0xff00c8, ei: 1.35 });
      const cyan = M(0x00ffd5, { rough: .10, metal: .50, emissive: 0x00a98e, ei: 1.45 });

      add(c, B(.98 * c.bulk, .86, .18, black), [0, 1.33, -.54]);
      paired(s => {
        const rail = C(.055, .055, .96, s < 0 ? pink : cyan, 8);
        add(c, rail, [s * .45 * c.bulk, 1.31, -.67], [0, 0, s * .20]);
        const shoulder = S(.34, black, 16);
        add(c, shoulder, [s * .78 * c.bulk, 1.64, 0], null, [1.16, .72, 1.08]);
        const sr = Tor(.26, .045, s < 0 ? pink : cyan, 20);
        add(c, sr, [s * .79 * c.bulk, 1.65, -.07], [PI / 2, 0, 0]);
        const arm = s < 0 ? c.armL : c.armR;
        attach(arm, C(.23, .20, .50, dark, 12), [0, -.15, 0]);
        attach(arm, B(.07, .44, .12, s < 0 ? pink : cyan), [0, -.14, -.22]);
        const leg = s < 0 ? c.legL : c.legR;
        attach(leg, B(.12, .52, .16, s < 0 ? pink : cyan), [s * .10, -.13, -.21]);
      });
      const coreMat = M(0xffffff, { rough: .05, metal: .3, emissive: 0x00ffd5, ei: 2 });
      const core = S(.15, coreMat, 18);
      add(c, core, [0, 1.40, -.72]);
      const coreRing = Tor(.27, .045, pink, 28);
      add(c, coreRing, [0, 1.40, -.70]);
      add(c, B(.58, .10, .18, dark), [0, .76, -.49]);
      const backA = C(.08, .08, 1.05, pink, 10);
      add(c, backA, [-.30, 1.32, .48], [.08, 0, -.10]);
      const backB = C(.08, .08, 1.05, cyan, 10);
      add(c, backB, [.30, 1.32, .48], [.08, 0, .10]);
      c.anim(t => {
        const pulse = 1 + Math.sin(t * 4.2) * .12;
        core.scale.setScalar(pulse);
        coreRing.rotation.z = t * 1.25;
        coreMat.emissiveIntensity = 1.7 + Math.sin(t * 4.2) * .45;
      });
    },

    /* Placa Sigma: placas angulares, gola alta e acabamento de titânio. */
    sigma(c) {
      const gun = M(0x202733, { rough: .25, metal: .94 });
      const steel = M(0x8795a4, { rough: .18, metal: .98 });
      const black = M(0x0c1118, { rough: .34, metal: .82 });
      const cyan = M(0x00e5ff, { rough: .08, metal: .56, emissive: 0x007486, ei: 1.25 });

      /* peitorais separados formam um V em vez de uma caixa única */
      paired(s => {
        const pec = B(.58 * c.bulk, .55, .22, gun);
        add(c, pec, [s * .28 * c.bulk, 1.47, -.57], [0, 0, s * .16]);
        const edge = B(.055, .50, .045, cyan);
        add(c, edge, [s * .10, 1.43, -.71], [0, 0, -s * .35]);
      });
      for (let i = 0; i < 3; i++)
        add(c, B(.62 - i * .07, .16, .19, i === 1 ? steel : black), [0, 1.04 - i * .16, -.53]);
      const collar = Tor(.44 * c.bulk, .095, gun, 24);
      add(c, collar, [0, 1.78, 0], [PI / 2, 0, 0]);
      paired(s => {
        const sh = S(.38, gun, 18);
        add(c, sh, [s * .82 * c.bulk, 1.64, .02], null, [1.25, .62, 1.05]);
        add(c, B(.50, .10, .56, steel), [s * .82 * c.bulk, 1.75, .02], [0, 0, s * .10]);
        const arm = s < 0 ? c.armL : c.armR;
        attach(arm, C(.25, .21, .48, gun, 14), [0, -.16, 0]);
        attach(arm, B(.11, .40, .12, steel), [0, -.17, -.23]);
        const leg = s < 0 ? c.legL : c.legR;
        attach(leg, S(.245, gun, 12), [0, -.15, -.18], null, [1, 1.25, .55]);
      });
      /* emblema sigma abstrato */
      add(c, B(.32, .065, .055, cyan), [0, 1.39, -.73], [0, 0, .30]);
      add(c, B(.32, .065, .055, cyan), [0, 1.23, -.73], [0, 0, -.30]);
    },

    /* Colete Órbita 6: leve, assimétrico e construído em torno de um anel. */
    orbit6(c) {
      const ink = M(0x17345b, { rough: .26, metal: .78 });
      const blue = M(0x327fda, { rough: .13, metal: .52, emissive: 0x133b78, ei: .72 });
      const cyan = M(0x2de2ff, { rough: .07, metal: .34, emissive: 0x08778c, ei: 1.28 });
      const pearl = M(0xe8f7ff, { rough: .18, metal: .62 });

      const chest = S(.52, ink, 22);
      add(c, chest, [0, 1.35, -.50], null, [.92 * c.bulk, 1.03, .27]);
      const orbit = Tor(.31, .055, cyan, 32);
      add(c, orbit, [-.18, 1.40, -.69]);
      const stem = Cap(.048, .42, blue);
      add(c, stem, [-.34, 1.56, -.69], [0, 0, -.34]);
      const core = S(.10, pearl, 16);
      add(c, core, [-.18, 1.40, -.73]);
      add(c, B(.62, .10, .18, blue), [.20, .96, -.50], [0, 0, -.14]);

      paired(s => {
        const arm = s < 0 ? c.armL : c.armR;
        const bracer = C(.245, .215, .40, ink, 16);
        attach(arm, bracer, [0, -.16, 0]);
        const rail = Cap(.040, .22, s < 0 ? cyan : blue);
        attach(arm, rail, [0, -.16, -.235]);
        const leg = s < 0 ? c.legL : c.legR;
        attach(leg, C(.245, .215, .35, ink, 14), [0, -.15, 0]);
      });
      /* Só o ombro esquerdo leva o satélite: silhueta propositalmente desigual. */
      const shoulder = Tor(.32, .075, blue, 26);
      add(c, shoulder, [-.78 * c.bulk, 1.66, -.02], [PI / 2, 0, 0]);
      const satellite = S(.10, cyan, 14);
      add(c, satellite, [-1.02 * c.bulk, 1.85, -.06]);
      c.anim(t => {
        orbit.rotation.z = t * .72;
        core.scale.setScalar(1 + Math.sin(t * 4.6) * .10);
        satellite.position.y = 1.85 + Math.sin(t * 2.8) * .07;
      });
    },

    /* Bastião Prisma 7: placas angulares em degraus, sem repetir o anel do 6. */
    prism7(c) {
      const ink = M(0x1b1738, { rough: .22, metal: .90 });
      const violet = M(0x9b65ff, { rough: .09, metal: .46, emissive: 0x482694, ei: 1.05 });
      const pink = M(0xff4fbd, { rough: .08, metal: .42, emissive: 0x8e195b, ei: 1.06 });
      const pearl = M(0xf5efff, { rough: .12, metal: .88 });

      /* sete lâminas peitorais inclinadas compõem uma couraça em leque */
      for (let i = -3; i <= 3; i++) {
        const h = .62 - Math.abs(i) * .045;
        const plate = B(.18, h, .20, i % 2 ? violet : ink);
        add(c, plate, [i * .145, 1.38 - Math.abs(i) * .025, -.58], [0, 0, -i * .055]);
        const tip = new THREE.Mesh(new THREE.OctahedronGeometry(.075, 0), i % 2 ? pink : pearl);
        add(c, tip, [i * .145, 1.68 - Math.abs(i) * .03, -.71]);
      }
      add(c, B(.92 * c.bulk, .15, .23, ink), [0, .82, -.08]);
      add(c, Cap(.055, .52, pink), [.20, 1.19, -.72], [0, 0, -.42]);
      add(c, Cap(.055, .42, pearl), [.07, 1.58, -.72], [0, 0, PI / 2]);

      paired(s => {
        const sh = B(.53, .18, .62, ink);
        add(c, sh, [s * .79 * c.bulk, 1.67, 0], [0, 0, s * .13]);
        const crest = new THREE.Mesh(new THREE.OctahedronGeometry(.16, 0), s < 0 ? violet : pink);
        add(c, crest, [s * .91 * c.bulk, 1.82, -.13], [0, 0, s * .20], [1.35, .75, .70]);
        const arm = s < 0 ? c.armL : c.armR;
        attach(arm, B(.34, .46, .39, ink), [0, -.15, 0]);
        attach(arm, Cap(.045, .30, s < 0 ? violet : pink), [0, -.15, -.235]);
        const leg = s < 0 ? c.legL : c.legR;
        attach(leg, B(.32, .42, .38, ink), [0, -.15, -.03]);
        attach(leg, B(.12, .28, .08, pearl), [0, -.14, -.245]);
      });
      const crestTop = new THREE.Mesh(new THREE.OctahedronGeometry(.13, 0), pink);
      add(c, crestTop, [0, 1.86, .02], null, [1, 1.65, .72]);
      c.anim(t => {
        crestTop.rotation.y = t * 1.8;
        crestTop.scale.set(1, 1.65 + Math.sin(t * 4) * .12, .72);
      });
    },

    /* Temporada 67: placas arredondadas 6|7 com amortecedores de impacto. */
    protocol67(c) {
      const navy = M(0x151a43, { rough: .20, metal: .78 });
      const pearl = M(0xf0f3ff, { rough: .15, metal: .72 });
      const blue = M(0x6572ff, { rough: .09, metal: .42, emissive: 0x2630a0, ei: .82 });
      const pink = M(0xff4fbd, { rough: .10, metal: .38, emissive: 0x8e185a, ei: .78 });
      const cyan = M(0x2de2ff, { rough: .07, metal: .34, emissive: 0x08788f, ei: 1.25 });

      /* Duas placas convexas acompanham o corpo-feijão em vez de formar caixa. */
      paired(s => {
        const plate = S(.55, navy, 24);
        add(c, plate, [s * .27 * c.bulk, 1.34, -.52], [0, 0, s * .05], [.96, 1.06, .28]);
        const edge = Tor(.24, .032, s < 0 ? blue : pink, 24);
        add(c, edge, [s * .27, 1.38, -.685]);
      });
      const six = Tor(.20, .050, blue, 24);
      add(c, six, [-.27, 1.39, -.72]);
      add(c, Cap(.044, .24, blue), [-.37, 1.52, -.72], [0, 0, -.34]);
      add(c, Cap(.044, .26, pink), [.25, 1.58, -.72], [0, 0, PI / 2]);
      add(c, Cap(.044, .31, pink), [.28, 1.34, -.72], [0, 0, -.38]);
      const waist = Tor(.48 * c.bulk, .062, pearl, 28);
      add(c, waist, [0, .80, 0], [PI / 2, 0, 0], [1, 1, .90]);

      paired(s => {
        const color = s < 0 ? blue : pink;
        const shoulder = S(.39, navy, 20);
        add(c, shoulder, [s * .82 * c.bulk, 1.66, 0], null, [1.28, .68, 1.05]);
        const bumper = Tor(.29, .052, color, 24);
        add(c, bumper, [s * .83 * c.bulk, 1.67, -.08], [PI / 2, 0, 0]);
        const arm = s < 0 ? c.armL : c.armR;
        attach(arm, C(.265, .22, .48, navy, 18), [0, -.14, 0]);
        attach(arm, Cap(.045, .25, color), [0, -.14, -.245]);
        const leg = s < 0 ? c.legL : c.legR;
        attach(leg, S(.26, navy, 18), [0, -.14, -.03], null, [1.05, 1.20, .76]);
        attach(leg, Cap(.046, .20, color), [0, -.14, -.245]);
      });

      const core = new THREE.Mesh(new THREE.IcosahedronGeometry(.14, 1), pearl);
      add(c, core, [0, 1.17, -.73]);
      const orbit = Tor(.23, .035, cyan, 28);
      add(c, orbit, [0, 1.17, -.71]);
      c.anim(t => {
        core.rotation.x = t * .8; core.rotation.y = t * 1.5;
        orbit.rotation.z = -t * 1.1;
        const pulse = 1 + Math.sin(t * 6.7) * .07;
        core.scale.setScalar(pulse);
      });
    },

    /* Casca de Gigachad: armadura mítica dourada, enorme e cerimonial. */
    chadplate(c) {
      const gold = M(0xffc92e, { rough: .13, metal: .98, emissive: 0x5e3900, ei: .52 });
      const pale = M(0xffeaa0, { rough: .12, metal: .97, emissive: 0x6b4b00, ei: .42 });
      const dark = M(0x382817, { rough: .28, metal: .87 });
      const purple = M(0xb45cff, { rough: .08, metal: .46, emissive: 0x7b20d8, ei: 1.55 });

      /* peito esculpido em duas placas arredondadas */
      paired(s => {
        const pec = S(.43, gold, 20);
        add(c, pec, [s * .35 * c.bulk, 1.48, -.48], null, [1.12, .72, .55]);
        const sh = S(.52, gold, 20);
        add(c, sh, [s * .88 * c.bulk, 1.70, .02], null, [1.25, .68, 1.10]);
        const spike = Cone(.14, .54, pale, 8);
        add(c, spike, [s * 1.10 * c.bulk, 1.96, .03], [0, 0, -s * .72]);
        const arm = s < 0 ? c.armL : c.armR;
        attach(arm, C(.29, .23, .53, gold, 16), [0, -.14, 0]);
        attach(arm, Tor(.235, .045, pale, 18), [0, -.36, 0], [PI / 2, 0, 0]);
        const leg = s < 0 ? c.legL : c.legR;
        attach(leg, C(.25, .21, .48, gold, 14), [0, -.15, 0]);
        attach(leg, B(.19, .33, .12, pale), [0, -.14, -.23]);
      });
      for (let i = 0; i < 3; i++)
        add(c, B(.66 - i * .06, .15, .20, i === 1 ? pale : gold), [0, 1.09 - i * .15, -.51]);
      add(c, B(.96 * c.bulk, .16, .28, dark), [0, .72, -.03]);
      for (let i = -2; i <= 2; i++)
        add(c, B(.13, .24, .16, gold), [i * .18, .66, -.24]);
      const gemMat = purple;
      const gem = new THREE.Mesh(new THREE.OctahedronGeometry(.18, 0), gemMat);
      add(c, gem, [0, 1.39, -.80]);
      const halo = Tor(.34, .045, pale, 30);
      add(c, halo, [0, 1.39, -.76]);
      /* gola e pequeno manto rígido nas costas */
      const collar = Tor(.50 * c.bulk, .11, pale, 26);
      add(c, collar, [0, 1.80, .02], [PI / 2, 0, 0]);
      paired(s => add(c, B(.42, .88, .10, dark), [s * .27, 1.27, .48], [0, 0, s * .10]));
      c.anim(t => {
        gem.rotation.y = t * 1.7; gem.rotation.x = t * .65;
        halo.rotation.z = -t * .8;
        const p = 1 + Math.sin(t * 3) * .09;
        gem.scale.setScalar(p);
      });
    }
  };

  MA.applyArmorModel = function (ctx) {
    const armor = ctx && ctx.armor;
    if (!armor) return;
    if (ctx.skin && ctx.skin.numeric) {
      numericArmor(ctx);
      return;
    }
    const build = BUILDS[armor.id] || BUILDS.hoodie;
    build(ctx);
  };
})(window.MA);
