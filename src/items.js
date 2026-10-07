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
     Catálogo jogável integralmente substituído pela família Blocky Characters
     2.0, de Kenney. Os campos de cor abaixo mantêm um fallback procedural caso
     um GLB não carregue; os modelos completos ficam em src/skinmodels.js. */
  MA.SKINS = [
    { id:'rookie', name:'Novato do Lobby', rarity:'common', price:0, level:1, starter:true,
      desc:'Chegou agora, mas já entrou sorrindo e pronto para a primeira partida.',
      face:'🙂', skinTone:'#8f563b', body:0xc83f4c, hood:0x9d293b, arms:0xc83f4c, legs:0x3154a4,
      hat:'none', hatColor:0x000000, aura:0x2de2ff, extra:'none' },

    { id:'gamer', name:'Controle Humano', rarity:'rare', price:1800, level:3,
      desc:'Camiseta de controle, concentração máxima e zero vontade de sair da fila.',
      face:'🎮', skinTone:'#e8b58b', body:0x38a86b, hood:0x26784f, arms:0x38a86b, legs:0x9a6047,
      hat:'none', hatColor:0x000000, aura:0x39ff88, extra:'none' },

    { id:'lumber', name:'Lenhador de Wi-Fi', rarity:'rare', price:2400, level:4,
      desc:'Sobrevive no mato, no lag e em qualquer servidor com uma barra de sinal.',
      face:'🪓', skinTone:'#e0a36e', body:0x9a563c, hood:0x6f3928, arms:0xb9704b, legs:0x2e8b62,
      hat:'none', hatColor:0x000000, aura:0x7be38d, extra:'none' },

    { id:'striker', name:'Camisa 10 do Lobby', rarity:'rare', price:2800, level:5,
      desc:'Entra em campo, dribla o ping e comemora antes da partida começar.',
      face:'⚽', skinTone:'#74442d', body:0x32a86c, hood:0x1f7350, arms:0xf5f5f5, legs:0x3154a4,
      hat:'none', hatColor:0x000000, aura:0x55ff9a, extra:'none' },

    { id:'survivor', name:'Sobrevivente do Spawn', rarity:'rare', price:3500, level:6,
      desc:'Já caiu em mapas piores. A faixa no ombro guarda histórias e munição.',
      face:'🧭', skinTone:'#9b6548', body:0x37936b, hood:0x26654d, arms:0x37936b, legs:0x36455c,
      hat:'none', hatColor:0x000000, aura:0x48d597, extra:'none' },

    { id:'scout', name:'Exploradora do Ping', rarity:'epic', price:4500, level:7,
      desc:'Localiza atalhos, loot e a rota exata para fugir da conexão ruim.',
      face:'🧭', skinTone:'#d99b73', body:0x9b65ff, hood:0x6840b8, arms:0xb584ff, legs:0x8b593e,
      hat:'none', hatColor:0x000000, aura:0x9b65ff, extra:'none' },

    { id:'sheriff', name:'Xerife do Servidor', rarity:'epic', price:5200, level:9,
      desc:'Mantém a ordem no chat e carrega o distintivo mais quadrado da arena.',
      face:'⭐', skinTone:'#e0ae7e', body:0x29477f, hood:0x1d315b, arms:0x29477f, legs:0x27354f,
      hat:'none', hatColor:0x000000, aura:0x2de2ff, extra:'none' },

    { id:'professor', name:'Professor AFK', rarity:'epic', price:6000, level:11,
      desc:'Calculou todas as probabilidades e decidiu esperar parado no lugar certo.',
      face:'🧪', skinTone:'#e7c09a', body:0xdceeff, hood:0xb7d4ef, arms:0xdceeff, legs:0x705240,
      hat:'none', hatColor:0x000000, aura:0xaad4ff, extra:'none' },

    { id:'dojo', name:'Mestre do Dojo', rarity:'epic', price:7200, level:12,
      desc:'Faixa vermelha, pose gelada e disciplina para não culpar o controle.',
      face:'🥋', skinTone:'#f0e7df', body:0x20a56b, hood:0x16754f, arms:0x20a56b, legs:0xf1f1e8,
      hat:'none', hatColor:0x000000, aura:0xff4f6d, extra:'none' },

    { id:'orcceo', name:'Orc Executivo', rarity:'legendary', price:9500, level:15,
      desc:'Transforma caos em planilha e toda derrota em reunião de desempenho.',
      face:'👹', skinTone:'#40a86b', body:0x283b51, hood:0x172536, arms:0x283b51, legs:0x8b593e,
      hat:'none', hatColor:0x000000, aura:0x39ff88, extra:'none' },

    { id:'hunter', name:'Caçador do Lag', rarity:'legendary', price:12000, level:20,
      desc:'Segue rastros de pacote perdido e nunca deixa uma barra vermelha escapar.',
      face:'🎯', skinTone:'#9b6548', body:0x3d8c66, hood:0x2c674c, arms:0x3d8c66, legs:0x3a4659,
      hat:'none', hatColor:0x000000, aura:0xffc42e, extra:'none' },

    { id:'bogorc', name:'Orc do Pântano', rarity:'legendary', price:15000, level:23,
      desc:'Verde, enorme e irritado porque alguém pisou no pântano dele novamente.',
      face:'🧌', skinTone:'#24a96b', body:0x2cb879, hood:0x178051, arms:0x2cb879, legs:0x6c778c,
      hat:'none', hatColor:0x000000, aura:0x39ff88, extra:'none', bulky:true },

    { id:'executive', name:'CEO do Lobby', rarity:'mythic', price:25000, level:30,
      desc:'Terno impecável, gravata vermelha e controle acionário de todas as filas.',
      face:'💼', skinTone:'#805039', body:0x161b27, hood:0x0d111a, arms:0x161b27, legs:0x253050,
      hat:'none', hatColor:0x000000, aura:0xff4f4f, extra:'none' },

    { id:'captain', name:'Capitão do Cubo', rarity:'mythic', price:30000, level:30,
      desc:'Casaco azul, medalhas invisíveis e autoridade máxima sobre cada bloco.',
      face:'🫡', skinTone:'#d99b73', body:0x3f55a8, hood:0x293a7c, arms:0xf4f4ef, legs:0x8b593e,
      hat:'none', hatColor:0x000000, aura:0x6572ff, extra:'none' },

    { id:'crash', name:'Dublê de Respawn', rarity:'mythic', price:6700, level:1,
      desc:'Boneco de impacto certificado para cair, levantar e testar tudo outra vez.',
      face:'⚠️', skinTone:'#ffd14b', body:0xffc42e, hood:0xe49a16, arms:0xffc42e, legs:0x222b39,
      hat:'none', hatColor:0x000000, aura:0xffc42e, extra:'none',
      seasonal:true, season:'67', boxOnly:true, marketMin:1670, marketMax:26700 },

    { id:'mechred', name:'Mecha Rubi', rarity:'rare', price:2600, level:5,
      desc:'Unidade blindada de núcleo vermelho, calibrada para confusão competitiva.',
      face:'🤖', skinTone:'#697386', body:0x657080, hood:0x3f4858, arms:0x657080, legs:0x465064,
      hat:'none', hatColor:0xff405c, aura:0xff405c, extra:'none', metal:true,
      seasonal:true, season:'67', boxOnly:true, marketMin:650, marketMax:10400 },

    { id:'mechviolet', name:'Mecha Violeta', rarity:'epic', price:7700, level:11,
      desc:'Protótipo de núcleo violeta que transforma cada movimento em sinal de perigo.',
      face:'🤖', skinTone:'#697386', body:0x657080, hood:0x3f4858, arms:0x657080, legs:0x465064,
      hat:'none', hatColor:0x9b65ff, aura:0x9b65ff, extra:'none', metal:true,
      seasonal:true, season:'67', boxOnly:true, marketMin:1925, marketMax:46200 },

    { id:'shadow', name:'Ninja Sem Sinal', rarity:'mythic', price:26700, level:27,
      desc:'Some antes do carregamento terminar e reaparece atrás do último adversário.',
      face:'🥷', skinTone:'#d6ad87', body:0x252b38, hood:0x151a23, arms:0x252b38, legs:0x151a23,
      hat:'none', hatColor:0x000000, aura:0xff4f6d, extra:'none',
      seasonal:true, season:'67', boxOnly:true, marketMin:6675, marketMax:267000 }
  ];

  /* Preserva compras e a skin equipada quando um perfil criado com o catálogo
     anterior entra na nova versão. NPCs usam outro catálogo e não passam aqui. */
  MA.SKIN_ID_MIGRATION = Object.freeze({
    chill: 'rookie', hacker: 'gamer', doge: 'lumber', rizzler: 'scout',
    sigma: 'sheriff', clown: 'striker', ghost: 'professor', demon: 'orcceo',
    gigachad: 'hunter', king: 'executive', sixtyseven: 'crash',
    sixorbit: 'mechred', sevenbreak: 'mechviolet', duo67: 'shadow'
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
