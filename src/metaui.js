/* MEME ARENA 3D — telas de conta, hub, loja e inventário */
(function (MA) {
  'use strict';
  const $ = MA.$;

  const M = {
    shopTab: 'weapon',
    invTab: 'all',
    busy: false,

    /* ------------------------------------------------------------ toast */
    toast(msg, kind) {
      const box = $('toasts');
      const d = document.createElement('div');
      d.className = 'toast' + (kind ? ' ' + kind : '');
      d.innerHTML = msg;
      box.appendChild(d);
      setTimeout(() => { d.style.opacity = '0'; d.style.transform = 'translateX(30px)'; }, 2600);
      setTimeout(() => d.remove(), 3100);
    },

    screen(id) {
      ['auth', 'hub', 'shop', 'inventory', 'start', 'help', 'board', 'settings', 'over', 'pausebox', 'perkScreen']
        .forEach(s => { const e = $(s); if (e) e.classList.add('hid'); });
      if (id) $(id).classList.remove('hid');
    },

    /* ============================================================= AUTH */
    initAuth() {
      const tabs = document.querySelectorAll('#auth .tab');
      tabs.forEach(t => t.onclick = () => {
        tabs.forEach(x => x.classList.remove('sel'));
        t.classList.add('sel');
        const reg = t.dataset.tab === 'register';
        $('authAction').textContent = reg ? 'CRIAR CONTA' : 'ENTRAR';
        $('authConfirmRow').classList.toggle('hid', !reg);
        $('authMode').value = reg ? 'register' : 'login';
        this.authError('');
      });

      $('authForm').onsubmit = async ev => {
        ev.preventDefault();
        if (this.busy) return;
        const u = $('authUser').value.trim();
        const p = $('authPass').value;
        const mode = $('authMode').value;
        if (mode === 'register' && p !== $('authPass2').value) {
          return this.authError('As senhas não conferem.');
        }
        this.busy = true;
        $('authAction').textContent = 'AGUARDE…';
        this.authError('');
        try {
          const r = mode === 'register'
            ? await MA.Net.signUp(u, p)
            : await MA.Net.signIn(u, p);
          if (r.error) { this.authError(r.error); return; }
          MA.Profile.set(r.profile);
          MA.Profile.save(true);
          this.toast('👋 Bem-vindo, <b>' + r.profile.username + '</b>!');
          this.openHub();
        } catch (e) {
          this.authError('Falha de conexão: ' + e.message);
        } finally {
          this.busy = false;
          $('authAction').textContent = $('authMode').value === 'register' ? 'CRIAR CONTA' : 'ENTRAR';
        }
      };

      $('authGuest').onclick = async () => {
        const name = 'Convidado' + Math.floor(Math.random() * 9000 + 1000);
        const r = await MA.Net.signUp(name, 'convidado123');
        if (r.error) return this.authError(r.error);
        MA.Profile.set(r.profile);
        MA.Profile.save(true);
        this.toast('Jogando como <b>' + name + '</b>. O progresso fica salvo neste navegador.');
        this.openHub();
      };

      $('modeBadge').textContent = MA.Net.online ? '🌐 ONLINE' : '💾 LOCAL';
      $('modeBadge').className = 'modebadge ' + (MA.Net.online ? 'on' : 'off');
      $('modeHint').innerHTML = MA.Net.online
        ? 'Sua conta funciona em qualquer dispositivo.'
        : 'Modo local: a conta fica salva <b>só neste navegador</b>.';
    },

    authError(msg) {
      const e = $('authError');
      e.textContent = msg || '';
      e.classList.toggle('hid', !msg);
    },

    /* ============================================================== HUB */
    openHub() {
      if (MA._prepHub) MA._prepHub();
      this.renderHub();
      this.screen('hub');
    },

    renderHub() {
      const p = MA.Profile.data;
      if (!p) return;
      const skin = MA.Profile.equippedSkin();
      const armor = MA.Profile.equippedArmor();
      const need = MA.Profile.xpToNext();

      $('hubName').textContent = p.username;
      $('hubLevel').textContent = p.level;
      $('hubXpFill').style.width = (MA.Profile.xpProgress() * 100) + '%';
      $('hubXpTxt').textContent = MA.fmt(p.xp) + ' / ' + MA.fmt(need) + ' XP';
      $('hubCoins').textContent = MA.fmt(p.coins);
      $('hubSkin').textContent = skin.face + ' ' + skin.name;
      $('hubArmor').textContent = '🛡️ ' + armor.name;

      const wIdx = MA.Profile.equippedWeapons();
      $('hubWeapons').innerHTML = wIdx.length
        ? wIdx.map(i => '<span class="chip">' + MA.WEAPONS[i].icon + ' ' + MA.WEAPONS[i].name + '</span>').join('')
        : '<span class="chip warn">⚠️ nenhuma arma — compre na loja</span>';

      const s = p.stats;
      $('hubStats').innerHTML =
        st('PARTIDAS', MA.fmt(s.games)) + st('RECORDE', MA.fmt(s.bestScore)) +
        st('MELHOR ONDA', s.bestWave) + st('ABATES', MA.fmt(s.kills)) +
        st('CHEFES', s.bosses) + st('COMBO MÁX', 'x' + s.maxCombo);

      /* trava do multiplayer */
      const ok = MA.Profile.canMultiplayer();
      const btn = $('mpBtn');
      btn.classList.toggle('locked', !ok);
      btn.innerHTML = ok
        ? '⚔️ MULTIPLAYER'
        : '🔒 MULTIPLAYER <em>nível ' + MA.CONFIG.MULTIPLAYER_LEVEL + '</em>';

      $('playBtnHub').classList.toggle('needweapon', wIdx.length === 0);
    },

    /* ============================================================= LOJA */
    openShop(tab) {
      this.shopTab = tab || this.shopTab;
      this.renderShop();
      this.screen('shop');
    },

    renderShop() {
      const p = MA.Profile.data;
      $('shopCoins').textContent = MA.fmt(p.coins);
      document.querySelectorAll('#shop .tab').forEach(t =>
        t.classList.toggle('sel', t.dataset.tab === this.shopTab));

      const items = MA.catalog()
        .filter(i => i.type === this.shopTab)
        .sort((a, b) => (a.price - b.price));

      $('shopGrid').innerHTML = items.map(i => this.card(i, 'shop')).join('');
      this.bindCards('shop');
    },

    /* ======================================================== INVENTÁRIO */
    openInventory(tab) {
      this.invTab = tab || this.invTab;
      this.renderInventory();
      this.screen('inventory');
    },

    renderInventory() {
      const p = MA.Profile.data;
      $('invCoins').textContent = MA.fmt(p.coins);
      document.querySelectorAll('#inventory .tab').forEach(t =>
        t.classList.toggle('sel', t.dataset.tab === this.invTab));

      let items = MA.Profile.items();
      if (this.invTab !== 'all') items = items.filter(i => i.type === this.invTab);
      items.sort((a, b) => (b.price || 0) - (a.price || 0));

      $('invCount').textContent = MA.Profile.items().length + ' itens';
      $('invGrid').innerHTML = items.length
        ? items.map(i => this.card(i, 'inv')).join('')
        : '<p class="dim" style="grid-column:1/-1;padding:24px">Nada aqui ainda. Vá até a loja!</p>';
      this.bindCards('inv');
    },

    /* --------------------------------------------------------- card HTML */
    card(item, ctx) {
      const r = MA.ITEM_RARITY[item.rarity] || MA.ITEM_RARITY.common;
      const owned = MA.Profile.owns(item.type, item.id);
      const eq = MA.Profile.isEquipped(item.type, item.id);
      const lv = MA.Profile.data.level;
      const canLv = lv >= (item.level || 1);
      const canCoin = MA.Profile.data.coins >= item.price;

      const icon = item.type === 'skin' ? item.face
                 : item.type === 'armor' ? '🛡️'
                 : item.icon || '🔫';

      let stats = '';
      if (item.type === 'armor') {
        stats = '<div class="istats">' +
          (item.hp ? '<span>+' + item.hp + ' HP</span>' : '') +
          (item.dr ? '<span>-' + Math.round(item.dr * 100) + '% dano</span>' : '') +
          (!item.hp && !item.dr ? '<span>sem bônus</span>' : '') + '</div>';
      } else if (item.type === 'weapon') {
        const w = MA.WEAPONS.find(x => x.id === item.id);
        if (w) stats = '<div class="istats"><span>' + w.dmg + ' dano</span><span>' +
          (w.count > 1 ? w.count + ' projéteis' : (1 / w.rate).toFixed(1) + '/s') + '</span></div>';
      }

      let action;
      if (ctx === 'shop') {
        if (owned) action = '<button class="ibtn owned" disabled>✔ ADQUIRIDO</button>';
        else if (!canLv) action = '<button class="ibtn lock" disabled>🔒 NÍVEL ' + item.level + '</button>';
        else action = '<button class="ibtn buy' + (canCoin ? '' : ' poor') + '" data-type="' + item.type +
          '" data-id="' + item.id + '" data-act="buy">🪙 ' + MA.fmt(item.price) + '</button>';
      } else {
        const sellv = Math.round((item.price || 0) * MA.CONFIG.SELL_RATE);
        action = '<div class="ibtns">' +
          '<button class="ibtn ' + (eq ? 'uneq' : 'eq') + '" data-type="' + item.type +
            '" data-id="' + item.id + '" data-act="equip">' + (eq ? '✔ EQUIPADO' : 'EQUIPAR') + '</button>' +
          (item.starter ? '' :
            '<button class="ibtn sell" data-type="' + item.type + '" data-id="' + item.id +
            '" data-act="sell" title="Vender por ' + sellv + '">💰 ' + MA.fmt(sellv) + '</button>') +
          '</div>';
      }

      return '<div class="icard ' + item.rarity + (eq ? ' isequipped' : '') + '" style="--rc:' + r.color + '">' +
        '<div class="irar" style="color:' + r.color + '">' + r.name + '</div>' +
        '<div class="iico">' + icon + '</div>' +
        '<div class="iname">' + item.name + '</div>' +
        '<div class="idesc">' + (item.desc || '') + '</div>' +
        stats + action + '</div>';
    },

    bindCards(ctx) {
      const root = ctx === 'shop' ? $('shopGrid') : $('invGrid');
      root.querySelectorAll('button[data-act]').forEach(b => {
        b.onclick = () => {
          const type = b.dataset.type, id = b.dataset.id, act = b.dataset.act;
          const item = Object.assign({ type }, MA.findItem(type, id));
          MA.Audio.ui();
          if (act === 'buy') {
            const r = MA.Profile.buy(item);
            if (r.error) { this.toast('❌ ' + r.error, 'bad'); MA.Audio.deny(); return; }
            MA.Audio.pickup();
            this.toast('✅ Comprado: <b>' + item.name + '</b>');
            this.renderShop();
          } else if (act === 'equip') {
            const r = MA.Profile.equip(type, id);
            if (r.error) { this.toast('❌ ' + r.error, 'bad'); MA.Audio.deny(); return; }
            MA.Profile.save();
            if ((type === 'skin' || type === 'armor') && MA._rebuildLook) MA._rebuildLook();
            this.toast(r.equipped ? '✅ Equipado: <b>' + item.name + '</b>' : 'Desequipado: ' + item.name);
            this.renderInventory();
          } else if (act === 'sell') {
            if (!confirm('Vender "' + item.name + '" por ' +
                MA.fmt(Math.round(item.price * MA.CONFIG.SELL_RATE)) + ' moedas?')) return;
            const r = MA.Profile.sell(item);
            if (r.error) { this.toast('❌ ' + r.error, 'bad'); MA.Audio.deny(); return; }
            this.toast('💰 Vendido por <b>' + MA.fmt(r.value) + '</b> moedas');
            this.renderInventory();
          }
        };
      });
    },

    /* ------------------------------------------------- recompensas da run */
    showRewards(res) {
      const box = $('rewardBox');
      let h = '<div class="rwline">🪙 <b>+' + MA.fmt(res.coins) + '</b> moedas</div>' +
              '<div class="rwline">✨ <b>+' + MA.fmt(res.xp) + '</b> XP</div>';
      if (res.levels > 0) {
        h += '<div class="rwlevel">🎉 SUBIU ' + res.levels + ' NÍVE' + (res.levels > 1 ? 'IS' : 'L') +
             '! Agora é nível <b>' + MA.Profile.data.level + '</b></div>';
        if (MA.Profile.data.level === MA.CONFIG.MULTIPLAYER_LEVEL)
          h += '<div class="rwlevel">⚔️ MULTIPLAYER DESBLOQUEADO!</div>';
      }
      box.innerHTML = h;
    },

    bind() {
      const on = (id, fn) => { const e = $(id); if (e) e.onclick = () => { MA.Audio.init(); MA.Audio.ui(); fn(); }; };
      on('playBtnHub', () => {
        if (MA.Profile.equippedWeapons().length === 0) {
          this.toast('⚠️ Compre e equipe uma arma antes de jogar.', 'bad');
          this.openShop('weapon');
          return;
        }
        if (MA._renderMapList) MA._renderMapList();
        this.screen('start');
      });
      on('shopBtn', () => this.openShop());
      on('invBtn', () => this.openInventory());
      on('mpBtn', () => {
        if (!MA.Profile.canMultiplayer()) {
          this.toast('🔒 Chegue ao nível ' + MA.CONFIG.MULTIPLAYER_LEVEL + ' para liberar o multiplayer.', 'bad');
          MA.Audio.deny(); return;
        }
        this.toast('⚔️ Multiplayer chega na próxima atualização!');
      });
      on('hubSettings', () => $('settings').classList.remove('hid'));
      on('logoutBtn', async () => {
        await MA.Net.signOut();
        MA.Profile.data = null;
        this.screen('auth');
      });
      on('shopClose', () => this.openHub());
      on('invClose', () => this.openHub());
      on('backToHub', () => this.openHub());

      document.querySelectorAll('#shop .tab').forEach(t =>
        t.onclick = () => { MA.Audio.ui(); this.openShop(t.dataset.tab); });
      document.querySelectorAll('#inventory .tab').forEach(t =>
        t.onclick = () => { MA.Audio.ui(); this.openInventory(t.dataset.tab); });
    }
  };

  function st(k, v) { return '<div class="hst"><span>' + k + '</span><b>' + v + '</b></div>'; }

  MA.MetaUI = M;
})(window.MA);
