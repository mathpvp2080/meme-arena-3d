/* MEME ARENA 3D — catálogo de itens: skins, armaduras e preços de armas */
(function (MA) {
  'use strict';

  MA.ITEM_RARITY = {
    common:    { name: 'COMUM',     color: '#9fb3c8' },
    rare:      { name: 'RARO',      color: '#2de2ff' },
    epic:      { name: 'ÉPICO',     color: '#9b65ff' },
    legendary: { name: 'LENDÁRIO',  color: '#ffd166' },
    mythic:    { name: 'MÍTICO',    color: '#ff4fbd' }
  };

  /* ------------------------------------------------------------- SKINS --
     Cada skin descreve como o boneco do jogador é montado em 3D.
     hat: none | cap | crown | halo | horns | bucket
     extra: none | cape | wings | jetpack | scarf                        */
  MA.SKINS = [
    { id:'chill', name:'Chill Guy', rarity:'common', price:0, level:1, starter:true,
      desc:'O clássico. Moletom azul, boné rosa e zero preocupações.',
      face:'😎', skinTone:'#efba88', body:0x6273dc, hood:0x4858b3, arms:0x7587e8, legs:0x393b72,
      hat:'cap', hatColor:0xff5bbf, aura:0x2de2ff, extra:'none' },

    { id:'hacker', name:'Hacker Anônimo', rarity:'rare', price:1800, level:3,
      desc:'Moletom preto, código verde escorrendo. "Estou dentro."',
      face:'🕶️', skinTone:'#cfd8e3', body:0x12161c, hood:0x0b0e12, arms:0x1a2029, legs:0x0e1116,
      hat:'none', hatColor:0x000000, aura:0x39ff88, extra:'scarf', extraColor:0x39ff88 },

    { id:'doge', name:'Doge Dourado', rarity:'rare', price:2400, level:4,
      desc:'Much style. Very wow. Such shiba.',
      face:'🐕', skinTone:'#f2c14e', body:0xd9a441, hood:0xb3832b, arms:0xe8b85c, legs:0x8a6520,
      hat:'none', hatColor:0x000000, aura:0xffe600, extra:'none' },

    { id:'rizzler', name:'Rizzler', rarity:'epic', price:4500, level:7,
      desc:'Carisma em nível industrial. Sobrancelha permanentemente erguida.',
      face:'😏', skinTone:'#e8b07a', body:0x5a3fd6, hood:0x3d2a9e, arms:0x6f55e8, legs:0x2b1d6e,
      hat:'none', hatColor:0x7a5bff, aura:0x7a5bff, extra:'cape', extraColor:0x4a2fc0 },

    { id:'sigma', name:'Sigma Grindset', rarity:'epic', price:5200, level:9,
      desc:'Acorda às 4h59. Banho gelado. Não fala com NPCs.',
      face:'🗿', skinTone:'#b9c4cc', body:0x1d2129, hood:0x12151a, arms:0x272c36, legs:0x0f1216,
      hat:'none', hatColor:0x000000, aura:0x00e5ff, extra:'cape', extraColor:0x0a0d12 },

    { id:'clown', name:'Palhaço do Lobby', rarity:'rare', price:2800, level:5,
      desc:'Honk honk. Pra quem joga mal mas com estilo.',
      face:'🤡', skinTone:'#ffe3d6', body:0xff3b5c, hood:0xffd400, arms:0x3bc9ff, legs:0x9b4dff,
      hat:'bucket', hatColor:0x39ff88, aura:0xff3b5c, extra:'none' },

    { id:'ghost', name:'Fantasma do Chat', rarity:'epic', price:6000, level:11,
      desc:'Vê tudo, nunca comenta. Levemente translúcido.',
      face:'👻', skinTone:'#eaf2ff', body:0xdfe9ff, hood:0xc4d3f0, arms:0xeaf2ff, legs:0xc4d3f0,
      hat:'halo', hatColor:0xffffff, aura:0xaad4ff, extra:'none', ghost:true },

    { id:'demon', name:'Demônio do Ratio', rarity:'legendary', price:9500, level:15,
      desc:'Aparece quando você perde uma discussão na internet.',
      face:'😈', skinTone:'#b8324f', body:0x5a0d1c, hood:0x3a0512, arms:0x7d1428, legs:0x2a0309,
      hat:'horns', hatColor:0x2a0309, aura:0xff2d6f, extra:'wings', extraColor:0x3a0512 },

    { id:'gigachad', name:'Gigachad', rarity:'legendary', price:12000, level:20,
      desc:'Mandíbula capaz de cortar vidro. Não fala, apenas existe.',
      face:'🗿', skinTone:'#cdd6dd', body:0x9aa6b0, hood:0x78848e, arms:0xb6c0c8, legs:0x5f6a73,
      hat:'none', hatColor:0x000000, aura:0xffffff, extra:'none', bulky:true },

    { id:'king', name:'Rei do Brainrot', rarity:'mythic', price:25000, level:30,
      desc:'A skin final. Ouro, coroa e capa. Você venceu a internet.',
      face:'👑', skinTone:'#ffd98a', body:0xd4a017, hood:0xb8860b, arms:0xffd700, legs:0x8a6508,
      hat:'crown', hatColor:0xffd700, aura:0xffc42e, extra:'cape', extraColor:0xb8860b, metal:true },

    { id:'sixorbit', name:'Seis em Órbita', rarity:'rare', price:2600, level:5,
      desc:'A opção acessível da coleção: piloto ciano com órbita assimétrica em forma de 6.',
      face:'6', skinTone:'#e9ae7d', body:0x327fda, hood:0x174a91, arms:0x4da9ee, legs:0x173760,
      hat:'none', hatColor:0x2de2ff, aura:0x2de2ff, extra:'none', seasonal:true, season:'67',
      marketMin:650, marketMax:10400 },

    { id:'sevenbreak', name:'Sete Quebra-Loop', rarity:'epic', price:7700, level:11,
      desc:'Corredora violeta com viseira angular, faixa diagonal e energia em sete pontas.',
      face:'7', skinTone:'#d89b76', body:0x713ed4, hood:0x3d1e87, arms:0x9b65ff, legs:0x25194d,
      hat:'none', hatColor:0xff4fbd, aura:0xff4fbd, extra:'none', seasonal:true, season:'67',
      marketMin:1925, marketMax:46200 },

    { id:'duo67', name:'Fusão 67', rarity:'mythic', price:26700, level:27,
      desc:'Duas frequências na mesma skin: lado 6 orbital, lado 7 prismático e núcleo sincronizado.',
      face:'67', skinTone:'#edb184', body:0x29316f, hood:0x151a43, arms:0x6572ff, legs:0x171a3f,
      hat:'none', hatColor:0xf5f7ff, aura:0x9b65ff, extra:'none', seasonal:true, season:'67', metal:true,
      marketMin:6675, marketMax:267000 }
  ];

  /* --------------------------------------------------------- ARMADURAS -- */
  MA.ARMORS = [
    { id:'hoodie', name:'Moletom Básico', rarity:'common', price:0, level:1, starter:true,
      desc:'É só um moletom. Mas é confortável.', hp:0, dr:0, color:0x6273dc },
    { id:'cardboard', name:'Colete de Papelão', rarity:'common', price:900, level:2,
      desc:'Surpreendentemente eficaz contra memes de baixa resolução.', hp:25, dr:.04, color:0xb98a4a },
    { id:'pixel', name:'Armadura de Pixel', rarity:'rare', price:2600, level:5,
      desc:'Renderizada em 8 bits. Blocos protegem blocos.', hp:50, dr:.09, color:0x3bc9ff },
    { id:'neon', name:'Exoesqueleto Neon', rarity:'epic', price:6200, level:10,
      desc:'Brilha no escuro e absorve dano de cringe.', hp:85, dr:.15, color:0xff00c8 },
    { id:'sigma', name:'Placa Sigma', rarity:'legendary', price:11000, level:17,
      desc:'Forjada em disciplina e banho gelado.', hp:130, dr:.21, color:0x9aa6b0 },
    { id:'chadplate', name:'Casca de Gigachad', rarity:'mythic', price:22000, level:26,
      desc:'Não é armadura. É só o peitoral dele.', hp:190, dr:.28, color:0xffd700 },
    { id:'orbit6', name:'Colete Órbita 6', rarity:'rare', price:3600, level:6,
      desc:'Anel amortecedor lateral e placas leves: proteção móvel sem virar uma caixa.',
      hp:58, dr:.10, color:0x2de2ff, seasonal:true, season:'67',
      marketMin:900, marketMax:14400 },
    { id:'prism7', name:'Bastião Prisma 7', rarity:'legendary', price:15700, level:19,
      desc:'Sete placas angulares desviam impacto e acendem uma crista prismática.',
      hp:145, dr:.23, color:0xff4fbd, seasonal:true, season:'67',
      marketMin:3925, marketMax:125600 }
  ];

  /* ------------------------------------------- preços/níveis das armas --
     Mescla com MA.WEAPONS (definido em data.js) pelo índice/id.         */
  MA.WEAPON_SHOP = {
    laser:     { price: 450,   level: 1,  rarity:'common', starter:true },
    shot:      { price: 1600,  level: 3,  rarity:'rare' },
    boomerang: { price: 2900,  level: 5,  rarity:'rare', marketMin:725, marketMax:11600 },
    rpg:       { price: 3800,  level: 6,  rarity:'epic' },
    gravity6:  { price: 6700,  level: 10, rarity:'epic', marketMin:1675, marketMax:40200 },
    mini:      { price: 7500,  level: 12, rarity:'legendary' },
    prism7:    { price: 12700, level: 17, rarity:'legendary', marketMin:3175, marketMax:101600 },
    rail:      { price: 14000, level: 18, rarity:'mythic' }
  };

  /* Habilidades equipáveis usam F (ou o botão ✦ no touch). Elas não são
     armas disfarçadas: cada uma altera movimento/área/ritmo de combate. */
  MA.ABILITIES = [
    { id:'repulse6', name:'Repulsão 6', icon:'⑥', rarity:'rare', price:3600, level:6, cooldown:12,
      desc:'Pulso circular causa 46 de dano e empurra inimigos próximos.',
      color:0x2de2ff, marketMin:900, marketMax:14400 },
    { id:'blink7', name:'Passo 7', icon:'⑦', rarity:'epic', price:7700, level:11, cooldown:8,
      desc:'Salto instantâneo de 7 metros na direção da mira, com breve invulnerabilidade.',
      color:0xff4fbd, marketMin:1925, marketMax:46200 },
    { id:'overclock67', name:'Sobrecarga 67', icon:'67', rarity:'legendary', price:16700, level:20, cooldown:24,
      desc:'Durante 6,7 s aumenta cadência, dano e velocidade.',
      color:0x9b65ff, marketMin:4175, marketMax:133600 }
  ];

  /* catálogo unificado usado pela loja e pelo inventário */
  MA.catalog = function () {
    const out = [];
    MA.SKINS.forEach(s => out.push(Object.assign({ type: 'skin' }, s)));
    MA.ARMORS.forEach(a => out.push(Object.assign({ type: 'armor' }, a)));
    MA.WEAPONS.forEach(w => {
      const m = MA.WEAPON_SHOP[w.id] || { price: 1000, level: 1, rarity: 'common' };
      out.push(Object.assign({
        type: 'weapon', id: w.id, name: w.name, icon: w.icon, desc: w.desc
      }, m, { starter: !!m.starter }));
    });
    MA.ABILITIES.forEach(a => out.push(Object.assign({ type: 'ability' }, a)));
    return out;
  };

  MA.findItem = function (type, id) {
    if (type === 'skin')    return MA.SKINS.find(s => s.id === id);
    if (type === 'armor')   return MA.ARMORS.find(a => a.id === id);
    if (type === 'ability') return MA.ABILITIES.find(a => a.id === id);
    if (type === 'weapon') {
      const w = MA.WEAPONS.find(x => x.id === id);
      if (!w) return null;
      const m = MA.WEAPON_SHOP[id] || {};
      return Object.assign({}, w, m, { type: 'weapon' });
    }
    return null;
  };

  /* Cada item tem a sua própria faixa de revenda. Itens sazonais declaram
     limites explícitos; o catálogo permanente deriva a faixa do valor e da
     raridade. O servidor repete os mesmos limites antes de aceitar o anúncio. */
  MA.marketPriceBounds = function (item) {
    if (!item) return { min: 10, max: 1000 };
    if (item.marketMin !== undefined && item.marketMax !== undefined) {
      return { min: Math.max(10, item.marketMin | 0), max: Math.max(item.marketMin | 0, item.marketMax | 0) };
    }
    const base = Math.max(100, item.price || 100);
    const mult = { common: 3, rare: 4, epic: 6, legendary: 8, mythic: 10 }[item.rarity] || 3;
    return {
      min: Math.max(10, Math.round(base * .25)),
      max: Math.max(100, Math.round(base * mult))
    };
  };

  MA.itemKey = (type, id) => type + ':' + id;
})(window.MA);
