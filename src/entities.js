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

  /* ============================================================= JOGADOR */
  function createPlayer(scene) {
    const g = new THREE.Group();

    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(.56, .92, 6, 18),
      new THREE.MeshStandardMaterial({ color: 0x3f5190, roughness: .7, emissive: 0x111c48, emissiveIntensity: .45 })
    );
    body.position.y = 1.16; body.castShadow = true; g.add(body);

    // detalhe do moletom
    const hood = new THREE.Mesh(
      new THREE.SphereGeometry(.46, 18, 12, 0, TAU, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0x2c3a6e, roughness: .8 })
    );
    hood.position.y = 1.72; hood.rotation.x = Math.PI; g.add(hood);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(.56, 26, 20),
      new THREE.MeshStandardMaterial({ map: MA.Tex.face('😎', '#e8b07a', '#4a3318'), roughness: .55 })
    );
    head.position.y = 2.18; head.castShadow = true; g.add(head);

    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(.59, .59, .2, 22),
      new THREE.MeshStandardMaterial({ color: 0xff2d6f, emissive: 0x8a0036, emissiveIntensity: .55, roughness: .5 })
    );
    cap.position.y = 2.58; g.add(cap);
    const brim = new THREE.Mesh(
      new THREE.BoxGeometry(.9, .07, .55),
      new THREE.MeshStandardMaterial({ color: 0xcc1050, roughness: .5 })
    );
    brim.position.set(0, 2.5, -.5); g.add(brim);

    const armMat = new THREE.MeshStandardMaterial({ color: 0x4f63a8, roughness: .7 });
    const armL = new THREE.Mesh(new THREE.CapsuleGeometry(.18, .58, 4, 12), armMat);
    armL.position.set(-.74, 1.32, 0); armL.castShadow = true; g.add(armL);
    const armR = new THREE.Mesh(new THREE.CapsuleGeometry(.18, .58, 4, 12), armMat);
    armR.position.set(.74, 1.32, 0); armR.castShadow = true; g.add(armR);

    const legMat = new THREE.MeshStandardMaterial({ color: 0x232f5e, roughness: .82 });
    const legL = new THREE.Mesh(new THREE.CapsuleGeometry(.21, .56, 4, 12), legMat);
    legL.position.set(-.27, .46, 0); legL.castShadow = true; g.add(legL);
    const legR = new THREE.Mesh(new THREE.CapsuleGeometry(.21, .56, 4, 12), legMat);
    legR.position.set(.27, .46, 0); legR.castShadow = true; g.add(legR);

    /* arma */
    const gun = new THREE.Group();
    const barrel = new THREE.Mesh(
      new THREE.BoxGeometry(.22, .22, 1.4),
      new THREE.MeshStandardMaterial({ color: 0x14142a, metalness: .92, roughness: .22 })
    );
    barrel.position.z = .58; gun.add(barrel);
    const tip = new THREE.Mesh(
      new THREE.SphereGeometry(.17, 14, 10),
      new THREE.MeshBasicMaterial({ color: 0xffe600 })
    );
    tip.position.z = 1.26; gun.add(tip);
    const muzzle = new THREE.Sprite(new THREE.SpriteMaterial({
      map: MA.Tex.glow('#ffffff'), color: 0xffe600, transparent: true,
      blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0
    }));
    muzzle.scale.setScalar(2.4); muzzle.position.z = 1.4; gun.add(muzzle);
    const mag = new THREE.Mesh(
      new THREE.BoxGeometry(.2, .36, .32),
      new THREE.MeshStandardMaterial({ color: 0xff00c8, emissive: 0xff00c8, emissiveIntensity: .6 })
    );
    mag.position.set(0, -.26, .18); gun.add(mag);
    gun.position.set(.74, 1.36, .3);
    g.add(gun);

    const aura = new THREE.Mesh(
      new THREE.RingGeometry(.95, 1.3, 36),
      new THREE.MeshBasicMaterial({ color: 0x00ffd5, transparent: true, opacity: .4, side: THREE.DoubleSide, depthWrite: false })
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

    scene.add(g);

    return {
      obj: g, head, gun, tip, muzzle, aura, ultAura, shieldMesh, armL, armR, legL, legR, body,
      pos: new THREE.Vector3(0, 0, 26), vel: V3(),
      y: 0, vy: 0, onGround: true,
      hp: 100, maxhp: 100,
      energy: 100, maxenergy: 100,
      weapon: 0, cooldown: 0, invuln: 0,
      dashCd: 0, dashCharges: 1, dashMax: 1, dashTimer: 0,
      bob: 0, recoil: 0, radius: .85,
      /* buffs temporários */
      bDmg: 0, bSpeed: 0, bShield: 0, bRate: 0,
      /* multiplicadores permanentes (perks) */
      mDmg: 1, mRate: 1, mSpeed: 1, mSize: 1, mScore: 1,
      crit: 0.05, lifesteal: 0, extraShots: 0, pierce: 0, deathBoom: 0,
      magnet: 3, enRegen: 14, autoShield: 0, autoShieldT: 0,
      brainGain: 1, dropRate: 1, knock: 1, armor: 1, thorns: 0, bounce: 0
    };
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
    const head = new THREE.Mesh(
      cachedGeo('hs' + HR.toFixed(2), () => new THREE.SphereGeometry(HR, 24, 18)),
      new THREE.MeshStandardMaterial({ map: MA.Tex.face(def.emoji, def.color, def.ring, elite), roughness: .5 })
    );
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

    scene.add(g);

    const hpMul = (opts.hpScale || 1) * (elite ? 2.6 : 1);
    const dmgMul = (opts.dmgScale || 1) * (elite ? 1.45 : 1);

    const e = {
      def, obj: g, body, head, a1, a2, l1, l2, hb, hbCan, hbTex, glow,
      isBoss, elite,
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
