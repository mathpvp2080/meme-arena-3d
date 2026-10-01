/* MEME ARENA 3D — interface: HUD, telas, cards de perk, radar, feed */
(function (MA) {
  'use strict';
  const $ = MA.$;

  const UI = {
    el: {}, bannerTimer: null, feed: [], hitT: 0,

    init() {
      const ids = ['hud','hpf','hpt','enf','ent','rzf','rzt','score','waveTxt','combo','powers',
        'wname','wicon','wdesc','weaponList','minimap','banner','bannerT','bannerS','floats',
        'vig','killfeed','hitmark','fps','bossbar','bossname','bossfill','dashpips','perkbar','crosshair'];
      ids.forEach(i => this.el[i] = $(i));
      this.mm = this.el.minimap.getContext('2d');
      this.mmSize = this.el.minimap.width;
    },

    /* ----------------------------------------------------------- HUD -- */
    update(G, p) {
      const e = this.el;
      e.hpf.style.width = MA.clamp(p.hp / p.maxhp * 100, 0, 100) + '%';
      e.hpt.textContent = Math.max(0, Math.ceil(p.hp)) + ' / ' + Math.round(p.maxhp);
      e.enf.style.width = MA.clamp(p.energy / p.maxenergy * 100, 0, 100) + '%';
      e.ent.textContent = Math.ceil(p.energy);
      e.rzf.style.width = MA.clamp(G.brainrot, 0, 100) + '%';
      e.rzt.textContent = Math.floor(G.brainrot) + '%' + (G.brainrot >= 100 ? '  [E]' : '');
      e.rzf.parentElement.parentElement.classList.toggle('ready', G.brainrot >= 100);

      e.score.textContent = MA.fmt(G.score);
      e.waveTxt.textContent = G.bossAlive
        ? 'ONDA ' + G.wave + ' · CHEFE'
        : 'ONDA ' + G.wave + ' · ' + G.waveKills + '/' + G.waveTarget;

      if (G.combo > 1) {
        e.combo.style.opacity = '1';
        e.combo.textContent = 'COMBO x' + G.combo;
        e.combo.style.color = G.combo > 15 ? '#ff2d6f' : G.combo > 7 ? '#ffe600' : '#ff4df0';
      } else e.combo.style.opacity = '0';

      const w = MA.WEAPONS[p.weapon];
      e.wname.textContent = w.name;
      e.wicon.textContent = w.icon;
      e.wdesc.textContent = w.desc;

      /* pips de dash */
      let pips = '';
      for (let i = 0; i < p.dashMax; i++)
        pips += '<i class="' + (i < Math.floor(p.dashCharges) ? 'on' : '') + '"></i>';
      e.dashpips.innerHTML = pips;

      /* buffs ativos */
      let html = '';
      if (p.bDmg > 0)    html += tag('📈 DANO x2', '#00ff88', p.bDmg);
      if (p.bSpeed > 0)  html += tag('😏 RIZZ', '#7a5bff', p.bSpeed);
      if (p.bShield > 0) html += tag('🗿 ESCUDO', '#b9c4cc', p.bShield);
      if (p.bRate > 0)   html += tag('🔥 OVERDRIVE', '#ffc42e', p.bRate);
      if (G.ult > 0)     html += tag('🧠 BRAINROT', '#ff00c8', G.ult);
      e.powers.innerHTML = html;

      /* barra do chefe */
      if (G.bossAlive && !G.bossAlive.dead) {
        e.bossbar.classList.remove('hid');
        e.bossname.textContent = G.bossAlive.def.emoji + '  ' + G.bossAlive.def.name + '  ·  FASE ' + G.bossAlive.phase;
        e.bossfill.style.width = MA.clamp(G.bossAlive.hp / G.bossAlive.maxhp * 100, 0, 100) + '%';
      } else e.bossbar.classList.add('hid');

      /* hitmarker */
      if (this.hitT > 0) {
        this.hitT -= 1 / 60;
        e.hitmark.style.opacity = MA.clamp(this.hitT * 6, 0, 1);
      } else e.hitmark.style.opacity = '0';
    },

    updateWeaponList(p, G) {
      let h = '';
      MA.WEAPONS.forEach((w, i) => {
        const locked = G.wave < w.unlock;
        h += '<div class="wslot' + (i === p.weapon ? ' sel' : '') + (locked ? ' lock' : '') + '">' +
             '<b>' + (i + 1) + '</b><span>' + w.icon + '</span>' +
             (locked ? '<em>onda ' + w.unlock + '</em>' : '') + '</div>';
      });
      this.el.weaponList.innerHTML = h;
    },

    updatePerkBar(perks) {
      let h = '';
      Object.keys(perks).forEach(id => {
        const def = MA.PERKS.find(x => x.id === id);
        if (def) h += '<span class="pbadge" title="' + def.name + ': ' + def.desc + '">' +
                      def.icon + (perks[id] > 1 ? '<i>' + perks[id] + '</i>' : '') + '</span>';
      });
      this.el.perkbar.innerHTML = h;
    },

    hitmark(crit) {
      this.hitT = crit ? .28 : .16;
      this.el.hitmark.style.color = crit ? '#ffe600' : '#ffffff';
      this.el.hitmark.style.transform = 'translate(-50%,-50%) scale(' + (crit ? 1.45 : 1) + ')';
    },

    /* ------------------------------------------------------- feedback -- */
    float(text, color, size) {
      const d = document.createElement('div');
      d.className = 'ft'; d.textContent = text;
      d.style.color = color || '#ffe600';
      d.style.fontSize = (size || 24) + 'px';
      d.style.left = (window.innerWidth / 2 + MA.rand(-130, 130)) + 'px';
      d.style.top = (window.innerHeight * .44 + MA.rand(-60, 60)) + 'px';
      this.el.floats.appendChild(d);
      setTimeout(() => d.remove(), 1200);
    },

    kill(name, emoji, color) {
      const d = document.createElement('div');
      d.className = 'kf';
      d.innerHTML = '<b style="color:' + (color || '#ff2d6f') + '">' + emoji + ' ' + name + '</b> foi deletado';
      this.el.killfeed.appendChild(d);
      while (this.el.killfeed.children.length > 5) this.el.killfeed.firstChild.remove();
      setTimeout(() => d.remove(), 3200);
    },

    notice(html) {
      const d = document.createElement('div');
      d.className = 'kf';
      d.innerHTML = html;
      this.el.killfeed.appendChild(d);
      while (this.el.killfeed.children.length > 5) this.el.killfeed.firstChild.remove();
      setTimeout(() => d.remove(), 4000);
    },

    banner(t, s, dur, cls) {
      this.el.bannerT.textContent = t;
      this.el.bannerS.textContent = s || '';
      this.el.banner.className = cls || '';
      this.el.banner.style.opacity = '1';
      clearTimeout(this.bannerTimer);
      this.bannerTimer = setTimeout(() => { this.el.banner.style.opacity = '0'; }, dur || 2000);
    },

    damageFlash(strong) {
      const v = this.el.vig;
      v.style.opacity = strong ? '1' : '.8';
      setTimeout(() => { v.style.opacity = '0'; }, 190);
    },

    /* ---------------------------------------------------------- radar -- */
    radar(G, p, enemies, pickups, yaw) {
      const s = this.mmSize, half = s / 2, k = half / MA.World.ARENA, x = this.mm;
      x.clearRect(0, 0, s, s);
      x.fillStyle = 'rgba(5,2,20,.72)'; x.fillRect(0, 0, s, s);
      x.strokeStyle = 'rgba(255,0,200,.55)'; x.lineWidth = 2; x.strokeRect(2, 2, s - 4, s - 4);

      x.fillStyle = 'rgba(120,80,255,.4)';
      MA.World.obstacles.forEach(o => {
        x.beginPath(); x.arc(half + o.x * k, half + o.z * k, Math.max(2, o.r * k), 0, MA.TAU); x.fill();
      });

      pickups.forEach(pk => {
        x.fillStyle = '#39ff88';
        x.fillRect(half + pk.obj.position.x * k - 2, half + pk.obj.position.z * k - 2, 4, 4);
      });

      enemies.forEach(e => {
        x.fillStyle = e.isBoss ? '#ffe600' : e.elite ? '#ffd400' : '#ff2d6f';
        x.beginPath();
        x.arc(half + e.obj.position.x * k, half + e.obj.position.z * k, e.isBoss ? 5.5 : e.elite ? 3.6 : 2.6, 0, MA.TAU);
        x.fill();
      });

      const px = half + p.pos.x * k, pz = half + p.pos.z * k;
      x.save(); x.translate(px, pz); x.rotate(-yaw);
      const grd = x.createRadialGradient(0, 0, 0, 0, 0, 38);
      grd.addColorStop(0, 'rgba(0,255,213,.35)'); grd.addColorStop(1, 'rgba(0,255,213,0)');
      x.fillStyle = grd;
      x.beginPath(); x.moveTo(0, 0); x.arc(0, 0, 38, -Math.PI / 2 - .62, -Math.PI / 2 + .62); x.closePath(); x.fill();
      x.restore();
      x.fillStyle = '#00ffd5';
      x.beginPath(); x.arc(px, pz, 4, 0, MA.TAU); x.fill();
    },

    /* ----------------------------------------------------- perk cards -- */
    showPerks(choices, onPick) {
      const box = $('perkCards');
      box.innerHTML = '';
      choices.forEach((pk, idx) => {
        const r = MA.RARITY[pk.rarity];
        const c = document.createElement('button');
        c.className = 'card';
        c.style.setProperty('--rc', r.color);
        c.innerHTML =
          '<div class="crar" style="color:' + r.color + '">' + r.name + '</div>' +
          '<div class="cico">' + pk.icon + '</div>' +
          '<div class="cname">' + pk.name + '</div>' +
          '<div class="cdesc">' + pk.desc + '</div>' +
          '<div class="ckey">[' + (idx + 1) + ']</div>';
        c.onclick = () => onPick(pk);
        box.appendChild(c);
      });
      $('perkScreen').classList.remove('hid');
    },
    hidePerks() { $('perkScreen').classList.add('hid'); },

    /* --------------------------------------------------- leaderboard -- */
    renderBoard() {
      const list = MA.store.get('scores', []);
      const el = $('boardList');
      if (!list.length) { el.innerHTML = '<p class="dim">Nenhuma partida ainda. Bora jogar!</p>'; return; }
      let h = '<table><tr><th>#</th><th>PONTOS</th><th>ONDA</th><th>DIFIC.</th><th>RANK</th><th>DATA</th></tr>';
      list.slice(0, 10).forEach((s, i) => {
        h += '<tr><td class="pos">' + (i + 1) + '</td><td class="sc">' + MA.fmt(s.score) +
             '</td><td>' + s.wave + '</td><td>' + s.diff + '</td><td>' + s.rank +
             '</td><td class="dim">' + s.date + '</td></tr>';
      });
      el.innerHTML = h + '</table>';
    },

    saveScore(score, wave, diffName, rank) {
      const list = MA.store.get('scores', []);
      list.push({
        score: Math.round(score), wave, diff: diffName, rank,
        date: new Date().toLocaleDateString('pt-BR')
      });
      list.sort((a, b) => b.score - a.score);
      MA.store.set('scores', list.slice(0, 20));
      const best = MA.store.get('best', 0);
      if (score > best) { MA.store.set('best', Math.round(score)); return true; }
      return false;
    }
  };

  function tag(label, color, secs) {
    return '<span class="pw" style="color:' + color + ';border-color:' + color + ';background:' + color + '1f">' +
           label + ' <i>' + secs.toFixed(1) + 's</i></span>';
  }

  MA.UI = UI;
})(window.MA);
