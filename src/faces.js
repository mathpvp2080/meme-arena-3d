/* =====================================================================
   MEME ARENA 3D — rostos desenhados (canvas 2D, 100% procedural)

   Cada função recebe (x, S, def) e desenha o rosto do meme num quadrado
   S x S que vira a textura da cabeça. Nada de emoji: tudo desenhado.
   ===================================================================== */
(function (MA) {
  'use strict';
  const TAU = Math.PI * 2;

  /* ------------------------------------------------------------ helpers */
  function ell(x, cx, cy, rx, ry, fill, rot) {
    x.save(); x.translate(cx, cy); if (rot) x.rotate(rot); x.scale(rx, ry);
    x.beginPath(); x.arc(0, 0, 1, 0, TAU); x.restore();
    if (fill) { x.fillStyle = fill; x.fill(); }
  }
  function circ(x, cx, cy, r, fill) {
    x.beginPath(); x.arc(cx, cy, r, 0, TAU);
    if (fill) { x.fillStyle = fill; x.fill(); }
  }
  function stroke(x, color, w) { x.strokeStyle = color; x.lineWidth = w; x.lineCap = 'round'; x.stroke(); }
  function line(x, x1, y1, x2, y2, color, w) {
    x.beginPath(); x.moveTo(x1, y1); x.lineTo(x2, y2); stroke(x, color, w);
  }
  function arc(x, cx, cy, r, a1, a2, color, w, anti) {
    x.beginPath(); x.arc(cx, cy, r, a1, a2, !!anti); stroke(x, color, w);
  }
  /* par de olhos simples com pupila que "olha" pra frente */
  function eyes(x, S, cy, dx, rw, rh, pupil, pr, white) {
    [-1, 1].forEach(s => {
      ell(x, S / 2 + s * dx, cy, rw, rh, white || '#ffffff');
      x.strokeStyle = 'rgba(0,0,0,.55)'; x.lineWidth = 4; x.stroke();
      circ(x, S / 2 + s * dx, cy + rh * .08, pr || rw * .45, pupil || '#111111');
      circ(x, S / 2 + s * dx - rw * .22, cy - rh * .3, (pr || rw * .45) * .32, 'rgba(255,255,255,.9)');
    });
  }
  function smile(x, S, cy, w, h, color, lw) {
    x.beginPath();
    x.moveTo(S / 2 - w, cy);
    x.quadraticCurveTo(S / 2, cy + h, S / 2 + w, cy);
    stroke(x, color || '#1a1a1a', lw || 9);
  }
  function teethRow(x, x1, x2, y, h, n) {
    const w = (x2 - x1) / n;
    x.fillStyle = '#ffffff';
    for (let i = 0; i < n; i++) x.fillRect(x1 + i * w + 1, y, w - 2, h);
  }

  /* ===================================================================
     ROSTOS — chave = id do meme em data.js
     =================================================================== */
  const F = {

    /* 😈 Trollface — o traço clássico do rage comic */
    troll(x, S) {
      x.fillStyle = '#f2f2ef';
      ell(x, S / 2, S * .54, S * .36, S * .34, '#f2f2ef');
      // sobrancelhas grossas erguidas
      x.lineWidth = 7; x.strokeStyle = '#111';
      x.beginPath(); x.moveTo(S * .26, S * .36); x.quadraticCurveTo(S * .36, S * .27, S * .46, S * .35); x.stroke();
      x.beginPath(); x.moveTo(S * .54, S * .35); x.quadraticCurveTo(S * .64, S * .27, S * .74, S * .36); x.stroke();
      // olhos pequenos e espertos
      ell(x, S * .37, S * .45, S * .07, S * .05, '#fff');
      ell(x, S * .63, S * .45, S * .07, S * .05, '#fff');
      circ(x, S * .38, S * .455, S * .028, '#111');
      circ(x, S * .64, S * .455, S * .028, '#111');
      // sorriso enorme com dentes
      x.beginPath();
      x.moveTo(S * .22, S * .60);
      x.quadraticCurveTo(S / 2, S * .92, S * .78, S * .60);
      x.quadraticCurveTo(S / 2, S * .70, S * .22, S * .60);
      x.fillStyle = '#111'; x.fill();
      x.save(); x.beginPath();
      x.moveTo(S * .22, S * .60); x.quadraticCurveTo(S / 2, S * .92, S * .78, S * .60);
      x.quadraticCurveTo(S / 2, S * .70, S * .22, S * .60); x.clip();
      teethRow(x, S * .24, S * .76, S * .60, S * .07, 9);
      x.restore();
      line(x, S * .22, S * .60, S * .78, S * .60, '#111', 6);
    },

    /* 🔺 Amogus — a viseira e a mochila */
    sus(x, S, def) {
      x.fillStyle = def.color; x.fillRect(0, 0, S, S);
      // corpo em gota
      x.beginPath();
      x.moveTo(S * .30, S * .86); x.quadraticCurveTo(S * .26, S * .22, S * .50, S * .18);
      x.quadraticCurveTo(S * .74, S * .22, S * .70, S * .86);
      x.fillStyle = MA.shade(def.color, 18); x.fill();
      stroke(x, MA.shade(def.color, -60), 8);
      // viseira
      x.save();
      x.beginPath(); x.ellipse(S * .56, S * .42, S * .22, S * .14, -.06, 0, TAU);
      const vg = x.createLinearGradient(S * .34, S * .3, S * .78, S * .55);
      vg.addColorStop(0, '#dff6ff'); vg.addColorStop(.5, '#79c7e8'); vg.addColorStop(1, '#2d6c8f');
      x.fillStyle = vg; x.fill(); stroke(x, '#17384a', 7);
      x.restore();
      // brilho da viseira
      x.globalAlpha = .75;
      ell(x, S * .48, S * .37, S * .07, S * .035, '#ffffff', -.3);
      x.globalAlpha = 1;
    },

    /* 🐸 Pepe — olhos esbugalhados e lábios */
    pepe(x, S, def) {
      x.fillStyle = MA.shade(def.color, -12); x.fillRect(0, 0, S, S);
      // manchas
      x.globalAlpha = .25;
      circ(x, S * .2, S * .75, S * .13, MA.shade(def.color, -45));
      circ(x, S * .84, S * .68, S * .1, MA.shade(def.color, -45));
      x.globalAlpha = 1;
      // olhos grandes no alto
      [-1, 1].forEach(s => {
        circ(x, S / 2 + s * S * .21, S * .33, S * .155, '#ffffff');
        x.strokeStyle = '#1f4d1f'; x.lineWidth = 6; x.stroke();
        circ(x, S / 2 + s * S * .21 + s * S * .02, S * .35, S * .055, '#111');
        circ(x, S / 2 + s * S * .21 - S * .04, S * .29, S * .025, 'rgba(255,255,255,.95)');
      });
      // lábios largos
      x.beginPath();
      x.moveTo(S * .20, S * .62); x.quadraticCurveTo(S / 2, S * .80, S * .80, S * .62);
      x.quadraticCurveTo(S / 2, S * .72, S * .20, S * .62);
      x.fillStyle = '#2f7a2f'; x.fill(); stroke(x, '#174a17', 5);
      line(x, S * .22, S * .63, S * .78, S * .63, '#174a17', 4);
    },

    /* 🐕 Doge — focinho shiba e sobrancelhas */
    doge(x, S, def) {
      x.fillStyle = def.color; x.fillRect(0, 0, S, S);
      // pelo mais claro no focinho
      ell(x, S / 2, S * .66, S * .30, S * .24, MA.shade(def.color, 48));
      // sobrancelhas pensativas
      x.lineWidth = 9; x.strokeStyle = MA.shade(def.color, -50);
      x.beginPath(); x.moveTo(S * .24, S * .30); x.quadraticCurveTo(S * .33, S * .24, S * .42, S * .30); x.stroke();
      x.beginPath(); x.moveTo(S * .58, S * .30); x.quadraticCurveTo(S * .67, S * .24, S * .76, S * .30); x.stroke();
      eyes(x, S, S * .44, S * .17, S * .075, S * .085, '#2a1a08', S * .04);
      // focinho
      x.beginPath();
      x.moveTo(S / 2 - S * .07, S * .58); x.quadraticCurveTo(S / 2, S * .52, S / 2 + S * .07, S * .58);
      x.quadraticCurveTo(S / 2, S * .66, S / 2 - S * .07, S * .58);
      x.fillStyle = '#2a1a08'; x.fill();
      // boca em W
      x.beginPath();
      x.moveTo(S / 2, S * .64); x.lineTo(S / 2, S * .70);
      x.moveTo(S / 2, S * .70); x.quadraticCurveTo(S * .40, S * .78, S * .34, S * .68);
      x.moveTo(S / 2, S * .70); x.quadraticCurveTo(S * .60, S * .78, S * .66, S * .68);
      stroke(x, '#2a1a08', 7);
    },

    /* 🚽 Skibidi — a cabeça que sai do vaso, olhos arregalados */
    skibidi(x, S) {
      x.fillStyle = '#e9d9c6'; x.fillRect(0, 0, S, S);
      // cabelo
      x.beginPath();
      x.moveTo(S * .14, S * .34); x.quadraticCurveTo(S / 2, S * -.08, S * .86, S * .34);
      x.quadraticCurveTo(S / 2, S * .20, S * .14, S * .34);
      x.fillStyle = '#2b2118'; x.fill();
      // olhos exageradamente abertos
      [-1, 1].forEach(s => {
        circ(x, S / 2 + s * S * .19, S * .46, S * .115, '#ffffff');
        x.strokeStyle = '#6b4b2f'; x.lineWidth = 5; x.stroke();
        circ(x, S / 2 + s * S * .19, S * .47, S * .052, '#1a1a1a');
        circ(x, S / 2 + s * S * .19 - S * .02, S * .44, S * .018, '#fff');
      });
      // sobrancelhas tortas
      line(x, S * .22, S * .32, S * .40, S * .35, '#2b2118', 8);
      line(x, S * .60, S * .35, S * .78, S * .32, '#2b2118', 8);
      // boca cantando (O grande)
      ell(x, S / 2, S * .72, S * .13, S * .10, '#5a1414');
      stroke(x, '#2b0b0b', 6);
      ell(x, S / 2, S * .77, S * .07, S * .04, '#c23b3b');
      teethRow(x, S * .39, S * .61, S * .645, S * .035, 5);
    },

    /* 😏 Rizzler — sobrancelha erguida e sorriso de canto */
    rizz(x, S, def) {
      const g = x.createLinearGradient(0, 0, 0, S);
      g.addColorStop(0, MA.shade(def.color, 35)); g.addColorStop(1, MA.shade(def.color, -25));
      x.fillStyle = g; x.fillRect(0, 0, S, S);
      // cabelo com franja
      x.beginPath();
      x.moveTo(S * .12, S * .32); x.quadraticCurveTo(S * .30, S * .02, S * .62, S * .14);
      x.quadraticCurveTo(S * .86, S * .22, S * .88, S * .36);
      x.quadraticCurveTo(S / 2, S * .22, S * .12, S * .32);
      x.fillStyle = '#17121f'; x.fill();
      // sobrancelha esquerda erguida bem alto
      x.beginPath(); x.moveTo(S * .24, S * .40); x.quadraticCurveTo(S * .33, S * .28, S * .44, S * .36); stroke(x, '#17121f', 9);
      x.beginPath(); x.moveTo(S * .57, S * .40); x.quadraticCurveTo(S * .66, S * .36, S * .76, S * .42); stroke(x, '#17121f', 9);
      // olhos semicerrados
      [-1, 1].forEach(s => {
        x.beginPath(); x.ellipse(S / 2 + s * S * .17, S * .50, S * .08, S * .045, 0, 0, TAU);
        x.fillStyle = '#fff'; x.fill(); stroke(x, '#17121f', 4);
        circ(x, S / 2 + s * S * .17, S * .505, S * .032, '#1a1a1a');
      });
      // sorriso torto
      x.beginPath();
      x.moveTo(S * .34, S * .70); x.quadraticCurveTo(S * .54, S * .80, S * .70, S * .62);
      stroke(x, '#17121f', 8);
      // brilho de dente
      circ(x, S * .66, S * .655, S * .017, '#ffffff');
    },

    /* 🌈 Nyan Cat — carinha de pop-tart */
    nyan(x, S, def) {
      x.fillStyle = '#f7b9d8'; x.fillRect(0, 0, S, S);
      // confete da torrada
      for (let i = 0; i < 40; i++) {
        x.fillStyle = ['#ff3ca6', '#00e5ff', '#ffe600', '#7cff4d'][i % 4];
        x.fillRect(Math.random() * S, Math.random() * S, 6, 6);
      }
      ell(x, S / 2, S * .54, S * .34, S * .30, '#9a9a9a');
      // olhos pretos ovais
      ell(x, S * .36, S * .48, S * .055, S * .075, '#1a1a1a');
      ell(x, S * .64, S * .48, S * .055, S * .075, '#1a1a1a');
      circ(x, S * .345, S * .455, S * .018, '#fff');
      circ(x, S * .625, S * .455, S * .018, '#fff');
      // bochechas rosa
      circ(x, S * .26, S * .60, S * .055, 'rgba(255,90,160,.75)');
      circ(x, S * .74, S * .60, S * .055, 'rgba(255,90,160,.75)');
      // boca :3
      x.beginPath();
      x.moveTo(S * .44, S * .64); x.quadraticCurveTo(S / 2, S * .70, S * .56, S * .64);
      stroke(x, '#1a1a1a', 6);
      line(x, S / 2, S * .60, S / 2, S * .645, '#1a1a1a', 5);
    },

    /* 💀 Bluescreen — tela azul da morte */
    crash(x, S) {
      x.fillStyle = '#0a3bbf'; x.fillRect(0, 0, S, S);
      // :( gigante
      x.fillStyle = '#ffffff';
      x.font = 'bold ' + Math.round(S * .42) + 'px monospace';
      x.textAlign = 'left'; x.textBaseline = 'top';
      x.fillText(':(', S * .14, S * .10);
      // linhas de texto falsas
      x.fillStyle = 'rgba(255,255,255,.85)';
      for (let i = 0; i < 5; i++) x.fillRect(S * .12, S * .60 + i * S * .062, S * (.4 + Math.random() * .4), S * .028);
      // glitch
      for (let i = 0; i < 8; i++) {
        x.fillStyle = ['rgba(255,0,200,.5)', 'rgba(0,255,255,.5)'][i % 2];
        x.fillRect(0, Math.random() * S, S, 3 + Math.random() * 5);
      }
    },

    /* 🌽 Só Em Ohio — milho e olhar perdido */
    ohio(x, S, def) {
      x.fillStyle = def.color; x.fillRect(0, 0, S, S);
      // grãos de milho
      x.globalAlpha = .45;
      for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
        ell(x, (c + .5) * S / 9, (r + .5) * S / 9, S * .042, S * .034, MA.shade(def.color, r % 2 ? 30 : -25));
      }
      x.globalAlpha = 1;
      // olhos tortos (um maior que o outro)
      circ(x, S * .35, S * .44, S * .115, '#fff'); stroke(x, '#5a3700', 5);
      circ(x, S * .66, S * .47, S * .085, '#fff'); stroke(x, '#5a3700', 5);
      circ(x, S * .37, S * .47, S * .045, '#111');
      circ(x, S * .64, S * .44, S * .035, '#111');
      // boca ondulada de confusão
      x.beginPath();
      x.moveTo(S * .32, S * .70);
      x.quadraticCurveTo(S * .42, S * .64, S * .50, S * .70);
      x.quadraticCurveTo(S * .58, S * .76, S * .68, S * .68);
      stroke(x, '#5a3700', 8);
    },

    /* 📈 Stonks Man — o boneco cinza de terno */
    stonks(x, S) {
      x.fillStyle = '#b9c6d4'; x.fillRect(0, 0, S, S);
      // cabeça 3D cinza sem traços
      ell(x, S / 2, S * .52, S * .33, S * .36, '#9aa8b8');
      x.globalAlpha = .5; ell(x, S * .40, S * .40, S * .12, S * .14, '#cfd9e4'); x.globalAlpha = 1;
      // olhos minúsculos vazios
      circ(x, S * .40, S * .47, S * .035, '#4a5869');
      circ(x, S * .60, S * .47, S * .035, '#4a5869');
      // boca reta de "não sei o que fiz"
      line(x, S * .40, S * .68, S * .60, S * .68, '#4a5869', 7);
      // seta de gráfico subindo
      x.strokeStyle = '#2ecc71'; x.lineWidth = 8; x.lineJoin = 'round';
      x.globalAlpha = .9;
      x.beginPath(); x.moveTo(S * .14, S * .88); x.lineTo(S * .30, S * .80);
      x.lineTo(S * .42, S * .86); x.lineTo(S * .70, S * .66); x.stroke();
      x.beginPath(); x.moveTo(S * .70, S * .66); x.lineTo(S * .58, S * .67);
      x.moveTo(S * .70, S * .66); x.lineTo(S * .69, S * .78); stroke(x, '#2ecc71', 8);
      x.globalAlpha = 1;
    },

    /* 🕶️ Sigma — óculos escuros e cara fechada */
    sigma(x, S, def) {
      const g = x.createLinearGradient(0, 0, 0, S);
      g.addColorStop(0, '#3a3a4a'); g.addColorStop(1, '#16161e');
      x.fillStyle = g; x.fillRect(0, 0, S, S);
      // mandíbula marcada
      x.globalAlpha = .35;
      x.beginPath(); x.moveTo(S * .18, S * .62); x.quadraticCurveTo(S / 2, S * .98, S * .82, S * .62);
      x.fillStyle = '#000'; x.fill(); x.globalAlpha = 1;
      // óculos escuros
      x.fillStyle = '#0b0b11';
      x.beginPath();
      x.moveTo(S * .14, S * .40); x.lineTo(S * .44, S * .40);
      x.lineTo(S * .42, S * .56); x.lineTo(S * .18, S * .56); x.closePath(); x.fill();
      x.beginPath();
      x.moveTo(S * .56, S * .40); x.lineTo(S * .86, S * .40);
      x.lineTo(S * .82, S * .56); x.lineTo(S * .58, S * .56); x.closePath(); x.fill();
      x.fillRect(S * .44, S * .43, S * .12, S * .035);
      // reflexo ciano nas lentes
      x.strokeStyle = def.ring || '#00e5ff'; x.lineWidth = 5;
      x.beginPath(); x.moveTo(S * .18, S * .54); x.lineTo(S * .30, S * .42); x.stroke();
      x.beginPath(); x.moveTo(S * .60, S * .54); x.lineTo(S * .72, S * .42); x.stroke();
      // boca reta e barba por fazer
      line(x, S * .40, S * .74, S * .60, S * .74, '#0b0b11', 8);
      x.globalAlpha = .25; x.fillStyle = '#000';
      for (let i = 0; i < 160; i++) {
        const a = Math.random() * Math.PI, r = S * (.30 + Math.random() * .06);
        x.fillRect(S / 2 + Math.cos(a) * r, S * .66 + Math.sin(a) * r * .5, 3, 3);
      }
      x.globalAlpha = 1;
    },

    /* 🥤 Grimace Shake — roxo com olhos vazios e gotas */
    grimace(x, S, def) {
      const g = x.createRadialGradient(S * .4, S * .35, 10, S / 2, S / 2, S * .7);
      g.addColorStop(0, MA.shade(def.color, 40)); g.addColorStop(1, MA.shade(def.color, -40));
      x.fillStyle = g; x.fillRect(0, 0, S, S);
      // olhos muito juntos e vazios
      ell(x, S * .43, S * .42, S * .085, S * .105, '#ffffff');
      ell(x, S * .60, S * .42, S * .085, S * .105, '#ffffff');
      circ(x, S * .445, S * .44, S * .038, '#1a1a1a');
      circ(x, S * .585, S * .44, S * .038, '#1a1a1a');
      // boca aberta derramando
      ell(x, S / 2, S * .70, S * .17, S * .12, '#2a0b3a');
      x.fillStyle = MA.shade(def.color, 55);
      for (let i = 0; i < 4; i++) {
        const dx = S * (.34 + i * .11);
        x.beginPath();
        x.moveTo(dx, S * .78);
        x.quadraticCurveTo(dx - 7, S * (.86 + i % 2 * .06), dx, S * (.94 + i % 2 * .04));
        x.quadraticCurveTo(dx + 7, S * (.86 + i % 2 * .06), dx, S * .78);
        x.fill();
      }
    },

    /* 🦈 Tralalero — tubarão de tênis */
    tralala(x, S, def) {
      const g = x.createLinearGradient(0, 0, 0, S);
      g.addColorStop(0, MA.shade(def.color, 25)); g.addColorStop(.6, def.color);
      g.addColorStop(.61, '#e9f4ff'); g.addColorStop(1, '#cfe4f5');
      x.fillStyle = g; x.fillRect(0, 0, S, S);
      // olhos pequenos e malvados
      [-1, 1].forEach(s => {
        circ(x, S / 2 + s * S * .20, S * .32, S * .075, '#ffffff'); stroke(x, '#0b3f7a', 5);
        circ(x, S / 2 + s * S * .20, S * .33, S * .034, '#111');
      });
      line(x, S * .22, S * .22, S * .40, S * .28, '#0b3f7a', 8);
      line(x, S * .60, S * .28, S * .78, S * .22, '#0b3f7a', 8);
      // bocão com dentes serrilhados
      x.beginPath();
      x.moveTo(S * .12, S * .56); x.quadraticCurveTo(S / 2, S * .96, S * .88, S * .56);
      x.quadraticCurveTo(S / 2, S * .66, S * .12, S * .56);
      x.fillStyle = '#5a1020'; x.fill();
      x.save();
      x.beginPath();
      x.moveTo(S * .12, S * .56); x.quadraticCurveTo(S / 2, S * .96, S * .88, S * .56);
      x.quadraticCurveTo(S / 2, S * .66, S * .12, S * .56); x.clip();
      x.fillStyle = '#ffffff';
      for (let i = 0; i < 9; i++) {
        const w = S * .085, x1 = S * .12 + i * w;
        x.beginPath(); x.moveTo(x1, S * .56); x.lineTo(x1 + w / 2, S * .70); x.lineTo(x1 + w, S * .56); x.fill();
      }
      for (let i = 0; i < 8; i++) {
        const w = S * .085, x1 = S * .16 + i * w;
        x.beginPath(); x.moveTo(x1, S * .92); x.lineTo(x1 + w / 2, S * .78); x.lineTo(x1 + w, S * .92); x.fill();
      }
      x.restore();
    },

    /* 🪵 Tung Tung Sahur — tronco de madeira com olhos */
    tung(x, S, def) {
      x.fillStyle = def.color; x.fillRect(0, 0, S, S);
      // veios de madeira
      x.strokeStyle = MA.shade(def.color, -40); x.lineWidth = 4;
      for (let i = 0; i < 7; i++) {
        x.beginPath();
        x.moveTo(0, i * S / 7 + 6);
        x.bezierCurveTo(S * .3, i * S / 7 - 10, S * .7, i * S / 7 + 22, S, i * S / 7 + 4);
        x.stroke();
      }
      // olhos esbugalhados colados
      circ(x, S * .38, S * .40, S * .135, '#ffffff'); stroke(x, '#3a2008', 6);
      circ(x, S * .64, S * .40, S * .135, '#ffffff'); stroke(x, '#3a2008', 6);
      circ(x, S * .40, S * .42, S * .06, '#111');
      circ(x, S * .62, S * .42, S * .06, '#111');
      // boca aberta vertical gritando
      ell(x, S / 2, S * .73, S * .11, S * .15, '#2a1405');
      stroke(x, '#3a2008', 6);
      // sobrancelhas furiosas
      line(x, S * .24, S * .25, S * .46, S * .33, '#3a2008', 10);
      line(x, S * .54, S * .33, S * .76, S * .25, '#3a2008', 10);
    },

    /* 🐊 Bombardiro Crocodilo — focinho de jacaré */
    bombard(x, S, def) {
      const g = x.createLinearGradient(0, 0, 0, S);
      g.addColorStop(0, MA.shade(def.color, 20)); g.addColorStop(1, MA.shade(def.color, -35));
      x.fillStyle = g; x.fillRect(0, 0, S, S);
      // escamas
      x.globalAlpha = .3;
      for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
        x.beginPath();
        x.arc((c + .5) * S / 8, (r + .5) * S / 8, S * .05, Math.PI, 0);
        x.fillStyle = MA.shade(def.color, -50); x.fill();
      }
      x.globalAlpha = 1;
      // olhos de réptil no alto
      [-1, 1].forEach(s => {
        ell(x, S / 2 + s * S * .22, S * .26, S * .085, S * .065, '#ffd34d'); stroke(x, '#23401c', 5);
        ell(x, S / 2 + s * S * .22, S * .26, S * .018, S * .055, '#111');
      });
      // focinho comprido com dentes
      x.beginPath();
      x.moveTo(S * .26, S * .50); x.lineTo(S * .74, S * .50);
      x.lineTo(S * .66, S * .78); x.lineTo(S * .34, S * .78); x.closePath();
      x.fillStyle = MA.shade(def.color, -18); x.fill(); stroke(x, '#23401c', 6);
      line(x, S * .28, S * .63, S * .72, S * .63, '#23401c', 5);
      x.fillStyle = '#fff';
      for (let i = 0; i < 7; i++) {
        const x1 = S * .29 + i * S * .062;
        x.beginPath(); x.moveTo(x1, S * .63); x.lineTo(x1 + S * .026, S * .565); x.lineTo(x1 + S * .052, S * .63); x.fill();
        x.beginPath(); x.moveTo(x1, S * .63); x.lineTo(x1 + S * .026, S * .695); x.lineTo(x1 + S * .052, S * .63); x.fill();
      }
    },

    /* 🤪 Goofy Ahh NPC — língua de fora e olhos tortos */
    goofy(x, S, def) {
      x.fillStyle = def.color; x.fillRect(0, 0, S, S);
      // sardas
      x.globalAlpha = .4;
      for (let i = 0; i < 26; i++) circ(x, Math.random() * S, S * .5 + Math.random() * S * .4, 3, MA.shade(def.color, -50));
      x.globalAlpha = 1;
      // olhos com tamanhos diferentes e pupilas vesgas
      circ(x, S * .34, S * .38, S * .145, '#fff'); stroke(x, '#7a2d00', 6);
      circ(x, S * .68, S * .43, S * .105, '#fff'); stroke(x, '#7a2d00', 6);
      circ(x, S * .40, S * .40, S * .055, '#111');
      circ(x, S * .63, S * .41, S * .042, '#111');
      // boca aberta com língua
      x.beginPath();
      x.moveTo(S * .28, S * .64); x.quadraticCurveTo(S / 2, S * .92, S * .74, S * .62);
      x.quadraticCurveTo(S / 2, S * .72, S * .28, S * .64);
      x.fillStyle = '#5a1414'; x.fill(); stroke(x, '#7a2d00', 5);
      x.beginPath();
      x.moveTo(S * .44, S * .76); x.quadraticCurveTo(S * .52, S * .99, S * .64, S * .80);
      x.quadraticCurveTo(S * .54, S * .76, S * .44, S * .76);
      x.fillStyle = '#ff6b8a'; x.fill();
    },

    /* ================================================ CHEFES ========== */

    /* MEGA SKIBIDI G-MAN */
    bigskibidi(x, S, def) {
      F.skibidi(x, S, def);
      // olhos brilhando de vermelho
      [-1, 1].forEach(s => {
        circ(x, S / 2 + s * S * .19, S * .47, S * .055, '#ff2d2d');
        x.globalAlpha = .5; circ(x, S / 2 + s * S * .19, S * .47, S * .10, '#ff2d2d'); x.globalAlpha = 1;
      });
      // gravata do G-Man
      x.fillStyle = '#1b3a5c';
      x.beginPath(); x.moveTo(S / 2, S * .86); x.lineTo(S * .44, S * .95);
      x.lineTo(S / 2, S); x.lineTo(S * .56, S * .95); x.closePath(); x.fill();
    },

    /* GIGACHAD */
    gigachad(x, S) {
      const g = x.createLinearGradient(0, 0, S, S);
      g.addColorStop(0, '#e9eef2'); g.addColorStop(.5, '#b9c4cc'); g.addColorStop(1, '#7d8990');
      x.fillStyle = g; x.fillRect(0, 0, S, S);
      // sombras de estátua
      x.globalAlpha = .55; x.fillStyle = '#5c666d';
      x.beginPath(); x.moveTo(S * .16, S * .58); x.quadraticCurveTo(S / 2, S * 1.05, S * .84, S * .58);
      x.quadraticCurveTo(S / 2, S * .70, S * .16, S * .58); x.fill();
      x.globalAlpha = 1;
      // olhos fundos e sérios
      x.fillStyle = '#39424a';
      ell(x, S * .36, S * .44, S * .09, S * .035, '#39424a', -.12);
      ell(x, S * .64, S * .44, S * .09, S * .035, '#39424a', .12);
      // sobrancelhas pesadas
      line(x, S * .24, S * .36, S * .46, S * .40, '#5c666d', 12);
      line(x, S * .54, S * .40, S * .76, S * .36, '#5c666d', 12);
      // nariz grego
      x.beginPath(); x.moveTo(S * .50, S * .40); x.lineTo(S * .46, S * .62); x.lineTo(S * .55, S * .62);
      stroke(x, '#7d8990', 6);
      // mandíbula/boca reta
      line(x, S * .38, S * .74, S * .62, S * .74, '#4a545c', 9);
      // barba cinzelada
      x.globalAlpha = .4; x.fillStyle = '#6b767d';
      for (let i = 0; i < 220; i++) {
        const a = Math.random() * Math.PI, r = S * (.30 + Math.random() * .08);
        x.fillRect(S / 2 + Math.cos(a) * r, S * .64 + Math.sin(a) * r * .55, 3, 3);
      }
      x.globalAlpha = 1;
    },

    tralaboss(x, S, def) {
      F.tralala(x, S, def);
      [-1, 1].forEach(s => { circ(x, S / 2 + s * S * .20, S * .33, S * .034, '#ff2d2d'); });
    },

    bombaboss(x, S, def) {
      F.bombard(x, S, def);
      [-1, 1].forEach(s => { ell(x, S / 2 + s * S * .22, S * .26, S * .02, S * .055, '#ff2d2d'); });
    },

    /* O ALGORITMO — cérebro/olho do feed infinito */
    brainrot(x, S) {
      const g = x.createRadialGradient(S / 2, S / 2, 8, S / 2, S / 2, S * .7);
      g.addColorStop(0, '#ff8ad4'); g.addColorStop(.45, '#ff3ca6'); g.addColorStop(1, '#3a0060');
      x.fillStyle = g; x.fillRect(0, 0, S, S);
      // dobras de cérebro
      x.strokeStyle = 'rgba(90,0,110,.7)'; x.lineWidth = 9; x.lineCap = 'round';
      for (let i = 0; i < 9; i++) {
        x.beginPath();
        const y = S * (.1 + i * .1);
        x.moveTo(S * .05, y);
        x.bezierCurveTo(S * .3, y - S * .09, S * .55, y + S * .1, S * .96, y - S * .02);
        x.stroke();
      }
      // olho central que tudo vê
      circ(x, S / 2, S * .52, S * .22, '#ffffff');
      circ(x, S / 2, S * .52, S * .13, '#6a00ff');
      circ(x, S / 2, S * .52, S * .055, '#000');
      circ(x, S * .45, S * .46, S * .03, 'rgba(255,255,255,.95)');
      x.strokeStyle = '#2a0040'; x.lineWidth = 8;
      x.beginPath(); x.arc(S / 2, S * .52, S * .22, 0, TAU); x.stroke();
    }
  };


  /* ===================================================================
     ROSTOS DAS SKINS DO JOGADOR  (chave 'skin:<id>')
     =================================================================== */
  function skinBase(x, S, tone) {
    tone = tone || '#e8b07a';
    const g = x.createRadialGradient(S * .36, S * .3, 10, S / 2, S / 2, S * .66);
    g.addColorStop(0, MA.shade(tone, 26)); g.addColorStop(.6, tone);
    g.addColorStop(1, MA.shade(tone, -38));
    x.fillStyle = g; x.fillRect(0, 0, S, S);
  }
  function brows(x, S, y1, y2, color, w) {
    x.beginPath(); x.moveTo(S * .24, S * y1); x.quadraticCurveTo(S * .34, S * y2, S * .45, S * y1); stroke(x, color, w || 9);
    x.beginPath(); x.moveTo(S * .55, S * y1); x.quadraticCurveTo(S * .66, S * y2, S * .76, S * y1); stroke(x, color, w || 9);
  }
  function shades(x, S, lens, glint) {
    x.fillStyle = lens || '#15151d';
    x.beginPath();
    x.moveTo(S * .15, S * .41); x.lineTo(S * .45, S * .41);
    x.lineTo(S * .43, S * .57); x.lineTo(S * .19, S * .57); x.closePath(); x.fill();
    x.beginPath();
    x.moveTo(S * .55, S * .41); x.lineTo(S * .85, S * .41);
    x.lineTo(S * .81, S * .57); x.lineTo(S * .57, S * .57); x.closePath(); x.fill();
    x.fillRect(S * .45, S * .44, S * .10, S * .035);
    if (glint) {
      x.strokeStyle = glint; x.lineWidth = 5;
      x.beginPath(); x.moveTo(S * .19, S * .55); x.lineTo(S * .31, S * .43); x.stroke();
      x.beginPath(); x.moveTo(S * .59, S * .55); x.lineTo(S * .71, S * .43); x.stroke();
    }
  }

  const SK = {
    /* 😎 Chill Guy — leitura mínima de party-game: dois olhos verticais. */
    chill(x, S, d) {
      skinBase(x, S, d.skinTone);
      [-1, 1].forEach(s => {
        ell(x, S / 2 + s * S * .17, S * .50, S * .035, S * .105, '#211913');
        ell(x, S / 2 + s * S * .158, S * .465, S * .010, S * .025, 'rgba(255,255,255,.72)');
      });
    },

    /* 🕶️ Hacker — capuz escuro e óculos com reflexo verde */
    hacker(x, S, d) {
      skinBase(x, S, d.skinTone);
      x.fillStyle = 'rgba(0,0,0,.55)';
      x.beginPath(); x.moveTo(0, 0); x.lineTo(S, 0); x.lineTo(S, S * .34);
      x.quadraticCurveTo(S / 2, S * .18, 0, S * .34); x.closePath(); x.fill();
      shades(x, S, '#0b0f0c', '#39ff88');
      line(x, S * .40, S * .74, S * .60, S * .74, '#2a2f2a', 7);
      // chuva de código
      x.fillStyle = 'rgba(57,255,136,.5)'; x.font = '15px monospace';
      for (let i = 0; i < 16; i++) x.fillText(Math.random() < .5 ? '1' : '0', Math.random() * S, S * (.78 + Math.random() * .2));
    },

    /* 🐕 Doge Dourado */
    doge(x, S, d) {
      skinBase(x, S, d.skinTone);
      ell(x, S / 2, S * .66, S * .28, S * .22, MA.shade(d.skinTone, 42));
      brows(x, S, .30, .24, MA.shade(d.skinTone, -55), 9);
      eyes(x, S, S * .44, S * .17, S * .075, S * .085, '#2a1a08', S * .04);
      x.beginPath();
      x.moveTo(S / 2 - S * .07, S * .58); x.quadraticCurveTo(S / 2, S * .52, S / 2 + S * .07, S * .58);
      x.quadraticCurveTo(S / 2, S * .66, S / 2 - S * .07, S * .58);
      x.fillStyle = '#2a1a08'; x.fill();
      x.beginPath();
      x.moveTo(S / 2, S * .64); x.lineTo(S / 2, S * .70);
      x.moveTo(S / 2, S * .70); x.quadraticCurveTo(S * .40, S * .78, S * .34, S * .68);
      x.moveTo(S / 2, S * .70); x.quadraticCurveTo(S * .60, S * .78, S * .66, S * .68);
      stroke(x, '#2a1a08', 7);
    },

    /* 🤡 Palhaço do Lobby */
    clown(x, S, d) {
      skinBase(x, S, d.skinTone);
      // olhos com X de maquiagem
      [-1, 1].forEach(s => {
        const cx = S / 2 + s * S * .19;
        circ(x, cx, S * .44, S * .105, '#ffffff'); stroke(x, '#c0392b', 5);
        circ(x, cx, S * .45, S * .045, '#111');
        line(x, cx - S * .13, S * .31, cx + S * .13, S * .57, '#2bb3ff', 7);
        line(x, cx + S * .13, S * .31, cx - S * .13, S * .57, '#2bb3ff', 7);
      });
      // nariz vermelho
      circ(x, S / 2, S * .60, S * .085, '#ff2d2d');
      circ(x, S * .48, S * .58, S * .025, 'rgba(255,255,255,.7)');
      // sorriso pintado
      x.beginPath(); x.moveTo(S * .24, S * .70); x.quadraticCurveTo(S / 2, S * .92, S * .76, S * .70);
      stroke(x, '#c0392b', 12);
      smile(x, S, S * .72, S * .13, S * .09, '#5a1414', 6);
    },

    /* 😏 Rizzler */
    rizzler(x, S, d) {
      skinBase(x, S, d.skinTone);
      x.beginPath();
      x.moveTo(S * .10, S * .32); x.quadraticCurveTo(S * .30, S * .00, S * .62, S * .12);
      x.quadraticCurveTo(S * .88, S * .20, S * .90, S * .36);
      x.quadraticCurveTo(S / 2, S * .20, S * .10, S * .32);
      x.fillStyle = '#231a16'; x.fill();
      x.beginPath(); x.moveTo(S * .23, S * .42); x.quadraticCurveTo(S * .33, S * .28, S * .45, S * .37); stroke(x, '#231a16', 9);
      x.beginPath(); x.moveTo(S * .56, S * .41); x.quadraticCurveTo(S * .66, S * .37, S * .77, S * .43); stroke(x, '#231a16', 9);
      [-1, 1].forEach(s => {
        x.beginPath(); x.ellipse(S / 2 + s * S * .17, S * .51, S * .08, S * .045, 0, 0, TAU);
        x.fillStyle = '#fff'; x.fill(); stroke(x, '#231a16', 4);
        circ(x, S / 2 + s * S * .17, S * .515, S * .032, '#1a1a1a');
      });
      x.beginPath(); x.moveTo(S * .34, S * .70); x.quadraticCurveTo(S * .54, S * .80, S * .70, S * .63); stroke(x, '#5a3318', 8);
      circ(x, S * .66, S * .665, S * .017, '#ffffff');
    },

    /* 🗿 Sigma Grindset */
    sigma(x, S, d) {
      skinBase(x, S, d.skinTone);
      brows(x, S, .38, .33, '#3a3f46', 13);
      shades(x, S, '#0b0b11', '#00e5ff');
      line(x, S * .40, S * .75, S * .60, S * .75, '#2b3038', 9);
      x.globalAlpha = .28; x.fillStyle = '#39414a';
      for (let i = 0; i < 180; i++) {
        const a = Math.random() * Math.PI, r = S * (.29 + Math.random() * .07);
        x.fillRect(S / 2 + Math.cos(a) * r, S * .66 + Math.sin(a) * r * .55, 3, 3);
      }
      x.globalAlpha = 1;
    },

    /* 👻 Fantasma do Chat */
    ghost(x, S, d) {
      skinBase(x, S, d.skinTone);
      x.globalAlpha = .9;
      ell(x, S * .37, S * .45, S * .085, S * .12, '#2b3a55');
      ell(x, S * .63, S * .45, S * .085, S * .12, '#2b3a55');
      x.globalAlpha = 1;
      circ(x, S * .355, S * .41, S * .028, 'rgba(255,255,255,.9)');
      circ(x, S * .615, S * .41, S * .028, 'rgba(255,255,255,.9)');
      ell(x, S / 2, S * .70, S * .09, S * .07, '#2b3a55');
      // névoa
      x.globalAlpha = .18; x.fillStyle = '#ffffff';
      for (let i = 0; i < 6; i++) ell(x, Math.random() * S, S * (.8 + Math.random() * .2), S * .18, S * .05, '#ffffff');
      x.globalAlpha = 1;
    },

    /* 😈 Demônio do Ratio */
    demon(x, S, d) {
      skinBase(x, S, d.skinTone);
      brows(x, S, .40, .28, '#2a0309', 12);
      [-1, 1].forEach(s => {
        const cx = S / 2 + s * S * .18;
        ell(x, cx, S * .48, S * .095, S * .065, '#ffd400');
        x.globalAlpha = .55; circ(x, cx, S * .48, S * .13, '#ff6a00'); x.globalAlpha = 1;
        ell(x, cx, S * .48, S * .02, S * .055, '#1a0000');
      });
      // sorriso de dentes afiados
      x.beginPath(); x.moveTo(S * .24, S * .64); x.quadraticCurveTo(S / 2, S * .90, S * .76, S * .64);
      x.quadraticCurveTo(S / 2, S * .72, S * .24, S * .64);
      x.fillStyle = '#1a0000'; x.fill();
      x.save();
      x.beginPath(); x.moveTo(S * .24, S * .64); x.quadraticCurveTo(S / 2, S * .90, S * .76, S * .64);
      x.quadraticCurveTo(S / 2, S * .72, S * .24, S * .64); x.clip();
      x.fillStyle = '#fff';
      for (let i = 0; i < 7; i++) {
        const w = S * .075, x1 = S * .25 + i * w;
        x.beginPath(); x.moveTo(x1, S * .64); x.lineTo(x1 + w / 2, S * .76); x.lineTo(x1 + w, S * .64); x.fill();
      }
      x.restore();
    },

    /* 🗿 Gigachad */
    gigachad(x, S, d) {
      skinBase(x, S, d.skinTone);
      x.globalAlpha = .4; x.fillStyle = '#5c666d';
      x.beginPath(); x.moveTo(S * .16, S * .60); x.quadraticCurveTo(S / 2, S * 1.04, S * .84, S * .60);
      x.quadraticCurveTo(S / 2, S * .72, S * .16, S * .60); x.fill();
      x.globalAlpha = 1;
      ell(x, S * .36, S * .45, S * .09, S * .035, '#39424a', -.12);
      ell(x, S * .64, S * .45, S * .09, S * .035, '#39424a', .12);
      line(x, S * .24, S * .37, S * .46, S * .41, '#5c666d', 12);
      line(x, S * .54, S * .41, S * .76, S * .37, '#5c666d', 12);
      x.beginPath(); x.moveTo(S * .50, S * .41); x.lineTo(S * .46, S * .62); x.lineTo(S * .55, S * .62); stroke(x, '#8d979e', 6);
      line(x, S * .38, S * .75, S * .62, S * .75, '#4a545c', 9);
      x.globalAlpha = .35; x.fillStyle = '#6b767d';
      for (let i = 0; i < 200; i++) {
        const a = Math.random() * Math.PI, r = S * (.30 + Math.random() * .08);
        x.fillRect(S / 2 + Math.cos(a) * r, S * .65 + Math.sin(a) * r * .55, 3, 3);
      }
      x.globalAlpha = 1;
    },

    /* Coleção 6 — olhos simples e uma pequena marca orbital. */
    sixorbit(x, S, d) {
      skinBase(x, S, d.skinTone);
      [-1, 1].forEach(s => {
        ell(x, S / 2 + s * S * .17, S * .49, S * .035, S * .105, '#17253a');
        ell(x, S / 2 + s * S * .158, S * .455, S * .009, S * .024, 'rgba(255,255,255,.72)');
      });
      arc(x, S * .29, S * .70, S * .034, -.35, TAU - .35, '#2de2ff', S * .017);
      line(x, S * .267, S * .673, S * .286, S * .625, '#2de2ff', S * .017);
    },

    /* Coleção 7 — mesma leitura limpa, com pintura prismática discreta. */
    sevenbreak(x, S, d) {
      skinBase(x, S, d.skinTone);
      [-1, 1].forEach(s => {
        ell(x, S / 2 + s * S * .17, S * .49, S * .036, S * .106, '#25172f', s * .025);
        ell(x, S / 2 + s * S * .158, S * .454, S * .009, S * .024, 'rgba(255,255,255,.72)');
      });
      line(x, S * .68, S * .65, S * .75, S * .65, '#ff4fbd', S * .019);
      line(x, S * .743, S * .66, S * .69, S * .75, '#9b65ff', S * .019);
    },

    /* Fusão 67 — olhos mínimos e dois glifos, um de cada frequência. */
    duo67(x, S, d) {
      skinBase(x, S, d.skinTone);
      x.fillStyle = 'rgba(101,114,255,.10)'; x.fillRect(0, 0, S / 2, S);
      x.fillStyle = 'rgba(255,79,189,.10)'; x.fillRect(S / 2, 0, S / 2, S);
      [-1, 1].forEach(s => {
        ell(x, S / 2 + s * S * .17, S * .49, S * .037, S * .108, '#191629');
        ell(x, S / 2 + s * S * .158, S * .454, S * .010, S * .025, 'rgba(255,255,255,.76)');
      });
      arc(x, S * .31, S * .70, S * .030, -.35, TAU - .35, '#2de2ff', S * .016);
      line(x, S * .29, S * .676, S * .305, S * .638, '#2de2ff', S * .016);
      line(x, S * .67, S * .66, S * .72, S * .66, '#ff4fbd', S * .017);
      line(x, S * .714, S * .67, S * .68, S * .735, '#ff4fbd', S * .017);
    },

    /* Temporada 67 — olhos mínimos; identidade fica no traje e nos glifos. */
    sixtyseven(x, S) {
      skinBase(x, S, '#e7aa7c');
      [-1, 1].forEach(s => {
        ell(x, S / 2 + s * S * .17, S * .49, S * .036, S * .108, '#211829');
        ell(x, S / 2 + s * S * .158, S * .454, S * .010, S * .026, 'rgba(255,255,255,.72)');
      });
      /* pintura facial 6·7 minúscula, sem sobrancelha, nariz ou boca */
      x.strokeStyle = '#2de2ff'; x.lineWidth = S * .016; x.lineCap = 'round';
      x.beginPath(); x.arc(S * .30, S * .70, S * .025, 0, TAU); x.stroke();
      line(x, S * .285, S * .682, S * .30, S * .645, '#2de2ff', S * .016);
      line(x, S * .67, S * .66, S * .72, S * .66, '#ff4fbd', S * .017);
      line(x, S * .715, S * .668, S * .68, S * .73, '#ff4fbd', S * .017);
    },

    /* 👑 Rei do Brainrot */
    king(x, S, d) {
      skinBase(x, S, d.skinTone);
      brows(x, S, .35, .29, '#6b4a00', 9);
      [-1, 1].forEach(s => {
        const cx = S / 2 + s * S * .18;
        ell(x, cx, S * .46, S * .095, S * .075, '#ffffff'); stroke(x, '#7a5a00', 4);
        circ(x, cx, S * .47, S * .04, '#2b1d00');
        circ(x, cx - S * .025, S * .44, S * .016, '#fff');
      });
      // barba dourada
      x.fillStyle = 'rgba(255,215,0,.55)';
      x.beginPath(); x.moveTo(S * .22, S * .62); x.quadraticCurveTo(S / 2, S * 1.05, S * .78, S * .62);
      x.quadraticCurveTo(S / 2, S * .74, S * .22, S * .62); x.fill();
      smile(x, S, S * .68, S * .14, S * .10, '#6b4a00', 8);
      // brilho
      circ(x, S * .80, S * .26, S * .03, 'rgba(255,255,255,.9)');
    }
  };

  Object.keys(SK).forEach(k => { F['skin:' + k] = SK[k]; });

  /* aliases: chefes que reaproveitam o rosto do inimigo comum */
  MA.FACES = F;
})(window.MA);
