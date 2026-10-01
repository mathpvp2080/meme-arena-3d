/* =====================================================================
   MEME ARENA 3D — mapas

   Cada mapa troca céu, chão, névoa, luzes, obstáculos, cenário de fundo
   e os cartazes. Todos liberam por NÍVEL do jogador.
   ===================================================================== */
(function (MA) {
  'use strict';

  MA.MAPS = [
    {
      id: 'arena', name: 'Arena Brainrot', icon: '🌐', level: 1,
      desc: 'O servidor original. Grade neon, sol retrô e muito roxo.',
      bg: 0x06010f, fog: 0x0d0126, fogD: 0.0125,
      ground: { base: '#0c0322', grid: 'rgba(150,20,255,.85)', fine: 'rgba(0,255,220,.22)', speck: true, repeat: 14 },
      sky: { stops: ['#03010a', '#130228', '#2c0540', '#4a0a46', '#2a0533', '#0a0118'], stars: 500, sun: ['rgba(255,245,150,1)', 'rgba(255,140,190,.85)', 'rgba(190,40,180,.28)'] },
      ring: 0xff00c8, wall: 0x6a00ff, wallEmissive: 0x4400aa,
      ambient: [0x2a1d52, .30], hemi: [0x6a38a8, 0x0d001c, .28], sun3d: [0xffcfa0, 1.15],
      neon: [0xff00c8, 0x00ffd5, 0xffe600, 0x6a5bff, 0xff2d6f],
      obstacle: { style: 'neonbox', palette: [0xff00c8, 0x00ffd5, 0xffe600, 0x6a5bff, 0xff2d6f, 0x39ff88], count: 20 },
      monument: 'likes',
      signs: [['SKIBIDI\nZONE', '#00ffd5'], ['ERRO 404\nCÉREBRO NÃO ENCONTRADO', '#ff2d6f'],
              ['+1000\nSOCIAL CREDIT', '#ffe600'], ['SIGMA\nGRINDSET', '#ff00c8'],
              ['NO CAP\nFR FR ON GOD', '#7a5bff'], ['TOUCH\nGRASS', '#39ff88'],
              ['OHIO\nFINAL BOSS', '#ffc42e'], ['AURA\n-9999', '#3fb9ff']]
    },

    {
      id: 'ohio', name: 'Planície de Ohio', icon: '🌽', level: 4,
      desc: 'Milharal infinito, céu alaranjado e silos. Só acontece em Ohio.',
      bg: 0x1d0f06, fog: 0x3a1c08, fogD: 0.0105,
      ground: { base: '#5c3a14', grid: 'rgba(120,80,30,.6)', fine: 'rgba(200,150,60,.18)', speck: true, repeat: 18 },
      sky: { stops: ['#2b1405', '#6b2a07', '#b4520e', '#e8821f', '#f2a93b', '#3a1c08'], stars: 120, sun: ['rgba(255,236,170,1)', 'rgba(255,170,60,.9)', 'rgba(220,90,20,.3)'] },
      ring: 0xffc42e, wall: 0x8a5a1f, wallEmissive: 0xc98a2a,
      ambient: [0x4a2d12, .42], hemi: [0xffb259, 0x2a1405, .45], sun3d: [0xffd9a0, 1.35],
      neon: [0xffc42e, 0xff8a3d, 0xffe600, 0x9a6b00],
      obstacle: { style: 'silo', palette: [0xc0392b, 0xb9a07a, 0x8a6a3a, 0xd9c79a], count: 16 },
      monument: 'corn',
      props: 'cornfield',
      signs: [['BEM-VINDO\nA OHIO', '#ffc42e'], ['SAÍDA\nNÃO EXISTE', '#ff8a3d'],
              ['MILHO\nILIMITADO', '#ffe600'], ['SITUAÇÃO\nNORMAL', '#ff5a1f'],
              ['NADA DE\nESTRANHO AQUI', '#ffb259'], ['ÚLTIMO POSTO\nPOR 9999 KM', '#ffd9a0']]
    },

    {
      id: 'esgoto', name: 'Esgoto Skibidi', icon: '🚽', level: 9,
      desc: 'Azulejo encardido, canos vazando e vasos por todo lado.',
      bg: 0x04100e, fog: 0x07201c, fogD: 0.019,
      ground: { base: '#1b4f46', grid: 'rgba(220,250,240,.30)', fine: 'rgba(230,255,248,.14)', speck: true, repeat: 26 },
      sky: { stops: ['#02100d', '#04211c', '#063029', '#08403a', '#052a25', '#021310'], stars: 60, sun: ['rgba(180,255,230,.7)', 'rgba(60,200,170,.4)', 'rgba(10,80,70,.2)'] },
      ring: 0x2fe0b8, wall: 0x0f5a4a, wallEmissive: 0x19a88a,
      ambient: [0x1e5a50, .42], hemi: [0x5affd8, 0x04201c, .4], sun3d: [0xdcfff4, 1.05],
      neon: [0x2fe0b8, 0x39ff88, 0x00e5ff, 0x1b7f6a],
      obstacle: { style: 'pipe', palette: [0xcfd8dc, 0x7a8a8f, 0x2fe0b8, 0x4a5f5a], count: 22 },
      monument: 'toilet',
      props: 'drips',
      signs: [['ESGOTO\nMUNICIPAL', '#2fe0b8'], ['NÃO BEBA\nA ÁGUA', '#39ff88'],
              ['SETOR\nSKIBIDI', '#00e5ff'], ['CÂMERA\nVIGIANDO VOCÊ', '#ff2d6f'],
              ['DESCARGA\nOBRIGATÓRIA', '#cfd8dc'], ['NÍVEL -3', '#2fe0b8']]
    },

    {
      id: 'praia', name: 'Praia Italiana', icon: '🦈', level: 15,
      desc: 'Areia clara, mar azul e tubarões de tênis. Tralalero tralala.',
      bg: 0x0a2a4a, fog: 0x1f6fa8, fogD: 0.0088,
      ground: { base: '#c9a56a', grid: 'rgba(150,115,60,.45)', fine: 'rgba(255,240,200,.12)', speck: true, repeat: 20 },
      sky: { stops: ['#0a2a4a', '#1464a0', '#36a7d8', '#8fd8f0', '#ffd9a0', '#1f6fa8'], stars: 0, sun: ['rgba(255,255,220,1)', 'rgba(255,220,120,.9)', 'rgba(255,160,60,.25)'] },
      ring: 0x00bcd4, wall: 0x1f8fd0, wallEmissive: 0x49c8f0,
      ambient: [0x4a7fa0, .30], hemi: [0x8fd0f0, 0xa88a52, .34], sun3d: [0xfff0c8, 1.15],
      neon: [0x00e5ff, 0xffe600, 0xff7ad9, 0x39ff88],
      obstacle: { style: 'umbrella', palette: [0xff2d6f, 0xffe600, 0x00bcd4, 0xffffff], count: 18 },
      monument: 'shark',
      props: 'palms',
      signs: [['SPIAGGIA\nLIBERA', '#00e5ff'], ['TRALALERO\nTRALALA', '#ffe600'],
              ['PERIGO\nTUBARÕES DE TÊNIS', '#ff2d6f'], ['GELATO\n€0,99', '#ff7ad9'],
              ['NÃO MERGULHE\nAQUI', '#ffffff'], ['BOMBARDIRO\nPASSOU POR AQUI', '#39ff88']]
    },

    {
      id: 'servidor', name: 'Servidor do Algoritmo', icon: '🧠', level: 22,
      desc: 'Dentro da máquina: racks infinitos, cabos e telas rolando sozinhas.',
      bg: 0x05000d, fog: 0x12002a, fogD: 0.0165,
      ground: { base: '#0a0a14', grid: 'rgba(0,229,255,.55)', fine: 'rgba(255,0,200,.18)', speck: false, repeat: 26 },
      sky: { stops: ['#03000a', '#0a0020', '#180040', '#2a0060', '#120030', '#05000d'], stars: 900, sun: ['rgba(255,60,200,.9)', 'rgba(120,0,255,.6)', 'rgba(40,0,90,.3)'] },
      ring: 0x00e5ff, wall: 0x2a0060, wallEmissive: 0x6a00ff,
      ambient: [0x2a1060, .45], hemi: [0x6a3ad8, 0x0a0220, .5], sun3d: [0xe6dcff, 1.25],
      neon: [0x00e5ff, 0xff00c8, 0x39ff88, 0xffe600, 0x6a5bff],
      obstacle: { style: 'rack', palette: [0x00e5ff, 0xff00c8, 0x39ff88, 0x6a5bff], count: 24 },
      monument: 'core',
      props: 'cables',
      signs: [['DATACENTER\nSETOR 7', '#00e5ff'], ['NÃO DESLIGUE\nO ALGORITMO', '#ff00c8'],
              ['ENGAJAMENTO\n+999%', '#39ff88'], ['ROLE\nINFINITAMENTE', '#ffe600'],
              ['CPU 100%\nSEMPRE', '#6a5bff'], ['VOCÊ É\nO PRODUTO', '#ff2d6f']]
    }
  ];

  MA.mapById = function (id) {
    return MA.MAPS.find(m => m.id === id) || MA.MAPS[0];
  };
  MA.mapUnlocked = function (map, level) {
    return level >= (map.level || 1);
  };
})(window.MA);
