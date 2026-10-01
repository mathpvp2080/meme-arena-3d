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
    mode: 'coop',          // 'coop' | 'pvp'
    map: 'arena',
    diff: 'normal',
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

    minLevel() { return (MA.CONFIG && MA.CONFIG.MULTIPLAYER_LEVEL) || 5; },
    unlocked() {
      const p = MA.Profile && MA.Profile.data;
      return !!p && p.level >= this.minLevel();
    },

    _identity() {
      const p = MA.Profile.data;
      return {
        id: (MA.Net.user && MA.Net.user.id) || ('L' + Math.random().toString(36).slice(2, 9)),
        name: p.username, level: p.level,
        skin: (p.equipped && p.equipped.skin) || 'chill',
        armor: (p.equipped && p.equipped.armor) || 'hoodie'
      };
    },

    /* --------------------------------------------------- criar / entrar */
    async createRoom(mode, map, diff) {
      const r = await this._open(code4(), true, mode, map, diff);
      if (!r.error && MA.Net.online && MA.Net.impl.sb) {
        try {
          await MA.Net.impl.sb.from('rooms').insert({
            code: this.code, host_id: this.me.id, host_name: this.me.name,
            mode, map, diff, players: 1, state: 'lobby'
          });
        } catch (e) { console.warn('[MP] não deu pra anunciar a sala', e); }
      }
      return r;
    },

    async joinRoom(code) {
      code = String(code || '').trim().toUpperCase();
      if (code.length !== 4) return { error: 'O código tem 4 letras.' };
      let mode = 'coop', map = 'arena', diff = 'normal';
      if (MA.Net.online && MA.Net.impl.sb) {
        const { data } = await MA.Net.impl.sb.from('rooms').select('*').eq('code', code).maybeSingle();
        if (!data) return { error: 'Sala não encontrada.' };
        if (data.players >= data.max_players) return { error: 'Sala cheia.' };
        mode = data.mode; map = data.map; diff = data.diff;
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
      this.mode = mode || 'coop'; this.map = map || 'arena'; this.diff = diff || 'normal';
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
      let changed = false;
      this.peerList.forEach(p => {
        if (t - p.last > PEER_TIMEOUT) { this._removeAvatar(p); delete this.peers[p.id]; changed = true; }
      });
      if (changed) this.emit('peers');
      if (this.isHost && MA.Net.online && MA.Net.impl.sb) {
        MA.Net.impl.sb.from('rooms')
          .update({ players: this.count, state: this.started ? 'playing' : 'lobby' })
          .eq('code', this.code).then(() => {}, () => {});
      }
    },

    send(msg) { if (this.tr) { msg.from = this.me.id; this.tr.send(msg); } },

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
          p.name = m.name; p.skin = m.skin; p.armor = m.armor; p.level = m.level;
          p.last = Date.now();
          if (m.t === 'hello') {
            this.send({ t: 'ping', ...this.me, host: this.isHost, started: this.started });
            if (this.isHost && this.started) this.send({ t: 'start', mode: this.mode, map: this.map, diff: this.diff });
          }
          if (isNew) {
            this.emit('peers');
            if (MA.UI && MA.UI.notice) MA.UI.notice('🎮 <b>' + m.name + '</b> entrou na sala');
          }
          break;
        }
        case 'bye': {
          const p = this.peers[m.from];
          if (p) {
            if (MA.UI && MA.UI.notice) MA.UI.notice('👋 <b>' + p.name + '</b> saiu');
            this._removeAvatar(p); delete this.peers[m.from]; this.emit('peers');
          }
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
          this.mode = m.mode; this.map = m.map; this.diff = m.diff;
          this.started = true;
          this.emit('start', m);
          break;
        case 'snap':  this.emit('snap', m); break;      // inimigos (host → todos)
        case 'hit':   this.emit('hit', m); break;       // cliente → host
        case 'ekill': this.emit('ekill', m); break;     // host → todos
        case 'shot':  this.emit('shot', m); break;      // tiro visível dos outros
        case 'pvp':   this.emit('pvp', m); break;       // dano em jogador
        case 'wave':  this.emit('wave', m); break;
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
          h: Math.round(player.hp), hm: Math.round(player.hpMax),
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
        map: MA.Tex.nameTag(p.name, this.mode === 'pvp' ? '#ff3d7f' : '#49ffb0'),
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
        /* pernas balançando quando anda */
        const moving = p.tPos && p.pos.distanceToSquared(p.tPos) > .004;
        p.bob = (p.bob || 0) + dt * (moving ? 11 : 3);
        const sw = Math.sin(p.bob) * (moving ? .5 : .06);
        p.obj.legL.rotation.x = sw; p.obj.legR.rotation.x = -sw;
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
      const e = enemies.slice(0, 40).map(x => ({
        i: x.netId, d: x.def.id,
        x: +x.obj.position.x.toFixed(1), z: +x.obj.position.z.toFixed(1),
        r: +x.obj.rotation.y.toFixed(2),
        h: Math.round(x.hp), m: Math.round(x.hpMax),
        b: x.isBoss ? 1 : 0, e: x.elite ? 1 : 0
      }));
      this.send({ t: 'snap', e, w: G.wave, q: G.spawnQueue | 0, tgt: G.waveTarget | 0 });
    },

    startMatch() {
      this.started = true;
      this.send({ t: 'start', mode: this.mode, map: this.map, diff: this.diff });
    }
  };

  MA.Multi = Multi;
})(window.MA);
