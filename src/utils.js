/* MEME ARENA 3D — utils & shared namespace */
window.MA = window.MA || {};
(function (MA) {
  'use strict';

  MA.TAU = Math.PI * 2;
  MA.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  MA.lerp = (a, b, t) => a + (b - a) * t;
  MA.damp = (a, b, l, dt) => MA.lerp(a, b, 1 - Math.exp(-l * dt));
  MA.rand = (a, b) => a + Math.random() * (b - a);
  MA.randi = (a, b) => Math.floor(MA.rand(a, b + 1));
  MA.pick = arr => arr[Math.floor(Math.random() * arr.length)];
  MA.chance = p => Math.random() < p;
  MA.$ = id => document.getElementById(id);
  MA.fmt = n => Math.round(n).toLocaleString('pt-BR');
  MA.esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));

  MA.shuffle = function (arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  MA.shade = function (hex, amt) {
    let h = String(hex).replace('#', '');
    if (h.length === 3) h = h.split('').map(s => s + s).join('');
    const n = parseInt(h, 16);
    const r = MA.clamp((n >> 16) + amt, 0, 255);
    const g = MA.clamp(((n >> 8) & 255) + amt, 0, 255);
    const b = MA.clamp((n & 255) + amt, 0, 255);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };

  MA.store = {
    get(k, d) {
      try { const v = localStorage.getItem('memearena.' + k); return v === null ? d : JSON.parse(v); }
      catch (e) { return d; }
    },
    set(k, v) {
      try { localStorage.setItem('memearena.' + k, JSON.stringify(v)); } catch (e) {}
    }
  };

  /* CapsuleGeometry polyfill (three r128 não possui) */
  if (typeof THREE.CapsuleGeometry === 'undefined') {
    THREE.CapsuleGeometry = function (radius, length, capSeg, radialSeg) {
      radius = radius === undefined ? 1 : radius;
      length = length === undefined ? 1 : length;
      capSeg = Math.max(2, capSeg || 4);
      radialSeg = Math.max(3, radialSeg || 8);
      const pts = [], h = length / 2;
      for (let i = 0; i <= capSeg; i++) {
        const a = -Math.PI / 2 + (i / capSeg) * (Math.PI / 2);
        pts.push(new THREE.Vector2(Math.cos(a) * radius, -h + Math.sin(a) * radius));
      }
      for (let i = 0; i <= capSeg; i++) {
        const a = (i / capSeg) * (Math.PI / 2);
        pts.push(new THREE.Vector2(Math.cos(a) * radius, h + Math.sin(a) * radius));
      }
      const g = new THREE.LatheGeometry(pts, radialSeg);
      g.computeVertexNormals();
      return g;
    };
  }

  /* three r128 não gerencia espaço de cor: cores hex entram como se já
     fossem lineares e o renderer (outputEncoding sRGB) clareia tudo.
     Converter para linear devolve a cor que a gente realmente escolheu.   */
  MA.linearizeColors = function (root) {
    root.traverse(o => {
      const mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
      mats.forEach(m => {
        if (!m || m.userData.__lin) return;
        m.userData.__lin = true;
        if (m.color) m.color.convertSRGBToLinear();
        if (m.emissive) m.emissive.convertSRGBToLinear();
      });
    });
    return root;
  };

  MA.disposeObject = function (obj) {
    obj.traverse(o => {
      if (o.geometry && !o.geometry.userData.shared) o.geometry.dispose();
      if (o.material) {
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach(m => { if (!m.userData || !m.userData.shared) m.dispose(); });
      }
    });
  };

  /* FPS meter */
  MA.FPS = {
    frames: 0, last: performance.now(), value: 60,
    tick() {
      this.frames++;
      const now = performance.now();
      if (now - this.last >= 500) {
        this.value = Math.round(this.frames * 1000 / (now - this.last));
        this.frames = 0; this.last = now;
      }
      return this.value;
    }
  };

  /* Registro externo ao HTML permite uma CSP sem script inline. */
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    addEventListener('load', () => navigator.serviceWorker.register('sw.js?v=49').catch(() => {}));
  }
})(window.MA);
