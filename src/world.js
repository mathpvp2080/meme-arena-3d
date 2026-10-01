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

    build(scene, quality) {
      this.scene = scene;
      this.obstacles.length = 0; this.lights.length = 0; this.billboards.length = 0;

      scene.background = new THREE.Color(0x06010f);
      scene.fog = new THREE.FogExp2(0x0d0126, 0.0125);

      /* céu */
      const skyGeo = new THREE.SphereGeometry(320, 48, 28);
      this.skyMesh = new THREE.Mesh(skyGeo, new THREE.MeshBasicMaterial({
        map: MA.Tex.sky(), side: THREE.BackSide, fog: false, depthWrite: false
      }));
      scene.add(this.skyMesh);

      /* chão */
      const ground = new THREE.Mesh(
        new THREE.BoxGeometry(this.ARENA * 2, 2, this.ARENA * 2),
        new THREE.MeshStandardMaterial({
          map: MA.Tex.ground(), roughness: .74, metalness: .22,
          emissive: 0x1a0540, emissiveIntensity: .55
        })
      );
      ground.position.y = -1; ground.receiveShadow = quality !== 'low';
      scene.add(ground);

      /* anel neon do perímetro */
      this.ringMesh = new THREE.Mesh(
        new THREE.TorusGeometry(this.ARENA - 1.5, .55, 10, 110),
        new THREE.MeshBasicMaterial({ color: 0xff00c8 })
      );
      this.ringMesh.rotation.x = Math.PI / 2; this.ringMesh.position.y = .42;
      scene.add(this.ringMesh);

      /* paredes de energia */
      const wallMat = new THREE.MeshStandardMaterial({
        color: 0x6a00ff, transparent: true, opacity: .26, side: THREE.DoubleSide,
        emissive: 0x4400aa, emissiveIntensity: 1.1, roughness: .3, depthWrite: false
      });
      const H = 18;
      [[0, -this.ARENA, 0], [0, this.ARENA, 0], [-this.ARENA, 0, Math.PI / 2], [this.ARENA, 0, Math.PI / 2]]
        .forEach(w => {
          const m = new THREE.Mesh(new THREE.PlaneGeometry(this.ARENA * 2, H), wallMat);
          m.position.set(w[0], H / 2, w[1]); m.rotation.y = w[2] || 0;
          scene.add(m);
        });

      /* luzes */
      scene.add(new THREE.AmbientLight(0x2a1d52, .30));
      scene.add(new THREE.HemisphereLight(0x6a38a8, 0x0d001c, .28));

      this.sun = new THREE.DirectionalLight(0xffcfa0, 1.15);
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

      const neon = [0xff00c8, 0x00ffd5, 0xffe600, 0x6a5bff, 0xff2d6f];
      const nLights = quality === 'low' ? 2 : quality === 'high' ? 5 : 3;
      for (let i = 0; i < nLights; i++) {
        const pl = new THREE.PointLight(neon[i % neon.length], 1.0, 52, 2);
        pl.position.set(Math.cos(i / nLights * TAU) * 36, 11, Math.sin(i / nLights * TAU) * 36);
        scene.add(pl);
        this.lights.push({ light: pl, a: i / nLights * TAU, r: 36 });
      }

      this._monument(scene);
      this._obstacles(scene);
      this._billboards(scene);
      this._stars(scene, quality);
    },

    _monument(scene) {
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

    _obstacles(scene) {
      const palette = [0xff00c8, 0x00ffd5, 0xffe600, 0x6a5bff, 0xff2d6f, 0x39ff88];
      const spots = [];
      for (let i = 0; i < 20; i++) {
        let x = 0, z = 0, ok = false, tries = 0;
        while (!ok && tries++ < 80) {
          x = MA.rand(-this.ARENA + 11, this.ARENA - 11);
          z = MA.rand(-this.ARENA + 11, this.ARENA - 11);
          ok = Math.hypot(x, z) > 14;
          for (const s of spots) if (Math.hypot(s.x - x, s.z - z) < 13) ok = false;
        }
        if (!ok) continue;
        spots.push({ x, z });
        const w = MA.rand(3, 7.5), h = MA.rand(2.5, 10), d = MA.rand(3, 7.5);
        const col = MA.pick(palette);
        const m = new THREE.Mesh(
          new THREE.BoxGeometry(w, h, d),
          new THREE.MeshStandardMaterial({
            color: 0x0d0320, emissive: col, emissiveIntensity: .35,
            metalness: .55, roughness: .34
          })
        );
        m.position.set(x, h / 2, z); m.rotation.y = MA.rand(0, TAU);
        m.castShadow = true; m.receiveShadow = true;
        m.add(new THREE.LineSegments(
          new THREE.EdgesGeometry(m.geometry),
          new THREE.LineBasicMaterial({ color: col })
        ));
        scene.add(m);
        this.obstacles.push({ x, z, r: Math.max(w, d) * .6, h });
      }
    },

    _billboards(scene) {
      const texts = [
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
        this.ringMesh.material.color.setHSL((time * .07) % 1, 1, .55);
      }
      if (this.monument) {
        this.monument.orb.rotation.y += dt * 1.5;
        this.monument.orb.position.y = 9.1 + Math.sin(time * 1.7) * .3;
        this.monument.halo.rotation.z += dt * 1.1;
        this.monument.halo.position.y = this.monument.orb.position.y;
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
