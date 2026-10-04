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
    itemKeys: [
      'skin:sixtyseven', 'skin:sixorbit', 'skin:sevenbreak', 'skin:duo67',
      'armor:protocol67', 'armor:orbit6', 'armor:prism7',
      'weapon:pulse67', 'weapon:boomerang', 'weapon:gravity6', 'weapon:prism7',
      'ability:repulse6', 'ability:blink7', 'ability:overclock67'
    ],
    boxes: [
      {
        id: 'box67', name: 'CAIXA 67', icon: '67', price: 670, count: 1,
        desc: 'Uma abertura. Pode conter equipamento sazonal, moedas, XP ou Impulso 67.'
      },
      {
        id: 'vault67', name: 'COFRE 67', icon: '6+7', price: 1967, count: 3,
        desc: 'Três aberturas com desconto. Cada abertura avança a garantia da 7ª caixa.'
      }
    ]
  };
  MA.SEASON = SEASON;

  /* Conteúdo sazonal. Os valores price servem como avaliação de inventário e
     base do mercado; a origem é sempre Caixa 67 ou drop aleatório de chefe. */
  if (!MA.SKINS.some(s => s.id === 'sixtyseven')) {
    MA.SKINS.push({
      id: 'sixtyseven', name: 'Corredor 67', rarity: 'mythic', price: 6700, level: 1,
      desc: 'Herói party-game com touca espacial, traje azul-magenta e energia ciano.',
      face: '67', skinTone: '#e7aa7c', body: 0x6572ff, hood: 0xff4fbd,
      arms: 0x2de2ff, legs: 0x343066, hat: 'none', hatColor: 0xff4fbd,
      aura: 0xff4fbd, extra: 'none', seasonal: true, season: '67', boxOnly: true,
      marketMin: 1670, marketMax: 26700
    });
  }

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

    openBox(id) {
      if (!MA.Profile || !MA.Profile.data) return { error: 'Entre em uma conta para abrir caixas.' };
      if (!this.active()) return { error: 'As Caixas 67 só ficam disponíveis durante a temporada.' };
      const box = this.box(id);
      if (!box) return { error: 'Caixa desconhecida.' };
      if (MA.Profile.data.coins < box.price) return { error: 'Moedas insuficientes.' };

      MA.Profile.addCoins(-box.price);
      const results = [];
      for (let i = 0; i < box.count; i++) results.push(this._roll());
      const p = this.progress();
      p.lastRewards = p.lastRewards.concat(results.map(r => r.log)).slice(-12);
      if (MA.Goals) { MA.Goals.track('buys', 1); MA.Goals.track('inv', 0); }
      MA.Profile.save(true);
      return { ok: true, box, results, progress: p };
    },

    _roll() {
      const p = this.progress();
      p.boxesOpened++;
      const guaranteed = p.pity >= 6;
      const roll = Math.random() * 100;

      /* 18% de item sazonal. Sem item em seis aberturas, a sétima garante
         um dos itens da coleção ainda não possuídos. */
      if (guaranteed || roll < 18) {
        p.pity = 0;
        return this._itemReward(guaranteed, roll);
      }

      p.pity = Math.min(6, p.pity + 1);
      if (roll < 60) {
        const values = [167, 267, 367];
        const amount = values[Math.floor(Math.random() * values.length)];
        MA.Profile.addCoins(amount);
        return { type: 'coins', icon: '🪙', name: amount + ' MOEDAS', amount,
          rarity: 'common', log: '🪙 +' + amount + ' moedas' };
      }
      if (roll < 83) {
        const values = [167, 267, 367, 467];
        const amount = values[Math.floor(Math.random() * values.length)];
        const levels = MA.Profile.addXp(amount);
        return { type: 'xp', icon: '✦', name: amount + ' XP', amount, levels,
          rarity: 'rare', log: '✦ +' + amount + ' XP' };
      }

      const amount = Math.random() < .67 ? 1 : 2;
      p.boosts += amount;
      return {
        type: 'boost', icon: '⚡', name: 'IMPULSO 67 ×' + amount, amount,
        desc: '+67% de moedas e XP nas próximas ' + amount + ' partida' + (amount > 1 ? 's' : '') + '.',
        rarity: 'epic', log: '⚡ Impulso 67 ×' + amount
      };
    },

    _choices() {
      return SEASON.itemKeys.map(key => {
        const parts = key.split(':');
        return { key, type: parts[0], id: parts[1], item: MA.findItem(parts[0], parts[1]) };
      }).filter(choice => choice.item);
    },

    _pickWeighted(pool) {
      const rarityWeight = { common: 67, rare: 34, epic: 17, legendary: 8, mythic: 4 };
      const total = pool.reduce((sum, choice) => sum + (rarityWeight[choice.item.rarity] || 8), 0);
      let roll = Math.random() * total;
      for (let i = 0; i < pool.length; i++) {
        roll -= rarityWeight[pool[i].item.rarity] || 8;
        if (roll <= 0) return pool[i];
      }
      return pool[pool.length - 1];
    },

    _itemReward(guaranteed, roll, source) {
      const choices = this._choices();
      const missing = choices.filter(x => !MA.Profile.owns(x.type, x.id));
      let selected;
      if (guaranteed && missing.length) {
        selected = this._pickWeighted(missing);
      } else {
        /* Dentro dos 18%: 5% skin, 4% armadura, 5% arma e 4% habilidade. */
        const itemRoll = guaranteed ? Math.random() * 18 : Math.max(0, Math.min(17.999, roll));
        const type = itemRoll < 5 ? 'skin' : itemRoll < 9 ? 'armor' : itemRoll < 14 ? 'weapon' : 'ability';
        const pool = choices.filter(choice => choice.type === type);
        selected = this._pickWeighted(pool) || choices[0];
      }

      if (MA.Profile.owns(selected.type, selected.id)) {
        const amount = 67;
        const p = this.progress();
        p.fragments += amount;
        return {
          type: 'fragments', icon: '⬡', name: '67 FRAGMENTOS', amount,
          desc: 'Item repetido convertido. Use 67 fragmentos para abrir uma caixa garantida.',
          rarity: 'legendary', guaranteed,
          log: '⬡ +67 fragmentos (item repetido)'
        };
      }

      MA.Profile.grant(selected.type, selected.id, true);
      return {
        type: 'item', icon: selected.item.icon || selected.item.face || '67',
        name: selected.item.name, item: selected.item, itemType: selected.type,
        rarity: selected.item.rarity || 'legendary', guaranteed,
        desc: source === 'boss' ? 'DROP ALEATÓRIO DE CHEFE' :
          (guaranteed ? 'GARANTIA DA 7ª CAIXA' : 'ITEM EXCLUSIVO DA TEMPORADA'),
        log: '🎁 ' + selected.item.name + (source === 'boss' ? ' (chefe)' : '')
      };
    },

    bossReward() {
      if (!MA.Profile || !MA.Profile.data || !this.active()) return null;
      const p = this.progress();
      p.bossesDefeated++;
      if (Math.random() >= .67) {
        p.fragments += 7;
        const fallback = {
          type: 'fragments', icon: '⬡', name: '7 FRAGMENTOS', amount: 7,
          desc: 'O chefe não deixou um item desta vez. Fragmentos adicionados à Caixa Garantida.',
          rarity: 'rare', log: '⬡ +7 fragmentos (chefe)'
        };
        p.lastRewards = p.lastRewards.concat(fallback.log).slice(-12);
        MA.Profile.save(true);
        return fallback;
      }
      const reward = this._itemReward(false, Math.random() * 18, 'boss');
      p.bossDrops++;
      p.lastRewards = p.lastRewards.concat(reward.log).slice(-12);
      MA.Profile.save(true);
      return reward;
    },

    forge() {
      if (!MA.Profile || !MA.Profile.data) return { error: 'Entre em uma conta primeiro.' };
      const p = this.progress();
      if (p.fragments < 67) return { error: 'Você precisa de 67 fragmentos.' };
      const missing = this._choices().filter(choice => !MA.Profile.owns(choice.type, choice.id));
      if (!missing.length) return { error: 'Você já possui todos os itens da Temporada 67.' };
      /* Fragmentos não entregam um item diretamente: eles abrem uma Caixa 67
         com a mesma garantia da sétima abertura. */
      p.fragments -= 67;
      p.forged++;
      p.boxesOpened++;
      p.pity = 0;
      const reward = this._itemReward(true, Math.random() * 18, 'box');
      p.lastRewards = p.lastRewards.concat(reward.log).slice(-12);
      MA.Profile.save(true);
      return { ok: true, item: reward.item, type: reward.itemType, reward };
    },

    rewardMultiplier() {
      const p = this.progress();
      return p && p.boosts > 0 ? 1.67 : 1;
    },

    consumeBoost() {
      const p = this.progress();
      if (!p || p.boosts <= 0) return false;
      p.boosts--;
      return true;
    }
  };

  MA.Season = Season;
})(window.MA);
