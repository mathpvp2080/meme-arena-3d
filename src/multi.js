/* =====================================================================
   MEME ARENA 3D — ETAPA 3: multiplayer em tempo real

   Dois transportes, mesma interface:
     • supabase → Realtime (jogadores de verdade, pela internet)
     • local    → BroadcastChannel (abas do mesmo navegador; serve para
                  testar e para jogar em modo offline na mesma máquina)

   Modelo de autoridade:
     • O HOST manda nos inimigos (spawn, vida, morte) e na onda.
     • Cada jogador manda a própria pose/vida.
     • Dano em inimigo vira um pedido "hit" para o host confirmar.
     • No PvP, o dano é aplicado por quem LEVA o tiro (cada um é dono da
       própria vida), o que evita discussão entre as duas máquinas.
   ===================================================================== */
(function (MA) {
  'use strict';

  const SEND_HZ = 12;            // poses por segundo
  const SNAP_HZ = 9;             // snapshots de inimigos (host)
  const PEER_TIMEOUT = 6000;     // some com quem sumiu

  function code4() {
    const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let s = ''; for (let i = 0; i < 4; i++) s += A[Math.floor(Math.random() * A.length)];
    return s;
  }
  const now = () => performance.now();
  const competitive = mode => mode === 'pvp' || mode === 'pvpve';

  /* =================================================== transporte LOCAL */
  function LocalTransport(code) {
    const bc = new BroadcastChannel('memearena.room.' + code);
    return {
      kind: 'local',
      async connect(onMsg) {
        bc.onmessage = ev => onMsg(ev.data);
        return true;
      },
      send(msg) { bc.postMessage(msg); },
      close() { try { bc.close(); } catch (e) { /* ignora */ } }
    };
  }

  /* ================================================ transporte SUPABASE */
  function RealtimeTransport(code, sb) {
    let ch = null;
    return {
      kind: 'supabase',
      async connect(onMsg) {
        ch = sb.channel('room:' + code, {
          config: { broadcast: { self: false, ack: false } }
        });
        ch.on('broadcast', { event: 'm' }, p => onMsg(p.payload));
        await new Promise((res, rej) => {
          const t = setTimeout(() => rej(new Error('timeout')), 9000);
          ch.subscribe(st => {
            if (st === 'SUBSCRIBED') { clearTimeout(t); res(); }
            else if (st === 'CHANNEL_ERROR' || st === 'TIMED_OUT') { clearTimeout(t); rej(new Error(st)); }
          });
        });
        return true;
      },
      send(msg) { if (ch) ch.send({ type: 'broadcast', event: 'm', payload: msg }); },
      close() { if (ch) { try { sb.removeChannel(ch); } catch (e) { /* ignora */ } ch = null; } }
    };
  }

  /* ============================================================= MÓDULO */
  const Multi = {
    active: false,
    code: null,
    mode: 'coop',          // 'coop' | 'pvp' | 'pvpve'
    map: 'arena',
    diff: 'auto',
    isHost: false,
    started: false,
    me: null,              // { id, name, skin, armor, level }
    peers: {},             // id -> { id, name, skin, armor, level, pos, yaw, hp, hpMax, score, kills, dead, obj, last }
    tr: null,
    _sendT: 0,
    _snapT: 0,
    _listeners: {},
    _pendingHits: [],
    lastError: null,

    /* ------------------------------------------------------- eventos */
    on(ev, fn) { (this._listeners[ev] = this._listeners[ev] || []).push(fn); return this; },
    off(ev) { delete this._listeners[ev]; },
    emit(ev, a, b) { (this._listeners[ev] || []).forEach(f => { try { f(a, b); } catch (e) { console.warn(e); } }); },

    get peerList() { return Object.keys(this.peers).map(k => this.peers[k]); },
    get count() { return 1 + this.peerList.length; },

    maxPlayers(mode) { return competitive(mode || this.mode) ? 12 : 6; },
    teamCounts() {
      const all = [this.me].concat(this.peerList).filter(Boolean);
      return {
        pink: all.filter(p => p.team === 'pink').length,
        cyan: all.filter(p => p.team === 'cyan').length
      };
    },
    canStart() {
      if (this.mode === 'coop') return this.count >= 2;
      const t = this.teamCounts();
      return t.pink >= 2 && t.cyan >= 2;
    },

    minLevel() { return (MA.CONFIG && MA.CONFIG.MULTIPLAYER_LEVEL) || 5; },
    unlocked() {
      const p = MA.Profile && MA.Profile.data;
      return !!p && p.level >= this.minLevel();
    },

    _identity() {
      const p = MA.Profile.data;
      /* id ÚNICO POR ABA: duas abas do mesmo navegador compartilham a sessão
         do Supabase, então usar só o id da conta faria as duas se ignorarem. */
      let cid = null;
      try { cid = sessionStorage.getItem('memearena.cid'); } catch (e) { /* ignora */ }
      if (!cid) {
        cid = 'c' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
        try { sessionStorage.setItem('memearena.cid', cid); } catch (e) { /* ignora */ }
      }
      return {
        id: cid,
        uid: (MA.Net.user && MA.Net.user.id) || null,
        name: p.username, level: p.level,
        skin: (p.equipped && p.equipped.skin) || 'rookie',
        armor: (p.equipped && p.equipped.armor) || 'hoodie',
        sticker: (p.equipped && p.equipped.sticker) || '', team: null
      };
    },

    /* --------------------------------------------------- criar / entrar */
    async createRoom(mode, map, diff) {
      const r = await this._open(code4(), true, mode, map, diff);
      if (!r.error && MA.Net.online && MA.Net.impl.sb && this.me.uid) {
        try {
          await MA.Net.impl.sb.from('rooms').insert({
            code: this.code, host_id: this.me.uid, host_name: this.me.name,
            mode: this.mode, map: this.map, diff: this.diff, players: 1,
            max_players: this.maxPlayers(), state: 'lobby'
          });
        } catch (e) { console.warn('[MP] não deu pra anunciar a sala', e); }
      }
      return r;
    },

    async joinRoom(code) {
      code = String(code || '').trim().toUpperCase();
      if (code.length !== 4) return { error: 'O código tem 4 letras.' };
      let mode = 'coop', map = 'arena', diff = 'auto';
      if (MA.Net.online && MA.Net.impl.sb) {
        /* o cadastro da sala é só um atalho: se a tabela não existir ou a
           consulta falhar, dá pra entrar do mesmo jeito pelo código. */
        try {
          const { data } = await MA.Net.impl.sb.from('rooms').select('*').eq('code', code).maybeSingle();
          if (data) {
            if (data.players >= data.max_players) return { error: 'Sala cheia.' };
            mode = data.mode; map = data.map; diff = data.diff;
          }
        } catch (e) { console.warn('[MP] lista de salas indisponível', e); }
      }
      const r = await this._open(code, false, mode, map, diff);
      if (!r.error) this.send({ t: 'hello', ...this.me });
      return r;
    },

    async _open(code, host, mode, map, diff) {
      if (!this.unlocked()) return { error: 'Multiplayer libera no nível ' + this.minLevel() + '.' };
      this.leave();
      this.me = this._identity();
      this.code = code; this.isHost = host;
      this.mode = ['coop', 'pvp', 'pvpve'].indexOf(mode) >= 0 ? mode : 'coop';
      this.map = map || 'arena'; this.diff = diff || 'auto';
      this.me.team = host && competitive(this.mode) ? 'pink' : null;
      this.peers = {}; this.started = false; this.lastError = null;

      const sb = MA.Net.online && MA.Net.impl.sb;
      this.tr = sb ? RealtimeTransport(code, sb) : LocalTransport(code);
      try {
        await this.tr.connect(m => this._onMsg(m));
      } catch (e) {
        this.tr = null;
        return { error: 'Não deu pra conectar na sala. Tente de novo.' };
      }
      this.active = true;
      this._hb = setInterval(() => this._heartbeat(), 2000);
      this.emit('peers');
      return { ok: true, code };
    },

    leave() {
      if (this.active) this.send({ t: 'bye', id: this.me.id });
      clearInterval(this._hb);
      if (this.tr) { this.tr.close(); this.tr = null; }
      this.peerList.forEach(p => this._removeAvatar(p));
      if (this.isHost && this.code && MA.Net.online && MA.Net.impl.sb) {
        MA.Net.impl.sb.from('rooms').delete().eq('code', this.code).then(() => {}, () => {});
      }
      this.active = false; this.started = false; this.isHost = false;
      this.code = null; this.peers = {};
      this.emit('peers');
    },

    _heartbeat() {
      if (!this.active) return;
      this.send({ t: 'ping', ...this.me, host: this.isHost, started: this.started });
      const t = Date.now();
      let changed = false, perdiOHost = false;
      this.peerList.forEach(p => {
        if (t - p.last > PEER_TIMEOUT) {
          if (p.host) perdiOHost = true;
          this._removeAvatar(p); delete this.peers[p.id]; changed = true;
        }
      });
      if (changed) this.emit('peers');
      if (perdiOHost) this._migrarHost();
      if (this.isHost && MA.Net.online && MA.Net.impl.sb) {
        MA.Net.impl.sb.from('rooms')
          .update({ players: this.count, state: this.started ? 'playing' : 'lobby' })
          .eq('code', this.code).then(() => {}, () => {});
      }
    },

    send(msg) { if (this.tr) { msg.from = this.me.id; this.tr.send(msg); } },

    /* ------------------------------------------------ migração de host
       Se o anfitrião cai, a sala não pode morrer: quem tiver o menor id
       entre os que sobraram assume. Todo mundo faz a mesma conta, então
       o resultado é igual em todas as máquinas, sem precisar votar. */
    _migrarHost() {
      if (!this.active || this.isHost) return;
      const ids = this.peerList.filter(p => !p.host).map(p => p.id).concat([this.me.id]).sort();
      if (ids[0] !== this.me.id) return;        // outro assume; eu só espero
      this.isHost = true;
      this._hostId = this.me.id;
      this.send({ t: 'host' });
      this.emit('peers');
      this.emit('hostchange', { me: true });
      if (MA.UI && MA.UI.notice) {
        MA.UI.notice('👑 O anfitrião saiu — <b>você</b> assumiu o comando da sala.');
      }
      if (MA.Net.online && MA.Net.impl.sb && this.me.uid && this.code) {
        MA.Net.impl.sb.from('rooms').upsert({
          code: this.code, host_id: this.me.uid, host_name: this.me.name,
          mode: this.mode, map: this.map, diff: this.diff,
          players: this.count, max_players: this.maxPlayers(), state: this.started ? 'playing' : 'lobby'
        }).then(() => {}, () => {});
      }
    },

    /* ----------------------------------------------- recebimento */
    _onMsg(m) {
      if (!m || !this.active || m.from === this.me.id) return;
      switch (m.t) {
        case 'hello':
        case 'ping': {
          const isNew = !this.peers[m.from];
          const p = this.peers[m.from] || (this.peers[m.from] = {
            id: m.from, pos: new THREE.Vector3(0, 0, 0), yaw: 0,
            hp: 100, hpMax: 100, score: 0, kills: 0, dead: false, obj: null
          });
          const oldTeam = p.team;
          p.name = m.name; p.skin = m.skin; p.armor = m.armor; p.level = m.level;
          p.sticker = m.sticker || ''; p.team = m.team || p.team || null;
          p.last = Date.now();
          if (m.t === 'hello') {
            if (this.isHost && this.count > this.maxPlayers()) {
              this.send({ t: 'reject', to: m.from, reason: 'Sala cheia.' });
              delete this.peers[m.from];
              break;
            }
            if (this.isHost && competitive(this.mode) && !p.team) {
              const teams = this.teamCounts();
              p.team = teams.pink <= teams.cyan && teams.pink < 6 ? 'pink' : 'cyan';
            }
            if (this.isHost) this.send({ t: 'room', to: m.from, mode: this.mode, map: this.map,
              diff: this.diff, team: p.team, maxPlayers: this.maxPlayers() });
            this.send({ t: 'ping', ...this.me, host: this.isHost, started: this.started });
            /* partida em andamento: convida SÓ quem acabou de chegar.
               Sem o 'to', todo mundo recebia 'start' de novo e a partida
               reiniciava para a sala inteira sempre que alguém entrava. */
            if (this.isHost && this.started) {
              this.send({ t: 'start', to: m.from, mode: this.mode, map: this.map, diff: this.diff });
            }
          }
          /* o anfitrião se identifica no ping: usado na migração de host */
          if (m.host) { p.host = true; this._hostId = m.from; } else { p.host = false; }
          if (isNew || oldTeam !== p.team) this.emit('peers');
          if (isNew) {
            if (MA.UI && MA.UI.notice) MA.UI.notice('🎮 <b>' + m.name + '</b> entrou na sala');
          }
          break;
        }
        case 'bye': {
          const p = this.peers[m.from];
          if (p) {
            const eraHost = !!p.host;
            if (MA.UI && MA.UI.notice) MA.UI.notice('👋 <b>' + p.name + '</b> saiu');
            this._removeAvatar(p); delete this.peers[m.from]; this.emit('peers');
            if (eraHost) this._migrarHost();
          }
          break;
        }
        case 'room': {
          if (m.to && m.to !== this.me.id) break;
          this.mode = ['coop', 'pvp', 'pvpve'].indexOf(m.mode) >= 0 ? m.mode : 'coop';
          this.map = m.map || this.map; this.diff = m.diff || 'auto';
          this.me.team = competitive(this.mode) ? m.team : null;
          this.send({ t: 'ping', ...this.me, host: this.isHost, started: this.started });
          this.emit('peers'); this.emit('room', m);
          break;
        }
        case 'reject': {
          if (m.to && m.to !== this.me.id) break;
          this.lastError = m.reason || 'Não foi possível entrar na sala.';
          this.emit('reject', this.lastError);
          setTimeout(() => this.leave(), 0);
          break;
        }
        case 'host': {                      // alguém assumiu o comando da sala
          const p = this.peers[m.from];
          if (p) p.host = true;
          this._hostId = m.from;
          this.peerList.forEach(x => { if (x.id !== m.from) x.host = false; });
          this.emit('peers');
          if (MA.UI && MA.UI.notice) MA.UI.notice('👑 <b>' + (p ? p.name : 'Alguém') + '</b> virou o anfitrião');
          break;
        }
        case 'p': {                                    // pose
          const p = this.peers[m.from]; if (!p) break;
          p.tPos = p.tPos || new THREE.Vector3();
          p.tPos.set(m.x, m.y, m.z); p.tYaw = m.r;
          p.hp = m.h; p.hpMax = m.hm; p.dead = !!m.d;
          p.score = m.s || 0; p.kills = m.k || 0; p.wpn = m.w;
          p.last = Date.now();
          break;
        }
        case 'start':
          if (m.to && m.to !== this.me.id) break;   // convite para outra pessoa
          if (this.started) break;                  // já estou jogando: ignora
          this.mode = m.mode; this.map = m.map; this.diff = m.diff;
          this.started = true;
          this.emit('start', m);
          break;
        case 'snap':  this.emit('snap', m); break;      // inimigos (host → todos)
        case 'hit':   this.emit('hit', m); break;       // cliente → host
        case 'pick':  this.emit('pick', m); break;      // alguém pegou um item
        case 'ekill': this.emit('ekill', m); break;     // host → todos
        case 'shot':  this.emit('shot', m); break;      // tiro visível dos outros
        case 'pvp':   this.emit('pvp', m); break;       // dano em jogador
        case 'wave':  this.emit('wave', m); break;
        case 'threat': this.emit('threat', m); break;
        case 'over':  this.emit('over', m); break;
        case 'chat':  this.emit('chat', m); break;
      }
    },

    /* ------------------------------------------- envio da própria pose */
    tick(dt, player, G) {
      if (!this.active || !this.started || !player) return;
      this._sendT -= dt;
      if (this._sendT <= 0) {
        this._sendT = 1 / SEND_HZ;
        const p = player.obj.position;
        this.send({
          t: 'p', x: +p.x.toFixed(2), y: +p.y.toFixed(2), z: +p.z.toFixed(2),
          r: +player.obj.rotation.y.toFixed(2),
          h: Math.round(player.hp), hm: Math.round(player.maxhp),
          d: !!G.over, s: G.score | 0, k: G.kills | 0, w: player.weapon
        });
      }
    },

    /* --------------------------------- bonecos dos outros na cena */
    _avatar(scene, p) {
      const skin = MA.findItem('skin', p.skin) || MA.SKINS[0];
      const armor = MA.findItem('armor', p.armor) || null;
      const a = MA.createPlayer(scene, skin, armor);
      a.obj.position.copy(p.pos);
      /* etiqueta com o nome em cima da cabeça */
      const tag = new THREE.Sprite(new THREE.SpriteMaterial({
        map: MA.Tex.nameTag(p.name, competitive(this.mode) ? (p.team === 'pink' ? '#ff4fcf' : '#36dfff') : '#49ffb0'),
        transparent: true, depthTest: false
      }));
      tag.scale.set(3.2, .8, 1); tag.position.y = 3.5;
      a.obj.add(tag);
      p.tag = tag;
      return a;
    },

    updateAvatars(scene, dt) {
      if (!this.active) return;
      this.peerList.forEach(p => {
        if (!p.obj) { p.obj = this._avatar(scene, p); }
        if (p.tPos) {
          p.pos.lerp(p.tPos, Math.min(1, dt * 11));
          p.obj.obj.position.copy(p.pos);
          let d = p.tYaw - p.obj.obj.rotation.y;
          while (d > Math.PI) d -= Math.PI * 2;
          while (d < -Math.PI) d += Math.PI * 2;
          p.obj.obj.rotation.y += d * Math.min(1, dt * 12);
        }
        p.obj.obj.visible = !p.dead;
        /* mantém nas mãos o mesmo modelo de arma que o outro jogador usa */
        if (Number.isFinite(p.wpn) && p.obj.weapon !== p.wpn) {
          p.obj.weapon = p.wpn;
          MA.syncWeaponModel(p.obj);
        }
        MA.animateWeaponModel(p.obj, dt, false);
        /* pernas procedurais ou clips do pacote Kenney quando anda */
        const moving = p.tPos && p.pos.distanceToSquared(p.tPos) > .004;
        p.bob = (p.bob || 0) + dt * (moving ? 11 : 3);
        const sw = Math.sin(p.bob) * (moving ? .5 : .06);
        p.obj.legL.rotation.x = sw; p.obj.legR.rotation.x = -sw;
        if (MA.SkinModels) MA.SkinModels.setState(p.obj, moving ? 'run' : 'idle');
        const ud = p.obj.obj.userData;
        if (ud.panim) ud.panim.forEach(fn => { try { fn(0, dt); } catch (e) { /* ignora */ } });
      });
    },

    _removeAvatar(p) {
      if (p && p.obj && p.obj.obj.parent) {
        p.obj.obj.parent.remove(p.obj.obj);
        MA.disposeObject(p.obj.obj);
      }
      if (p) p.obj = null;
    },

    clearAvatars() { this.peerList.forEach(p => this._removeAvatar(p)); },

    /* ------------------------------------------ host: snapshot de inimigos */
    hostSnapshot(dt, enemies, G) {
      if (!this.active || !this.isHost || !this.started) return;
      this._snapT -= dt;
      if (this._snapT > 0) return;
      this._snapT = 1 / SNAP_HZ;
      const e = enemies.slice(0, 60).map(x => ({
        i: x.netId, d: x.def.id,
        x: +x.obj.position.x.toFixed(1), z: +x.obj.position.z.toFixed(1),
        r: +x.obj.rotation.y.toFixed(2),
        h: Math.round(x.hp), m: Math.round(x.hpMax),
        b: x.isBoss ? 1 : 0, e: x.elite ? 1 : 0
      }));
      /* itens do chão também viajam: sem isso o cliente nunca via
         cura, dano dobrado, nuke… tudo caía só na tela do anfitrião. */
      const it = (this._pickFn ? this._pickFn() : []).slice(0, 24);
      this.send({ t: 'snap', e, full: enemies.length <= 60, it, w: G.wave, q: G.spawnQueue | 0, tgt: G.waveTarget | 0 });
    },

    startMatch() {
      if (!this.canStart()) return { error: this.mode === 'coop'
        ? 'O Coop precisa de pelo menos 2 jogadores.'
        : 'Cada equipe precisa de pelo menos 2 jogadores.' };
      this.started = true;
      this.send({ t: 'start', mode: this.mode, map: this.map, diff: this.diff });
      return { ok: true };
    }
  };

  MA.Multi = Multi;
})(window.MA);
