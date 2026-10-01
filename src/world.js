/* MEME ARENA 3D — construção da arena, luzes, céu, obstáculos */
(function (MA) {
  'use strict';
  const TAU = MA.TAU;

  const W = {
    ARENA: 68,
    obstacles: [],
    lights: [],
    billboards: [],
    skyMesh: null, ringMesh: null, sun: null, monument: null,

    build(scene, quality, map) {
      this.scene = scene;
      this.map = map = map || (MA.MAPS ? MA.MAPS[0] : null);
      this.obstacles.length = 0; this.lights.length = 0; this.billboards.length = 0;
      this.drips = null; this.monument = null; this._ringHSL = null;

      scene.background = new THREE.Color(map.bg);
      scene.fog = new THREE.FogExp2(map.fog, map.fogD);

      /* céu */
      const skyGeo = new THREE.SphereGeometry(320, 48, 28);
      this.skyMesh = new THREE.Mesh(skyGeo, new THREE.MeshBasicMaterial({
        map: MA.Tex.sky(map.sky), side: THREE.BackSide, fog: false, depthWrite: false
      }));
      scene.add(this.skyMesh);

      /* chão */
      const ground = new THREE.Mesh(
        new THREE.BoxGeometry(this.ARENA * 2, 2, this.ARENA * 2),
        new THREE.MeshStandardMaterial({
          map: MA.Tex.ground(map.ground), roughness: .74, metalness: .22,
          emissive: map.fog, emissiveIntensity: .35
        })
      );
      ground.position.y = -1; ground.receiveShadow = quality !== 'low';
      scene.add(ground);

      /* anel neon do perímetro */
      this.ringMesh = new THREE.Mesh(
        new THREE.TorusGeometry(this.ARENA - 1.5, .55, 10, 110),
        new THREE.MeshBasicMaterial({ color: map.ring })
      );
      this.ringMesh.rotation.x = Math.PI / 2; this.ringMesh.position.y = .42;
      scene.add(this.ringMesh);

      /* paredes de energia */
      const wallMat = new THREE.MeshStandardMaterial({
        color: map.wall, transparent: true, opacity: .26, side: THREE.DoubleSide,
        emissive: map.wallEmissive, emissiveIntensity: 1.1, roughness: .3, depthWrite: false
      });
      const H = 18;
      [[0, -this.ARENA, 0], [0, this.ARENA, 0], [-this.ARENA, 0, Math.PI / 2], [this.ARENA, 0, Math.PI / 2]]
        .forEach(w => {
          const m = new THREE.Mesh(new THREE.PlaneGeometry(this.ARENA * 2, H), wallMat);
          m.position.set(w[0], H / 2, w[1]); m.rotation.y = w[2] || 0;
          scene.add(m);
        });

      /* luzes */
      scene.add(new THREE.AmbientLight(map.ambient[0], map.ambient[1]));
      scene.add(new THREE.HemisphereLight(map.hemi[0], map.hemi[1], map.hemi[2]));

      this.sun = new THREE.DirectionalLight(map.sun3d[0], map.sun3d[1]);
      this.sun.position.set(44, 78, 32);
      if (quality !== 'low') {
        this.sun.castShadow = true;
        const res = quality === 'high' ? 2048 : 1024;
        this.sun.shadow.mapSize.set(res, res);
        const d = 86;
        this.sun.shadow.camera.left = -d; this.sun.shadow.camera.right = d;
        this.sun.shadow.camera.top = d; this.sun.shadow.camera.bottom = -d;
        this.sun.shadow.camera.far = 240;
        this.sun.shadow.bias = -0.0008;
      }
      scene.add(this.sun);

      const neon = map.neon;
      const nLights = quality === 'low' ? 2 : quality === 'high' ? 5 : 3;
      for (let i = 0; i < nLights; i++) {
        const pl = new THREE.PointLight(neon[i % neon.length], 1.0, 52, 2);
        pl.position.set(Math.cos(i / nLights * TAU) * 36, 11, Math.sin(i / nLights * TAU) * 36);
        scene.add(pl);
        this.lights.push({ light: pl, a: i / nLights * TAU, r: 36 });
      }

      this._monument(scene, map);
      this._obstacles(scene, map);
      this._billboards(scene, map);
      this._stars(scene, quality);
      if (map.props && this['_props_' + map.props]) this['_props_' + map.props](scene, map);
    },

    _monument(scene, map) {
      if (map && map.monument && map.monument !== 'likes' && this['_mon_' + map.monument]) return this['_mon_' + map.monument](scene, map);
      const palette = [0xff00c8, 0x00ffd5, 0xffe600, 0x6a5bff];
      const mon = new THREE.Group();
      for (let i = 0; i < 4; i++) {
        const s = 7.4 - i * 1.5;
        const box = new THREE.Mesh(
          new THREE.BoxGeometry(s, 1.7, s),
          new THREE.MeshStandardMaterial({
            color: palette[i % 4], emissive: palette[i % 4],
            emissiveIntensity: .32, metalness: .6, roughness: .3
          })
        );
        box.position.y = .85 + i * 1.7; box.castShadow = true; box.receiveShadow = true;
        mon.add(box);
      }
      const like = new THREE.Mesh(
        new THREE.SphereGeometry(1.7, 24, 18),
        new THREE.MeshStandardMaterial({ color: 0xff2d6f, emissive: 0xff2d6f, emissiveIntensity: 1 })
      );
      like.position.y = 9.1; mon.add(like);
      const halo = new THREE.Mesh(
        new THREE.TorusGeometry(2.6, .14, 8, 40),
        new THREE.MeshBasicMaterial({ color: 0x00ffd5 })
      );
      halo.position.y = 9.1; halo.rotation.x = Math.PI / 2.4; mon.add(halo);
      scene.add(mon);
      this.monument = { group: mon, orb: like, halo };
      this.obstacles.push({ x: 0, z: 0, r: 5.4, h: 10.5 });
    },

    _obstacles(scene, map) {
      const ocfg = (map && map.obstacle) || {};
      const palette = ocfg.palette || [0xff00c8, 0x00ffd5, 0xffe600, 0x6a5bff, 0xff2d6f, 0x39ff88];
      const style = ocfg.style || 'neonbox';
      const count = ocfg.count || 20;
      const spots = [];
      for (let i = 0; i < count; i++) {
        let x = 0, z = 0, ok = false, tries = 0;
        while (!ok && tries++ < 80) {
          x = MA.rand(-this.ARENA + 11, this.ARENA - 11);
          z = MA.rand(-this.ARENA + 11, this.ARENA - 11);
          ok = Math.hypot(x, z) > 14;
          for (const s of spots) if (Math.hypot(s.x - x, s.z - z) < 13) ok = false;
        }
        if (!ok) continue;
        spots.push({ x, z });
        const col = MA.pick(palette);
        const res = this['_obs_' + style](scene, x, z, col, map);
        this.obstacles.push({ x, z, r: res.r, h: res.h });
      }
    },

    /* ================================================ OBSTÁCULOS ===== */
    _obs_neonbox(scene, x, z, col) {
      const w = MA.rand(3, 7.5), h = MA.rand(2.5, 10), d = MA.rand(3, 7.5);
      const m = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        new THREE.MeshStandardMaterial({
          color: 0x0d0320, emissive: col, emissiveIntensity: .35,
          metalness: .55, roughness: .34
        })
      );
      m.position.set(x, h / 2, z); m.rotation.y = MA.rand(0, TAU);
      m.castShadow = true; m.receiveShadow = true;
      m.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry),
        new THREE.LineBasicMaterial({ color: col })));
      scene.add(m);
      return { r: Math.max(w, d) * .6, h };
    },

    /* celeiro/silo de Ohio */
    _obs_silo(scene, x, z, col) {
      const g = new THREE.Group();
      const r = MA.rand(2.2, 3.6), h = MA.rand(6, 12);
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(r, r, h, 16),
        new THREE.MeshStandardMaterial({ color: col, roughness: .82, metalness: .25 })
      );
      body.position.y = h / 2; body.castShadow = body.receiveShadow = true; g.add(body);
      const roof = new THREE.Mesh(
        new THREE.ConeGeometry(r * 1.14, r * 1.1, 16),
        new THREE.MeshStandardMaterial({ color: MA.shade('#' + col.toString(16).padStart(6, '0'), -45), roughness: .7, metalness: .4 })
      );
      roof.position.y = h + r * .55; roof.castShadow = true; g.add(roof);
      for (let i = 1; i < 4; i++) {
        const band = new THREE.Mesh(new THREE.TorusGeometry(r * 1.02, .09, 6, 18),
          new THREE.MeshStandardMaterial({ color: 0x4a3a22, roughness: .8 }));
        band.rotation.x = Math.PI / 2; band.position.y = h * i / 4; g.add(band);
      }
      g.position.set(x, 0, z); g.rotation.y = MA.rand(0, TAU);
      scene.add(g);
      return { r: r * 1.1, h: h + r };
    },

    /* canos do esgoto — torres finas, canos deitados e válvulas */
    _obs_pipe(scene, x, z, col) {
      const g = new THREE.Group();
      const mat = new THREE.MeshStandardMaterial({ color: col, roughness: .5, metalness: .7 });
      const dark = new THREE.MeshStandardMaterial({ color: MA.shade('#' + col.toString(16).padStart(6, '0'), -45), roughness: .6, metalness: .6 });
      const kind = Math.random();
      let rad, hgt;

      if (kind < .45) {
        /* coluna de cano com flanges */
        rad = MA.rand(.6, 1.1); hgt = MA.rand(5, 11);
        const tube = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad, hgt, 12), mat);
        tube.position.y = hgt / 2; tube.castShadow = tube.receiveShadow = true; g.add(tube);
        for (let i = 1; i <= 3; i++) {
          const fl = new THREE.Mesh(new THREE.CylinderGeometry(rad * 1.35, rad * 1.35, .28, 12), dark);
          fl.position.y = hgt * i / 4; g.add(fl);
        }
        const valve = new THREE.Mesh(new THREE.TorusGeometry(rad * .85, rad * .16, 6, 14),
          new THREE.MeshStandardMaterial({ color: 0xc0392b, roughness: .5, metalness: .6 }));
        valve.position.set(0, hgt * .62, rad * 1.1); valve.rotation.x = Math.PI / 2; g.add(valve);
      } else if (kind < .78) {
        /* cano deitado sobre dois apoios (dá pra usar de cobertura) */
        rad = MA.rand(.7, 1.2); hgt = rad * 2.4;
        const len = MA.rand(7, 13);
        const tube = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad, len, 12), mat);
        tube.rotation.z = Math.PI / 2; tube.position.y = rad * 1.9;
        tube.castShadow = tube.receiveShadow = true; g.add(tube);
        [-1, 1].forEach(sx => {
          const leg = new THREE.Mesh(new THREE.BoxGeometry(.4, rad * 1.9, rad * 2.2), dark);
          leg.position.set(sx * len * .36, rad * .95, 0); g.add(leg);
        });
        const flange = new THREE.Mesh(new THREE.CylinderGeometry(rad * 1.3, rad * 1.3, .3, 12), dark);
        flange.rotation.z = Math.PI / 2; flange.position.set(len * .5, rad * 1.9, 0); g.add(flange);
        rad = len * .45;
      } else {
        /* saída de esgoto com cotovelo virado pro chão */
        rad = MA.rand(.8, 1.3); hgt = MA.rand(3.5, 6);
        const tube = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad, hgt, 12), mat);
        tube.position.y = hgt / 2; tube.castShadow = true; g.add(tube);
        const elbow = new THREE.Mesh(new THREE.TorusGeometry(rad * 1.5, rad * .92, 10, 16, Math.PI / 2), mat);
        elbow.position.set(0, hgt, 0); elbow.rotation.x = Math.PI; elbow.rotation.y = MA.rand(0, TAU);
        elbow.castShadow = true; g.add(elbow);
        const mouth = new THREE.Mesh(new THREE.CircleGeometry(rad * .85, 14),
          new THREE.MeshBasicMaterial({ color: 0x062a24 }));
        mouth.position.y = hgt + .02; mouth.rotation.x = -Math.PI / 2; g.add(mouth);
      }

      g.position.set(x, 0, z); g.rotation.y = MA.rand(0, TAU);
      scene.add(g);
      return { r: Math.max(1, rad * 1.25), h: hgt + 1 };
    },

    /* guarda-sol da praia */
    _obs_umbrella(scene, x, z, col) {
      const g = new THREE.Group();
      const h = MA.rand(4.5, 6.5), r = MA.rand(3, 4.6);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, h, 8),
        new THREE.MeshStandardMaterial({ color: 0xd8d8d8, metalness: .8, roughness: .3 }));
      pole.position.y = h / 2; pole.castShadow = true; g.add(pole);
      const top = new THREE.Mesh(new THREE.ConeGeometry(r, r * .55, 14, 1, true),
        new THREE.MeshStandardMaterial({ color: col, roughness: .75, side: THREE.DoubleSide }));
      top.position.y = h; top.castShadow = true; g.add(top);
      const stripes = new THREE.Mesh(new THREE.ConeGeometry(r * .99, r * .54, 14, 1, true),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .75, side: THREE.DoubleSide, transparent: true, opacity: .4 }));
      stripes.position.y = h - .02; stripes.rotation.y = .22; g.add(stripes);
      /* cadeira */
      const chair = new THREE.Mesh(new THREE.BoxGeometry(1.6, .25, 2.6),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .8 }));
      chair.position.set(r * .5, .5, 0); chair.rotation.z = -.14; chair.castShadow = true; g.add(chair);
      g.position.set(x, 0, z); g.rotation.y = MA.rand(0, TAU);
      scene.add(g);
      return { r: 1.2, h: h };
    },

    /* rack de servidor */
    _obs_rack(scene, x, z, col) {
      const g = new THREE.Group();
      const w = MA.rand(3, 5), h = MA.rand(5, 11), d = MA.rand(2, 3.4);
      const frame = new THREE.Mesh(new THREE.BoxGeometry(w, h, d),
        new THREE.MeshStandardMaterial({ color: 0x242838, metalness: .7, roughness: .4,
          emissive: col, emissiveIntensity: .12 }));
      frame.position.y = h / 2; frame.castShadow = frame.receiveShadow = true; g.add(frame);
      const n = Math.floor(h / 1.1);
      for (let i = 0; i < n; i++) {
        const led = new THREE.Mesh(new THREE.PlaneGeometry(w * .82, .3),
          new THREE.MeshBasicMaterial({ color: Math.random() < .25 ? 0xff2d6f : col, transparent: true, opacity: .55 + Math.random() * .45 }));
        led.position.set(0, .7 + i * 1.1, d / 2 + .02); g.add(led);
      }
      g.position.set(x, 0, z); g.rotation.y = Math.round(MA.rand(0, 4)) * Math.PI / 2 + MA.rand(-.2, .2);
      scene.add(g);
      return { r: Math.max(w, d) * .6, h };
    },

    /* ================================================= MONUMENTOS ==== */
    _mon_corn(scene) {
      const g = new THREE.Group();
      const cob = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.8, 11, 18),
        new THREE.MeshStandardMaterial({ color: 0xffc42e, emissive: 0x7a4a00, emissiveIntensity: .45, roughness: .55 }));
      cob.position.y = 5.5; cob.castShadow = true; g.add(cob);
      const tip = new THREE.Mesh(new THREE.ConeGeometry(2.4, 3, 18),
        new THREE.MeshStandardMaterial({ color: 0xffd966, emissive: 0x7a5a00, emissiveIntensity: .4 }));
      tip.position.y = 12.3; g.add(tip);
      for (let i = 0; i < 5; i++) {
        const leaf = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 9),
          new THREE.MeshStandardMaterial({ color: 0x5a8f3a, side: THREE.DoubleSide, roughness: .85 }));
        const a = i / 5 * TAU;
        leaf.position.set(Math.cos(a) * 2.6, 4.6, Math.sin(a) * 2.6);
        leaf.rotation.set(.22, -a, .3); g.add(leaf);
      }
      scene.add(g);
      this.monument = { group: g, orb: tip, halo: null };
      this.obstacles.push({ x: 0, z: 0, r: 3.6, h: 13 });
    },

    _mon_toilet(scene) {
      const g = new THREE.Group();
      const porcelain = new THREE.MeshStandardMaterial({ color: 0xf2f4f6, roughness: .25, metalness: .12 });
      const base = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 4.4, 4.5, 22), porcelain);
      base.position.y = 2.25; base.castShadow = base.receiveShadow = true; g.add(base);
      const bowl = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 3.2, 3.2, 24), porcelain);
      bowl.position.y = 6.1; bowl.castShadow = true; g.add(bowl);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(4.15, .5, 10, 28), porcelain);
      rim.rotation.x = Math.PI / 2; rim.position.y = 7.7; g.add(rim);
      const water = new THREE.Mesh(new THREE.CircleGeometry(3.7, 24),
        new THREE.MeshStandardMaterial({ color: 0x2f8f9f, emissive: 0x11506a, emissiveIntensity: .8, roughness: .1, metalness: .4 }));
      water.rotation.x = -Math.PI / 2; water.position.y = 7.5; g.add(water);
      const tank = new THREE.Mesh(new THREE.BoxGeometry(6, 4.6, 2.2), porcelain);
      tank.position.set(0, 8.2, -4.4); tank.castShadow = true; g.add(tank);
      scene.add(g);
      this.monument = { group: g, orb: water, halo: rim };
      this.obstacles.push({ x: 0, z: 0, r: 5, h: 10 });
    },

    _mon_shark(scene) {
      const g = new THREE.Group();
      const blue = new THREE.MeshStandardMaterial({ color: 0x3fb9ff, roughness: .4, metalness: .2 });
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(2.6, 7, 10, 20), blue);
      body.rotation.z = Math.PI / 2; body.position.y = 4.2; body.castShadow = true; g.add(body);
      const belly = new THREE.Mesh(new THREE.CapsuleGeometry(2.1, 6.4, 8, 16),
        new THREE.MeshStandardMaterial({ color: 0xe9f4ff, roughness: .5 }));
      belly.rotation.z = Math.PI / 2; belly.position.set(0, 3.3, .7); g.add(belly);
      const fin = new THREE.Mesh(new THREE.ConeGeometry(2, 4.4, 4), blue);
      fin.position.y = 8; fin.rotation.y = Math.PI / 4; fin.castShadow = true; g.add(fin);
      const tail = new THREE.Mesh(new THREE.ConeGeometry(2.6, 4, 4), blue);
      tail.position.set(-6.4, 4.6, 0); tail.rotation.z = Math.PI / 2 + .5; g.add(tail);
      [-1, 1].forEach(s => {
        const shoe = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.3, 1.6),
          new THREE.MeshStandardMaterial({ color: 0x1b63d8, roughness: .6 }));
        shoe.position.set(2.2, .7, s * 1.6); shoe.castShadow = true; g.add(shoe);
      });
      scene.add(g);
      this.monument = { group: g, orb: fin, halo: null };
      this.obstacles.push({ x: 0, z: 0, r: 5.2, h: 9 });
    },

    _mon_core(scene) {
      const g = new THREE.Group();
      const core = new THREE.Mesh(new THREE.IcosahedronGeometry(3.4, 1),
        new THREE.MeshStandardMaterial({
          color: 0xff3ca6, emissive: 0xff3ca6, emissiveIntensity: .9,
          flatShading: true, metalness: .4, roughness: .3
        }));
      core.position.y = 7; g.add(core);
      const cage = new THREE.Mesh(new THREE.IcosahedronGeometry(5.2, 1),
        new THREE.MeshBasicMaterial({ color: 0x00e5ff, wireframe: true, transparent: true, opacity: .4 }));
      cage.position.y = 7; g.add(cage);
      for (let i = 0; i < 6; i++) {
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(.7, 7, .7),
          new THREE.MeshStandardMaterial({ color: 0x14141c, emissive: 0x6a00ff, emissiveIntensity: .35, metalness: .8 }));
        const a = i / 6 * TAU;
        pillar.position.set(Math.cos(a) * 5.4, 3.5, Math.sin(a) * 5.4);
        pillar.castShadow = true; g.add(pillar);
      }
      scene.add(g);
      this.monument = { group: g, orb: core, halo: cage };
      this.obstacles.push({ x: 0, z: 0, r: 6, h: 10 });
    },

    /* ======================================================= PROPS === */
    /* milharal de verdade: caule + folhas + espiga, desenhado em
       InstancedMesh (milhares de peças, só 3 chamadas de desenho) */
    _props_cornfield(scene) {
      const N = 260;
      const FOLHAS = 4;
      const caule = new THREE.InstancedMesh(
        new THREE.CylinderGeometry(.055, .09, 1, 5),
        new THREE.MeshStandardMaterial({ color: 0x4e7a2e, roughness: .95 }), N);
      const folha = new THREE.InstancedMesh(
        new THREE.PlaneGeometry(1.5, .34, 3, 1),
        new THREE.MeshStandardMaterial({
          color: 0x7cb83f, roughness: .9, side: THREE.DoubleSide
        }), N * FOLHAS);
      const espiga = new THREE.InstancedMesh(
        new THREE.CylinderGeometry(.12, .16, .8, 7),
        new THREE.MeshStandardMaterial({
          color: 0xe0b429, roughness: .75, emissive: 0x3a2a00, emissiveIntensity: .4
        }), N);

      const d = new THREE.Object3D();
      let fi = 0;
      for (let i = 0; i < N; i++) {
        const a = MA.rand(0, TAU), r = MA.rand(this.ARENA * .78, this.ARENA * 1.55);
        const x = Math.cos(a) * r, z = Math.sin(a) * r;
        const h = MA.rand(3.4, 5.2);
        const tilt = MA.rand(-.07, .07);

        d.position.set(x, h / 2, z);
        d.rotation.set(tilt, MA.rand(0, TAU), tilt * .6);
        d.scale.set(1, h, 1);
        d.updateMatrix(); caule.setMatrixAt(i, d.matrix);

        for (let k = 0; k < FOLHAS; k++) {
          const ang = MA.rand(0, TAU);
          const alt = h * (.35 + k * .16);
          d.position.set(x + Math.cos(ang) * .42, alt, z + Math.sin(ang) * .42);
          d.rotation.set(MA.rand(-.25, .25), -ang, MA.rand(.25, .7));
          d.scale.set(MA.rand(.8, 1.2), 1, 1);
          d.updateMatrix(); folha.setMatrixAt(fi++, d.matrix);
        }

        d.position.set(x + Math.cos(a) * .18, h * .78, z + Math.sin(a) * .18);
        d.rotation.set(.18, a, .1);
        d.scale.set(1, 1, 1);
        d.updateMatrix(); espiga.setMatrixAt(i, d.matrix);
      }
      [caule, folha, espiga].forEach(m => {
        m.instanceMatrix.needsUpdate = true;
        m.castShadow = false; m.receiveShadow = false;
        scene.add(m);
      });
    },

    _props_drips(scene) {
      const mat = new THREE.MeshBasicMaterial({ color: 0x39ff88, transparent: true, opacity: .55 });
      this.drips = [];
      for (let i = 0; i < 26; i++) {
        const m = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 1.6, 5), mat);
        const a = MA.rand(0, TAU), r = MA.rand(10, this.ARENA - 6);
        m.position.set(Math.cos(a) * r, MA.rand(2, 12), Math.sin(a) * r);
        scene.add(m); this.drips.push(m);
      }
    },

    _props_palms(scene) {
      for (let i = 0; i < 16; i++) {
        const a = MA.rand(0, TAU), r = MA.rand(this.ARENA * .8, this.ARENA * 1.25);
        const g = new THREE.Group();
        const h = MA.rand(7, 13);
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.35, .6, h, 8),
          new THREE.MeshStandardMaterial({ color: 0x8a6a3a, roughness: .9 }));
        trunk.position.y = h / 2; trunk.rotation.z = MA.rand(-.14, .14); g.add(trunk);
        for (let j = 0; j < 7; j++) {
          const leaf = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 6),
            new THREE.MeshStandardMaterial({ color: 0x2e8b57, side: THREE.DoubleSide, roughness: .85 }));
          const la = j / 7 * TAU;
          leaf.position.set(Math.cos(la) * 2.2, h, Math.sin(la) * 2.2);
          leaf.rotation.set(.9, -la, 0); g.add(leaf);
        }
        g.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
        scene.add(g);
      }
    },

    _props_cables(scene) {
      const mat = new THREE.MeshStandardMaterial({ color: 0x1a1a26, roughness: .7 });
      for (let i = 0; i < 24; i++) {
        const a = MA.rand(0, TAU);
        const r1 = this.ARENA - 2, h1 = MA.rand(15, 22);
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(Math.cos(a) * r1, h1, Math.sin(a) * r1),
          new THREE.Vector3(Math.cos(a + .5) * r1 * .82, h1 * .8, Math.sin(a + .5) * r1 * .82),
          new THREE.Vector3(Math.cos(a + 1.1) * r1, h1 * .9, Math.sin(a + 1.1) * r1)
        ]);
        const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, .1, 5, false), mat);
        scene.add(tube);
      }
    },

    _billboards(scene, map) {
      const texts = (map && map.signs) || [
        ['SKIBIDI\nZONE', '#00ffd5'], ['ERRO 404\nCÉREBRO NÃO ENCONTRADO', '#ff2d6f'],
        ['+1000\nSOCIAL CREDIT', '#ffe600'], ['SIGMA\nGRINDSET', '#ff00c8'],
        ['NO CAP\nFR FR ON GOD', '#7a5bff'], ['TOUCH\nGRASS', '#39ff88'],
        ['OHIO\nFINAL BOSS', '#ffc42e'], ['AURA\n-9999', '#3fb9ff']
      ];
      texts.forEach((t, i) => {
        const a = i / texts.length * TAU + .35;
        const m = new THREE.Mesh(
          new THREE.PlaneGeometry(15, 7.5),
          new THREE.MeshBasicMaterial({ map: MA.Tex.billboard(t[0], t[1]), transparent: true, side: THREE.DoubleSide })
        );
        m.position.set(Math.cos(a) * (this.ARENA - 2.5), 10 + Math.sin(i * 1.7) * 2, Math.sin(a) * (this.ARENA - 2.5));
        m.lookAt(0, 10, 0);
        scene.add(m); this.billboards.push(m);
      });
    },

    _stars(scene, quality) {
      const n = quality === 'low' ? 400 : 1100;
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        const r = MA.rand(140, 290), th = MA.rand(0, TAU), ph = Math.acos(MA.rand(-.05, 1));
        pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
        pos[i * 3 + 1] = Math.abs(r * Math.cos(ph)) + 22;
        pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
        const c = new THREE.Color().setHSL(MA.rand(.55, 1), .9, MA.rand(.5, .95));
        col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      }
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
      scene.add(new THREE.Points(geo, new THREE.PointsMaterial({
        size: 1.7, vertexColors: true, fog: false, transparent: true, opacity: .9
      })));
    },

    update(dt, time) {
      this.lights.forEach(ml => {
        ml.a += dt * .38;
        ml.light.position.x = Math.cos(ml.a) * ml.r;
        ml.light.position.z = Math.sin(ml.a) * ml.r;
        ml.light.intensity = .85 + Math.sin(time * 3 + ml.a) * .3;
      });
      if (this.skyMesh) this.skyMesh.rotation.y += dt * .005;
      if (this.ringMesh) {
        const base = this._ringHSL || (this._ringHSL =
          new THREE.Color(this.map ? this.map.ring : 0xff00c8).getHSL({ h: 0, s: 0, l: 0 }));
        this.ringMesh.material.color.setHSL(
          (base.h + Math.sin(time * .5) * .05 + 1) % 1,
          Math.min(1, base.s + .15),
          base.l + Math.sin(time * 1.6) * .08
        );
      }
      if (this.drips) {
        for (let i = 0; i < this.drips.length; i++) {
          const d = this.drips[i];
          d.position.y -= dt * 6;
          if (d.position.y < .4) d.position.y = MA.rand(8, 14);
        }
      }
      if (this.monument) {
        const mo = this.monument.orb, mh = this.monument.halo;
        if (mo) {
          if (mo.userData.baseY === undefined) mo.userData.baseY = mo.position.y;
          mo.rotation.y += dt * 1.5;
          mo.position.y = mo.userData.baseY + Math.sin(time * 1.7) * .3;
        }
        if (mh) {
          mh.rotation.z += dt * 1.1;
          if (mo) mh.position.y = mo.position.y;
        }
      }
      this.billboards.forEach((b, i) => { b.position.y = 10 + Math.sin(time * .75 + i) * .8; });
    },

    /* colisão circular contra obstáculos + limites */
    resolve(pos, radius) {
      for (let i = 0; i < this.obstacles.length; i++) {
        const o = this.obstacles[i];
        const dx = pos.x - o.x, dz = pos.z - o.z;
        const d = Math.hypot(dx, dz), min = o.r + radius;
        if (d < min && d > 0.0001) {
          const push = min - d;
          pos.x += dx / d * push; pos.z += dz / d * push;
        }
      }
      const lim = this.ARENA - 2;
      pos.x = MA.clamp(pos.x, -lim, lim);
      pos.z = MA.clamp(pos.z, -lim, lim);
    },

    blocks(p) {
      for (let i = 0; i < this.obstacles.length; i++) {
        const o = this.obstacles[i];
        if (p.y > o.h) continue;
        if (Math.hypot(p.x - o.x, p.z - o.z) < o.r) return true;
      }
      return false;
    },

    outside(p) {
      return Math.abs(p.x) > this.ARENA || Math.abs(p.z) > this.ARENA;
    },

    /* ponto de spawn válido longe do jogador */
    spawnPoint(playerPos, minDist) {
      minDist = minDist || 26;
      for (let i = 0; i < 40; i++) {
        const a = MA.rand(0, TAU), r = MA.rand(this.ARENA * .45, this.ARENA * .9);
        const x = Math.cos(a) * r, z = Math.sin(a) * r;
        if (Math.hypot(x - playerPos.x, z - playerPos.z) < minDist) continue;
        let bad = false;
        for (const o of this.obstacles) if (Math.hypot(x - o.x, z - o.z) < o.r + 2.5) bad = true;
        if (!bad) return { x, z };
      }
      const a = MA.rand(0, TAU);
      return { x: Math.cos(a) * this.ARENA * .8, z: Math.sin(a) * this.ARENA * .8 };
    }
  };

  MA.World = W;
})(window.MA);
