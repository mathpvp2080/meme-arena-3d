/* MEME ARENA 3D — efeitos, jogador, inimigos, projéteis e itens */
(function (MA) {
  'use strict';
  const TAU = MA.TAU;
  const V3 = () => new THREE.Vector3();

  /* ====================================================== EFEITOS / POOL */
  const FX = {
    scene: null,
    pool: [], active: [], rings: [], pops: [],
    partGeo: null, maxParticles: 520,

    init(scene) {
      this.scene = scene;
      this.partGeo = new THREE.SphereGeometry(1, 6, 5);
      this.partGeo.userData = { shared: true };
      this.ringGeo = new THREE.RingGeometry(.4, .85, 44);
      this.ringGeo.userData = { shared: true };
      for (let i = 0; i < this.maxParticles; i++) {
        const m = new THREE.Mesh(this.partGeo, new THREE.MeshBasicMaterial({
          color: 0xffffff, transparent: true, depthWrite: false
        }));
        m.visible = false; scene.add(m);
        this.pool.push({ mesh: m, life: 0, max: 1, vel: V3(), grav: 20, s: 1, spin: 0 });
      }
    },

    burst(pos, color, count, power, size, grav) {
      const budget = MA.Game.quality === 'low' ? .5 : MA.Game.quality === 'med' ? .8 : 1;
      count = Math.max(1, Math.round(count * budget));
      for (let i = 0; i < count; i++) {
        const p = this.pool.pop();
        if (!p) return;
        p.mesh.material.color.set(color);
        p.s = (size || .2) * MA.rand(.5, 1.6);
        p.mesh.scale.setScalar(p.s);
        p.mesh.position.copy(pos);
        p.mesh.visible = true;
        p.mesh.material.opacity = 1;
        p.vel.set(MA.rand(-1, 1), MA.rand(-.15, 1.25), MA.rand(-1, 1))
          .normalize().multiplyScalar(MA.rand(.3, 1) * (power || 8));
        p.life = p.max = MA.rand(.45, 1.15);
        p.grav = grav === undefined ? 22 : grav;
        this.active.push(p);
      }
    },

    ring(pos, color, maxR, dur, y) {
      const m = new THREE.Mesh(this.ringGeo, new THREE.MeshBasicMaterial({
        color, transparent: true, side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending, depthWrite: false
      }));
      m.rotation.x = -Math.PI / 2;
      m.position.copy(pos); m.position.y = y === undefined ? .25 : y;
      this.scene.add(m);
      this.rings.push({ mesh: m, t: 0, dur: dur || .5, maxR: maxR || 6 });
    },

    popup(pos, text, color, scale) {
      if (MA.Game.quality === 'low' && Math.random() < .5) return;
      const tex = MA.Tex.popup(text, color);
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
      sp.position.copy(pos);
      const s = scale || 1;
      sp.scale.set(4 * s, 1 * s, 1);
      this.scene.add(sp);
      this.pops.push({ mesh: sp, t: 0, dur: 1.0, s });
    },

    update(dt) {
      for (let i = this.active.length - 1; i >= 0; i--) {
        const p = this.active[i];
        p.life -= dt;
        p.vel.y -= p.grav * dt;
        p.mesh.position.addScaledVector(p.vel, dt);
        if (p.mesh.position.y < .06) {
          p.mesh.position.y = .06; p.vel.y *= -.4; p.vel.x *= .72; p.vel.z *= .72;
        }
        const f = MA.clamp(p.life / p.max, 0, 1);
        p.mesh.material.opacity = f;
        p.mesh.scale.setScalar(p.s * (.25 + f * .95));
        if (p.life <= 0) {
          p.mesh.visible = false;
          this.active.splice(i, 1);
          this.pool.push(p);
        }
      }
      for (let i = this.rings.length - 1; i >= 0; i--) {
        const r = this.rings[i];
        r.t += dt;
        const f = r.t / r.dur;
        r.mesh.scale.setScalar(MA.lerp(.5, r.maxR, f * (2 - f)));
        r.mesh.material.opacity = MA.clamp(1 - f, 0, 1) * .85;
        if (f >= 1) { this.scene.remove(r.mesh); r.mesh.material.dispose(); this.rings.splice(i, 1); }
      }
      for (let i = this.pops.length - 1; i >= 0; i--) {
        const p = this.pops[i];
        p.t += dt;
        const f = p.t / p.dur;
        p.mesh.position.y += dt * 2.4;
        p.mesh.material.opacity = MA.clamp(1 - f * f, 0, 1);
        p.mesh.scale.set(4 * p.s * (1 + f * .25), 1 * p.s * (1 + f * .25), 1);
        if (f >= 1) {
          this.scene.remove(p.mesh);
          if (p.mesh.material.map) p.mesh.material.map.dispose();
          p.mesh.material.dispose();
          this.pops.splice(i, 1);
        }
      }
    },

    clear() {
      this.active.slice().forEach(p => { p.mesh.visible = false; this.pool.push(p); });
      this.active.length = 0;
      this.rings.forEach(r => { this.scene.remove(r.mesh); r.mesh.material.dispose(); });
      this.rings.length = 0;
      this.pops.forEach(p => {
        this.scene.remove(p.mesh);
        if (p.mesh.material.map) p.mesh.material.map.dispose();
        p.mesh.material.dispose();
      });
      this.pops.length = 0;
    }
  };

  /* Torso autoral de party-game. O perfil torneado cria ombros largos,
     barriga arredondada e cintura curta sem copiar uma malha proprietária. */
  function partyTorsoGeometry(bulk) {
    const p = [
      [0, -.55], [.33, -.53], [.47, -.44], [.54, -.20],
      [.61, .18], [.58, .39], [.46, .51], [0, .54]
    ].map(v => new THREE.Vector2(v[0] * bulk, v[1]));
    const geo = new THREE.LatheGeometry(p, 32);
    geo.computeVertexNormals();
    return geo;
  }

  function createPlayer(scene, skin, armorDef) {
    skin = skin || MA.SKINS[0];
    armorDef = armorDef || MA.ARMORS[0];
    const g = new THREE.Group();
    const trans = !!skin.ghost;
    const bulk = skin.bulky ? 1.18 : 1;
    /* Materiais de brinquedo premium: suaves, levemente brilhantes e sem o
       aspecto áspero/plástico barato da antiga base. */
    const metal = skin.metal ? .62 : .06;
    const rough = skin.metal ? .18 : .36;

    const mkMat = (col, extraRough) => {
      const color = new THREE.Color(col);
      return new THREE.MeshPhysicalMaterial({
        color, roughness: extraRough === undefined ? rough : extraRough,
        metalness: metal,
        clearcoat: skin.metal ? .62 : .30,
        clearcoatRoughness: skin.metal ? .14 : .24,
        emissive: color.clone().multiplyScalar(skin.metal ? .055 : .018),
        emissiveIntensity: 1,
        transparent: trans, opacity: trans ? .55 : 1
      });
    };

    /* Silhueta de party-game: torso torneado, ombros macios e cintura curta.
       A forma é autoral e serve como base consistente para todas as skins. */
    const bodyColor = skin.body;
    const body = new THREE.Mesh(partyTorsoGeometry(bulk), mkMat(bodyColor, .30));
    body.position.y = 1.19;
    body.scale.z = .91;
    body.castShadow = true; g.add(body);

    /* O encaixe fica escondido: cabeça e torso se sobrepõem como nos
       bonecos de party-game, sem pescoço cilíndrico aparente. */
    const neck = new THREE.Mesh(
      new THREE.CylinderGeometry(.20, .25, .18, 20),
      new THREE.MeshPhysicalMaterial({
        color: MA.shade(skin.skinTone, -8), roughness: .34, metalness: .01,
        clearcoat: .20, clearcoatRoughness: .28,
        transparent: trans, opacity: trans ? .7 : 1
      })
    );
    neck.position.y = 1.72; neck.visible = false; g.add(neck);

    /* capuz caído sobre as costas (não atravessa mais o queixo) */
    const hood = new THREE.Mesh(
      new THREE.SphereGeometry(.46 * bulk, 22, 16, 0, TAU, 0, Math.PI / 2),
      mkMat(skin.hood, .42)
    );
    hood.position.set(0, 1.65, .31);
    hood.rotation.x = Math.PI + .5;
    hood.scale.set(1.03, .88, 1.12);
    g.add(hood);

    /* Cabeça superdimensionada e quase esférica: principal assinatura visual
       do gênero, com espaço para expressões grandes e leitura em celular. */
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(.68, 36, 28),
      new THREE.MeshPhysicalMaterial({
        color: MA.shade(skin.skinTone, -2), roughness: .30, metalness: .01,
        clearcoat: .24, clearcoatRoughness: .22,
        transparent: trans, opacity: trans ? .7 : 1
      })
    );
    head.position.y = 2.17; head.scale.set(1, 1, .955); head.castShadow = true; g.add(head);

    /* rosto pintado grande e legível; cada meme preserva sua expressão própria */
    const pFace = new THREE.Mesh(
      new THREE.SphereGeometry(.689, 36, 28, -0.95, 1.9, 0.42, 2.3),
      new THREE.MeshPhysicalMaterial({
        map: MA.Tex.face(Object.assign({}, skin, {
          id: 'skin:' + skin.id,
          color: skin.skinTone,
          ring: MA.shade(skin.skinTone, -55)
        })),
        roughness: .27, metalness: .01, clearcoat: .18, clearcoatRoughness: .24,
        transparent: true, opacity: trans ? .75 : 1
      })
    );
    pFace.rotation.y = -Math.PI / 2;
    head.add(pFace);

    /* chapéu / acessório de cabeça */
    const hc = skin.hatColor !== undefined ? skin.hatColor : 0xffffff;
    if (skin.hat === 'cap') {
      const cap = new THREE.Mesh(
        new THREE.SphereGeometry(.705, 32, 16, 0, TAU, 0, 1.02),
        new THREE.MeshPhysicalMaterial({ color: hc, emissive: hc, emissiveIntensity: .06, roughness: .24, metalness: .025, clearcoat: .34, clearcoatRoughness: .20 })
      );
      cap.position.y = 2.17; cap.scale.z = .96; g.add(cap);
      /* aba oval grossa, sem cantos de caixa */
      const brim = new THREE.Mesh(new THREE.SphereGeometry(.51, 26, 14),
        new THREE.MeshPhysicalMaterial({ color: hc, roughness: .25, metalness: .025, clearcoat: .34, clearcoatRoughness: .20 }));
      brim.position.set(0, 2.56, -.53); brim.scale.set(1, .13, .68); g.add(brim);
    } else if (skin.hat === 'crown') {
      const crownMat = new THREE.MeshPhysicalMaterial({ color: hc, metalness: .90, roughness: .14, clearcoat: .48, clearcoatRoughness: .12 });
      const base = new THREE.Mesh(new THREE.CylinderGeometry(.61, .61, .18, 28), crownMat);
      base.position.y = 2.66; g.add(base);
      for (let i = 0; i < 7; i++) {
        const sp = new THREE.Mesh(new THREE.ConeGeometry(.11, .36, 10), crownMat);
        const a = i / 7 * TAU;
        sp.position.set(Math.cos(a) * .52, 2.89, Math.sin(a) * .52); g.add(sp);
      }
    } else if (skin.hat === 'halo') {
      const halo = new THREE.Mesh(new THREE.TorusGeometry(.47, .058, 10, 36),
        new THREE.MeshBasicMaterial({ color: hc }));
      halo.rotation.x = Math.PI / 2; halo.position.y = 3.00; g.add(halo);
      g.userData.halo = halo;
    } else if (skin.hat === 'horns') {
      [-1, 1].forEach(s => {
        const h = new THREE.Mesh(new THREE.ConeGeometry(.14, .54, 12),
          new THREE.MeshPhysicalMaterial({ color: hc, roughness: .30, clearcoat: .26, clearcoatRoughness: .22 }));
        h.position.set(s * .39, 2.68, -.04);
        h.rotation.z = -s * .42; h.rotation.x = -.22;
        g.add(h);
      });
    } else if (skin.hat === 'bucket') {
      const bucketMat = new THREE.MeshPhysicalMaterial({ color: hc, roughness: .32, metalness: .02, clearcoat: .24, clearcoatRoughness: .26 });
      const b = new THREE.Mesh(new THREE.CylinderGeometry(.54, .67, .43, 28), bucketMat);
      b.position.y = 2.70; g.add(b);
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(.79, .79, .07, 32), bucketMat);
      brim.position.y = 2.49; g.add(brim);
    }

    /* acessório de costas */
    if (skin.extra === 'cape') {
      /* capa curva: meio-cilindro cônico que abraça as costas e abre embaixo */
      const capeGeo = new THREE.CylinderGeometry(
        .52 * bulk, .92 * bulk, 1.65, 18, 6, true, Math.PI * .62, Math.PI * .76
      );
      const cape = new THREE.Mesh(capeGeo, new THREE.MeshStandardMaterial({
        color: skin.extraColor, side: THREE.DoubleSide, roughness: .82,
        metalness: .12, transparent: true, opacity: .97
      }));
      cape.position.set(0, 1.28, .14); cape.rotation.x = .1;
      cape.castShadow = true; g.add(cape);
      /* gola: arco só nas costas, bem atrás da cabeça */
      const collar = new THREE.Mesh(
        new THREE.TorusGeometry(.46 * bulk, .085, 8, 18, Math.PI * .9),
        new THREE.MeshStandardMaterial({ color: MA.shade(skin.extraColor, 28), roughness: .6 })
      );
      collar.position.set(0, 1.97, .14);
      collar.rotation.set(Math.PI / 2, 0, Math.PI * .05);
      g.add(collar);
      g.userData.cape = cape;
    } else if (skin.extra === 'wings') {
      /* asas de morcego recortadas (Shape) em vez de retângulos */
      const sh = new THREE.Shape();
      sh.moveTo(0, 0);
      sh.quadraticCurveTo(.55, .52, 1.12, .40);
      sh.quadraticCurveTo(.92, .20, 1.02, -.02);
      sh.quadraticCurveTo(.80, .04, .74, -.22);
      sh.quadraticCurveTo(.58, -.10, .48, -.34);
      sh.quadraticCurveTo(.30, -.16, .20, -.40);
      sh.quadraticCurveTo(.08, -.20, 0, 0);
      const wGeo = new THREE.ShapeGeometry(sh, 14);
      const wmat = new THREE.MeshStandardMaterial({
        color: skin.extraColor, side: THREE.DoubleSide, roughness: .62,
        metalness: .1, transparent: true, opacity: .95,
        emissive: MA.shade(skin.extraColor, -45), emissiveIntensity: .45
      });
      const wings = [];
      [-1, 1].forEach(s => {
        const w = new THREE.Mesh(wGeo, wmat);
        w.scale.set(s * 1.18, 1.18, 1);
        w.position.set(s * .42, 1.68, .34);
        w.rotation.y = s * .72;
        g.add(w); wings.push(w);
      });
      g.userData.wings = wings;
    } else if (skin.extra === 'scarf') {
      const sc = new THREE.Mesh(new THREE.BoxGeometry(.82, .2, .82),
        new THREE.MeshStandardMaterial({ color: skin.extraColor, emissive: skin.extraColor, emissiveIntensity: .6 }));
      sc.position.y = 1.82; g.add(sc);
      const tail = new THREE.Mesh(new THREE.PlaneGeometry(.34, 1.25),
        new THREE.MeshStandardMaterial({
          color: skin.extraColor, side: THREE.DoubleSide,
          emissive: skin.extraColor, emissiveIntensity: .35
        }));
      tail.position.set(.2, 1.3, .48); g.add(tail);
      g.userData.cape = tail;
    }

    const armMat = mkMat(skin.arms, .29);
    const armL = new THREE.Mesh(new THREE.CapsuleGeometry(.225 * bulk, .43, 9, 22), armMat);
    armL.position.set(-.75 * bulk, 1.29, 0); armL.rotation.z = -.075; armL.castShadow = true; g.add(armL);
    const armR = new THREE.Mesh(new THREE.CapsuleGeometry(.225 * bulk, .43, 9, 22), armMat);
    armR.position.set(.75 * bulk, 1.29, 0); armR.rotation.z = .075; armR.castShadow = true; g.add(armR);

    /* Mãos-mitten com polegar separado: simples, grandes e expressivas. */
    const handMat = mkMat(MA.shade(skin.skinTone, 3), .27);
    [armL, armR].forEach((arm, i) => {
      const side = i ? 1 : -1;
      const hand = new THREE.Mesh(new THREE.SphereGeometry(.245 * bulk, 22, 16), handMat);
      hand.position.y = -.38; hand.scale.set(1.03, .95, 1); hand.castShadow = true; arm.add(hand);
      const thumb = new THREE.Mesh(new THREE.SphereGeometry(.105 * bulk, 16, 12), handMat);
      thumb.position.set(-side * .17, -.015, -.08); thumb.scale.set(.92, 1.10, .86); hand.add(thumb);
    });
    /* Ombros menores só fazem a transição entre manga e torso. */
    [-1, 1].forEach(sg => {
      const sh = new THREE.Mesh(new THREE.SphereGeometry(.285 * bulk, 22, 16), mkMat(skin.arms, .29));
      sh.position.set(sg * .60 * bulk, 1.57, 0); sh.scale.set(1, .92, .94); sh.castShadow = true; g.add(sh);
    });

    /* Quadril alto e pernas curtas mantêm a silhueta compacta. */
    const hips = new THREE.Mesh(new THREE.SphereGeometry(.49 * bulk, 24, 16), mkMat(skin.legs, .34));
    hips.position.y = .74; hips.scale.set(1, .56, .87); g.add(hips);

    const legMat = mkMat(skin.legs, .32);
    const legL = new THREE.Mesh(new THREE.CapsuleGeometry(.235 * bulk, .34, 9, 22), legMat);
    legL.position.set(-.285 * bulk, .40, 0); legL.castShadow = true; g.add(legL);
    const legR = new THREE.Mesh(new THREE.CapsuleGeometry(.235 * bulk, .34, 9, 22), legMat);
    legR.position.set(.285 * bulk, .40, 0); legR.castShadow = true; g.add(legR);

    /* Botas grandes, arredondadas e avançadas para a frente. */
    const shoeMat = mkMat(MA.shade(skin.legs, -34), .25);
    const soleMat = new THREE.MeshPhysicalMaterial({ color: 0xf6f7ff, roughness: .24, metalness: .01, clearcoat: .24, clearcoatRoughness: .22 });
    [legL, legR].forEach(leg => {
      const shoe = new THREE.Mesh(new THREE.SphereGeometry(.305 * bulk, 24, 16), shoeMat);
      shoe.position.set(0, -.35, -.14); shoe.scale.set(.94, .59, 1.38); shoe.castShadow = true; leg.add(shoe);
      const sole = new THREE.Mesh(new THREE.SphereGeometry(.285 * bulk, 22, 12), soleMat);
      sole.position.set(0, -.45, -.15); sole.scale.set(1, .22, 1.42); leg.add(sole);
    });

    /* Armas com silhuetas próprias. Todos os cinco modelos ficam no suporte,
       mas só o selecionado é visível; trocar de arma deixa de ser apenas uma
       mudança de nome/cor e passa a mudar o objeto nas mãos do jogador. */
    const gun = new THREE.Group();
    const weaponVisuals = MA.WEAPONS.map(w => {
      const visual = MA.createWeaponModel(w);
      visual.group.visible = false;
      gun.add(visual.group);
      return visual;
    });
    weaponVisuals[0].group.visible = true;
    const tip = weaponVisuals[0].tip;
    const muzzle = weaponVisuals[0].muzzle;
    gun.position.set(1.02 * bulk, 1.22, -.2);
    gun.scale.setScalar(.86);
    g.add(gun);

    const aura = new THREE.Mesh(
      new THREE.RingGeometry(.95, 1.3, 36),
      new THREE.MeshBasicMaterial({ color: skin.aura, transparent: true, opacity: .4, side: THREE.DoubleSide, depthWrite: false })
    );
    aura.rotation.x = -Math.PI / 2; aura.position.y = .07; g.add(aura);

    const ultAura = new THREE.Mesh(
      new THREE.IcosahedronGeometry(2.5, 1),
      new THREE.MeshBasicMaterial({ color: 0xff00c8, transparent: true, opacity: .18, wireframe: true })
    );
    ultAura.position.y = 1.35; ultAura.visible = false; g.add(ultAura);

    const shieldMesh = new THREE.Mesh(
      new THREE.SphereGeometry(1.7, 20, 14),
      new THREE.MeshBasicMaterial({ color: 0xb9c4cc, transparent: true, opacity: .22, wireframe: true })
    );
    shieldMesh.position.y = 1.25; shieldMesh.visible = false; g.add(shieldMesh);

    /* peças exclusivas da skin (orelhas do doge, terno do sigma, ...) */
    const panim = [];
    if (MA.PBUILDS && MA.PBUILDS[skin.id]) {
      try {
        MA.PBUILDS[skin.id]({
          g, body, head, neck, hood, armL, armR, legL, legR, gun, skin, trans,
          add: m => { m.castShadow = true; g.add(m); return m; },
          anim: fn => panim.push(fn)
        });
      } catch (err) { console.warn('[MemeArena] skin 3D falhou:', skin.id, err); }
    }
    /* A armadura é uma segunda camada visual independente da skin. */
    if (MA.applyArmorModel) {
      try {
        MA.applyArmorModel({
          g, body, head, neck, hood, armL, armR, legL, legR, gun,
          armor: armorDef, skin, bulk, trans,
          add: m => { m.castShadow = true; g.add(m); return m; },
          anim: fn => panim.push(fn)
        });
      } catch (err) { console.warn('[MemeArena] armadura 3D falhou:', armorDef && armorDef.id, err); }
    }
    g.userData.panim = panim;

    MA.linearizeColors(g);
    scene.add(g);

    const bonusHp = (armorDef && armorDef.hp) || 0;
    const dr = (armorDef && armorDef.dr) || 0;

    const result = {
      obj: g, head, gun, tip, muzzle, weaponVisuals,
      aura, ultAura, shieldMesh, armL, armR, legL, legR, body,
      skin, armorDef,
      pos: new THREE.Vector3(0, 0, 26), vel: V3(),
      y: 0, vy: 0, onGround: true,
      hp: 100 + bonusHp, maxhp: 100 + bonusHp,
      energy: 100, maxenergy: 100,
      weapon: 0, cooldown: 0, invuln: 0,
      dashCd: 0, dashCharges: 1, dashMax: 1, dashTimer: 0,
      bob: 0, recoil: 0, radius: .85 * bulk,
      bDmg: 0, bSpeed: 0, bShield: 0, bRate: 0,
      mDmg: 1, mRate: 1, mSpeed: 1, mSize: 1, mScore: 1,
      crit: 0.05, lifesteal: 0, extraShots: 0, pierce: 0, deathBoom: 0,
      magnet: 3, enRegen: 14, autoShield: 0, autoShieldT: 0,
      brainGain: 1, dropRate: 1, knock: 1, armor: 1 - dr, thorns: 0, bounce: 0,
      allowedWeapons: null
    };
    MA.syncWeaponModel(result);
    return result;
  }

    /* ============================================================ INIMIGOS */
  const geoCache = {};
  function cachedGeo(key, make) {
    if (!geoCache[key]) { geoCache[key] = make(); geoCache[key].userData = { shared: true }; }
    return geoCache[key];
  }

  function createEnemy(scene, def, opts) {
    opts = opts || {};
    const isBoss = !!opts.boss, elite = !!opts.elite;
    const sc = (def.scale || 1) * (elite ? 1.3 : 1);
    const g = new THREE.Group();
    const R = (isBoss ? 2.7 : .74) * sc;
    const k = R.toFixed(2);

    const bodyGeo = isBoss
      ? cachedGeo('bs' + k, () => new THREE.SphereGeometry(R, 28, 20))
      : cachedGeo('bc' + k, () => new THREE.CapsuleGeometry(R * .7, R * .9, 6, 14));
    const body = new THREE.Mesh(bodyGeo, new THREE.MeshStandardMaterial({
      color: def.color, roughness: .55, metalness: .25,
      emissive: new THREE.Color(def.color).multiplyScalar(.25), emissiveIntensity: .7
    }));
    body.position.y = R * 1.15; body.castShadow = true; g.add(body);

    const HR = (isBoss ? 2.3 : .64) * sc;
    /* crânio em cor sólida + "adesivo" do rosto virado pra frente, assim o
       desenho nunca aparece esticado em volta da esfera                    */
    const head = new THREE.Mesh(
      cachedGeo('hs' + HR.toFixed(2), () => new THREE.SphereGeometry(HR, 24, 18)),
      new THREE.MeshStandardMaterial({
        color: MA.shade(def.color, -18), roughness: .62, metalness: .1
      })
    );
    const faceTex = MA.Tex.face(def, null, null, elite);
    const faceDisc = new THREE.Mesh(
      cachedGeo('fd' + HR.toFixed(2), () => new THREE.SphereGeometry(HR * 1.012, 26, 20, -0.95, 1.9, 0.42, 2.3)),
      new THREE.MeshStandardMaterial({ map: faceTex, roughness: .5, transparent: true })
    );
    faceDisc.rotation.y = Math.PI / 2;
    head.add(faceDisc);
    head.position.y = R * 1.15 + R * (isBoss ? 1.08 : 1.22) + HR * .18;
    head.castShadow = true; g.add(head);

    if (isBoss) {
      const spikeGeo = cachedGeo('spk', () => new THREE.ConeGeometry(.36, 1.7, 8));
      const spikeMat = new THREE.MeshStandardMaterial({ color: def.ring, emissive: def.ring, emissiveIntensity: .85, metalness: .85 });
      for (let i = 0; i < 10; i++) {
        const sp = new THREE.Mesh(spikeGeo, spikeMat);
        const a = i / 10 * TAU;
        sp.position.set(Math.cos(a) * HR * .95, head.position.y + HR * .72, Math.sin(a) * HR * .95);
        sp.rotation.z = -Math.cos(a) * .62; sp.rotation.x = Math.sin(a) * .62;
        g.add(sp);
      }
    }
    if (elite) {
      const crown = new THREE.Mesh(
        new THREE.TorusGeometry(HR * 1.05, HR * .1, 8, 24),
        new THREE.MeshBasicMaterial({ color: 0xffd400 })
      );
      crown.rotation.x = Math.PI / 2;
      crown.position.y = head.position.y + HR * .95;
      g.add(crown);
    }

    const limbMat = new THREE.MeshStandardMaterial({ color: MA.shade(def.color, -55), roughness: .72 });
    const armGeo = cachedGeo('ar' + k, () => new THREE.CapsuleGeometry(R * .22, R * .7, 4, 8));
    const legGeo = cachedGeo('lg' + k, () => new THREE.CapsuleGeometry(R * .25, R * .55, 4, 8));
    const a1 = new THREE.Mesh(armGeo, limbMat); a1.position.set(-R * 1.1, R * 1.3, 0); g.add(a1);
    const a2 = new THREE.Mesh(armGeo, limbMat); a2.position.set(R * 1.1, R * 1.3, 0); g.add(a2);
    const l1 = new THREE.Mesh(legGeo, limbMat); l1.position.set(-R * .4, R * .45, 0); g.add(l1);
    const l2 = new THREE.Mesh(legGeo, limbMat); l2.position.set(R * .4, R * .45, 0); g.add(l2);

    const hbCan = document.createElement('canvas'); hbCan.width = 128; hbCan.height = 16;
    const hbTex = new THREE.CanvasTexture(hbCan);
    const hb = new THREE.Sprite(new THREE.SpriteMaterial({ map: hbTex, depthTest: false, transparent: true }));
    hb.scale.set(isBoss ? 9 : 2.3, isBoss ? 1.1 : .3, 1);
    hb.position.y = head.position.y + HR * 1.65;
    g.add(hb);

    const glow = new THREE.Mesh(
      cachedGeo('gl' + k, () => new THREE.PlaneGeometry(R * 5, R * 5)),
      new THREE.MeshBasicMaterial({
        map: MA.Tex.glow('#ffffff'), color: elite ? 0xffd400 : new THREE.Color(def.color),
        transparent: true, opacity: .5, depthWrite: false, blending: THREE.AdditiveBlending
      })
    );
    glow.rotation.x = -Math.PI / 2; glow.position.y = .05; g.add(glow);

    /* ---- peças exclusivas do meme (src/builds.js) ---- */
    const anim = [];
    const builder = MA.BUILDS && MA.BUILDS[def.id];
    if (builder) {
      try {
        builder({
          g, body, head, a1, a2, l1, l2,
          R, HR, sc, def, isBoss, elite, anim,
          headY: head.position.y,
          add(mesh) { mesh.castShadow = true; g.add(mesh); return mesh; }
        });
      } catch (err) { console.warn('[MemeArena] build falhou:', def.id, err); }
    }

    scene.add(g);

    const hpMul = (opts.hpScale || 1) * (elite ? 2.6 : 1);
    const dmgMul = (opts.dmgScale || 1) * (elite ? 1.45 : 1);

    const e = {
      def, obj: g, body, head, faceDisc, a1, a2, l1, l2, hb, hbCan, hbTex, glow,
      isBoss, elite, anim, animT: Math.random() * 10,
      hp: def.hp * hpMul, maxhp: def.hp * hpMul,
      dmg: def.dmg * dmgMul,
      speed: def.spd * (opts.spdScale || 1) * (elite ? .88 : 1),
      pts: def.pts * (elite ? 2.4 : 1),
      radius: R * 1.05,
      t: MA.rand(0, 10), atkCd: MA.rand(.6, 2.2), touchCd: 0,
      orbitDir: Math.random() < .5 ? 1 : -1,
      chargeCd: MA.rand(2.5, 5.5), charging: 0, chargeDir: V3(),
      tpCd: MA.rand(2, 5),
      knock: V3(), flash: 0, dead: false, phase: 1, hitBy: null,
      spawnT: 0.55
    };
    updateHB(e);
    g.scale.setScalar(0.01);
    return e;
  }

  function updateHB(e) {
    const x = e.hbCan.getContext('2d');
    x.clearRect(0, 0, 128, 16);
    x.fillStyle = 'rgba(0,0,0,.66)'; x.fillRect(0, 0, 128, 16);
    const f = MA.clamp(e.hp / e.maxhp, 0, 1);
    const g = x.createLinearGradient(0, 0, 128, 0);
    if (e.isBoss) { g.addColorStop(0, '#ff00c8'); g.addColorStop(1, '#ffe600'); }
    else if (e.elite) { g.addColorStop(0, '#ffd400'); g.addColorStop(1, '#ff8a00'); }
    else { g.addColorStop(0, '#ff2d6f'); g.addColorStop(1, '#ff9d00'); }
    x.fillStyle = g; x.fillRect(2, 2, 124 * f, 12);
    x.strokeStyle = 'rgba(255,255,255,.45)'; x.lineWidth = 1; x.strokeRect(1, 1, 126, 14);
    e.hbTex.needsUpdate = true;
  }

  /* ================================================================ ITENS */
  function createPickup(scene, x, z, type) {
    const g = new THREE.Group();
    const core = new THREE.Mesh(
      cachedGeo('pk', () => new THREE.IcosahedronGeometry(.72, 0)),
      new THREE.MeshStandardMaterial({ color: type.color, emissive: type.color, emissiveIntensity: .95, metalness: .7, roughness: .2 })
    );
    g.add(core);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: MA.Tex.face(type.emoji, '#ffffff', '#111111'), transparent: true
    }));
    sp.scale.set(1.15, 1.15, 1); sp.position.y = 1.35; g.add(sp);
    const halo = new THREE.Mesh(
      cachedGeo('hl', () => new THREE.PlaneGeometry(4.2, 4.2)),
      new THREE.MeshBasicMaterial({
        map: MA.Tex.glow('#ffffff'), color: type.color, transparent: true,
        opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false
      })
    );
    halo.rotation.x = -Math.PI / 2; halo.position.y = .06; g.add(halo);
    g.position.set(x, 1.15, z);
    scene.add(g);
    return { obj: g, core, type, t: MA.rand(0, 6), life: 26 };
  }

  MA.FX = FX;
  MA.createPlayer = createPlayer;
  MA.createEnemy = createEnemy;
  MA.updateHB = updateHB;
  MA.createPickup = createPickup;
})(window.MA);
