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
     Elenco jogável do pacote Ultimate Monsters, de Quaternius. A seleção
     mistura famílias de rig e geometrias bem diferentes: animais, plantas,
     monstros voadores, criaturas gelatinosas e personagens absurdos. As cores
     abaixo mantêm um fallback procedural se um GLB não carregar. */
  MA.SKINS = [
    { id:'cactopraia', name:'Cacto de Praia', rarity:'common', price:0, level:1, starter:true,
      desc:'Foi tirar férias no deserto e apareceu de chapéu na arena errada.',
      face:'🌵', skinTone:'#79bd55', body:0x55a947, hood:0x3c7d35, arms:0x6fbd55, legs:0x8b5b36,
      hat:'sombrero', hatColor:0xe5a836, aura:0x8dff63, extra:'none' },

    { id:'galinhacaos', name:'Galinha do Caos', rarity:'common', price:900, level:2,
      desc:'Corre em círculos, bica o perigo e sempre atravessa o mapa na pior hora.',
      face:'🐔', skinTone:'#f5f0d7', body:0xf0eee0, hood:0xd7d2c2, arms:0xf0eee0, legs:0xe09b35,
      hat:'none', hatColor:0, aura:0xffd166, extra:'none' },

    { id:'gatosus', name:'Gato Suspeito', rarity:'rare', price:1600, level:3,
      desc:'Diz que estava fazendo tarefas. Ninguém viu, mas ele parece convincente.',
      face:'😼', skinTone:'#8c6b55', body:0x875f48, hood:0x5e4032, arms:0x875f48, legs:0x654637,
      hat:'none', hatColor:0, aura:0xff9f68, extra:'tail' },

    { id:'peixefora', name:"Peixe Fora d'Água", rarity:'rare', price:2200, level:4,
      desc:'Não sabe como chegou aqui, não sabe respirar aqui e mesmo assim quer vencer.',
      face:'🐟', skinTone:'#38b6c9', body:0x32a7c2, hood:0x21788d, arms:0x32a7c2, legs:0x28657c,
      hat:'none', hatColor:0, aura:0x2de2ff, extra:'tail' },

    { id:'pombocorreio', name:'Pombo-Correio do Wi-Fi', rarity:'rare', price:2800, level:5,
      desc:'Entrega mensagens, farelos e latência baixa em qualquer canto do servidor.',
      face:'🕊️', skinTone:'#738392', body:0x778896, hood:0x53616d, arms:0xaab5bc, legs:0xb94a55,
      hat:'none', hatColor:0, aura:0x8fe8ff, extra:'wings' },

    { id:'cogubug', name:'Cogumelo Bugado', rarity:'rare', price:3400, level:6,
      desc:'Cresceu dentro do código e agora solta esporos toda vez que encontra um bug.',
      face:'🍄', skinTone:'#eadbb7', body:0x9958bd, hood:0xdb595e, arms:0xd8c9a6, legs:0x68417f,
      hat:'mushroom', hatColor:0xe85762, aura:0xd28cff, extra:'none' },

    { id:'magogeleia', name:'Mago de Geleia', rarity:'epic', price:4500, level:7,
      desc:'Conjura feitiços duvidosos e escorrega antes de explicar como funcionam.',
      face:'🧙', skinTone:'#7652a8', body:0x7a51b7, hood:0x402a69, arms:0x916bd1, legs:0x4b3472,
      hat:'wizard', hatColor:0x493071, aura:0xb47cff, extra:'none' },

    { id:'yetibolso', name:'Yeti de Bolso', rarity:'epic', price:5200, level:8,
      desc:'Pequeno no tamanho, enorme na vontade de congelar o lobby inteiro.',
      face:'❄️', skinTone:'#bfeeff', body:0x8fd8ec, hood:0x62aebe, arms:0x8fd8ec, legs:0x5a9aa8,
      hat:'none', hatColor:0, aura:0x7eeeff, extra:'none', bulky:true },

    { id:'coelhomaromba', name:'Coelho Maromba', rarity:'epic', price:6800, level:10,
      desc:'Trocou cenoura por suplemento e nunca mais perdeu o dia de perna.',
      face:'🐰', skinTone:'#e7e6df', body:0xe5e2da, hood:0xbab7b1, arms:0xe5e2da, legs:0x9c9993,
      hat:'ears', hatColor:0xe5e2da, aura:0xff77c8, extra:'none', bulky:true },

    { id:'sapopix', name:'Sapo do Pix', rarity:'epic', price:7600, level:11,
      desc:'Promete multiplicar suas moedas. O comprovante chega depois da partida.',
      face:'🐸', skinTone:'#67b94f', body:0x52ae48, hood:0x347d36, arms:0x52ae48, legs:0x347d36,
      hat:'none', hatColor:0, aura:0x65ff79, extra:'none' },

    { id:'alpacarei', name:'Alpaca Rei', rarity:'epic', price:8500, level:12,
      desc:'Não pediu a coroa; apenas cuspiu em quem tentou tirá-la.',
      face:'🦙', skinTone:'#dfb67b', body:0xd6aa70, hood:0xa67849, arms:0xd6aa70, legs:0x865d3b,
      hat:'crown', hatColor:0xffcf3e, aura:0xffd166, extra:'none' },

    { id:'dinocoach', name:'Dino Coach', rarity:'legendary', price:9500, level:14,
      desc:'Extinto há milhões de anos, mas ainda vende curso de mentalidade jurássica.',
      face:'🦖', skinTone:'#52a668', body:0x42945a, hood:0x28673e, arms:0x42945a, legs:0x315f3c,
      hat:'none', hatColor:0, aura:0x72ff93, extra:'tail', bulky:true },

    { id:'etbombado', name:'ET Bombado', rarity:'legendary', price:10500, level:15,
      desc:'Veio em paz, encontrou uma academia e mudou completamente de plano.',
      face:'👽', skinTone:'#9d62c4', body:0x9256bd, hood:0x633782, arms:0x9256bd, legs:0x56316f,
      hat:'none', hatColor:0, aura:0xca7cff, extra:'none', bulky:true },

    { id:'ninjameme', name:'Ninja do Meme', rarity:'legendary', price:11500, level:17,
      desc:'Some no carregamento e reaparece quando a piada já ficou velha.',
      face:'🥷', skinTone:'#282533', body:0x262331, hood:0x13121a, arms:0x262331, legs:0x15131d,
      hat:'none', hatColor:0, aura:0xff4f6d, extra:'none' },

    { id:'lulalunar', name:'Lula Lunar', rarity:'legendary', price:14500, level:22,
      desc:'Oito braços, zero gravidade e nenhum respeito pelo espaço pessoal.',
      face:'🦑', skinTone:'#8f66cc', body:0x835bc3, hood:0x56398b, arms:0xa879e4, legs:0x56398b,
      hat:'none', hatColor:0, aura:0xc28cff, extra:'tentacles' },

    { id:'monstroboleto', name:'Monstro do Boleto', rarity:'legendary', price:16000, level:23,
      desc:'Aparece todo mês, cresce com juros e nunca aceita ser ignorado.',
      face:'📄', skinTone:'#d06b55', body:0xc65c49, hood:0x833b32, arms:0xc65c49, legs:0x65302a,
      hat:'none', hatColor:0, aura:0xff765f, extra:'none', bulky:true },

    { id:'reicogumelo', name:'Rei Cogumelo', rarity:'legendary', price:18000, level:25,
      desc:'Soberano absoluto do reino úmido atrás do roteador.',
      face:'🍄', skinTone:'#f1ddbd', body:0xc8545c, hood:0x89383f, arms:0xe6d1b1, legs:0x754838,
      hat:'mushroom', hatColor:0xd34e58, aura:0xff8f98, extra:'none', bulky:true },

    { id:'passaropistola', name:'Pássaro Pistola', rarity:'mythic', price:20000, level:26,
      desc:'Acordou com a asa esquerda e decidiu discutir com toda a arena.',
      face:'🐦', skinTone:'#f4c84c', body:0xeebc3f, hood:0xb98228, arms:0xeebc3f, legs:0x9a6329,
      hat:'none', hatColor:0, aura:0xffd94f, extra:'wings' },

    { id:'dragaocaos', name:'Dragão do Caos', rarity:'mythic', price:24000, level:28,
      desc:'Coleciona tesouros, derrotas alheias e abas demais abertas no navegador.',
      face:'🐉', skinTone:'#d24c55', body:0xc63f49, hood:0x852630, arms:0xc63f49, legs:0x70212a,
      hat:'horns', hatColor:0xefe0b6, aura:0xff4f5f, extra:'wings', bulky:true },

    { id:'cranio', name:'Crânio Flutuante', rarity:'mythic', price:28000, level:30,
      desc:'Não tem corpo, não tem medo e definitivamente não tem plano odontológico.',
      face:'💀', skinTone:'#e7dfcc', body:0x393342, hood:0x1f1b27, arms:0x393342, legs:0x1f1b27,
      hat:'none', hatColor:0, aura:0xb58cff, extra:'float' },

    { id:'ouricoradio', name:'Ouriço Radioativo', rarity:'rare', price:4200, level:1,
      desc:'Encostou no servidor errado e agora cada espinho pega cinco barras de sinal.',
      face:'☢️', skinTone:'#76c94f', body:0x62ba43, hood:0x3d7d2d, arms:0x62ba43, legs:0x3d7d2d,
      hat:'spikes', hatColor:0xc6f04c, aura:0xb8ff4a, extra:'none',
      seasonal:true, season:'67', boxOnly:true, marketMin:1050, marketMax:16800 },

    { id:'abelhachefe', name:'Abelha-Chefe', rarity:'epic', price:8700, level:1,
      desc:'Gerencia a colmeia, cobra metas impossíveis e ainda encontra tempo para picar.',
      face:'🐝', skinTone:'#f2bd35', body:0xeab52d, hood:0x2d2932, arms:0xeab52d, legs:0x2d2932,
      hat:'crown', hatColor:0xffd84b, aura:0xffd94f, extra:'wings',
      seasonal:true, season:'67', boxOnly:true, marketMin:2175, marketMax:52200 },

    { id:'hywirl', name:'Hipnose Ambulante', rarity:'legendary', price:17700, level:1,
      desc:'Olhou para o próprio olho por tempo demais e esqueceu qual era o time.',
      face:'🌀', skinTone:'#9b66ce', body:0x8e58c2, hood:0x5d367e, arms:0x8e58c2, legs:0x5d367e,
      hat:'none', hatColor:0, aura:0xdc7cff, extra:'float',
      seasonal:true, season:'67', boxOnly:true, marketMin:4425, marketMax:141600 },

    { id:'glubturbo', name:'Glub Turbo', rarity:'mythic', price:28700, level:1,
      desc:'Uma criatura aerodinâmica, barulhenta e movida por pura energia de chat.',
      face:'👾', skinTone:'#31bdd0', body:0x29aec3, hood:0x18758a, arms:0x29aec3, legs:0x18758a,
      hat:'horns', hatColor:0xd7f36a, aura:0x2de2ff, extra:'float',
      seasonal:true, season:'67', boxOnly:true, marketMin:7175, marketMax:287000 }
  ];

  /* Preserva compras e a skin equipada de perfis dos dois catálogos
     anteriores. NPCs usam outro registro e nunca passam por esta migração. */
  MA.SKIN_ID_MIGRATION = Object.freeze({
    chill:'cactopraia', hacker:'magogeleia', doge:'gatosus', rizzler:'sapopix',
    sigma:'etbombado', clown:'galinhacaos', ghost:'cranio', demon:'dragaocaos',
    gigachad:'coelhomaromba', king:'reicogumelo', sixtyseven:'ouricoradio',
    sixorbit:'abelhachefe', sevenbreak:'hywirl', duo67:'glubturbo',
    rookie:'cactopraia', gamer:'galinhacaos', lumber:'gatosus', striker:'peixefora',
    survivor:'pombocorreio', scout:'cogubug', sheriff:'magogeleia',
    professor:'yetibolso', dojo:'ninjameme', orcceo:'monstroboleto',
    hunter:'dinocoach', bogorc:'glubturbo', executive:'reicogumelo',
    captain:'passaropistola', crash:'ouricoradio', mechred:'abelhachefe',
    mechviolet:'hywirl', shadow:'cranio'
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
