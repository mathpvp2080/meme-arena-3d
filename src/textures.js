/* MEME ARENA 3D — texturas 100% procedurais via canvas */
(function (MA) {
  'use strict';
  const TAU = MA.TAU;

  const T = {
    cache: {},
    _c(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h || w; return c; },

    /* rosto do meme: usa o desenho de src/faces.js quando existe,
       e cai no emoji genérico quando não existe                        */
    face(emojiOrDef, bg, ring, elite) {
      const def = (emojiOrDef && typeof emojiOrDef === 'object') ? emojiOrDef : null;
      const emoji = def ? def.emoji : emojiOrDef;
      bg = def ? def.color : bg;
      ring = def ? def.ring : ring;
      const drawer = def && MA.FACES && MA.FACES[def.id];
      const key = 'f|' + (def ? def.id : emoji) + '|' + bg + '|' + (elite ? 'E' : '');
      if (this.cache[key]) return this.cache[key];

      const S = 256, c = this._c(S), x = c.getContext('2d');

      let drawn = false;
      if (drawer) {
        try { drawer(x, S, def); drawn = true; }
        catch (err) { console.warn('[MemeArena] rosto falhou:', def.id, err); }
      }
      if (!drawn) {
        const g = x.createRadialGradient(S * .34, S * .28, 8, S * .5, S * .5, S * .62);
        g.addColorStop(0, '#ffffff'); g.addColorStop(.32, bg); g.addColorStop(1, MA.shade(bg, -55));
        x.fillStyle = g; x.fillRect(0, 0, S, S);
        x.font = '150px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",serif';
        x.textAlign = 'center'; x.textBaseline = 'middle';
        x.fillText(emoji, S / 2, S / 2 - 6);
      }

      /* aro externo (dourado quando é elite) */
      x.strokeStyle = elite ? '#ffd400' : ring;
      x.lineWidth = elite ? 20 : 14;
      x.beginPath(); x.arc(S / 2, S / 2, S / 2 - 11, 0, TAU); x.stroke();
      if (elite) {
        x.strokeStyle = 'rgba(255,255,255,.7)'; x.lineWidth = 5;
        x.beginPath(); x.arc(S / 2, S / 2, S / 2 - 28, 0, TAU); x.stroke();
      }

      const t = new THREE.CanvasTexture(c);
      t.encoding = THREE.sRGBEncoding;
      t.anisotropy = 4; t.userData = { shared: true };
      this.cache[key] = t; return t;
    },

    /* chão: cores vêm do mapa (src/maps.js) */
    ground(cfg) {
      cfg = cfg || { base: '#0c0322', grid: 'rgba(150,20,255,.85)', fine: 'rgba(0,255,220,.22)', speck: true, repeat: 14 };
      const key = 'gnd|' + cfg.base + cfg.grid + cfg.fine;
      if (this.cache[key]) return this.cache[key];
      const S = 512, c = this._c(S), x = c.getContext('2d');
      x.fillStyle = cfg.base; x.fillRect(0, 0, S, S);
      x.strokeStyle = cfg.grid; x.lineWidth = 3;
      for (let i = 0; i <= 8; i++) {
        const p = i * S / 8;
        x.beginPath(); x.moveTo(p, 0); x.lineTo(p, S); x.stroke();
        x.beginPath(); x.moveTo(0, p); x.lineTo(S, p); x.stroke();
      }
      x.strokeStyle = cfg.fine; x.lineWidth = 1;
      for (let i = 0; i <= 32; i++) {
        const p = i * S / 32;
        x.beginPath(); x.moveTo(p, 0); x.lineTo(p, S); x.stroke();
        x.beginPath(); x.moveTo(0, p); x.lineTo(S, p); x.stroke();
      }
      if (cfg.speck !== false) {
        for (let i = 0; i < 1200; i++) {
          x.fillStyle = 'rgba(255,255,255,' + (Math.random() * .06) + ')';
          x.fillRect(Math.random() * S, Math.random() * S, 2, 2);
        }
      }
      const t = new THREE.CanvasTexture(c);
      t.encoding = THREE.sRGBEncoding;
      t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(cfg.repeat || 14, cfg.repeat || 14);
      t.anisotropy = 8; t.userData = { shared: true };
      this.cache[key] = t; return t;
    },

    /* céu: gradiente + estrelas + sol, tudo vindo do mapa */
    sky(cfg) {
      cfg = cfg || {};
      const stops = cfg.stops || ['#03010a', '#130228', '#2c0540', '#4a0a46', '#2a0533', '#0a0118'];
      const nStars = cfg.stars === undefined ? 500 : cfg.stars;
      const sun = cfg.sun || ['rgba(255,245,150,1)', 'rgba(255,140,190,.85)', 'rgba(190,40,180,.28)'];
      const key = 'sky|' + stops.join('') + nStars;
      if (this.cache[key]) return this.cache[key];

      const W = 1024, H = 512, c = this._c(W, H), x = c.getContext('2d');
      const g = x.createLinearGradient(0, 0, 0, H);
      const at = [0, .38, .58, .70, .78, 1];
      stops.forEach((col, i) => g.addColorStop(at[i] !== undefined ? at[i] : i / (stops.length - 1), col));
      x.fillStyle = g; x.fillRect(0, 0, W, H);

      for (let i = 0; i < nStars; i++) {
        const sx = Math.random() * W, sy = Math.random() * H * .34;
        x.fillStyle = 'rgba(255,255,255,' + (Math.random() * .85) + ')';
        const s2 = Math.random() < .08 ? 3 : 1.6;
        x.fillRect(sx, sy, s2, s2);
      }

      const cy = H * .345, R = 62;
      const sg = x.createRadialGradient(W * .5, cy, 6, W * .5, cy, R * 2.4);
      sg.addColorStop(0, sun[0]); sg.addColorStop(.22, sun[1]);
      sg.addColorStop(.55, sun[2]); sg.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = sg; x.beginPath(); x.arc(W * .5, cy, R * 2.4, 0, TAU); x.fill();
      if (cfg.scanSun !== false) {
        x.globalCompositeOperation = 'destination-out';
        for (let i = 0; i < 7; i++) x.fillRect(W * .5 - R, cy + 8 + i * 9, R * 2, 3 + i);
        x.globalCompositeOperation = 'source-over';
      }
      for (let i = 0; i < 14; i++) {
        const cx2 = Math.random() * W, cy2 = H * (.42 + Math.random() * .22);
        const w = MA.rand(60, 220), h = MA.rand(3, 9);
        x.fillStyle = 'rgba(255,220,240,' + MA.rand(.03, .09) + ')';
        x.beginPath(); x.ellipse(cx2, cy2, w, h, 0, 0, TAU); x.fill();
      }
      const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.userData = { shared: true };
      this.cache[key] = t; return t;
    },

    billboard(text, color) {
      const W = 512, H = 256, c = this._c(W, H), x = c.getContext('2d');
      x.fillStyle = '#07021a'; x.fillRect(0, 0, W, H);
      x.strokeStyle = color; x.lineWidth = 10; x.strokeRect(6, 6, W - 12, H - 12);
      x.strokeStyle = 'rgba(255,255,255,.18)'; x.lineWidth = 2; x.strokeRect(20, 20, W - 40, H - 40);
      x.textAlign = 'center'; x.textBaseline = 'middle';
      const lines = text.split('\n');
      lines.forEach((ln, i) => {
        x.font = 'bold ' + (i === 0 ? 58 : 36) + 'px Impact, Haettenschweiler, Verdana';
        x.fillStyle = i === 0 ? color : '#ffffff';
        x.fillText(ln, W / 2, H / 2 + (i - (lines.length - 1) / 2) * 62);
      });
      const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.userData = { shared: true };
      return t;
    },

    glow(color) {
      const key = 'g|' + color;
      if (this.cache[key]) return this.cache[key];
      const S = 128, c = this._c(S), x = c.getContext('2d');
      const g = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
      g.addColorStop(0, color); g.addColorStop(.22, color); g.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = g; x.fillRect(0, 0, S, S);
      const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.userData = { shared: true };
      this.cache[key] = t; return t;
    },

    popup(text, color) {
      const W = 256, H = 64, c = this._c(W, H), x = c.getContext('2d');
      x.font = 'bold 46px Impact, Verdana'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.lineWidth = 8; x.lineJoin = 'round'; x.strokeStyle = '#000';
      x.strokeText(text, W / 2, H / 2 + 2); x.fillStyle = color || '#ffe600';
      x.fillText(text, W / 2, H / 2 + 2);
      const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
    }
  };

  MA.Tex = T;
})(window.MA);
