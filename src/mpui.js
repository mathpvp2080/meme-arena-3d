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

      M.on('peers', () => {
        this.renderPlayers();
        /* se eu virei anfitrião no lobby, o botão de começar aparece pra mim */
        if (M.active && !M.started) {
          const st = $('mpStart');
          if (st) st.classList.toggle('hid', !M.isHost);
          const hint = $('mpHint');
          if (hint) {
            hint.innerHTML = M.isHost
              ? 'Você é o anfitrião: quando todo mundo estiver aqui, clique em <b>COMEÇAR PARTIDA</b>.'
              : 'Esperando o anfitrião começar a partida…';
          }
        }
      });
      M.on('chat', m => {
        /* quem você bloqueou simplesmente não existe pra você */
        if (MA.Mod && MA.Mod.estaBloqueado(m.name)) return;
        /* o filtro roda aqui, em QUEM RECEBE: adiantou nada o outro
           alterar o jogo dele pra mandar palavrão */
        const f = MA.Mod ? MA.Mod.filtrar(m.text) : { texto: m.text };
        MA.Mod && MA.Mod.lembrar(m.name, m.text);
        this.addChat(m.name, f.texto);
        if (!MA.MetaUI || document.getElementById('multi').classList.contains('hid')) {
          MA.UI.notice('💬 <b>' + m.name + ':</b> ' + f.texto);
        }
      });

      const enviar = () => {
        const inp = $('mpChatIn');
        const bruto = (inp.value || '').trim().slice(0, 90);
        if (!bruto || !MA.Multi.active) return;
        const f = MA.Mod ? MA.Mod.filtrar(bruto) : { texto: bruto, sujo: false };
        if (f.sujo) {
          MA.Audio && MA.Audio.deny && MA.Audio.deny();
          this.msg('🧼 Olha o linguajar — a mensagem foi censurada.');
          setTimeout(() => this.msg(''), 2600);
        }
        MA.Multi.send({ t: 'chat', name: MA.Multi.me.name, text: f.texto });
        this.addChat(MA.Multi.me.name, f.texto, true);
        inp.value = '';
      };
      $('mpChatSend').onclick = enviar;
      $('mpChatIn').onkeydown = e => { if (e.key === 'Enter') enviar(); };
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

    addChat(nome, texto, eu) {
      const box = $('mpChat');
      if (!box) return;
      const esc = MA.esc(texto);
      const d = document.createElement('div');
      d.className = 'mpmsg' + (eu ? ' eu' : '');
      d.innerHTML = '<b>' + MA.esc(nome) + ':</b> ' + esc;
      box.appendChild(d);
      while (box.children.length > 40) box.removeChild(box.firstChild);
      box.scrollTop = box.scrollHeight;
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
      this.msg('');
      const mapa = MA.mapById(M.map);
      $('mpLobbyInfo').innerHTML =
        (M.mode === 'pvp' ? '⚔️ PVP' : '🤝 CO-OP') + ' · ' + mapa.icon + ' ' + mapa.name +
        (MA.Net.online
          ? ' · <b class="okdot">🌐 online</b>'
          : ' · <b class="warndot">⚠️ MODO LOCAL</b> — só enxerga outras abas deste navegador. ' +
            'Saia, volte e entre com sua conta para jogar pela internet.');
      $('mpHint').innerHTML = M.isHost
        ? 'Você é o anfitrião: quando todo mundo estiver aqui, clique em <b>COMEÇAR PARTIDA</b>.'
        : 'Esperando o anfitrião começar a partida…';
      this.renderPlayers();
      this._diag();
    },

    /* se ninguem aparecer, explica os motivos mais comuns em vez de deixar o
       jogador olhando uma tela parada */
    _diag() {
      clearTimeout(this._diagT);
      const base = $('mpHint').innerHTML;
      this._diagT = setTimeout(() => {
        const M = MA.Multi;
        if (!M.active || M.count > 1 || document.getElementById('multi').classList.contains('hid')) return;
        $('mpHint').innerHTML = base +
          '<div class="mpdiag">Ninguém entrou ainda. Se o seu amigo diz que já entrou, confira:' +
          '<br>• Os dois precisam estar <b>conectados com a conta</b> (aqui aparece ' +
          (MA.Net.online ? '<b class="okdot">🌐 online</b>' : '<b class="warndot">⚠️ MODO LOCAL</b>') + ').' +
          '<br>• O código é <b>' + M.code + '</b> — confira letra por letra.' +
          '<br>• Se um dos dois estiver com uma versão antiga do jogo, aperte <b>Ctrl+Shift+R</b> ' +
          '(no celular: fechar e abrir a aba de novo).</div>';
      }, 12000);
    },

    renderPlayers() {
      const M = MA.Multi;
      const box = $('mpPlayers');
      if (!box || !M.active) return;
      if (M.count > 1) clearTimeout(this._diagT);
      const eu = M.me;
      const todos = [{ name: eu.name, level: eu.level, skin: eu.skin, host: M.isHost, eu: true }]
        .concat(M.peerList.map(p => ({ name: p.name, level: p.level, skin: p.skin, host: false })));
      box.innerHTML = todos.map(p => {
        const sk = MA.findItem('skin', p.skin) || MA.SKINS[0];
        const bloq = !p.eu && MA.Mod && MA.Mod.estaBloqueado(p.name);
        const safeName = MA.esc(p.name);
        const safeLevel = Math.max(1, Math.floor(Number(p.level) || 1));
        const acoes = p.eu ? '' :
          '<div class="mppacts">' +
            (bloq
              ? '<button class="mppbtn" data-unblock="' + safeName + '" title="desbloquear">✅</button>'
              : '<button class="mppbtn" data-block="' + safeName + '" title="bloquear">🚫</button>') +
            '<button class="mppbtn" data-report="' + safeName + '" title="denunciar">🚩</button>' +
          '</div>';
        return '<div class="mpp' + (bloq ? ' bloqueado' : '') + '">' +
          '<div class="mppface">' + MA.esc(sk.face) + '</div>' +
          '<div class="mppinfo"><b>' + safeName + '</b>' + (p.eu ? ' <span class="dim">(você)</span>' : '') +
          '<div class="dim">nível ' + safeLevel + (p.host ? ' · 👑 anfitrião' : '') +
            (bloq ? ' · 🚫 bloqueado' : '') + '</div></div>' +
          acoes +
          '</div>';
      }).join('') +
        Array.from({ length: Math.max(0, 4 - todos.length) },
          () => '<div class="mpp empty"><div class="mppface">＋</div><div class="mppinfo dim">vaga aberta</div></div>').join('');
      box.querySelectorAll('[data-block]').forEach(b => {
        b.onclick = () => MA.Mod.bloquear(b.dataset.block);
      });
      box.querySelectorAll('[data-unblock]').forEach(b => {
        b.onclick = () => MA.Mod.desbloquear(b.dataset.unblock);
      });
      box.querySelectorAll('[data-report]').forEach(b => {
        b.onclick = () => MA.Mod.pedirMotivo(b.dataset.report);
      });

      if (!$('mpLobby').classList.contains('hid')) {
        $('mpStart').classList.toggle('hid', !M.isHost);
      }
    },

    async create() {
      const M = MA.Multi;
      this.msg('Criando sala…');
      const mapa = MA.store.get('map', 'arena');
      const diff = MA.store.get('diff', 'norm');
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
          box.innerHTML = '<div class="dim">Nenhuma sala aberta agora. Crie a sua! ' +
            '<br>(Se nenhuma sala aparecer nunca, falta rodar o arquivo ' +
            '<b>supabase/schema_multiplayer.sql</b> no Supabase — mesmo assim dá ' +
            'para jogar normalmente entrando pelo <b>código</b>.)</div>';
          return;
        }
        box.innerHTML = data.map(r => {
          const mapa = MA.mapById(r.map);
          const safeCode = MA.esc(r.code);
          const players = Math.max(0, Math.floor(Number(r.players) || 0));
          const maxPlayers = Math.max(1, Math.min(8, Math.floor(Number(r.max_players) || 4)));
          return '<div class="mproom" data-code="' + safeCode + '">' +
            '<div class="mprcode">' + safeCode + '</div>' +
            '<div class="mprinfo"><b>' + MA.esc(r.host_name) + '</b>' +
            '<div class="dim">' + (r.mode === 'pvp' ? '⚔️ PvP' : '🤝 Co-op') + ' · ' +
            mapa.icon + ' ' + mapa.name + '</div></div>' +
            '<div class="mprn">' + players + '/' + maxPlayers + '</div>' +
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
