/* =====================================================================
   MEME ARENA 3D — miniaturas 3D da loja e do inventário

   Um único renderer produz imagens dos modelos reais do jogo aos poucos.
   Assim os cards mostram o que será equipado, sem criar dezenas de WebGL
   contexts nem depender de arquivos de imagem externos.
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
        this.renderer.toneMappingExposure = 1.18;
        this.renderer.setClearColor(0x000000, 0);

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(34, 320 / 196, .1, 30);
        this.stage = new THREE.Group();
        this.scene.add(this.stage);

        this.scene.add(new THREE.HemisphereLight(0xccecff, 0x16082e, 1.6));
        const key = new THREE.DirectionalLight(0xffffff, 2.25);
        key.position.set(-4, 6, -5); this.scene.add(key);
        const rim = new THREE.DirectionalLight(0xff2dd1, 1.5);
        rim.position.set(5, 3, 4); this.scene.add(rim);
        const fill = new THREE.PointLight(0x00ffd5, 1.2, 12);
        fill.position.set(-3, 2, -3); this.scene.add(fill);
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

    drain() {
      if (this.busy || !this.queue.length) return;
      if (!this.init()) return;
      this.busy = true;
      const next = () => {
        const job = this.queue.shift();
        if (!job) { this.busy = false; return; }
        let url = '';
        try { url = this.snapshot(job.type, job.id); }
        catch (err) { console.warn('[MemeArena] falha na miniatura', job.key, err); }
        if (url) this.cache[job.key] = url;
        (this.pending[job.key] || []).forEach(el => {
          if (url && el.isConnected) this.apply(el, url);
        });
        delete this.pending[job.key];
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

      if (type === 'weapon') {
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
        const skin = type === 'skin'
          ? (MA.findItem('skin', id) || MA.SKINS[0])
          : MA.SKINS[0];
        const armor = type === 'armor'
          ? (MA.findItem('armor', id) || MA.ARMORS[0])
          : MA.ARMORS[0];
        const avatar = MA.createPlayer(stage, skin, armor);
        avatar.gun.visible = false;
        avatar.ultAura.visible = false;
        avatar.shieldMesh.visible = false;
        avatar.aura.material.opacity = .28;
        avatar.obj.rotation.y = -.52;
        avatar.obj.position.y = -.15;
        stage.add(avatar.obj);
        this.camera.position.set(3.8, 2.55, -5.9);
        this.camera.lookAt(0, 1.32, 0);
      }

      this.renderer.render(this.scene, this.camera);
      const url = this.renderer.domElement.toDataURL('image/webp', .88);
      this.clearStage();
      return url;
    }
  };

  MA.Previews = P;
})(window.MA);
