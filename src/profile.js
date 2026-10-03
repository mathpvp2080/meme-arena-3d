/* MEME ARENA 3D — perfil do jogador: nível, XP, moedas, inventário, loja */
(function (MA) {
  'use strict';
  const CFG = MA.CONFIG;

  const P = {
    data: null,

    set(profile) {
      this.data = profile;
      this._migrate();
      return this.data;
    },

    _migrate() {
      const d = this.data;
      if (!d) return;
      d.inventory = d.inventory || [];
      d.equipped = d.equipped || {};
      d.equipped.skin = d.equipped.skin || 'chill';
      d.equipped.armor = d.equipped.armor || 'hoodie';
      d.equipped.weapons = d.equipped.weapons || [];
      d.equipped.ability = d.equipped.ability || '';
      d.stats = Object.assign(
        { games: 0, bestScore: 0, totalScore: 0, kills: 0, bosses: 0, bestWave: 0, maxCombo: 1, playtime: 0 },
        d.stats || {});
      if (MA.Season) MA.Season.migrate(d);
      /* todo mundo nasce com a skin e a armadura iniciais */
      MA.SKINS.filter(s => s.starter).forEach(s => this.grant('skin', s.id, true));
      MA.ARMORS.filter(a => a.starter).forEach(a => this.grant('armor', a.id, true));
      d.level = Math.max(1, d.level || 1);
      d.xp = Math.max(0, d.xp || 0);
      d.coins = Math.max(0, Math.floor(d.coins || 0));
    },

    /* ------------------------------------------------------- progressão */
    xpForLevel(lv) { return Math.round(120 * Math.pow(lv, 1.42)); },
    xpToNext() { return this.xpForLevel(this.data.level); },
    xpProgress() { return MA.clamp(this.data.xp / this.xpToNext(), 0, 1); },

    addXp(amount) {
      const d = this.data;
      let levels = 0;
      d.xp += Math.max(0, Math.round(amount));
      while (d.level < CFG.MAX_LEVEL && d.xp >= this.xpForLevel(d.level)) {
        d.xp -= this.xpForLevel(d.level);
        d.level++; levels++;
      }
      if (d.level >= CFG.MAX_LEVEL) d.xp = Math.min(d.xp, this.xpForLevel(CFG.MAX_LEVEL) - 1);
      return levels;
    },

    addCoins(n) { this.data.coins = Math.max(0, Math.floor(this.data.coins + n)); },

    /* --------------------------------------------------------- inventário */
    owns(type, id) { return this.data.inventory.indexOf(MA.itemKey(type, id)) >= 0; },

    grant(type, id, silent) {
      const k = MA.itemKey(type, id);
      if (this.data.inventory.indexOf(k) >= 0) return false;
      this.data.inventory.push(k);
      if (!silent && MA.MetaUI) MA.MetaUI.toast('🎁 Novo item: ' + (MA.findItem(type, id) || {}).name);
      return true;
    },

    revoke(type, id) {
      const i = this.data.inventory.indexOf(MA.itemKey(type, id));
      if (i >= 0) { this.data.inventory.splice(i, 1); return true; }
      return false;
    },

    items() {
      return this.data.inventory.map(k => {
        const [type, id] = k.split(':');
        const def = MA.findItem(type, id);
        return def ? Object.assign({ type }, def) : null;
      }).filter(Boolean);
    },

    /* ---------------------------------------------------------- equipar */
    equip(type, id) {
      if (!this.owns(type, id)) return { error: 'Você não possui esse item.' };
      const def = MA.findItem(type, id);
      if (type === 'weapon') {
        const list = this.data.equipped.weapons;
        const i = list.indexOf(id);
        if (i >= 0) {
          if (list.length <= 1) return { error: 'Você precisa de pelo menos uma arma equipada.' };
          list.splice(i, 1);
          return { ok: true, equipped: false };
        }
        if (list.length >= 3) return { error: 'Máximo de 3 armas equipadas. Desequipe uma antes.' };
        list.push(id);
        return { ok: true, equipped: true };
      }
      this.data.equipped[type] = id;
      return { ok: true, equipped: true, def };
    },

    isEquipped(type, id) {
      if (type === 'weapon') return this.data.equipped.weapons.indexOf(id) >= 0;
      return this.data.equipped[type] === id;
    },

    equippedSkin()  { return MA.findItem('skin',  this.data.equipped.skin)  || MA.SKINS[0]; },
    equippedArmor() { return MA.findItem('armor', this.data.equipped.armor) || MA.ARMORS[0]; },
    equippedAbility() { return MA.findItem('ability', this.data.equipped.ability) || null; },
    equippedWeapons() {
      const ids = this.data.equipped.weapons.filter(id => this.owns('weapon', id));
      return ids.map(id => MA.WEAPONS.findIndex(w => w.id === id)).filter(i => i >= 0);
    },

    /* -------------------------------------------------------------- loja */
    canBuy(item) {
      if (this.owns(item.type, item.id)) return { error: 'Você já tem esse item.' };
      if (item.boxOnly) return { error: 'Item exclusivo das Caixas 67.' };
      if (this.data.level < (item.level || 1)) return { error: 'Precisa ser nível ' + item.level + '.' };
      if (this.data.coins < item.price) return { error: 'Moedas insuficientes.' };
      return { ok: true };
    },

    buy(item) {
      const c = this.canBuy(item);
      if (c.error) return c;
      this.addCoins(-item.price);
      this.grant(item.type, item.id, true);
      if (item.type === 'weapon' && this.data.equipped.weapons.length < 3)
        this.data.equipped.weapons.push(item.id);
      if (item.type === 'ability' && !this.data.equipped.ability)
        this.data.equipped.ability = item.id;
      if (MA.Goals) { MA.Goals.track('buys', 1); MA.Goals.track('inv', 0); }
      this.save();
      return { ok: true };
    },

    sell(item) {
      if (!this.owns(item.type, item.id)) return { error: 'Você não possui esse item.' };
      if (item.starter) return { error: 'Itens iniciais não podem ser vendidos.' };
      if (item.boxOnly) return { error: 'Itens sazonais são revendidos no Mercado com preço definido por você.' };
      if (this.isEquipped(item.type, item.id)) return { error: 'Desequipe o item antes de vender.' };
      const value = Math.round((item.price || 0) * CFG.SELL_RATE);
      this.revoke(item.type, item.id);
      this.addCoins(value);
      this.save();
      return { ok: true, value };
    },

    /* ----------------------------------------------- recompensas da run */
    rewards(g) {
      const diffMul = g.diff ? g.diff.pts : 1;
      const seasonMul = MA.Season ? MA.Season.rewardMultiplier() : 1;
      const coins = Math.round((g.score / 22 + g.kills * 3 + g.wave * 16 + g.bossesKilled * 220) * diffMul * seasonMul);
      const xp    = Math.round((g.score / 14 + g.kills * 4 + g.wave * 26 + g.bossesKilled * 320) * diffMul * seasonMul);
      return { coins, xp, multiplier: seasonMul };
    },

    applyRun(g, seconds) {
      const r = this.rewards(g);
      this.addCoins(r.coins);
      const levels = this.addXp(r.xp);
      if (r.multiplier > 1 && MA.Season) {
        MA.Season.consumeBoost();
        const sp = MA.Season.progress();
        r.boostsRemaining = sp ? sp.boosts : 0;
      }
      const s = this.data.stats;
      s.games++;
      s.totalScore += g.score;
      s.bestScore = Math.max(s.bestScore, g.score);
      s.bestWave = Math.max(s.bestWave, g.wave);
      s.kills += g.kills;
      s.bosses += g.bossesKilled;
      s.maxCombo = Math.max(s.maxCombo, g.maxCombo);
      s.playtime += Math.max(0, Math.round(seconds || 0));
      this.save(true);
      return {
        coins: r.coins, xp: r.xp, levels,
        multiplier: r.multiplier,
        boostsRemaining: r.boostsRemaining || 0
      };
    },

    /* ------------------------------------------------------------ bônus */
    armorBonus() {
      const a = this.equippedArmor();
      return { hp: a.hp || 0, dr: a.dr || 0 };
    },

    canMultiplayer() { return this.data.level >= CFG.MULTIPLAYER_LEVEL; },

    save(immediate) {
      if (!this.data) return;
      return MA.Net.saveProfile(this.data, immediate);
    }
  };

  MA.Profile = P;
})(window.MA);
