/* =====================================================================
   MEME ARENA 3D — TEMPORADA 1: 67

   A temporada usa apenas o conceito numérico que circula como meme. Toda a
   identidade visual, os modelos, efeitos e sons continuam sendo criações
   próprias do jogo; nenhuma música, voz, foto ou personagem da trend é usado.
   ===================================================================== */
(function (MA) {
  'use strict';

  const SEASON = {
    id: 'season-1-67',
    number: 1,
    name: '67',
    title: 'TEMPORADA 1 · 67',
    startsAt: '2026-10-03T00:00:00-03:00',
    endsAt: '2026-11-28T23:59:59-03:00',
    nextStartsAt: '2026-11-29T00:00:00-03:00',
    odds: { resources: 50, skin: 50 },
    rarityOdds: Object.assign({}, MA.SKIN_DROP_ODDS),
    itemKeys: MA.SKINS.filter(skin => skin.rarity !== 'common').map(skin => 'skin:' + skin.id),
    boxes: [
      {
        id: 'box67', name: 'CAIXA 67', icon: '67', price: 670, count: 1,
        desc: 'Uma abertura: 50% de skin ou 50% de moedas, XP ou ambos.'
      },
      {
        id: 'vault67', name: 'COFRE 67', icon: '6+7', price: 1967, count: 3,
        desc: 'Três aberturas com desconto. Cada uma sorteia skin ou recursos separadamente.'
      }
    ]
  };
  MA.SEASON = SEASON;

  /* Armaduras e armas sazonais continuam próprias da Temporada 67. As skins
     agora vêm exclusivamente do catálogo Polygonal Mind R1/R2 aprovado. */
  if (!MA.ARMORS.some(a => a.id === 'protocol67')) {
    MA.ARMORS.push({
      id: 'protocol67', name: 'Protocolo 6·7', rarity: 'legendary', price: 8670, level: 1,
      desc: 'Placas duplas de impacto: +67 HP e 17% de redução de dano.',
      hp: 67, dr: .17, color: 0x6572ff,
      seasonal: true, season: '67', boxOnly: true,
      marketMin: 2670, marketMax: 46700
    });
  }

  if (!MA.WEAPONS.some(w => w.id === 'pulse67')) {
    MA.WEAPONS.push({
      id: 'pulse67', name: 'Pulso Seis-Sete', icon: '6⁷', kind: 'rail',
      dmg: 67, rate: .67, speed: 67, spread: .006, count: 1,
      color: 0x2de2ff, size: .25, life: 1.67, pierce: 6, unlock: 1,
      desc: 'Disparo de 67 de dano que atravessa até 6 alvos. Cadência de 0,67 s.'
    });
  }
  MA.WEAPON_SHOP.pulse67 = {
    price: 10670, level: 1, rarity: 'legendary', seasonal: true,
    season: '67', boxOnly: true, marketMin: 3670, marketMax: 67000
  };

  function int(n, fallback) {
    n = Number(n);
    return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : (fallback || 0);
  }

  const Season = {
    migrate(profile) {
      if (!profile) return null;
      profile.stats = profile.stats || {};
      const old = profile.stats.season67 || {};
      profile.stats.season67 = {
        boxesOpened: int(old.boxesOpened),
        pity: Math.min(6, int(old.pity)),
        boosts: int(old.boosts),
        fragments: int(old.fragments),
        forged: int(old.forged),
        bossesDefeated: int(old.bossesDefeated),
        bossDrops: int(old.bossDrops),
        lastBossRewardAt: old.lastBossRewardAt || null,
        lastRewards: Array.isArray(old.lastRewards) ? old.lastRewards.slice(-12) : []
      };
      return profile.stats.season67;
    },

    progress() {
      return MA.Profile && MA.Profile.data ? this.migrate(MA.Profile.data) : null;
    },

    active(now) {
      const t = now ? new Date(now).getTime() : Date.now();
      return t >= new Date(SEASON.startsAt).getTime() && t <= new Date(SEASON.endsAt).getTime();
    },

    countdown(now) {
      const t = now ? new Date(now).getTime() : Date.now();
      const start = new Date(SEASON.startsAt).getTime();
      const end = new Date(SEASON.endsAt).getTime();
      const next = new Date(SEASON.nextStartsAt).getTime();
      let target = end, prefix = 'TERMINA EM';
      if (t < start) { target = start; prefix = 'COMEÇA EM'; }
      else if (t > end) { target = next; prefix = 'PRÓXIMA EM'; }
      const total = Math.max(0, target - t);
      const days = Math.floor(total / 86400000);
      const hours = Math.floor((total % 86400000) / 3600000);
      const minutes = Math.floor((total % 3600000) / 60000);
      return prefix + ' ' + days + 'D ' + hours + 'H ' + minutes + 'M';
    },

    box(id) { return SEASON.boxes.find(b => b.id === id) || null; },

    async openBox(id) {
      if (!MA.Profile || !MA.Profile.data) return { error: 'Entre em uma conta para abrir caixas.' };
      if (!this.active()) return { error: 'As Caixas 67 só ficam disponíveis durante a temporada.' };
      const box = this.box(id);
      if (!box) return { error: 'Caixa desconhecida.' };
      if (MA.Profile.data.coins < box.price) return { error: 'Moedas insuficientes.' };

      /* Conta online: moedas, piedade e sorteio são autoridade do PostgreSQL.
         Convidado/modo local preserva o mesmo algoritmo sem criar dados remotos. */
      if (MA.Net && MA.Net.online) {
        const remote = await MA.Net.seasonOpenBox(id);
        if (!remote) return { error: 'Servidor sazonal indisponível.' };
        if (remote.error) return { error: remote.error };
        await MA.Net.refreshProfile();
        const results = (remote.results || []).map(r => this._enrichServerReward(r));
        if (MA.Goals) { MA.Goals.track('buys', 1); MA.Goals.track('inv', 0); }
        return { ok: true, box, results, progress: this.progress() };
      }

      MA.Profile.addCoins(-box.price);
      const results = [];
      for (let i = 0; i < box.count; i++) results.push(this._roll());
      const p = this.progress();
      p.lastRewards = p.lastRewards.concat(results.map(r => r.log)).slice(-12);
      if (MA.Goals) { MA.Goals.track('buys', 1); MA.Goals.track('inv', 0); }
      await MA.Profile.save(true);
      return { ok: true, box, results, progress: p };
    },

    _rollRarity(roll) {
      const n = Math.max(0, Math.min(99.999999, Number(roll)));
      if (n < 40) return 'uncommon';
      if (n < 69.5) return 'legendary';
      if (n < 89.5) return 'mythical';
      if (n < 99.5) return 'ultimate';
      return 'secret';
    },

    _resourceReward(source) {
      const boss = source === 'boss';
      const roll = Math.random();
      if (roll < .4) {
        const values = boss ? [500, 1000, 1500] : [250, 500, 750];
        const amount = values[Math.floor(Math.random() * values.length)];
        MA.Profile.addCoins(amount);
        return { type:'coins', icon:'🪙', name:amount + ' MOEDAS', amount,
          rarity:'common', desc:'RECURSO AUTOMÁTICO', log:'🪙 +' + amount + ' moedas' };
      }
      if (roll < .75) {
        const values = boss ? [400, 800, 1200] : [200, 400, 600];
        const amount = values[Math.floor(Math.random() * values.length)];
        const levels = MA.Profile.addXp(amount);
        return { type:'xp', icon:'✦', name:amount + ' XP', amount, levels,
          rarity:'uncommon', desc:'RECURSO AUTOMÁTICO', log:'✦ +' + amount + ' XP' };
      }
      const amount = boss ? 500 : 250;
      MA.Profile.addCoins(amount);
      const levels = MA.Profile.addXp(amount);
      return { type:'both', icon:'⚡', name:amount + ' MOEDAS + ' + amount + ' XP',
        amount, coins:amount, xp:amount, levels, rarity:'legendary',
        desc:'RECURSOS AUTOMÁTICOS', log:'⚡ +' + amount + ' moedas e XP' };
    },

    _skinChoices(source, rarity) {
      return MA.SKINS.filter(skin => skin.rarity === rarity &&
        (source === 'boss'
          ? skin.acquisition === 'boss' || skin.acquisition === 'both'
          : skin.acquisition === 'box' || skin.acquisition === 'both'));
    },

    _skinReward(source, forcedRarity) {
      const rarity = forcedRarity || this._rollRarity(Math.random() * 100);
      const pool = this._skinChoices(source || 'box', rarity);
      if (!pool.length) return this._resourceReward(source);
      const missing = pool.filter(skin => !MA.Profile.owns('skin', skin.id));
      const candidates = missing.length ? missing : pool;
      const selected = candidates[Math.floor(Math.random() * candidates.length)];

      /* O inventário atual é unitário. Depois de completar uma faixa inteira,
         uma repetida vira recursos imediatamente, sem criar uma segunda skin. */
      if (MA.Profile.owns('skin', selected.id)) {
        const amount = Math.max(250, Math.round(selected.marketValue * .1));
        MA.Profile.addCoins(amount);
        return { type:'coins', icon:'🪙', name:amount + ' MOEDAS', amount,
          rarity, converted:true, desc:'SKIN REPETIDA CONVERTIDA AUTOMATICAMENTE',
          log:'🪙 +' + amount + ' moedas (skin repetida)' };
      }

      MA.Profile.grant('skin', selected.id, true);
      return { type:'item', icon:selected.face || '🎁', name:selected.name,
        item:selected, itemKey:'skin:' + selected.id, itemType:'skin', rarity,
        desc:source === 'boss' ? 'DROP DE CHEFE' : 'DROP DE CAIXA',
        log:'🎁 ' + selected.name + (source === 'boss' ? ' (chefe)' : ' (caixa)') };
    },

    _roll(source) {
      const p = this.progress();
      if (source !== 'boss') p.boxesOpened++;
      p.pity = 0; // mantido no formato do perfil apenas por compatibilidade
      return Math.random() < .5 ? this._skinReward(source || 'box') : this._resourceReward(source || 'box');
    },

    _choices(source) {
      const wanted = source || 'box';
      return MA.SKINS.filter(skin => skin.rarity !== 'common' &&
        (wanted === 'boss'
          ? skin.acquisition === 'boss' || skin.acquisition === 'both'
          : skin.acquisition === 'box' || skin.acquisition === 'both'))
        .map(item => ({ key:'skin:' + item.id, type:'skin', id:item.id, item }));
    },

    _enrichServerReward(reward) {
      const r = Object.assign({}, reward || {});
      if (r.itemKey) {
        const parts = r.itemKey.split(':');
        r.itemType = r.itemType || parts[0];
        r.item = MA.findItem(parts[0], parts[1]);
        if (r.item) {
          r.name = r.item.name;
          r.icon = r.item.icon || r.item.face || r.icon || '67';
          r.rarity = r.item.rarity || r.rarity;
        }
      }
      if (!r.log) {
        if (r.type === 'item') r.log = '🎁 ' + r.name;
        else if (r.type === 'coins') r.log = '🪙 +' + r.amount + ' moedas';
        else if (r.type === 'xp') r.log = '✦ +' + r.amount + ' XP';
        else if (r.type === 'both') r.log = '⚡ +' + r.coins + ' moedas e +' + r.xp + ' XP';
        else if (r.type === 'boost') r.log = '⚡ Impulso 67 ×' + r.amount;
        else r.log = '⬡ +' + r.amount + ' fragmentos';
      }
      return r;
    },

    async bossReward() {
      if (!MA.Profile || !MA.Profile.data || !this.active()) return null;
      if (MA.Net && MA.Net.online) {
        const remote = await MA.Net.seasonBossReward();
        if (!remote) return { error: 'Servidor sazonal indisponível.' };
        if (remote.error) return { error: remote.error };
        await MA.Net.refreshProfile();
        return this._enrichServerReward(remote.reward);
      }
      const p = this.progress();
      p.bossesDefeated++;
      const reward = this._roll('boss');
      if (reward.type === 'item') p.bossDrops++;
      p.lastRewards = p.lastRewards.concat(reward.log).slice(-12);
      MA.Profile.save(true);
      return reward;
    },

    async forge() {
      return { error: 'A forja de fragmentos foi encerrada. Caixas e chefes agora usam o sorteio 50/50.' };
    },

    rewardMultiplier() {
      const p = this.progress();
      return p && p.boosts > 0 ? 1.67 : 1;
    },

    consumeBoost() {
      const p = this.progress();
      if (!p || p.boosts <= 0) return false;
      p.boosts--;
      /* O resultado da partida continua imediato na UI, mas a conta online
         confirma o consumo na tabela sazonal privada do servidor. */
      if (MA.Net && MA.Net.online) {
        const request = MA.Net.seasonConsumeBoost();
        if (request && request.then) request.then(r => {
          if (r && r.error) console.warn('[Temporada 67] impulso não confirmado:', r.error);
        }).catch(e => console.warn('[Temporada 67] impulso não confirmado', e));
      }
      return true;
    }
  };

  MA.Season = Season;
})(window.MA);
