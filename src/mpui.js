/* =====================================================================
   MEME ARENA 3D — ETAPA 3: telas do multiplayer
   Lobby, criação/entrada em sala e lista de salas abertas.
   ===================================================================== */
(function (MA) {
  'use strict';

  const $ = id => document.getElementById(id);

  const MPUI = {
    mode: 'coop',
    _roomTimer: null,

    init() {
      const M = MA.Multi;

      /* escolha do modo */
      document.querySelectorAll('#mpHome .mpmode').forEach(el => {
        el.onclick = () => {
          document.querySelectorAll('#mpHome .mpmode').forEach(x => x.classList.remove('sel'));
          el.classList.add('sel');
          this.mode = el.dataset.mode;
          $('mpModeTag').textContent = this.mode === 'pvp' ? 'PVP' : 'CO-OP';
          MA.Audio.ui();
        };
      });

      $('mpCreate').onclick = () => this.create();
      $('mpJoin').onclick = () => this.join($('mpCode').value);
      $('mpCode').oninput = e => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); };
      $('mpCode').onkeydown = e => { if (e.key === 'Enter') this.join(e.target.value); };
      $('mpRefresh').onclick = () => this.loadRooms();
      $('mpLeave').onclick = () => { MA.Multi.leave(); this.showHome(); };
      $('mpClose').onclick = () => {
        MA.Multi.leave();
        clearInterval(this._roomTimer); this._roomTimer = null;
        MA.MetaUI.screen('hub');
      };
      $('mpStart').onclick = () => {
        if (!M.isHost) return;
        if (M.count < 2) { this.msg('Espere pelo menos mais um jogador entrar.'); return; }
        M.startMatch();
        MA._startMultiMatch();
      };

      M.on('peers', () => this.renderPlayers());
      M.on('chat', m => MA.UI.notice('💬 <b>' + m.name + ':</b> ' + m.text));
    },

    /* chamada pelo botão MULTIPLAYER do hub */
    open() {
      const M = MA.Multi;
      if (!M.unlocked()) {
        MA.Audio.deny();
        MA.MetaUI.toast('🔒 O multiplayer abre no <b>nível ' + M.minLevel() + '</b>. Continue jogando!');
        return;
      }
      MA._bindMulti && MA._bindMulti();
      this.showHome();
      MA.MetaUI.screen('multi');
      this.loadRooms();
      clearInterval(this._roomTimer);
      this._roomTimer = setInterval(() => { if (!MA.Multi.active) this.loadRooms(); }, 12000);
    },

    msg(t, ok) {
      const e = $('mpMsg');
      e.innerHTML = t || '';
      e.style.color = ok ? 'var(--ok,#49ffb0)' : '';
    },

    showHome() {
      $('mpHome').classList.remove('hid');
      $('mpLobby').classList.add('hid');
      $('mpStart').classList.add('hid');
      $('mpLeave').classList.add('hid');
      this.msg('');
    },

    showLobby() {
      const M = MA.Multi;
      $('mpHome').classList.add('hid');
      $('mpLobby').classList.remove('hid');
      $('mpLeave').classList.remove('hid');
      $('mpStart').classList.toggle('hid', !M.isHost);
      $('mpBigCode').textContent = M.code;
      const mapa = MA.mapById(M.map);
      $('mpLobbyInfo').innerHTML =
        (M.mode === 'pvp' ? '⚔️ PVP' : '🤝 CO-OP') + ' · ' + mapa.icon + ' ' + mapa.name +
        (MA.Net.online ? '' : ' · <b>modo local</b> (só outras abas deste navegador)');
      $('mpHint').innerHTML = M.isHost
        ? 'Você é o anfitrião: quando todo mundo estiver aqui, clique em <b>COMEÇAR PARTIDA</b>.'
        : 'Esperando o anfitrião começar a partida…';
      this.renderPlayers();
    },

    renderPlayers() {
      const M = MA.Multi;
      const box = $('mpPlayers');
      if (!box || !M.active) return;
      const eu = M.me;
      const todos = [{ name: eu.name, level: eu.level, skin: eu.skin, host: M.isHost, eu: true }]
        .concat(M.peerList.map(p => ({ name: p.name, level: p.level, skin: p.skin, host: false })));
      box.innerHTML = todos.map(p => {
        const sk = MA.findItem('skin', p.skin) || MA.SKINS[0];
        return '<div class="mpp">' +
          '<div class="mppface">' + sk.face + '</div>' +
          '<div class="mppinfo"><b>' + p.name + '</b>' + (p.eu ? ' <span class="dim">(você)</span>' : '') +
          '<div class="dim">nível ' + (p.level || 1) + (p.host ? ' · 👑 anfitrião' : '') + '</div></div>' +
          '</div>';
      }).join('') +
        Array.from({ length: Math.max(0, 4 - todos.length) },
          () => '<div class="mpp empty"><div class="mppface">＋</div><div class="mppinfo dim">vaga aberta</div></div>').join('');
      if (!$('mpLobby').classList.contains('hid')) {
        $('mpStart').classList.toggle('hid', !M.isHost);
      }
    },

    async create() {
      const M = MA.Multi;
      this.msg('Criando sala…');
      const mapa = MA.store.get('map', 'arena');
      const diff = MA.store.get('diff', 'normal');
      const r = await M.createRoom(this.mode, mapa, diff);
      if (r.error) { this.msg(r.error); MA.Audio.deny(); return; }
      MA.Audio.pickup();
      this.showLobby();
    },

    async join(code) {
      const M = MA.Multi;
      this.msg('Entrando…');
      const r = await M.joinRoom(code);
      if (r.error) { this.msg(r.error); MA.Audio.deny(); return; }
      MA.Audio.ui();
      this.showLobby();
    },

    async loadRooms() {
      const box = $('mpRooms');
      if (!box) return;
      if (!MA.Net.online) {
        box.innerHTML = '<div class="dim">Modo local: a lista de salas só funciona com o Supabase ligado. ' +
          'Você ainda pode <b>criar</b> uma sala e abrir o jogo em outra aba para entrar com o código.</div>';
        return;
      }
      try {
        const sb = MA.Net.impl.sb;
        sb.rpc('clean_rooms').then(() => {}, () => {});
        const { data } = await sb.from('rooms').select('*')
          .eq('state', 'lobby').order('updated_at', { ascending: false }).limit(12);
        if (!data || !data.length) {
          box.innerHTML = '<div class="dim">Nenhuma sala aberta agora. Crie a sua!</div>';
          return;
        }
        box.innerHTML = data.map(r => {
          const mapa = MA.mapById(r.map);
          return '<div class="mproom" data-code="' + r.code + '">' +
            '<div class="mprcode">' + r.code + '</div>' +
            '<div class="mprinfo"><b>' + r.host_name + '</b>' +
            '<div class="dim">' + (r.mode === 'pvp' ? '⚔️ PvP' : '🤝 Co-op') + ' · ' +
            mapa.icon + ' ' + mapa.name + '</div></div>' +
            '<div class="mprn">' + r.players + '/' + r.max_players + '</div>' +
            '</div>';
        }).join('');
        box.querySelectorAll('.mproom').forEach(el => {
          el.onclick = () => this.join(el.dataset.code);
        });
      } catch (e) {
        box.innerHTML = '<div class="dim">Não deu pra carregar as salas agora.</div>';
      }
    }
  };

  MA.MPUI = MPUI;
})(window.MA);
