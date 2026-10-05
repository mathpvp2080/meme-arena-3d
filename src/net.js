/* =====================================================================
   MEME ARENA 3D — camada de rede

   Abstrai o backend. Funciona em dois modos:
     • local     → contas salvas no localStorage (sem servidor)
     • supabase  → contas, perfis e (futuramente) multiplayer reais

   O resto do jogo só conversa com MA.Net e não sabe qual modo está ativo.
   ===================================================================== */
(function (MA) {
  'use strict';

  const CFG = MA.CONFIG;
  const LS_USERS = 'memearena.users';
  const LS_SESSION = 'memearena.session';

  /* --------------------------------------------------------- utilidades */
  async function sha256(text) {
    if (window.crypto && crypto.subtle) {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    // fallback bem fraco, só pra navegadores sem SubtleCrypto (http sem TLS)
    let h = 0;
    for (let i = 0; i < text.length; i++) { h = (h << 5) - h + text.charCodeAt(i); h |= 0; }
    return 'weak' + Math.abs(h).toString(16);
  }

  function validUsername(u) {
    if (!u || u.length < 3) return 'O nome precisa de pelo menos 3 caracteres.';
    if (u.length > 16) return 'O nome pode ter no máximo 16 caracteres.';
    if (!/^[a-zA-Z0-9_]+$/.test(u)) return 'Use apenas letras, números e _ (underline).';
    if (/^convidado\d{4}$/i.test(u)) return 'Esse formato de nome é reservado ao modo Convidado.';
    return null;
  }
  function validPassword(p) {
    if (!p || p.length < 6) return 'A senha precisa de pelo menos 6 caracteres.';
    if (p.length > 72) return 'Senha longa demais.';
    return null;
  }

  function freshProfile(username) {
    return {
      username,
      level: 1,
      xp: 0,
      coins: CFG.START_COINS,
      inventory: [],                    // ['skin:chill','armor:hoodie', ...]
      equipped: { skin: 'chill', armor: 'hoodie', weapons: [], ability: '' },
      stats: { games: 0, bestScore: 0, totalScore: 0, kills: 0, bosses: 0, bestWave: 0, maxCombo: 1, playtime: 0 },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  }

  /* ===================================================== adaptador LOCAL */
  const Local = {
    mode: 'local',

    _users() { return MA.store.get('users', {}); },
    _saveUsers(u) { MA.store.set('users', u); },

    async init() { return true; },

    async signUp(username, password) {
      const e1 = validUsername(username); if (e1) return { error: e1 };
      const e2 = validPassword(password); if (e2) return { error: e2 };
      const users = this._users();
      const key = username.toLowerCase();
      if (users[key]) return { error: 'Esse nome já está em uso neste navegador.' };
      users[key] = { username, hash: await sha256(password + '::' + key), profile: freshProfile(username) };
      this._saveUsers(users);
      MA.store.set('session', key);
      return { user: { username }, profile: users[key].profile };
    },

    async signIn(username, password) {
      const users = this._users();
      const key = String(username || '').toLowerCase();
      const rec = users[key];
      if (!rec) return { error: 'Conta não encontrada neste navegador.' };
      const hash = await sha256(password + '::' + key);
      if (hash !== rec.hash) return { error: 'Senha incorreta.' };
      MA.store.set('session', key);
      return { user: { username: rec.username }, profile: rec.profile };
    },

    async restore() {
      const key = MA.store.get('session', null);
      if (!key) return null;
      const rec = this._users()[key];
      if (!rec) return null;
      return { user: { username: rec.username }, profile: rec.profile };
    },

    async signOut() { MA.store.set('session', null); return true; },

    async saveProfile(profile) {
      const key = MA.store.get('session', null);
      if (!key) return { error: 'Sem sessão.' };
      const users = this._users();
      if (!users[key]) return { error: 'Conta sumiu.' };
      profile.updatedAt = Date.now();
      users[key].profile = profile;
      this._saveUsers(users);
      return { ok: true };
    },

    async leaderboard() {
      const users = this._users();
      return Object.values(users)
        .map(u => ({ username: u.username, score: u.profile.stats.bestScore, level: u.profile.level }))
        .sort((a, b) => b.score - a.score).slice(0, 20);
    },

    async deleteAccount() {
      const key = MA.store.get('session', null);
      const users = this._users();
      delete users[key]; this._saveUsers(users);
      MA.store.set('session', null);
      return { ok: true };
    }
  };

  /* ================================================== adaptador SUPABASE */
  const Remote = {
    mode: 'supabase',
    sb: null,

    _email(username) { return username.toLowerCase() + '@players.memearena.app'; },

    async init() {
      if (this.sb) return true;
      if (!window.supabase) {
        await new Promise((res, rej) => {
          const s = document.createElement('script');
          /* versão fixa: evita que uma atualização remota quebre o login em produção */
          s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.1/dist/umd/supabase.js';
          /* rede bloqueada/lenta não pode pendurar o jogo: sem resposta em 8s
             o modo local assume e a interface aparece normalmente */
          const limite = setTimeout(() => { s.onload = s.onerror = null; rej(new Error('cdn: tempo esgotado')); }, 8000);
          s.onload = () => { clearTimeout(limite); res(); };
          s.onerror = () => { clearTimeout(limite); rej(new Error('cdn')); };
          document.head.appendChild(s);
        });
        if (!window.supabase) throw new Error('cdn: SDK não carregou');
      }
      this.sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY, {
        auth: { persistSession: true, autoRefreshToken: true }
      });
      return true;
    },

    async signUp(username, password) {
      const e1 = validUsername(username); if (e1) return { error: e1 };
      const e2 = validPassword(password); if (e2) return { error: e2 };
      const { data: taken } = await this.sb.from('profiles')
        .select('username').ilike('username', username).maybeSingle();
      if (taken) return { error: 'Esse nome de jogador já existe.' };

      const { data, error } = await this.sb.auth.signUp({
        email: this._email(username), password,
        options: { data: { username } }
      });
      if (error) return { error: this._msg(error) };
      if (!data.session) return { error: 'Confirmação de e-mail está ligada no Supabase. Desative em Authentication → Providers → Email.' };

      const profile = freshProfile(username);
      const { error: e3 } = await this.sb.from('profiles').insert({
        id: data.user.id, username,
        level: 1, xp: 0, coins: CFG.START_COINS,
        inventory: profile.inventory, equipped: profile.equipped, stats: profile.stats
      });
      if (e3) return { error: this._msg(e3) };
      return { user: { username, id: data.user.id }, profile };
    },

    async signIn(username, password) {
      const { data, error } = await this.sb.auth.signInWithPassword({
        email: this._email(username), password
      });
      if (error) return { error: 'Nome ou senha incorretos.' };
      const profile = await this._fetchProfile(data.user.id);
      if (!profile) return { error: 'Perfil não encontrado.' };
      return { user: { username: profile.username, id: data.user.id }, profile };
    },

    async restore() {
      const { data } = await this.sb.auth.getSession();
      if (!data || !data.session) return null;
      const profile = await this._fetchProfile(data.session.user.id);
      if (!profile) return null;
      return { user: { username: profile.username, id: data.session.user.id }, profile };
    },

    async _fetchProfile(id) {
      const { data, error } = await this.sb.from('profiles').select('*').eq('id', id).maybeSingle();
      if (error || !data) return null;
      return {
        username: data.username, level: data.level, xp: data.xp, coins: data.coins,
        inventory: data.inventory || [], equipped: data.equipped || { skin: 'chill', armor: 'hoodie', weapons: [], ability: '' },
        stats: data.stats || {}, updatedAt: Date.now()
      };
    },

    async signOut() { await this.sb.auth.signOut(); return true; },

    async saveProfile(profile) {
      const { data } = await this.sb.auth.getUser();
      if (!data || !data.user) return { error: 'Sem sessão.' };
      const { error } = await this.sb.from('profiles').update({
        level: profile.level, xp: profile.xp, coins: profile.coins,
        inventory: profile.inventory, equipped: profile.equipped,
        stats: profile.stats, updated_at: new Date().toISOString()
      }).eq('id', data.user.id);
      return error ? { error: this._msg(error) } : { ok: true };
    },

    async leaderboard() {
      /* o ranking "limpo" é uma visão do banco que esconde quem tem
         suspeita de trapaça registrada nos últimos 7 dias. Se o SQL das
         travas ainda não foi rodado, caímos no ranking simples. */
      const lb = await this.sb.from('leaderboard')
        .select('username,level,best_score').limit(20);
      if (!lb.error && lb.data) {
        return lb.data.map(p => ({
          username: p.username, level: p.level, score: p.best_score || 0
        })).sort((a, b) => b.score - a.score);
      }
      const { data } = await this.sb.from('profiles')
        .select('username,level,stats').order('level', { ascending: false }).limit(20);
      return (data || []).map(p => ({
        username: p.username, level: p.level, score: (p.stats && p.stats.bestScore) || 0
      })).sort((a, b) => b.score - a.score);
    },

    async seasonOpenBox(id) {
      const { data, error } = await this.sb.rpc('season67_open_box', { p_box: id });
      if (error) return { error: this._msg(error) };
      return data || { error: 'O servidor não retornou a recompensa.' };
    },

    async seasonForgeBox() {
      const { data, error } = await this.sb.rpc('season67_forge_box');
      if (error) return { error: this._msg(error) };
      return data || { error: 'O servidor não retornou a recompensa.' };
    },

    async seasonBossReward() {
      const { data, error } = await this.sb.rpc('season67_boss_reward');
      if (error) return { error: this._msg(error) };
      return data || { error: 'O servidor não retornou a recompensa.' };
    },

    async seasonConsumeBoost() {
      const { data, error } = await this.sb.rpc('season67_consume_boost');
      if (error) return { error: this._msg(error) };
      return data || { error: 'O servidor não confirmou o Impulso 67.' };
    },

    async deleteAccount() {
      try {
        const { data, error } = await this.sb.rpc('delete_my_account');
        if (error) {
          if (/does not exist|schema cache/i.test(error.message || '')) {
            return { error: 'O servidor ainda não tem a função de exclusão. ' +
                            'Rode o arquivo supabase/schema_conta.sql no SQL Editor do Supabase.' };
          }
          return { error: this._msg(error) };
        }
        if (data && data.error) return { error: data.error };
        try { await this.sb.auth.signOut(); } catch (e) { /* ja foi */ }
        return { ok: true };
      } catch (e) {
        return { error: this._msg(e) };
      }
    },

    _msg(e) {
      const m = (e && e.message) || 'Erro desconhecido.';
      if (/rate limit/i.test(m)) return 'Muitas tentativas. Espere um pouco.';
      if (/already registered/i.test(m)) return 'Já existe uma conta com esse nome.';
      if (/season67_(open_box|forge_box|boss_reward|consume_boost)|schema cache/i.test(m)) {
        return 'Servidor ainda não recebeu o patch de lançamento. Execute supabase/DEPLOY_LAUNCH.sql.';
      }
      return m;
    }
  };

  /* ================================================ sessão de CONVIDADO --
     Nunca conversa com o Supabase. O perfil vive no sessionStorage: sobrevive
     a um recarregamento da aba, mas desaparece quando a sessão do navegador
     termina. Assim o botão de teste não cria usuários de autenticação reais. */
  let guestMemory = null;
  const Guest = {
    mode: 'guest',
    key: 'memearena.guest.session',
    async init() { return true; },
    _read() {
      try { return JSON.parse(sessionStorage.getItem(this.key) || 'null'); }
      catch (e) { return guestMemory; }
    },
    _write(value) {
      guestMemory = value;
      try {
        if (value) sessionStorage.setItem(this.key, JSON.stringify(value));
        else sessionStorage.removeItem(this.key);
      } catch (e) { /* modo privado pode bloquear storage; memória ainda funciona */ }
    },
    async start(username) {
      const profile = freshProfile(username);
      profile.guest = true;
      const rec = { user: { username, guest: true }, profile };
      this._write(rec);
      return rec;
    },
    async restore() { return this._read(); },
    async saveProfile(profile) {
      const rec = this._read();
      if (!rec) return { error: 'Sessão de convidado encerrada.' };
      profile.updatedAt = Date.now();
      profile.guest = true;
      rec.profile = profile;
      this._write(rec);
      return { ok: true };
    },
    async signOut() { this._write(null); return true; },
    async deleteAccount() { this._write(null); return { ok: true }; },
    async leaderboard() {
      const rec = this._read();
      return rec ? [{
        username: rec.profile.username,
        score: (rec.profile.stats && rec.profile.stats.bestScore) || 0,
        level: rec.profile.level || 1
      }] : [];
    }
  };

  /* ============================================================== FACADE */
  const Net = {
    impl: Local,
    _accountImpl: Local,
    user: null,
    online: false,
    _saveTimer: null,

    async init() {
      const hasKeys = CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY && !window.__forceLocal;
      if (hasKeys) {
        try {
          await Remote.init();
          this._accountImpl = Remote;
        } catch (e) {
          console.warn('[MemeArena] Supabase indisponível, usando modo local.', e);
          this._accountImpl = Local;
        }
      } else {
        this._accountImpl = Local;
      }
      this.impl = this._accountImpl;
      this.online = this.impl === Remote;
      await this.impl.init();
      return this.online;
    },

    get mode() { return this.impl.mode; },
    get isGuest() { return this.impl === Guest; },

    _useAccountBackend() {
      Guest._write(null);
      this.impl = this._accountImpl;
      this.online = this.impl === Remote;
    },

    async signUp(u, p) {
      this._useAccountBackend();
      const r = await this.impl.signUp(u, p);
      if (!r.error) this.user = r.user;
      return r;
    },
    async signIn(u, p) {
      this._useAccountBackend();
      const r = await this.impl.signIn(u, p);
      if (!r.error) this.user = r.user;
      return r;
    },
    async startGuest() {
      /* Se havia uma sessão online residual, encerra antes de entrar localmente. */
      if (this._accountImpl === Remote) {
        try { await Remote.signOut(); } catch (e) { /* sem sessão é normal */ }
      }
      const name = 'Convidado' + Math.floor(Math.random() * 9000 + 1000);
      const r = await Guest.start(name);
      this.impl = Guest;
      this.online = false;
      this.user = r.user;
      return r;
    },
    /* devolve só o PERFIL (ou null) — é isso que MA.Profile.set espera */
    async restore() {
      const guest = await Guest.restore();
      if (guest) {
        this.impl = Guest;
        this.online = false;
        this.user = guest.user;
        return guest.profile;
      }
      this.impl = this._accountImpl;
      this.online = this.impl === Remote;
      const r = await this.impl.restore();
      if (!r) return null;
      this.user = r.user;
      return r.profile || null;
    },
    async signOut() {
      const active = this.impl;
      this.user = null;
      const result = await active.signOut();
      this.impl = this._accountImpl;
      this.online = this.impl === Remote;
      return result;
    },

    /* grava com debounce pra não martelar o banco */
    saveProfile(profile, immediate) {
      clearTimeout(this._saveTimer);
      if (immediate) return this.impl.saveProfile(profile);
      return new Promise(res => {
        this._saveTimer = setTimeout(() => res(this.impl.saveProfile(profile)), 900);
      });
    },

    /* relê o perfil do servidor (depois de comprar/vender/ganhar presente) */
    async refreshProfile() {
      if (!this.online || !this.impl._fetchProfile) return MA.Profile.data;
      try {
        const { data } = await this.impl.sb.auth.getUser();
        if (!data || !data.user) return MA.Profile.data;
        const p = await this.impl._fetchProfile(data.user.id);
        if (p) MA.Profile.set(p);
      } catch (e) { console.warn('[MemeArena] não deu pra atualizar o perfil', e); }
      return MA.Profile.data;
    },

    seasonOpenBox(id) {
      return this.online && this.impl.seasonOpenBox ? this.impl.seasonOpenBox(id) : null;
    },
    seasonForgeBox() {
      return this.online && this.impl.seasonForgeBox ? this.impl.seasonForgeBox() : null;
    },
    seasonBossReward() {
      return this.online && this.impl.seasonBossReward ? this.impl.seasonBossReward() : null;
    },
    seasonConsumeBoost() {
      return this.online && this.impl.seasonConsumeBoost ? this.impl.seasonConsumeBoost() : null;
    },
    leaderboard() { return this.impl.leaderboard(); },
    async deleteAccount() {
      const active = this.impl;
      const result = await active.deleteAccount();
      if (active === Guest && !result.error) {
        this.user = null;
        this.impl = this._accountImpl;
        this.online = this.impl === Remote;
      }
      return result;
    },
    freshProfile
  };

  MA.Net = Net;
})(window.MA);
