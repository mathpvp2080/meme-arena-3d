/* =====================================================================
   MEME ARENA 3D — ETAPA 3 (parte 2): mercado e presentes

   Toda a parte perigosa (tirar item, pagar, creditar) acontece dentro
   do banco, em funções SQL atômicas — o navegador só pede. Assim
   ninguém consegue trapacear mexendo no JavaScript.
   ===================================================================== */
(function (MA) {
  'use strict';

  const $ = id => document.getElementById(id);
  const PRECO_MIN = 10;

  const Market = {
    tab: 'comprar',
    listings: [],
    minhas: [],
    _busy: false,

    online() { return !!(MA.Net.online && MA.Net.impl.sb); },
    sb() { return MA.Net.impl.sb; },

    /* ---------------------------------------------------------- dados */
    async carregar() {
      if (!this.online()) return { error: 'offline' };
      const meu = MA.Net.user && MA.Net.user.id;
      const { data, error } = await this.sb().from('market_listings')
        .select('*').eq('sold', false).order('created_at', { ascending: false }).limit(60);
      if (error) return { error: this._msg(error) };
      this.listings = (data || []).filter(l => l.seller_id !== meu);
      this.minhas = (data || []).filter(l => l.seller_id === meu);
      return { ok: true };
    },

    async vender(item, preco) {
      const { data, error } = await this.sb().rpc('market_sell', { p_item: item, p_price: preco });
      if (error) return { error: this._msg(error) };
      return data && data.error ? { error: data.error } : { ok: true };
    },

    async cancelar(id) {
      const { data, error } = await this.sb().rpc('market_cancel', { p_id: id });
      if (error) return { error: this._msg(error) };
      return data && data.error ? { error: data.error } : { ok: true };
    },

    async comprar(id) {
      const { data, error } = await this.sb().rpc('market_buy', { p_id: id });
      if (error) return { error: this._msg(error) };
      return data && data.error ? { error: data.error } : { ok: true, item: data.item, price: data.price };
    },

    async presentear(para, item, moedas, recado) {
      const { data, error } = await this.sb().rpc('send_gift', {
        p_to: para, p_item: item || '', p_coins: moedas || 0, p_note: recado || null
      });
      if (error) return { error: this._msg(error) };
      return data && data.error ? { error: data.error } : { ok: true };
    },

    _msg(e) {
      const m = (e && e.message) || 'Erro desconhecido.';
      if (/function .* does not exist|schema cache|relation .* does not exist/i.test(m)) {
        return 'O banco ainda não tem as tabelas do mercado. Rode o arquivo ' +
               'supabase/schema_multiplayer.sql no SQL Editor do Supabase.';
      }
      return m;
    },

    /* ------------------------------------------------------------- UI */
    init() {
      document.querySelectorAll('#market .tab').forEach(t => {
        t.onclick = () => { MA.Audio.ui(); this.abrir(t.dataset.tab); };
      });
      $('mkClose').onclick = () => { MA.Audio.ui(); MA.MetaUI.openHub(); };
      $('mkRefresh').onclick = () => { MA.Audio.ui(); this.render(); };
      $('giftSend').onclick = () => this.enviarPresente();
    },

    async abrir(tab) {
      this.tab = tab || this.tab || 'comprar';
      document.querySelectorAll('#market .tab').forEach(t =>
        t.classList.toggle('sel', t.dataset.tab === this.tab));
      MA.MetaUI.screen('market');
      this.render();
    },

    msg(t, bom) {
      const e = $('mkMsg');
      if (!e) return;
      e.innerHTML = t || '';
      e.className = 'formerr' + (bom ? ' ok' : '');
    },

    async render() {
      const box = $('mkBody');
      $('mkCoins').textContent = MA.fmt(MA.Profile.data.coins);
      ['mkBuy', 'mkSell', 'mkGift'].forEach(id => { const e = $(id); if (e) e.classList.add('hid'); });

      const off = !this.online();
      this.msg(off ? '⚠️ Você está no modo local (sem servidor). Dá para ver o mercado, ' +
        'mas comprar, vender e presentear só funciona com a conta online.' : '');

      if (this.tab === 'gift') {
        $('mkGift').classList.remove('hid'); box.innerHTML = ''; this.preencherGift(); return;
      }
      if (off) {
        this.listings = []; this.minhas = [];
        if (this.tab === 'comprar') { box.innerHTML = '<div class="dim">Entre com uma conta online para ver os anúncios.</div>'; $('mkBuy').classList.remove('hid'); }
        else this.renderVender(box);
        return;
      }

      box.innerHTML = '<div class="dim">Carregando…</div>';
      const r = await this.carregar();
      if (r.error) { box.innerHTML = ''; this.msg(r.error); return; }

      if (this.tab === 'comprar') this.renderComprar(box);
      else this.renderVender(box);
    },

    _card(l, botao) {
      const [tipo, id] = l.item.split(':');
      const it = MA.findItem(tipo, id);
      const nome = it ? it.name : l.item;
      const icone = it ? (it.icon || it.face || '🎁') : '🎁';
      const raro = it && it.rarity ? it.rarity : 'common';
      return '<div class="mkitem ' + raro + '">' +
        '<div class="mkico">' + icone + '</div>' +
        '<div class="mkinfo"><b>' + nome + '</b>' +
        '<div class="dim">' + (tipo === 'skin' ? 'Skin' : tipo === 'armor' ? 'Armadura' : 'Arma') +
        ' · vendedor: ' + l.seller_name + '</div></div>' +
        '<div class="mkprice">🪙 ' + MA.fmt(l.price) + '</div>' + botao +
        '</div>';
    },

    renderComprar(box) {
      $('mkBuy').classList.remove('hid');
      if (!this.listings.length) {
        box.innerHTML = '<div class="dim">Nenhum item à venda agora. Seja o primeiro a anunciar!</div>';
        return;
      }
      box.innerHTML = this.listings.map(l =>
        this._card(l, '<button class="btn mini" data-buy="' + l.id + '">COMPRAR</button>')).join('');
      box.querySelectorAll('[data-buy]').forEach(b => {
        b.onclick = () => this.acaoComprar(parseInt(b.dataset.buy, 10));
      });
    },

    renderVender(box) {
      $('mkSell').classList.remove('hid');
      const d = MA.Profile.data;
      /* o que dá para vender: o que está no inventário, menos itens iniciais e equipados */
      const equipados = [
        'skin:' + d.equipped.skin, 'armor:' + d.equipped.armor
      ].concat((d.equipped.weapons || []).map(w => 'weapon:' + w));
      const vendaveis = d.inventory.filter(key => {
        const [t, i] = key.split(':');
        const it = MA.findItem(t, i);
        return it && !it.starter && equipados.indexOf(key) < 0;
      });

      let html = '';
      if (this.minhas.length) {
        html += '<div class="seclbl">SEUS ANÚNCIOS</div>' + this.minhas.map(l =>
          this._card(l, '<button class="btn mini sec" data-cancel="' + l.id + '">CANCELAR</button>')).join('');
      }
      html += '<div class="seclbl">ITENS QUE VOCÊ PODE VENDER</div>';
      html += vendaveis.length ? vendaveis.map(key => {
        const [t, i] = key.split(':');
        const it = MA.findItem(t, i);
        const bounds = MA.marketPriceBounds ? MA.marketPriceBounds(it) : { min: PRECO_MIN, max: 1000000 };
        const sugerido = Math.max(bounds.min, Math.min(bounds.max, Math.round((it.price || 100) * .7)));
        return '<div class="mkitem ' + (it.rarity || 'common') + '">' +
          '<div class="mkico">' + (it.icon || it.face || '🎁') + '</div>' +
          '<div class="mkinfo"><b>' + it.name + '</b><div class="dim">' +
          (t === 'skin' ? 'Skin' : t === 'armor' ? 'Armadura' : 'Arma') +
          ' · faixa 🪙 ' + MA.fmt(bounds.min) + '–' + MA.fmt(bounds.max) + '</div></div>' +
          '<input class="inp mkp" type="number" min="' + bounds.min + '" max="' + bounds.max +
          '" value="' + sugerido + '" data-price="' + key + '">' +
          '<button class="btn mini" data-sell="' + key + '">ANUNCIAR</button>' +
          '</div>';
      }).join('')
        : '<div class="dim">Você não tem itens para vender. ' +
          'Itens iniciais e os que estão equipados não podem ser anunciados.</div>';
      box.innerHTML = html;

      box.querySelectorAll('[data-sell]').forEach(b => {
        b.onclick = () => {
          const key = b.dataset.sell;
          const inp = box.querySelector('[data-price="' + key + '"]');
          this.acaoVender(key, parseInt(inp.value, 10));
        };
      });
      box.querySelectorAll('[data-cancel]').forEach(b => {
        b.onclick = () => this.acaoCancelar(parseInt(b.dataset.cancel, 10));
      });
    },

    /* --------------------------------------------------------- ações */
    async _depois(txt) {
      await MA.Net.refreshProfile();
      MA.MetaUI.renderHub();
      this.msg(txt, true);
      this.render();
    },

    async acaoComprar(id) {
      if (!this.online()) { MA.Audio.deny(); this.msg('Isso só funciona com conta online.'); return; }
      if (this._busy) return; this._busy = true;
      this.msg('Comprando…');
      const r = await this.comprar(id);
      this._busy = false;
      if (r.error) { MA.Audio.deny(); this.msg(r.error); return; }
      MA.Audio.pickup();
      const [t, i] = r.item.split(':');
      const it = MA.findItem(t, i);
      this._depois('✅ Comprado: <b>' + (it ? it.name : r.item) + '</b> por 🪙 ' + MA.fmt(r.price));
    },

    async acaoVender(key, preco) {
      if (!this.online()) { MA.Audio.deny(); this.msg('Isso só funciona com conta online.'); return; }
      if (this._busy) return;
      const parts = String(key || '').split(':');
      const item = MA.findItem(parts[0], parts[1]);
      const bounds = MA.marketPriceBounds ? MA.marketPriceBounds(item) : { min: PRECO_MIN, max: 1000000 };
      if (!item || !(preco >= bounds.min && preco <= bounds.max)) {
        MA.Audio.deny();
        this.msg('Este item aceita valores entre 🪙 ' + MA.fmt(bounds.min) + ' e ' + MA.fmt(bounds.max) + '.');
        return;
      }
      this._busy = true; this.msg('Anunciando…');
      const r = await this.vender(key, preco);
      this._busy = false;
      if (r.error) { MA.Audio.deny(); this.msg(r.error); return; }
      MA.Audio.ui();
      this._depois('📢 Anunciado por 🪙 ' + MA.fmt(preco) + '. O item sai do seu inventário até vender.');
    },

    async acaoCancelar(id) {
      if (!this.online()) { MA.Audio.deny(); this.msg('Isso só funciona com conta online.'); return; }
      if (this._busy) return; this._busy = true;
      const r = await this.cancelar(id);
      this._busy = false;
      if (r.error) { MA.Audio.deny(); this.msg(r.error); return; }
      this._depois('↩️ Anúncio cancelado, item devolvido.');
    },

    async enviarPresente() {
      if (!this.online()) { MA.Audio.deny(); this.msg('Isso só funciona com conta online.'); return; }
      if (this._busy) return;
      const para = $('giftTo').value.trim();
      const item = $('giftItem').value;
      const moedas = Math.max(0, parseInt($('giftCoins').value, 10) || 0);
      const recado = $('giftNote').value.trim().slice(0, 120);
      if (!para) { MA.Audio.deny(); this.msg('Escreva o nome de quem vai receber.'); return; }
      if (!item && !moedas) { MA.Audio.deny(); this.msg('Escolha um item ou coloque moedas.'); return; }
      this._busy = true; this.msg('Enviando…');
      const r = await this.presentear(para, item, moedas, recado);
      this._busy = false;
      if (r.error) { MA.Audio.deny(); this.msg(r.error); return; }
      MA.Audio.pickup();
      if (MA.Goals) MA.Goals.track('gifts', 1);
      $('giftTo').value = ''; $('giftCoins').value = '0'; $('giftNote').value = '';
      await MA.Net.refreshProfile();
      MA.MetaUI.renderHub();
      this.preencherGift();
      this.msg('🎁 Presente enviado para <b>' + para + '</b>!', true);
    },

    /* lista de itens presenteáveis */
    preencherGift() {
      const sel = $('giftItem');
      if (!sel) return;
      const d = MA.Profile.data;
      const equipados = ['skin:' + d.equipped.skin, 'armor:' + d.equipped.armor]
        .concat((d.equipped.weapons || []).map(w => 'weapon:' + w));
      const itens = d.inventory.filter(key => {
        const [t, i] = key.split(':');
        const it = MA.findItem(t, i);
        return it && !it.starter && equipados.indexOf(key) < 0;
      });
      sel.innerHTML = '<option value="">— só moedas —</option>' + itens.map(key => {
        const [t, i] = key.split(':');
        const it = MA.findItem(t, i);
        return '<option value="' + key + '">' + (it.icon || it.face || '🎁') + ' ' + it.name + '</option>';
      }).join('');
    },

    /* avisa quem recebeu presente desde a última visita */
    async checarPresentes() {
      if (!this.online()) return;
      const uid = MA.Net.user && MA.Net.user.id;
      if (!uid) return;
      try {
        const visto = MA.store.get('lastGift', 0);
        const { data } = await this.sb().from('gifts')
          .select('*').eq('to_id', uid).order('created_at', { ascending: false }).limit(10);
        if (!data || !data.length) return;
        const novos = data.filter(g => new Date(g.created_at).getTime() > visto);
        if (!novos.length) return;
        MA.store.set('lastGift', Date.now());
        novos.reverse().forEach(g => {
          const partes = [];
          if (g.item) {
            const [t, i] = g.item.split(':');
            const it = MA.findItem(t, i);
            partes.push((it && it.name) || g.item);
          }
          if (g.coins) partes.push('🪙 ' + MA.fmt(g.coins));
          MA.MetaUI.toast('🎁 <b>' + g.from_name + '</b> te mandou ' + partes.join(' + ') +
            (g.note ? '<br><i>"' + g.note + '"</i>' : ''));
        });
        await MA.Net.refreshProfile();
        MA.MetaUI.renderHub();
      } catch (e) { /* sem tabela ainda: ignora */ }
    }
  };

  MA.Market = Market;
})(window.MA);
