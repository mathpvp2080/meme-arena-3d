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
      ['auth', 'hub', 'shop', 'lootbox', 'inventory', 'goals', 'market', 'multi', 'start', 'help', 'board', 'settings', 'over', 'pausebox', 'perkScreen']
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
      const mp = $('mpBtn');
      if (mp) {
        const liberado = MA.Profile.canMultiplayer();
        mp.classList.toggle('locked', !liberado);
        mp.textContent = liberado ? '👥 GRUPO'
          : '🔒 GRUPO (nv ' + MA.CONFIG.MULTIPLAYER_LEVEL + ')';
      }
      if (MA.Market) MA.Market.checarPresentes();
      this.refreshGoalDot();
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
      $('hubSkin').textContent = skin.face;
      $('hubSkin').title = skin.name;
      $('hubArmor').textContent = '🛡️ ' + armor.name;
      if (MA.Season) {
        const season = MA.Season.progress();
        if ($('seasonCountdown')) $('seasonCountdown').textContent = MA.Season.countdown();
        if ($('seasonFragments')) $('seasonFragments').textContent = MA.fmt(season.fragments);
        if ($('seasonBoosts')) $('seasonBoosts').textContent = season.boosts;
        if ($('seasonPity')) $('seasonPity').textContent = Math.min(7, season.pity + 1) + '/7';
      }
      const rank = MA.rankFor((p.stats && p.stats.bestScore) || 0);
      if ($('hubRank')) $('hubRank').textContent = rank.icon + ' ' + rank.name;
      const map = MA.mapById(MA.store.get('map', 'arena'));
      if ($('hubMapIcon')) $('hubMapIcon').textContent = map.icon;
      if ($('hubMapName')) $('hubMapName').textContent = map.name;

      const wIdx = MA.Profile.equippedWeapons();
      const ability = MA.Profile.equippedAbility();
      $('hubWeapons').innerHTML = (wIdx.length
        ? wIdx.map(i => '<span class="chip">' + MA.WEAPONS[i].icon + ' ' + MA.WEAPONS[i].name + '</span>').join('')
        : '<span class="chip warn">⚠️ nenhuma arma — compre na loja</span>') +
        (ability ? '<span class="chip ability">✦ ' + ability.name + '</span>' : '');

      /* Retrato 3D dedicado: não depende do canvas do mapa ficar visível por
         trás do lobby e sempre reflete skin, armadura e primeira arma. */
      const hero = $('hubCharacterPreview');
      if (hero && MA.Previews) {
        const weaponId = wIdx.length ? MA.WEAPONS[wIdx[0]].id : 'none';
        const lookKey = skin.id + '|' + armor.id + '|' + weaponId;
        if (hero.dataset.lookKey !== lookKey) {
          hero.dataset.lookKey = lookKey;
          hero.dataset.previewId = lookKey;
          hero.dataset.previewReady = '';
          hero.innerHTML = '<span>' + skin.face + '</span><i></i>';
        }
        MA.Previews.hydrate(hero.parentElement);
      }

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
        ? '👥 GRUPO'
        : '🔒 GRUPO <em>nível ' + MA.CONFIG.MULTIPLAYER_LEVEL + '</em>';

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

      if (MA.Season) {
        const sp = MA.Season.progress();
        if ($('seasonShopCountdown')) $('seasonShopCountdown').textContent = MA.Season.countdown();
        if ($('shopFragments')) $('shopFragments').textContent = MA.fmt(sp.fragments);
        if ($('shopBoosts')) $('shopBoosts').textContent = sp.boosts;
      }

      if (this.shopTab === 'box') {
        this.renderBoxes();
        return;
      }

      const items = MA.catalog()
        .filter(i => i.type === this.shopTab)
        .sort((a, b) => (a.price - b.price));

      $('shopGrid').innerHTML = items.map(i => this.card(i, 'shop')).join('');
      this.bindCards('shop');
      if (MA.Previews) MA.Previews.hydrate($('shopGrid'));
    },

    renderBoxes() {
      const grid = $('shopGrid');
      if (!MA.Season) { grid.innerHTML = '<p class="dim">Temporada indisponível.</p>'; return; }
      const sp = MA.Season.progress();
      const boxes = MA.SEASON.boxes.map((box, index) => {
        const can = MA.Profile.data.coins >= box.price;
        return '<article class="loot-card' + (index ? ' vault' : '') + '">' +
          '<div class="loot-box-art">' + box.icon + '</div>' +
          '<div><h3>' + box.name + '</h3><p>' + box.desc + '</p>' +
          '<div class="loot-odds"><b>CHANCES POR ABERTURA</b><br>' +
          '42% moedas · 23% XP · 17% Impulso 67 · 18% item sazonal<br>' +
          '<b>5% skin · 4% armadura · 5% arma · 4% habilidade</b></div>' +
          '<div class="loot-pity">GARANTIA: próxima abertura ' + Math.min(7, sp.pity + 1) + '/7 · item na 7ª sem drop</div>' +
          '<div class="loot-buy"><button class="ibtn buy' + (can ? '' : ' poor') + '" data-box="' + box.id + '">' +
          '🪙 ' + MA.fmt(box.price) + '</button><small>somente moeda virtual</small></div></div></article>';
      }).join('');
      const missing = MA.SEASON.itemKeys.some(key => {
        const parts = key.split(':'); return !MA.Profile.owns(parts[0], parts[1]);
      });
      const forgeDisabled = sp.fragments < 67 || !missing;
      grid.innerHTML = '<div class="box-grid">' + boxes +
        '<div class="forge-card"><span>⬡</span><div><b>CAIXA GARANTIDA · ' + MA.fmt(sp.fragments) + '/67 FRAGMENTOS</b>' +
        '<p>Itens repetidos e chefes rendem fragmentos. Use 67 para abrir uma Caixa 67 com um item que ainda falta.</p></div>' +
        '<button class="btn mini sec" id="forge67"' + (forgeDisabled ? ' disabled' : '') + '>ABRIR CAIXA</button></div></div>';
      grid.querySelectorAll('[data-box]').forEach(btn => {
        btn.onclick = () => this.openSeasonBox(btn.dataset.box);
      });
      const forge = $('forge67');
      if (forge) forge.onclick = () => {
        const r = MA.Season.forge();
        if (r.error) { MA.Audio.deny(); this.toast('❌ ' + r.error, 'bad'); return; }
        MA.Audio.pickup();
        this.toast('📦 Caixa garantida: <b>' + r.item.name + '</b>');
        this.renderShop();
      };
    },

    openSeasonBox(id) {
      const r = MA.Season.openBox(id);
      if (r.error) { MA.Audio.deny(); this.toast('❌ ' + r.error, 'bad'); return; }
      MA.Audio.pickup();
      this._lastBox = id;
      this.showLootResults(r);
    },

    showLootResults(opened) {
      const colors = { common: '#9fb3c8', rare: '#2de2ff', epic: '#9b65ff', legendary: '#ffd166', mythic: '#ff4fbd' };
      $('lootTitle').textContent = opened.box.name + ' ABERTO';
      $('lootResults').innerHTML = opened.results.map(r =>
        '<div class="loot-result ' + (r.guaranteed ? 'guaranteed' : '') + '" style="--rc:' + (colors[r.rarity] || colors.common) + '">' +
        '<div class="lrico">' + r.icon + '</div><b>' + r.name + '</b><small>' +
        (r.desc || (r.type === 'coins' ? 'SALDO ADICIONADO' : r.type === 'xp' ? 'EXPERIÊNCIA ADICIONADA' : 'RECOMPENSA 67')) +
        '</small></div>').join('');
      const sp = opened.progress;
      $('lootProgress').innerHTML = 'Caixas abertas: <b>' + MA.fmt(sp.boxesOpened) + '</b> · ' +
        'próxima garantia: <b>' + Math.min(7, sp.pity + 1) + '/7</b> · ' +
        'fragmentos: <b>' + MA.fmt(sp.fragments) + '</b> · Impulsos: <b>' + sp.boosts + '</b>';
      const again = $('lootAgain');
      again.textContent = 'ABRIR OUTRA · 🪙 ' + MA.fmt(opened.box.price);
      again.disabled = MA.Profile.data.coins < opened.box.price;
      this.screen('lootbox');
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
      if (MA.Previews) MA.Previews.hydrate($('invGrid'));
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
                 : item.type === 'ability' ? (item.icon || '✦')
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
      } else if (item.type === 'ability') {
        stats = '<div class="istats"><span>TECLA F</span><span>' + item.cooldown + 's recarga</span></div>';
      }

      let action;
      if (ctx === 'shop') {
        if (owned) action = '<button class="ibtn owned" disabled>✔ ADQUIRIDO</button>';
        else if (item.boxOnly) action = '<button class="ibtn boxonly" data-act="boxes">📦 ABRIR CAIXAS 67</button>';
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
            '" data-act="market" title="Revender por um valor definido por você">💱</button>' +
            (item.boxOnly ? '' : '<button class="ibtn sell" data-type="' + item.type + '" data-id="' + item.id +
            '" data-act="sell" title="Venda rápida por ' + sellv + '">🪙 ' + MA.fmt(sellv) + '</button>')) +
          '</div>';
      }

      return '<div class="icard ' + item.rarity + (eq ? ' isequipped' : '') + (item.seasonal ? ' seasonal' : '') + '" style="--rc:' + r.color + '">' +
        (item.seasonal ? '<div class="season-chip">TEMPORADA 67</div>' : '') +
        '<div class="irar" style="color:' + r.color + '">' + r.name + '</div>' +
        '<div class="iico itempreview" data-preview-type="' + item.type + '" data-preview-id="' + item.id + '">' +
          '<span>' + icon + '</span><i></i></div>' +
        '<div class="iname">' + item.name + '</div>' +
        '<div class="idesc">' + (item.desc || '') + '</div>' +
        stats + action + '</div>';
    },

    bindCards(ctx) {
      const root = ctx === 'shop' ? $('shopGrid') : $('invGrid');
      root.querySelectorAll('button[data-act]').forEach(b => {
        b.onclick = () => {
          const type = b.dataset.type, id = b.dataset.id, act = b.dataset.act;
          MA.Audio.ui();
          if (act === 'boxes') { this.openShop('box'); return; }
          const item = Object.assign({ type }, MA.findItem(type, id));
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
            if ((type === 'skin' || type === 'armor' || type === 'weapon' || type === 'ability') && MA._rebuildLook) MA._rebuildLook();
            this.toast(r.equipped ? '✅ Equipado: <b>' + item.name + '</b>' : 'Desequipado: ' + item.name);
            this.renderInventory();
          } else if (act === 'market') {
            if (MA.Profile.isEquipped(type, id)) {
              this.toast('⚠️ Desequipe o item antes de anunciar.', 'bad'); MA.Audio.deny(); return;
            }
            if (!MA.Market.online()) {
              this.toast('🌐 A revenda com preço próprio exige uma conta online.', 'bad'); MA.Audio.deny(); return;
            }
            MA.Market.abrir('vender');
          } else if (act === 'sell') {
            if (!confirm('Fazer venda rápida de "' + item.name + '" por ' +
                MA.fmt(Math.round(item.price * MA.CONFIG.SELL_RATE)) + ' moedas?\n\nNo Mercado você pode definir o seu próprio preço.')) return;
            const r = MA.Profile.sell(item);
            if (r.error) { this.toast('❌ ' + r.error, 'bad'); MA.Audio.deny(); return; }
            this.toast('💰 Venda rápida: <b>' + MA.fmt(r.value) + '</b> moedas');
            this.renderInventory();
          }
        };
      });
    },

    /* ------------------------------------------------- recompensas da run */
    /* ----------------------------------------------------- METAS (etapa 4) */
    openGoals(tab) {
      this._gtab = tab || this._gtab || 'daily';
      document.querySelectorAll('#goals .tab').forEach(t =>
        t.classList.toggle('sel', t.dataset.tab === this._gtab));
      $('glCoins').textContent = MA.fmt(MA.Profile.data.coins);
      this.renderGoals();
      this.screen('goals');
    },

    renderGoals() {
      const box = $('glBody');
      if (this._gtab === 'achv') return this.renderAchv(box);

      const g = MA.Goals._d();
      const d = g.daily;
      const faltam = this._tempoAteMeiaNoite();
      let html = '<div class="dim" style="margin-bottom:8px">Três missões novas todo dia. ' +
        'Reiniciam em <b>' + faltam + '</b>. Completando as três você ganha um bônus de 🪙 1.000 + 800 XP.</div>';

      html += d.missoes.map(m => {
        const pct = Math.min(1, m.prog / m.alvo);
        const pronto = m.feito === 'pronto', pago = m.feito === 'pago';
        return '<div class="goal' + (pago ? ' pago' : pronto ? ' pronto' : '') + '">' +
          '<div class="gico">' + (pago ? '✅' : m.icon) + '</div>' +
          '<div class="ginfo">' +
            '<b>' + m.nome + '</b>' +
            '<div class="gbar"><i style="width:' + (pct * 100) + '%"></i></div>' +
            '<div class="dim">' + MA.fmt(m.prog) + ' / ' + MA.fmt(m.alvo) +
              ' · prêmio: 🪙 ' + MA.fmt(m.coins) + ' + ' + MA.fmt(m.xp) + ' XP</div>' +
          '</div>' +
          (pago ? '<div class="gtag">RESGATADO</div>'
                : pronto ? '<button class="btn mini" data-claim="' + m.id + '">RESGATAR</button>'
                         : '<div class="gtag dim">' + Math.round(pct * 100) + '%</div>') +
        '</div>';
      }).join('');

      if (d.bonusPago) {
        html += '<div class="goal pago"><div class="gico">🎉</div><div class="ginfo">' +
          '<b>Bônus do dia completo</b><div class="dim">Você limpou as três missões de hoje!</div>' +
          '</div><div class="gtag">RESGATADO</div></div>';
      }

      const dias = g.dailyDays.length;
      html += '<div class="dim" style="margin-top:10px;text-align:center">' +
        'Dias com as missões completas: <b>' + dias + '</b></div>';

      box.innerHTML = html;
      box.querySelectorAll('[data-claim]').forEach(b => {
        b.onclick = () => {
          const r = MA.Goals.resgatar(b.dataset.claim);
          if (r.error) { MA.Audio.deny(); return; }
          MA.Audio.pickup();
          let msg = '🪙 ' + MA.fmt(r.coins) + ' + ' + MA.fmt(r.xp) + ' XP resgatados!';
          if (r.bonus) msg += '<br>🎉 <b>Bônus do dia:</b> 🪙 ' + MA.fmt(r.bonus.coins) +
                              ' + ' + MA.fmt(r.bonus.xp) + ' XP';
          this.toast(msg);
          this.renderHub();
          this.openGoals('daily');
        };
      });
    },

    renderAchv(box) {
      const r = MA.Goals.resumo();
      let html = '<div class="dim" style="margin-bottom:8px">' +
        '<b>' + r.feitas + ' de ' + r.total + '</b> conquistas desbloqueadas. ' +
        'O prêmio cai na conta sozinho assim que você cumpre a meta.</div>';

      const lista = MA.Goals.ACHIEVEMENTS.slice().sort((a, b) => {
        const fa = MA.Goals.feito(a.id) ? 1 : 0, fb = MA.Goals.feito(b.id) ? 1 : 0;
        if (fa !== fb) return fa - fb;
        return MA.Goals.progresso(b).pct - MA.Goals.progresso(a).pct;
      });

      html += lista.map(a => {
        const p = MA.Goals.progresso(a);
        const ok = MA.Goals.feito(a.id);
        const item = a.item ? (MA.findItem(a.item.type, a.item.id) || {}).name : null;
        return '<div class="goal t' + a.tier + (ok ? ' pago' : '') + '">' +
          '<div class="gico">' + (ok ? a.icon : '<span class="lock">' + a.icon + '</span>') + '</div>' +
          '<div class="ginfo"><b>' + a.name + '</b>' +
            '<div class="dim">' + a.desc + '</div>' +
            (ok ? '' : '<div class="gbar"><i style="width:' + (p.pct * 100) + '%"></i></div>' +
                       '<div class="dim">' + MA.fmt(p.v) + ' / ' + MA.fmt(p.alvo) + '</div>') +
            '<div class="dim">🪙 ' + MA.fmt(a.coins) + ' · ' + MA.fmt(a.xp) + ' XP' +
              (item ? ' · 🎁 <b>' + item + '</b>' : '') + '</div>' +
          '</div>' +
          (ok ? '<div class="gtag ok">✓</div>' : '') +
        '</div>';
      }).join('');
      box.innerHTML = html;
    },

    _tempoAteMeiaNoite() {
      const agora = new Date();
      const fim = new Date(agora); fim.setHours(24, 0, 0, 0);
      const s = Math.max(0, Math.floor((fim - agora) / 1000));
      const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
      return h + 'h ' + m + 'min';
    },

    /* selo vermelho no botão METAS quando há prêmio esperando */
    refreshGoalDot() {
      const dot = $('glDot');
      if (!dot || !MA.Profile.data || !MA.Goals) return;
      const g = MA.Goals._d();
      const pend = g && g.daily ? g.daily.missoes.filter(m => m.feito === 'pronto').length : 0;
      dot.classList.toggle('hid', pend === 0);
      dot.textContent = pend || '';
    },

    showRewards(res) {
      const box = $('rewardBox');
      let h = '<div class="rwline">🪙 <b>+' + MA.fmt(res.coins) + '</b> moedas</div>' +
              '<div class="rwline">✨ <b>+' + MA.fmt(res.xp) + '</b> XP</div>';
      if (res.multiplier > 1) {
        h += '<div class="rwlevel">⚡ IMPULSO 67 APLICADO · RECOMPENSAS +67% · ' +
             res.boostsRemaining + ' restante' + (res.boostsRemaining === 1 ? '' : 's') + '</div>';
      }
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
      on('seasonBtn', () => this.openShop('box'));
      on('shopBtn', () => this.openShop());
      on('lootClose', () => this.openShop('box'));
      on('lootAgain', () => { if (this._lastBox) this.openSeasonBox(this._lastBox); });
      on('invBtn', () => this.openInventory());
      on('mpBtn', () => MA.MPUI.open());
      on('mkBtn', () => { MA.Market.preencherGift(); MA.Market.abrir('comprar'); });
      on('glBtn', () => this.openGoals('daily'));
      on('glClose', () => this.openHub());
      document.querySelectorAll('#goals .tab').forEach(t =>
        t.onclick = () => { MA.Audio.ui(); this.openGoals(t.dataset.tab); });
      on('hubSettings', () => $('settings').classList.remove('hid'));
      /* exclusao de conta: exigencia das lojas e da politica de privacidade */
      let confirmando = false;
      on('sDelete', async () => {
        const btn = $('sDelete'), msg = $('sDelMsg');
        if (!confirmando) {
          confirmando = true;
          btn.textContent = '⚠️ CLIQUE DE NOVO PARA CONFIRMAR';
          msg.innerHTML = 'Isso apaga <b>para sempre</b> sua conta, nível, moedas e todos os itens. ' +
                          'Não tem como desfazer. Clique de novo em até 8 segundos para confirmar.';
          MA.Audio.deny();
          setTimeout(() => {
            if (!confirmando) return;
            confirmando = false; btn.textContent = '🗑 APAGAR MINHA CONTA'; msg.innerHTML = '';
          }, 8000);
          return;
        }
        confirmando = false;
        btn.textContent = 'apagando…'; btn.disabled = true;
        const r = await MA.Net.deleteAccount();
        btn.disabled = false; btn.textContent = '🗑 APAGAR MINHA CONTA';
        if (r && r.error) { msg.innerHTML = r.error; return; }
        msg.innerHTML = '';
        try { localStorage.removeItem('memearena.session'); } catch (e) { /* ignora */ }
        MA.Profile.data = null;
        $('settings').classList.add('hid');
        this.screen('auth');
        this.toast('Conta apagada. Até a próxima! 👋');
      });

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

      if (MA.Season && !this._seasonTimer) {
        this._seasonTimer = setInterval(() => {
          const txt = MA.Season.countdown();
          if ($('seasonCountdown')) $('seasonCountdown').textContent = txt;
          if ($('seasonShopCountdown')) $('seasonShopCountdown').textContent = txt;
        }, 60000);
      }
    }
  };

  function st(k, v) { return '<div class="hst"><span>' + k + '</span><b>' + v + '</b></div>'; }

  MA.MetaUI = M;
})(window.MA);
