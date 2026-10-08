/* MEME ARENA 3D — catálogo de itens: skins, armaduras e preços de armas */
(function (MA) {
  'use strict';

  MA.ITEM_RARITY = {
    common:    { name: 'COMUM',     color: '#9fb3c8' },
    uncommon:  { name: 'INCOMUM',   color: '#2de2ff' },
    legendary: { name: 'LENDÁRIO',  color: '#ffd166' },
    mythical:  { name: 'MÍTICO',    color: '#ff4fbd' },
    ultimate:  { name: 'ULTIMATE',  color: '#ff6b35' },
    secret:    { name: 'SECRETO',   color: '#72ff8b' },
    /* raridades legadas continuam válidas para armas, armaduras e habilidades */
    rare:      { name: 'RARO',      color: '#2de2ff' },
    epic:      { name: 'ÉPICO',     color: '#9b65ff' },
    mythic:    { name: 'MÍTICO',    color: '#ff4fbd' }
  };

  const SKIN_FALLBACKS = [
    ['#f4d06f',0xf4d06f,0x735d2a], ['#89d4ff',0x329bd1,0x174f78],
    ['#f6a6c1',0xd85c8b,0x6b2745], ['#a8ef7a',0x59b83b,0x2f6c22],
    ['#c8a5ff',0x8557cf,0x422675], ['#ff9978',0xdc5937,0x733020]
  ];
  function playableSkin(id, name, rarity, baseValue, sourceId, acquisition, face, desc, extra) {
    const palette = SKIN_FALLBACKS[sourceId % SKIN_FALLBACKS.length];
    const marketValue = Math.round(baseValue * .7);
    return Object.assign({
      id, name, rarity, price:baseValue, baseValue, marketValue,
      marketMin:marketValue, marketMax:marketValue, level:1,
      source:'Polygonal Mind 100 Avatars', sourceId, sourceRound:sourceId <= 100 ? 'R1' : 'R2',
      acquisition, shop:acquisition === 'shop', boxOnly:acquisition !== 'shop',
      desc, face, skinTone:palette[0], body:palette[1], hood:palette[2],
      arms:palette[1], legs:palette[2], hat:'none', hatColor:0, aura:palette[1], extra:'none'
    }, extra || {});
  }

  /* ------------------------------------------------------------- SKINS --
     Manifesto jogável Polygonal Mind R1/R2. Common só entra pela loja do
     sistema. As demais raridades são sorteadas por caixas e/ou chefes. `price`
     é o valor-base; o Mercado usa um preço fixo de 70%, pago integralmente ao
     vendedor. IDs de fonte existem para auditoria e nunca aparecem ao jogador. */
  MA.SKINS = [
    /* COMMON · 0–10.000 · loja do sistema */
    playableSkin('coolfries', 'Cool Fries', 'common', 0, 118, 'shop', '🍟',
      'The arena starter: crispy, confident and completely free.', { starter:true, noSell:true }),
    playableSkin('milk', 'Milk', 'common', 2500, 84, 'shop', '🥛',
      'Calcium, courage and a suspiciously steady aim.'),
    playableSkin('hotdog', 'Hot Dog', 'common', 5000, 87, 'shop', '🌭',
      'A fast snack that refuses to stay on the sidelines.'),
    playableSkin('washingmachine', 'Washing Machine', 'common', 7500, 192, 'shop', '🫧',
      'Ready to spin the lobby and rinse the competition.'),
    playableSkin('fridge', 'Fridge', 'common', 10000, 196, 'shop', '🧊',
      'Cold storage with an even colder victory pose.'),

    /* UNCOMMON · 10.000–25.000 */
    playableSkin('pizza', 'Pizza', 'uncommon', 10000, 103, 'box', '🍕',
      'Fresh from a box and already looking for another one.'),
    playableSkin('taco', 'Taco', 'uncommon', 15000, 162, 'boss', '🌮',
      'Any defeated boss can drop this crunchy contender.'),
    playableSkin('coolramen', 'Cool Ramen', 'uncommon', 20000, 138, 'both', '🍜',
      'Too hot for the shop and too cool for the kitchen.'),
    playableSkin('avocado', 'Avocado', 'uncommon', 25000, 88, 'boss', '🥑',
      'Soft center, hard-earned boss drop.'),

    /* LEGENDARY · 25.000–40.000 */
    playableSkin('sunflower', 'Sunflower', 'legendary', 25000, 104, 'box', '🌻',
      'Turns every arena light into a personal spotlight.'),
    playableSkin('baguette', 'Cool Baguette', 'legendary', 32500, 133, 'boss', '🥖',
      'A legendary loaf with a very sharp sense of timing.'),
    playableSkin('goldfishbag', 'Goldfish Bag', 'legendary', 40000, 105, 'both', '🐠',
      'A portable aquarium with championship ambitions.'),

    /* MYTHICAL · 40.000–60.000 */
    playableSkin('captainlantern', 'Captain Lantern', 'mythical', 40000, 119, 'box', '🏮',
      'Lights a path through the rarest box rolls.'),
    playableSkin('sharkperson', 'Shark Person', 'mythical', 60000, 120, 'boss', '🦈',
      'The boss fight ends; the feeding frenzy begins.'),

    /* ULTIMATE · 60.000–100.000 */
    playableSkin('moongirl', 'Moon Girl', 'ultimate', 60000, 177, 'box', '🌙',
      'A lunar visitor at the beginning of the Ultimate range.'),
    playableSkin('alienskeleton', 'Alien Skeleton', 'ultimate', 100000, 109, 'boss', '☠️',
      'The final Ultimate, recovered from the toughest bosses.'),

    /* SECRET · 100.000–1.000.000 · seleções obrigatórias do usuário */
    playableSkin('robot', 'Robot', 'secret', 100000, 51, 'boss', '🤖',
      'A heavy Polygonal Mind machine hidden in the boss pool.'),
    playableSkin('tallguy', 'Tall Guy', 'secret', 156250, 73, 'box', '🕴️',
      'So tall that the secret is visible from the next arena.'),
    playableSkin('skeletoncostume', 'Skeleton Costume', 'secret', 212500, 29, 'boss', '💀',
      'A classic costume reserved for an exceptionally rare drop.'),
    playableSkin('burnvictim', 'Burn Victim', 'secret', 268750, 66, 'box', '🔥',
      'Walked through the fire and straight into the Secret tier.'),
    playableSkin('chaosbaby', 'Chaos Baby', 'secret', 325000, 26, 'boss', '🍼',
      'Small silhouette, catastrophic arena energy.'),
    playableSkin('o', 'O', 'secret', 381250, 7, 'box', '⭕',
      'One letter. One eye-catching secret.'),
    playableSkin('coolbananaguy', 'Cool Banana Guy', 'secret', 437500, 24, 'box', '🍌',
      'The banana roll was promoted all the way to Secret.'),
    playableSkin('mousemisprint', 'Mouse Misprint', 'secret', 493750, 3, 'boss', '🐭',
      'An original, delightfully wrong mouse from R1.'),
    playableSkin('ramon', 'Ramon', 'secret', 550000, 78, 'box', '🧙',
      'A tiny legend with a name of his own.'),
    playableSkin('littlealienmenace', 'Little Alien Menace', 'secret', 606250, 2, 'boss', '👽',
      'A little visitor with an enormous threat level.'),
    playableSkin('eggplant', 'Eggplant', 'secret', 662500, 90, 'box', '🍆',
      'The produce aisle has never been this exclusive.'),
    playableSkin('cosmicdweller', 'Cosmic Dweller', 'secret', 718750, 124, 'box', '🌌',
      'A resident of somewhere far beyond the drop table.'),
    playableSkin('turtle', 'Turtle', 'secret', 775000, 182, 'boss', '🐢',
      'Slow entrance, almost impossible acquisition.'),
    playableSkin('tnt', 'TNT', 'secret', 831250, 152, 'box', '🧨',
      'A secret box drop with a very short fuse.'),
    playableSkin('coolpolygonalmind', 'Cool Polygonal Mind', 'secret', 887500, 200, 'boss', '🧠',
      'The collection mascot at the top end of the market.'),
    playableSkin('eyefighter', 'Eye Fighter', 'secret', 943750, 168, 'boss', '👁️',
      'Always sees the boss reward coming.'),
    playableSkin('cosmicperson', 'Cosmic Person', 'secret', 1000000, 129, 'box', '✨',
      'The million-coin apex of the Secret catalog.')
  ];

  MA.SKIN_DROP_ODDS = Object.freeze({
    uncommon: 40,
    legendary: 29.5,
    mythical: 20,
    ultimate: 10,
    secret: .5
  });

  /* Preserva compras/equipamento de todos os catálogos anteriores. Cada skin
     removida ganha um substituto jogável; NPCs nunca entram neste registro. */
  MA.SKIN_ID_MIGRATION = Object.freeze({
    chill:'coolfries', hacker:'sunflower', doge:'hotdog', rizzler:'coolramen',
    sigma:'alienskeleton', clown:'milk', ghost:'skeletoncostume', demon:'burnvictim',
    gigachad:'sharkperson', king:'captainlantern', sixtyseven:'cosmicdweller',
    sixorbit:'turtle', sevenbreak:'eyefighter', duo67:'cosmicperson',
    rookie:'coolfries', gamer:'milk', lumber:'hotdog', striker:'pizza', survivor:'taco',
    scout:'coolramen', sheriff:'sunflower', professor:'baguette', dojo:'robot',
    orcceo:'goldfishbag', hunter:'moongirl', bogorc:'littlealienmenace',
    executive:'captainlantern', captain:'sharkperson', crash:'cosmicdweller',
    mechred:'turtle', mechviolet:'eyefighter', shadow:'skeletoncostume',

    cactopraia:'coolfries', galinhacaos:'milk', gatosus:'hotdog', peixefora:'pizza',
    pombocorreio:'taco', cogubug:'coolramen', magogeleia:'sunflower',
    yetibolso:'baguette', coelhomaromba:'goldfishbag', sapopix:'captainlantern',
    alpacarei:'sharkperson', dinocoach:'moongirl', etbombado:'alienskeleton',
    ninjameme:'robot', lulalunar:'tallguy', monstroboleto:'skeletoncostume',
    reicogumelo:'burnvictim', passaropistola:'chaosbaby', dragaocaos:'o',
    cranio:'coolbananaguy', ouricoradio:'cosmicdweller', abelhachefe:'turtle',
    hywirl:'eyefighter', glubturbo:'cosmicperson'
  });

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
      hp:58, dr:.10, color:0x2de2ff, seasonal:true, season:'67', boxOnly:true,
      marketMin:900, marketMax:14400 },
    { id:'prism7', name:'Bastião Prisma 7', rarity:'legendary', price:15700, level:19,
      desc:'Sete placas angulares desviam impacto e acendem uma crista prismática.',
      hp:145, dr:.23, color:0xff4fbd, seasonal:true, season:'67', boxOnly:true,
      marketMin:3925, marketMax:125600 }
  ];

  /* ------------------------------------------- preços/níveis das armas --
     Mescla com MA.WEAPONS (definido em data.js) pelo índice/id.         */
  MA.WEAPON_SHOP = {
    laser:     { price: 450,   level: 1,  rarity:'common', starter:true },
    shot:      { price: 1600,  level: 3,  rarity:'rare' },
    boomerang: { price: 2900,  level: 5,  rarity:'rare', shop:false, boxOnly:true, seasonal:true, season:'67', marketMin:725, marketMax:11600 },
    rpg:       { price: 3800,  level: 6,  rarity:'epic' },
    gravity6:  { price: 6700,  level: 10, rarity:'epic', shop:false, boxOnly:true, seasonal:true, season:'67', marketMin:1675, marketMax:40200 },
    mini:      { price: 7500,  level: 12, rarity:'legendary' },
    prism7:    { price: 12700, level: 17, rarity:'legendary', shop:false, boxOnly:true, seasonal:true, season:'67', marketMin:3175, marketMax:101600 },
    rail:      { price: 14000, level: 18, rarity:'mythic' }
  };

  /* Habilidades equipáveis usam F (ou o botão ✦ no touch). Elas não são
     armas disfarçadas: cada uma altera movimento/área/ritmo de combate. */
  MA.ABILITIES = [
    { id:'repulse6', name:'Repulsão 6', icon:'⑥', rarity:'rare', price:4200, level:6, cooldown:12,
      desc:'Pulso circular causa 46 de dano e empurra inimigos próximos.',
      color:0x2de2ff, shop:false, boxOnly:true, seasonal:true, season:'67', marketMin:1050, marketMax:16800 },
    { id:'blink7', name:'Passo 7', icon:'⑦', rarity:'epic', price:8400, level:11, cooldown:8,
      desc:'Salto instantâneo de 7 metros na direção da mira, com breve invulnerabilidade.',
      color:0xff4fbd, shop:false, boxOnly:true, seasonal:true, season:'67', marketMin:2100, marketMax:50400 },
    { id:'overclock67', name:'Sobrecarga 67', icon:'67', rarity:'legendary', price:18700, level:20, cooldown:24,
      desc:'Durante 6,7 s aumenta cadência, dano e velocidade.',
      color:0x9b65ff, shop:false, boxOnly:true, seasonal:true, season:'67', marketMin:4675, marketMax:149600 }
  ];

  /* Figurinhas são cosméticas: completam o álbum e uma delas aparece como
     distintivo no lobby/perfil. Não liberam mapas, NPCs nem poder de combate. */
  const stickerColor = n => '#' + Number(n || 0x6572ff).toString(16).padStart(6, '0');
  MA.STICKERS = [];
  MA.MAPS.forEach((m, i) => MA.STICKERS.push({
    id: 'map-' + m.id, name: m.name, icon: m.icon, kind: 'map', targetId: m.id,
    rarity: i >= 3 ? 'epic' : i >= 1 ? 'rare' : 'common',
    price: 350 + i * 180, level: 1, noSell: true, color: stickerColor(m.ring),
    desc: 'Figurinha de mapa · coleção e distintivo de perfil.'
  }));
  MA.MEMES.forEach((m, i) => MA.STICKERS.push({
    id: 'npc-' + m.id, name: m.name, icon: m.emoji, kind: 'npc', targetId: m.id,
    rarity: i >= 2 ? 'epic' : 'rare', price: 500 + i * 170, level: 1,
    noSell: true, color: stickerColor(m.color),
    desc: 'Figurinha de NPC · coleção e distintivo de perfil.'
  }));
  MA.BOSSES.forEach((b, i) => MA.STICKERS.push({
    id: 'boss-' + b.id, name: b.name, icon: b.emoji, kind: 'boss', targetId: b.id,
    rarity: i >= 2 ? 'legendary' : 'epic', price: 950 + i * 280, level: 1,
    noSell: true, color: stickerColor(b.ring),
    desc: 'Figurinha de chefe · coleção e distintivo de perfil.'
  }));

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
    MA.STICKERS.forEach(s => out.push(Object.assign({ type: 'sticker' }, s)));
    return out;
  };

  MA.findItem = function (type, id) {
    if (type === 'skin')    return MA.SKINS.find(s => s.id === id);
    if (type === 'armor')   return MA.ARMORS.find(a => a.id === id);
    if (type === 'ability') return MA.ABILITIES.find(a => a.id === id);
    if (type === 'sticker') {
      const s = MA.STICKERS.find(x => x.id === id);
      return s ? Object.assign({ type: 'sticker' }, s) : null;
    }
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
