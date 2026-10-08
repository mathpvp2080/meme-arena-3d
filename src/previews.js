/* =====================================================================
   MEME ARENA 3D — miniaturas 3D da loja e do inventário

   Um único renderer produz imagens dos modelos reais do jogo aos poucos.
   Assim os cards mostram o que será equipado, sem criar dezenas de WebGL
   contexts nem depender de arquivos de imagem externos.

   Regra de ouro das skins com GLB: a foto só sai com o modelo real
   encaixado. Enquanto o GLB ainda está carregando (ou em cooldown de
   falha), o card mantém o placeholder e o trabalho é re-agendado com
   backoff. O boneco procedural de fallback nunca é fotografado nem
   armazenado no cache de miniaturas.
   ===================================================================== */
(function (MA) {
  'use strict';

  const P = {
    cache: Object.create(null),
    pending: Object.create(null),
    queue: [],
    busy: false,
    renderer: null,
    scene: null,
    camera: null,
    stage: null,

    init() {
      if (this.renderer) return true;
      try {
        this.renderer = new THREE.WebGLRenderer({
          alpha: true, antialias: true, preserveDrawingBuffer: true,
          powerPreference: 'low-power'
        });
        this.renderer.setPixelRatio(1);
        this.renderer.setSize(320, 196, false);
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.28;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setClearColor(0x000000, 0);

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(34, 320 / 196, .1, 30);
        this.stage = new THREE.Group();
        this.scene.add(this.stage);

        this.scene.add(new THREE.HemisphereLight(0xdaf8ff, 0x21143f, 1.72));
        const key = new THREE.DirectionalLight(0xfffbff, 2.35);
        key.position.set(-4, 6, -5); key.castShadow = true;
        key.shadow.mapSize.set(512, 512);
        key.shadow.camera.left = key.shadow.camera.bottom = -3.5;
        key.shadow.camera.right = key.shadow.camera.top = 3.5;
        key.shadow.camera.near = .1; key.shadow.camera.far = 16;
        this.scene.add(key);
        const rim = new THREE.DirectionalLight(0xff4fbd, 1.62);
        rim.position.set(5, 3, 4); this.scene.add(rim);
        const fill = new THREE.PointLight(0x2de2ff, 1.35, 12);
        fill.position.set(-3, 2, -3); this.scene.add(fill);
        const violet = new THREE.PointLight(0x6572ff, .85, 10);
        violet.position.set(2.6, 1.2, -2.2); this.scene.add(violet);
        return true;
      } catch (err) {
        console.warn('[MemeArena] miniaturas 3D indisponíveis:', err);
        return false;
      }
    },

    hydrate(root) {
      if (!root) return;
      root.querySelectorAll('[data-preview-type][data-preview-id]').forEach(el => {
        const type = el.dataset.previewType, id = el.dataset.previewId;
        const key = type + ':' + id;
        if (this.cache[key]) { this.apply(el, this.cache[key]); return; }
        if (!this.pending[key]) {
          this.pending[key] = [];
          this.queue.push({ key, type, id });
        }
        this.pending[key].push(el);
      });
      this.drain();
    },

    /* Quantas tentativas o card faz (com backoff) até abrir mão de
       fotografar. O cache nunca guarda fallback procedural: quem desiste
       fica com o placeholder e a próxima abertura da loja recomeça tudo. */
    MAX_ATTEMPTS: 8,

    /* Skin do job quando ela tem GLB registrado (null para jobs sem modelo
       ou de outros tipos de item). */
    glbSkinFor(job) {
      if (!MA.SkinModels) return null;
      if (!(job.type === 'skin' || job.type === 'avatar')) return null;
      const skinId = job.type === 'avatar' ? String(job.id).split('|')[0] : job.id;
      const skin = MA.findItem('skin', skinId);
      return (skin && MA.SkinModels.specFor(skin)) ? skin : null;
    },

    drain() {
      if (this.busy || !this.queue.length) return;
      if (!this.init()) return;
      this.busy = true;
      const next = async () => {
        const job = this.queue.shift();
        if (!job) { this.busy = false; return; }
        /* Repetição agendada com backoff: na tentativa anterior o modelo
           ainda não estava pronto. Volta para o fim da fila até a espera. */
        if (job.nextAt && performance.now() < job.nextAt) {
          this.queue.push(job);
          if (this.queue.length) requestAnimationFrame(next);
          return;
        }
        let url = null;
        let spec = null;
        try {
          /* O boot carrega só a skin equipada. Antes de fotografar outro
             card, espera o GLB sob demanda — e só fotografa com o modelo
             real encaixado (snapshot devolve null enquanto não estiver). */
          const skin = this.glbSkinFor(job);
          if (skin) {
            spec = MA.SkinModels.specFor(skin);
            if (!MA.SkinModels.hasLoaded(skin)) await MA.SkinModels.load(spec.url);
          }
          url = this.snapshot(job.type, job.id);
        } catch (err) {
          console.warn('[MemeArena] falha na miniatura', job.key, err);
          url = ''; /* erro de render: abandona este card sem repetir */
        }
        if (url) {
          this.cache[job.key] = url;
          (this.pending[job.key] || []).forEach(el => {
            if (el.isConnected) this.apply(el, url);
          });
          delete this.pending[job.key];
        } else if (url === null && spec) {
          /* GLB ainda não pronto (carregando ou em cooldown de falha):
             reagenda com backoff — a espera cobre o cooldown de falha,
             sem gastar tentativas à toa. O placeholder continua no card:
             o fallback procedural NUNCA vira miniatura. */
          job.attempts = (job.attempts || 0) + 1;
          if (job.attempts < this.MAX_ATTEMPTS) {
            const wait = Math.max(Math.min(4000, 350 * job.attempts), MA.SkinModels.retryDelay(spec.url));
            job.nextAt = performance.now() + wait;
            this.queue.push(job);
          } else {
            delete this.pending[job.key];
          }
        } else {
          delete this.pending[job.key];
        }
        /* uma miniatura por quadro evita travar a abertura da loja */
        if (this.queue.length) requestAnimationFrame(next);
        else this.busy = false;
      };
      requestAnimationFrame(next);
    },

    apply(el, url) {
      if (el.dataset.previewReady === '1') return;
      const img = document.createElement('img');
      img.src = url; img.alt = ''; img.draggable = false;
      el.innerHTML = '';
      el.appendChild(img);
      el.dataset.previewReady = '1';
    },

    clearStage() {
      while (this.stage.children.length) {
        const child = this.stage.children.pop();
        child.parent = null;
        this.dispose(child);
      }
    },

    dispose(root) {
      root.traverse(o => {
        if (o.geometry && !o.geometry.userData.shared) o.geometry.dispose();
        if (o.material) {
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          mats.forEach(m => m.dispose());
        }
      });
    },

    snapshot(type, id) {
      this.clearStage();
      const stage = this.stage;
      const portrait = type === 'avatar';
      const width = portrait ? 360 : 320;
      const height = portrait ? 480 : 196;
      this.renderer.setSize(width, height, false);
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();

      /* Loja/inventário usam pedestal de exposição. O retrato do lobby fica
         limpo, só com a sombra em CSS, como nos menus clássicos de party-game. */
      if (!portrait) {
        const floorTop = type === 'weapon' ? -.47 : -.23;
        const floorRadius = type === 'weapon' ? 1.58 : 1.15;
        const floor = new THREE.Mesh(
          new THREE.CylinderGeometry(floorRadius, floorRadius * 1.10, .15, 40),
          new THREE.MeshStandardMaterial({ color: 0x20265f, roughness: .25, metalness: .28 })
        );
        floor.position.y = floorTop - .075; floor.receiveShadow = true; stage.add(floor);
        const floorRing = new THREE.Mesh(
          new THREE.TorusGeometry(floorRadius * .83, .035, 8, 40),
          new THREE.MeshBasicMaterial({ color: type === 'weapon' ? 0xff4fbd : 0x2de2ff, transparent: true, opacity: .78 })
        );
        floorRing.rotation.x = Math.PI / 2; floorRing.position.y = floorTop + .006; stage.add(floorRing);
        if (type !== 'weapon') {
          const halo = new THREE.Mesh(
            new THREE.TorusGeometry(1.18, .022, 8, 48),
            new THREE.MeshBasicMaterial({ color: 0x6572ff, transparent: true, opacity: .34, depthWrite: false })
          );
          halo.position.set(0, 1.38, .47); stage.add(halo);
          const haloAccent = new THREE.Mesh(
            new THREE.TorusGeometry(1.06, .014, 8, 48),
            new THREE.MeshBasicMaterial({ color: 0xff4fbd, transparent: true, opacity: .26, depthWrite: false })
          );
          haloAccent.position.set(0, 1.38, .48); stage.add(haloAccent);
        }
      }

      if (type === 'ability') {
        const ability = MA.findItem('ability', id) || MA.ABILITIES[0];
        const color = ability.color || 0x9b65ff;
        const coreMat = new THREE.MeshPhysicalMaterial({
          color: 0xf5f7ff, roughness: .10, metalness: .68,
          emissive: color, emissiveIntensity: .55, clearcoat: .62
        });
        const glowMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .82 });
        const core = new THREE.Mesh(new THREE.OctahedronGeometry(.48, 1), coreMat);
        core.position.y = .45; core.rotation.set(.35, .45, .12); stage.add(core);
        const orbitA = new THREE.Mesh(new THREE.TorusGeometry(.78, .065, 10, 38), glowMat);
        orbitA.position.y = .45; orbitA.rotation.set(.55, .35, .18); stage.add(orbitA);
        const orbitB = new THREE.Mesh(new THREE.TorusGeometry(.62, .035, 8, 34),
          new THREE.MeshBasicMaterial({ color: id === 'blink7' ? 0xff4fbd : 0x2de2ff }));
        orbitB.position.y = .45; orbitB.rotation.set(-.62, .18, -.34); stage.add(orbitB);
        if (id === 'repulse6') {
          const six = new THREE.Mesh(new THREE.TorusGeometry(.24, .055, 8, 26), glowMat);
          six.position.set(-.08, .45, -.56); stage.add(six);
        } else if (id === 'blink7') {
          const top = new THREE.Mesh(new THREE.BoxGeometry(.48, .07, .08), glowMat);
          top.position.set(.03, .58, -.56); stage.add(top);
          const leg = new THREE.Mesh(new THREE.BoxGeometry(.08, .46, .08), glowMat);
          leg.position.set(.10, .39, -.56); leg.rotation.z = -.42; stage.add(leg);
        }
        this.camera.position.set(2.8, 1.75, -4.2);
        this.camera.lookAt(0, .42, 0);
      } else if (type === 'weapon') {
        const weapon = MA.findItem('weapon', id) || MA.WEAPONS[0];
        const visual = MA.createWeaponModel(weapon);
        visual.muzzle.visible = false;
        visual.group.rotation.set(-.12, -.58, -.08);
        visual.group.scale.setScalar(1.34);
        visual.group.position.set(0, .02, .12);
        stage.add(visual.group);
        this.camera.position.set(3.5, 2.15, -4.6);
        this.camera.lookAt(0, 0, -.55);
      } else {
        const parts = portrait ? String(id).split('|') : [];
        const skinId = portrait ? parts[0] : id;
        const armorId = portrait ? parts[1] : id;
        const weaponId = portrait ? parts[2] : '';
        const skin = (type === 'skin' || portrait)
          ? (MA.findItem('skin', skinId) || MA.SKINS[0])
          : MA.SKINS[0];
        const armor = (type === 'armor' || portrait)
          ? (MA.findItem('armor', armorId) || MA.ARMORS[0])
          : MA.ARMORS[0];
        /* Card de armadura fotografa o boneco base + armadura: o GLB da skin
           (modo full) esconderia a peça em exibição. */
        const avatar = MA.createPlayer(stage, skin, armor,
          type === 'armor' ? { skipSkinModel: true } : undefined);
        /* Skin com GLB registrado: só fotografamos com o modelo real
           encaixado. Se o GLB ainda não chegou, devolvemos null e o drain
           reagenda a tentativa — o fallback procedural NUNCA entra no cache
           de miniaturas. */
        const glbSpec = (type === 'skin' || portrait)
          && MA.SkinModels && MA.SkinModels.specFor(skin);
        if (glbSpec && !avatar.obj.userData.customModel) {
          this.clearStage();
          return null;
        }
        if (portrait) {
          const wi = MA.WEAPONS.findIndex(w => w.id === weaponId);
          avatar.weapon = wi >= 0 ? wi : 0;
          MA.syncWeaponModel(avatar);
          avatar.gun.visible = wi >= 0;
          avatar.obj.rotation.y = -.20;
          avatar.obj.position.y = -.22;
          avatar.aura.visible = false;
          this.camera.position.set(2.75, 2.55, -7.4);
          this.camera.lookAt(0, 1.34, 0);
        } else {
          avatar.gun.visible = false;
          avatar.obj.rotation.y = -.52;
          avatar.obj.position.y = -.15;
          avatar.aura.material.opacity = .28;
          this.camera.position.set(3.8, 2.55, -5.9);
          this.camera.lookAt(0, 1.32, 0);
        }
        avatar.ultAura.visible = false;
        avatar.shieldMesh.visible = false;
        stage.add(avatar.obj);
      }

      this.renderer.render(this.scene, this.camera);
      const url = this.renderer.domElement.toDataURL('image/webp', .90);
      this.clearStage();
      /* As miniaturas da loja continuam no formato horizontal. */
      if (portrait) {
        this.renderer.setSize(320, 196, false);
        this.camera.aspect = 320 / 196;
        this.camera.updateProjectionMatrix();
      }
      return url;
    }
  };

  MA.Previews = P;
})(window.MA);
