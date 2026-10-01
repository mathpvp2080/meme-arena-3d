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
      equipped: { skin: 'chill', armor: 'hoodie', weapons: [] },
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
          s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js';
          s.onload = res; s.onerror = () => rej(new Error('cdn'));
          document.head.appendChild(s);
        });
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
        inventory: data.inventory || [], equipped: data.equipped || { skin: 'chill', armor: 'hoodie', weapons: [] },
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
      const { data } = await this.sb.from('profiles')
        .select('username,level,stats').order('level', { ascending: false }).limit(20);
      return (data || []).map(p => ({
        username: p.username, level: p.level, score: (p.stats && p.stats.bestScore) || 0
      })).sort((a, b) => b.score - a.score);
    },

    async deleteAccount() { return { error: 'Peça a exclusão ao administrador.' }; },

    _msg(e) {
      const m = (e && e.message) || 'Erro desconhecido.';
      if (/rate limit/i.test(m)) return 'Muitas tentativas. Espere um pouco.';
      if (/already registered/i.test(m)) return 'Já existe uma conta com esse nome.';
      return m;
    }
  };

  /* ============================================================== FACADE */
  const Net = {
    impl: Local,
    user: null,
    online: false,
    _saveTimer: null,

    async init() {
      const hasKeys = CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY && !window.__forceLocal;
      if (hasKeys) {
        try {
          await Remote.init();
          this.impl = Remote; this.online = true;
        } catch (e) {
          console.warn('[MemeArena] Supabase indisponível, usando modo local.', e);
          this.impl = Local; this.online = false;
        }
      } else {
        this.impl = Local; this.online = false;
      }
      await this.impl.init();
      return this.online;
    },

    get mode() { return this.impl.mode; },

    async signUp(u, p) {
      const r = await this.impl.signUp(u, p);
      if (!r.error) this.user = r.user;
      return r;
    },
    async signIn(u, p) {
      const r = await this.impl.signIn(u, p);
      if (!r.error) this.user = r.user;
      return r;
    },
    /* devolve só o PERFIL (ou null) — é isso que MA.Profile.set espera */
    async restore() {
      const r = await this.impl.restore();
      if (!r) return null;
      this.user = r.user;
      return r.profile || null;
    },
    async signOut() { this.user = null; return this.impl.signOut(); },

    /* grava com debounce pra não martelar o banco */
    saveProfile(profile, immediate) {
      clearTimeout(this._saveTimer);
      if (immediate) return this.impl.saveProfile(profile);
      return new Promise(res => {
        this._saveTimer = setTimeout(() => res(this.impl.saveProfile(profile)), 900);
      });
    },

    leaderboard() { return this.impl.leaderboard(); },
    deleteAccount() { return this.impl.deleteAccount(); },
    freshProfile
  };

  MA.Net = Net;
})(window.MA);
