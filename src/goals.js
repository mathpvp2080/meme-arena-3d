/* =====================================================================
   MEME ARENA 3D — ETAPA 4: metas e recompensas

   Dois sistemas que dividem o mesmo motor de progresso:

     • CONQUISTAS — permanentes, para a vida toda da conta. Dão moedas,
       XP e, nas mais difíceis, itens exclusivos que não existem na loja.
     • MISSÕES DIÁRIAS — três por dia, sorteadas a partir da data, iguais
       para todo mundo. Reiniciam à meia-noite e dão um bônus extra se
       você completar as três.

   Tudo é guardado dentro do perfil (d.goals), então acompanha a conta
   em qualquer aparelho. O progresso é alimentado por MA.Goals.track(),
   chamado nos pontos-chave do jogo.
   ===================================================================== */
(function (MA) {
  'use strict';

  /* ------------------------------------------------------------ catálogo
     tipo: como o progresso é medido
       'stat'  → lê uma estatística acumulada do perfil (lifetime)
       'run'   → maior valor alcançado numa única partida
       'count' → contador próprio, somado por track()
  */
  const ACHIEVEMENTS = [
    /* --- primeiros passos --- */
    { id: 'first_blood', icon: '🩸', name: 'Primeiro Sangue', desc: 'Delete o seu primeiro meme.',
      tipo: 'stat', chave: 'kills', alvo: 1, coins: 50, xp: 30, tier: 1 },
    { id: 'survivor_5', icon: '🌊', name: 'Aguenta o Tranco', desc: 'Chegue à onda 5 numa partida.',
      tipo: 'run', chave: 'wave', alvo: 5, coins: 120, xp: 80, tier: 1 },
    { id: 'first_boss', icon: '👹', name: 'Caçador de Chefes', desc: 'Derrote o seu primeiro chefe.',
      tipo: 'stat', chave: 'bosses', alvo: 1, coins: 200, xp: 150, tier: 1 },
    { id: 'shopper', icon: '🛒', name: 'Consumista', desc: 'Compre o seu primeiro item na loja.',
      tipo: 'count', chave: 'buys', alvo: 1, coins: 80, xp: 40, tier: 1 },

    /* --- matança --- */
    { id: 'kills_100',  icon: '💀', name: 'Faxineiro da Internet', desc: 'Delete 100 memes no total.',
      tipo: 'stat', chave: 'kills', alvo: 100, coins: 300, xp: 200, tier: 2 },
    { id: 'kills_1000', icon: '☠️', name: 'Apagador de Timeline', desc: 'Delete 1.000 memes no total.',
      tipo: 'stat', chave: 'kills', alvo: 1000, coins: 1500, xp: 1200, tier: 3 },
    { id: 'kills_5000', icon: '🔥', name: 'Fim da Era Brainrot', desc: 'Delete 5.000 memes no total.',
      tipo: 'stat', chave: 'kills', alvo: 5000, coins: 6000, xp: 5000, tier: 4,
      item: { type: 'skin', id: 'reicogumelo' } },

    /* --- resistência --- */
    { id: 'wave_10', icon: '🏄', name: 'Surfista de Ondas', desc: 'Chegue à onda 10 numa partida.',
      tipo: 'run', chave: 'wave', alvo: 10, coins: 400, xp: 300, tier: 2 },
    { id: 'wave_20', icon: '🗿', name: 'Inabalável', desc: 'Chegue à onda 20 numa partida.',
      tipo: 'run', chave: 'wave', alvo: 20, coins: 1200, xp: 900, tier: 3 },
    { id: 'wave_30', icon: '👑', name: 'Lenda da Arena', desc: 'Chegue à onda 30 numa partida.',
      tipo: 'run', chave: 'wave', alvo: 30, coins: 4000, xp: 3500, tier: 4,
      item: { type: 'armor', id: 'chadplate' } },

    /* --- habilidade --- */
    { id: 'combo_25', icon: '⚡', name: 'Sem Respirar', desc: 'Faça um combo de x25 numa partida.',
      tipo: 'run', chave: 'combo', alvo: 25, coins: 500, xp: 350, tier: 2 },
    { id: 'combo_50', icon: '🌀', name: 'Furacão', desc: 'Faça um combo de x50 numa partida.',
      tipo: 'run', chave: 'combo', alvo: 50, coins: 1800, xp: 1400, tier: 3 },
    { id: 'flawless', icon: '🛡️', name: 'Intocável', desc: 'Limpe uma onda inteira sem levar dano.',
      tipo: 'count', chave: 'flawless', alvo: 1, coins: 350, xp: 250, tier: 2 },
    { id: 'flawless_10', icon: '💎', name: 'Vidro Temperado', desc: 'Limpe 10 ondas sem levar dano.',
      tipo: 'count', chave: 'flawless', alvo: 10, coins: 2000, xp: 1600, tier: 3 },
    { id: 'sniper', icon: '🎯', name: 'Mira de Elite', desc: 'Termine uma partida com 80% de precisão (mín. 50 tiros).',
      tipo: 'count', chave: 'sniper', alvo: 1, coins: 900, xp: 700, tier: 3 },

    /* --- exploração --- */
    { id: 'all_maps', icon: '🗺️', name: 'Turista do Caos', desc: 'Jogue pelo menos uma partida em cada um dos 5 mapas.',
      tipo: 'count', chave: 'maps', alvo: 5, coins: 1000, xp: 800, tier: 3 },
    { id: 'all_bosses', icon: '🏆', name: 'Exterminador', desc: 'Derrote os 5 chefes diferentes.',
      tipo: 'count', chave: 'bosstypes', alvo: 5, coins: 2500, xp: 2000, tier: 4,
      item: { type: 'weapon', id: 'rail' } },
    { id: 'collector', icon: '🎒', name: 'Colecionador', desc: 'Tenha 10 itens no inventário.',
      tipo: 'count', chave: 'inv', alvo: 10, coins: 800, xp: 600, tier: 2 },

    /* --- social --- */
    { id: 'mp_first', icon: '🤝', name: 'Melhor com Amigos', desc: 'Jogue uma partida no multiplayer.',
      tipo: 'count', chave: 'mpgames', alvo: 1, coins: 400, xp: 300, tier: 2 },
    { id: 'pvp_win', icon: '⚔️', name: 'Campeão da Arena', desc: 'Vença uma partida de PvP.',
      tipo: 'count', chave: 'pvpwins', alvo: 1, coins: 1200, xp: 1000, tier: 3 },
    { id: 'generous', icon: '🎁', name: 'Coração de Ouro', desc: 'Mande um presente para outro jogador.',
      tipo: 'count', chave: 'gifts', alvo: 1, coins: 600, xp: 400, tier: 2 },

    /* --- dedicação --- */
    { id: 'ult_10', icon: '🧠', name: 'Cérebro Derretido', desc: 'Use a ultimate Brainrot 10 vezes.',
      tipo: 'count', chave: 'ults', alvo: 10, coins: 450, xp: 350, tier: 2 },
    { id: 'playtime_1h', icon: '⏰', name: 'Uma Hora Jogada', desc: 'Acumule 1 hora de jogo.',
      tipo: 'stat', chave: 'playtime', alvo: 3600, coins: 700, xp: 500, tier: 2 },
    { id: 'hard_boss', icon: '😤', name: 'Masoquista', desc: 'Derrote um chefe na dificuldade Difícil ou acima.',
      tipo: 'count', chave: 'hardboss', alvo: 1, coins: 1500, xp: 1200, tier: 3 },
    { id: 'daily_7', icon: '📅', name: 'Rotina de Campeão', desc: 'Complete missões diárias em 7 dias.',
      tipo: 'count', chave: 'dailydays', alvo: 7, coins: 3000, xp: 2500, tier: 4,
      item: { type: 'skin', id: 'dinocoach' } }
  ];

  /* ------------------------------------------------- modelos de missão
     Cada modelo vira uma missão concreta ao sortear a quantidade. */
  const DAILY_POOL = [
    { id: 'd_kills', icon: '💀', nome: n => 'Delete ' + n + ' memes',       chave: 'd_kills',  vals: [40, 60, 80] },
    { id: 'd_wave',  icon: '🌊', nome: n => 'Chegue à onda ' + n,           chave: 'd_wave',   vals: [6, 8, 12], tipo: 'max' },
    { id: 'd_boss',  icon: '👹', nome: n => 'Derrote ' + n + ' chefe(s)',   chave: 'd_boss',   vals: [1, 2] },
    { id: 'd_combo', icon: '⚡', nome: n => 'Faça um combo de x' + n,       chave: 'd_combo',  vals: [12, 18, 25], tipo: 'max' },
    { id: 'd_score', icon: '🏅', nome: n => 'Faça ' + MA.fmt(n) + ' pontos numa partida', chave: 'd_score', vals: [3000, 6000, 10000], tipo: 'max' },
    { id: 'd_games', icon: '🎮', nome: n => 'Jogue ' + n + ' partidas',     chave: 'd_games',  vals: [2, 3, 4] },
    { id: 'd_elite', icon: '👑', nome: n => 'Mate ' + n + ' inimigos de elite', chave: 'd_elite', vals: [3, 5, 8] },
    { id: 'd_ult',   icon: '🧠', nome: n => 'Use a ultimate ' + n + ' vezes', chave: 'd_ult',  vals: [2, 3, 5] },
    { id: 'd_flaw',  icon: '🛡️', nome: n => 'Limpe ' + n + ' onda(s) sem levar dano', chave: 'd_flaw', vals: [1, 2] },
    { id: 'd_item',  icon: '📦', nome: n => 'Pegue ' + n + ' itens do chão', chave: 'd_item',  vals: [5, 8, 12] }
  ];

  /* sorteio determinístico: mesma data = mesmas missões para todo mundo */
  function rng(seed) {
    let s = seed >>> 0;
    return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }
  function hoje() {
    const d = new Date();
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  }

  const G = {
    ACHIEVEMENTS,

    /* ------------------------------------------------ estado no perfil */
    _d() {
      const p = MA.Profile.data;
      if (!p) return null;
      if (!p.goals) p.goals = {};
      const g = p.goals;
      g.done = g.done || {};        // conquistas concluídas { id: timestamp }
      g.counters = g.counters || {}; // contadores próprios
      g.best = g.best || {};         // melhor valor numa run
      g.seen = g.seen || {};         // conjuntos (mapas jogados, chefes mortos)
      g.daily = g.daily || null;
      g.dailyDays = g.dailyDays || [];
      this._rolarDiarias(g);
      return g;
    },

    /* sorteia as missões do dia se ainda não existirem */
    _rolarDiarias(g) {
      const dia = hoje();
      if (g.daily && g.daily.dia === dia) return;
      const r = rng(dia * 7919);
      const pool = DAILY_POOL.slice();
      const escolhidas = [];
      for (let i = 0; i < 3 && pool.length; i++) {
        const idx = Math.floor(r() * pool.length);
        const m = pool.splice(idx, 1)[0];
        const alvo = m.vals[Math.floor(r() * m.vals.length)];
        escolhidas.push({
          id: m.id, icon: m.icon, chave: m.chave, tipo: m.tipo || 'soma',
          nome: m.nome(alvo), alvo: alvo, prog: 0, feito: false,
          coins: 150 + Math.round(alvo * 4), xp: 120 + Math.round(alvo * 3)
        });
      }
      g.daily = { dia: dia, missoes: escolhidas, bonusPago: false };
    },

    /* ------------------------------------------------------- progresso */
    valorDe(a) {
      const p = MA.Profile.data, g = this._d();
      if (!p || !g) return 0;
      if (a.tipo === 'stat')  return p.stats[a.chave] || 0;
      if (a.tipo === 'run')   return g.best[a.chave] || 0;
      if (a.chave === 'inv')  return p.inventory.length;
      if (a.chave === 'maps')      return Object.keys(g.seen.maps || {}).length;
      if (a.chave === 'bosstypes') return Object.keys(g.seen.bosses || {}).length;
      if (a.chave === 'dailydays') return g.dailyDays.length;
      return g.counters[a.chave] || 0;
    },

    feito(id) { const g = this._d(); return !!(g && g.done[id]); },

    progresso(a) {
      const v = this.valorDe(a);
      return { v: Math.min(v, a.alvo), alvo: a.alvo, pct: Math.min(1, v / a.alvo) };
    },

    /* total de conquistas concluídas (para o selo no hub) */
    resumo() {
      const g = this._d();
      if (!g) return { feitas: 0, total: ACHIEVEMENTS.length, pend: 0 };
      const feitas = ACHIEVEMENTS.filter(a => g.done[a.id]).length;
      const pend = ACHIEVEMENTS.filter(a => !g.done[a.id] && this.progresso(a).pct >= 1).length +
                   (g.daily ? g.daily.missoes.filter(m => m.feito === 'pronto').length : 0);
      return { feitas, total: ACHIEVEMENTS.length, pend };
    },

    /* ---------------------------------------------- alimentar progresso
       track('kills', 3) soma · track('combo', 12, true) guarda o máximo */
    track(chave, valor, isMax) {
      const g = this._d();
      if (!g) return;
      valor = valor === undefined ? 1 : valor;

      if (isMax) g.best[chave] = Math.max(g.best[chave] || 0, valor);
      else g.counters[chave] = (g.counters[chave] || 0) + valor;

      /* espelha nas missões diárias que usam a mesma chave */
      if (g.daily) {
        g.daily.missoes.forEach(m => {
          if (m.chave !== 'd_' + chave && m.chave !== chave) return;
          if (m.feito) return;
          m.prog = m.tipo === 'max' ? Math.max(m.prog, valor) : m.prog + valor;
          if (m.prog >= m.alvo) { m.prog = m.alvo; m.feito = 'pronto'; this._avisarDiaria(m); }
        });
      }
      this._conferir();
    },

    /* conjuntos: mapas visitados, tipos de chefe derrotados */
    trackSet(grupo, valor) {
      const g = this._d();
      if (!g) return;
      g.seen[grupo] = g.seen[grupo] || {};
      if (!g.seen[grupo][valor]) { g.seen[grupo][valor] = 1; this._conferir(); }
    },

    /* ----------------------------------------------- resgate automático */
    _conferir() {
      const g = this._d();
      if (!g) return;
      ACHIEVEMENTS.forEach(a => {
        if (g.done[a.id]) return;
        if (this.progresso(a).pct < 1) return;
        g.done[a.id] = Date.now();
        MA.Profile.addCoins(a.coins);
        MA.Profile.addXp(a.xp);
        if (a.item) MA.Profile.grant(a.item.type, a.item.id);
        this._avisarConquista(a);
      });
      MA.Profile.save();
    },

    _avisarConquista(a) {
      const extra = a.item ? ('<br><b>+ item exclusivo:</b> ' +
        ((MA.findItem(a.item.type, a.item.id) || {}).name || '')) : '';
      if (MA.MetaUI) {
        MA.MetaUI.toast('<div class="tachv"><span class="tachvico">' + a.icon + '</span>' +
          '<div><b>CONQUISTA DESBLOQUEADA</b><br>' + a.name +
          '<div class="dim">🪙 ' + MA.fmt(a.coins) + ' · ' + MA.fmt(a.xp) + ' XP' + extra + '</div></div></div>', 'achv');
      }
      if (MA.UI && MA.UI.banner) MA.UI.banner('🏆 ' + a.name, a.icon);
      if (MA.Audio && MA.Audio.pickup) MA.Audio.pickup();
    },

    _avisarDiaria(m) {
      if (MA.MetaUI) {
        MA.MetaUI.toast('✅ <b>Missão diária:</b> ' + m.nome +
          '<div class="dim">Resgate no hub: 🪙 ' + MA.fmt(m.coins) + ' · ' + MA.fmt(m.xp) + ' XP</div>');
      }
      if (MA.Audio && MA.Audio.ui) MA.Audio.ui();
    },

    /* resgatar o prêmio de uma missão diária concluída */
    resgatar(id) {
      const g = this._d();
      if (!g || !g.daily) return { error: 'Nada para resgatar.' };
      const m = g.daily.missoes.find(x => x.id === id);
      if (!m || m.feito !== 'pronto') return { error: 'Missão ainda não concluída.' };
      m.feito = 'pago';
      MA.Profile.addCoins(m.coins);
      MA.Profile.addXp(m.xp);

      /* bônus por completar as três do dia */
      const todas = g.daily.missoes.every(x => x.feito === 'pago');
      let bonus = null;
      if (todas && !g.daily.bonusPago) {
        g.daily.bonusPago = true;
        bonus = { coins: 1000, xp: 800 };
        MA.Profile.addCoins(bonus.coins);
        MA.Profile.addXp(bonus.xp);
        const dia = String(g.daily.dia);
        if (g.dailyDays.indexOf(dia) < 0) g.dailyDays.push(dia);
        this._conferir();
      }
      MA.Profile.save(true);
      return { ok: true, coins: m.coins, xp: m.xp, bonus };
    },

    /* chamado no fim de cada partida */
    fimDePartida(g2, secs) {
      const g = this._d();
      if (!g) return;
      g.best.wave  = Math.max(g.best.wave  || 0, g2.wave);
      g.best.combo = Math.max(g.best.combo || 0, g2.maxCombo);
      g.best.score = Math.max(g.best.score || 0, g2.score);

      this.track('games', 1);
      this.track('d_wave', g2.wave, true);
      this.track('d_combo', g2.maxCombo, true);
      this.track('d_score', g2.score, true);
      this.track('d_games', 1);

      const acc = g2.shots ? g2.hits / g2.shots : 0;
      if (g2.shots >= 50 && acc >= .8) this.track('sniper', 1);
      this._conferir();
    }
  };

  MA.Goals = G;
})(window.MA);
