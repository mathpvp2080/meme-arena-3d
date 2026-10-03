/* MEME ARENA 3D — dados de conteúdo: memes, chefes, armas, perks, dificuldades */
(function (MA) {
  'use strict';

  /* ---------------------------------------------------------- inimigos --
     ai: chase | flank | orbit | ranged | charge | teleport | bomber
     tier: a partir de qual onda pode aparecer                              */
  MA.MEMES = [
    { id:'troll',   name:'Trollface',          emoji:'😈', color:'#e8e8e8', ring:'#111111', hp:30,  spd:4.2, dmg:9,  pts:100, ai:'chase',    scale:1.00, tier:1, taunt:'Problem?' },
    { id:'sus',     name:'Amogus',             emoji:'🔺', color:'#ff2d55', ring:'#8b0020', hp:26,  spd:5.4, dmg:11, pts:130, ai:'flank',    scale:0.95, tier:1, taunt:'SUS!' },
    { id:'pepe',    name:'Pepe Raivoso',       emoji:'🐸', color:'#4bd34b', ring:'#1d6b1d', hp:46,  spd:3.4, dmg:14, pts:150, ai:'chase',    scale:1.15, tier:1, taunt:'REEEE' },
    { id:'doge',    name:'Doge Corrompido',    emoji:'🐕', color:'#f2c14e', ring:'#9a6b00', hp:34,  spd:6.0, dmg:8,  pts:140, ai:'orbit',    scale:0.90, tier:2, taunt:'much hostile' },
    { id:'skibidi', name:'Skibidi Toilet',     emoji:'🚽', color:'#dcdcdc', ring:'#5a7fa0', hp:62,  spd:3.0, dmg:16, pts:200, ai:'charge',   scale:1.25, tier:2, taunt:'skibidi dop dop' },
    { id:'rizz',    name:'Rizzler',            emoji:'😏', color:'#7a5bff', ring:'#2d0f8f', hp:40,  spd:4.6, dmg:12, pts:170, ai:'flank',    scale:1.05, tier:2, taunt:'W rizz' },
    { id:'nyan',    name:'Nyan Cat',           emoji:'🌈', color:'#ff7ad9', ring:'#ff0090', hp:22,  spd:7.4, dmg:7,  pts:160, ai:'orbit',    scale:0.85, tier:3, taunt:'nyan nyan nyan' },
    { id:'crash',   name:'Bluescreen',         emoji:'💀', color:'#2a6bff', ring:'#001e66', hp:56,  spd:3.8, dmg:15, pts:190, ai:'ranged',   scale:1.10, tier:3, taunt:'ERROR 0x00' },
    { id:'ohio',    name:'Só Em Ohio',         emoji:'🌽', color:'#ffc42e', ring:'#7a4a00', hp:48,  spd:5.0, dmg:13, pts:210, ai:'teleport', scale:1.00, tier:3, taunt:'only in Ohio' },
    { id:'stonks',  name:'Stonks Man',         emoji:'📈', color:'#9fb3c8', ring:'#2e4a66', hp:74,  spd:2.8, dmg:18, pts:230, ai:'ranged',   scale:1.20, tier:4, taunt:'NOT STONKS' },
    { id:'sigma',   name:'Sigma Grindset',     emoji:'🕶️', color:'#2b2b38', ring:'#00e5ff', hp:70,  spd:5.2, dmg:17, pts:260, ai:'flank',    scale:1.10, tier:4, taunt:'5AM club' },
    { id:'grimace', name:'Grimace Shake',      emoji:'🥤', color:'#8e2dc4', ring:'#4a0073', hp:88,  spd:3.2, dmg:20, pts:270, ai:'charge',   scale:1.30, tier:4, taunt:'drink it' },
    { id:'tralala', name:'Tralalero Tralala',  emoji:'🦈', color:'#3fb9ff', ring:'#0b3f7a', hp:66,  spd:6.2, dmg:16, pts:290, ai:'orbit',    scale:1.10, tier:5, taunt:'tralalero tralala' },
    { id:'tung',    name:'Tung Tung Sahur',    emoji:'🪵', color:'#a9743f', ring:'#4a2a0c', hp:96,  spd:3.6, dmg:22, pts:310, ai:'charge',   scale:1.28, tier:5, taunt:'tung tung tung' },
    { id:'bombard', name:'Bombardiro Croc.',   emoji:'🐊', color:'#5f8f4f', ring:'#23401c', hp:84,  spd:4.0, dmg:21, pts:330, ai:'bomber',   scale:1.22, tier:6, taunt:'bombardiro!' },
    { id:'goofy',   name:'Goofy Ahh NPC',      emoji:'🤪', color:'#ff8a3d', ring:'#9c3b00', hp:58,  spd:6.6, dmg:14, pts:280, ai:'teleport', scale:0.95, tier:6, taunt:'goofy ahh' }
  ];

  MA.BOSSES = [
    { id:'bigskibidi', name:'MEGA SKIBIDI G-MAN', emoji:'🚽', color:'#e6e6e6', ring:'#3d6fa0', hp:900,  spd:3.4, dmg:26, pts:3000,  taunt:'SKIBIDI DOM DOM YES YES' },
    { id:'gigachad',   name:'GIGACHAD SUPREMO',   emoji:'🗿', color:'#b9c4cc', ring:'#333333', hp:1500, spd:4.2, dmg:32, pts:5000,  taunt:'não fale, apenas sinta' },
    { id:'tralaboss',  name:'TRALALERO TRALALA',  emoji:'🦈', color:'#3fb9ff', ring:'#062f5e', hp:2200, spd:5.0, dmg:34, pts:7500,  taunt:'porco dio tralalero' },
    { id:'bombaboss',  name:'BOMBARDIRO CROCODILO', emoji:'🐊', color:'#5f8f4f', ring:'#1b3315', hp:3000, spd:4.4, dmg:38, pts:10000, taunt:'bombardiro crocodilo' },
    { id:'brainrot',   name:'O ALGORITMO',        emoji:'🧠', color:'#ff3ca6', ring:'#6a00ff', hp:4200, spd:5.2, dmg:42, pts:15000, taunt:'ROLE INFINITAMENTE' }
  ];

  /* ------------------------------------------------------------- armas --
     unlock: onda em que a arma é liberada                                  */
  MA.WEAPONS = [
    { id:'laser',  name:'Laser de Doge',     icon:'✨', kind:'laser',  dmg:17, rate:0.105, speed:78, spread:0.012, count:1, color:0xffe600, size:0.22, life:1.6, unlock:1,
      desc:'Automático equilibrado. Cadência alta, dano médio.' },
    { id:'shot',   name:'Shotgun Gigachad',  icon:'💥', kind:'shot',   dmg:14, rate:0.60,  speed:58, spread:0.105, count:9, color:0x00ffd5, size:0.18, life:0.85, unlock:1,
      desc:'9 projéteis. Devastador de pertinho.' },
    { id:'boomerang', name:'Bumerangue do Loop', icon:'🪃', kind:'boomerang', dmg:34, rate:.72, speed:44, spread:0, count:1, color:0x45f0c2, size:.28, life:1.75, pierce:2, returnAt:.62, unlock:2,
      desc:'Arco físico que atravessa alvos, faz a curva e volta para a mão.' },
    { id:'rpg',    name:'Lança-Skibidi',     icon:'🚀', kind:'rocket', dmg:80, rate:1.00,  speed:46, spread:0.0,   count:1, color:0xff2d6f, size:0.40, life:3.0, splash:7.5, unlock:2,
      desc:'Foguete com dano em área e empurrão.' },
    { id:'gravity6', name:'Orbe Gravitacional 6', icon:'🔮', kind:'orb', dmg:62, rate:1.12, speed:32, spread:0, count:1, color:0x6572ff, size:.38, life:1.45, splash:6.2, gravityPull:7, unlock:4,
      desc:'Orbe flutuante que implode ao contato e puxa o grupo para o centro.' },
    { id:'mini',   name:'Minigun Brainrot',  icon:'🧠', kind:'laser',  dmg:9,  rate:0.045, speed:88, spread:0.045, count:1, color:0xff00c8, size:0.16, life:1.3, unlock:4,
      desc:'Cadência insana, precisão duvidosa.' },
    { id:'prism7', name:'Lâmina Prisma 7', icon:'🔷', kind:'prism', dmg:19, rate:.82, speed:82, spread:.14, count:7, color:0xff4fbd, size:.19, life:1.15, pierce:1, unlock:6,
      desc:'Arco-lâmina que libera sete estilhaços prismáticos perfurantes.' },
    { id:'rail',   name:'Railgun Sigma',     icon:'🕶️', kind:'rail',   dmg:150,rate:1.25,  speed:200,spread:0.0,   count:1, color:0x00e5ff, size:0.26, life:1.2, pierce:99, unlock:6,
      desc:'Perfura tudo em linha reta. Alto dano.' }
  ];

  /* -------------------------------------------------------------- perks --
     apply(p) recebe o objeto player/estado                                 */
  MA.PERKS = [
    { id:'dmg',     icon:'📈', name:'STONKS PERMANENTE', desc:'+22% de dano em todas as armas',       rarity:'c', max:6, apply:s => s.mDmg   *= 1.22 },
    { id:'rate',    icon:'⚡', name:'CADÊNCIA DE RIZZ',  desc:'+16% de cadência de tiro',             rarity:'c', max:6, apply:s => s.mRate  *= 0.86 },
    { id:'hp',      icon:'❤️', name:'MAIS HP',           desc:'+30 vida máxima e cura total',         rarity:'c', max:6, apply:s => { s.maxhp += 30; s.hp = s.maxhp; } },
    { id:'speed',   icon:'👟', name:'VELOCIDADE SONIC',  desc:'+13% de velocidade de movimento',      rarity:'c', max:5, apply:s => s.mSpeed *= 1.13 },
    { id:'crit',    icon:'🎯', name:'CRÍTICO',           desc:'+12% de chance de crítico (x2.5)',     rarity:'u', max:5, apply:s => s.crit   += 0.12 },
    { id:'lifest',  icon:'🧛', name:'ROUBO DE VIDA',     desc:'Recupera 3% do dano causado',          rarity:'u', max:4, apply:s => s.lifesteal += 0.03 },
    { id:'multi',   icon:'🔱', name:'TIRO MÚLTIPLO',     desc:'+1 projétil por disparo',              rarity:'r', max:3, apply:s => s.extraShots += 1 },
    { id:'pierce',  icon:'🏹', name:'PERFURANTE',        desc:'Projéteis atravessam +1 inimigo',      rarity:'u', max:4, apply:s => s.pierce += 1 },
    { id:'explode', icon:'💣', name:'MORTE EXPLOSIVA',   desc:'Inimigos explodem ao morrer',          rarity:'r', max:3, apply:s => s.deathBoom += 1 },
    { id:'magnet',  icon:'🧲', name:'ÍMÃ DE ITENS',      desc:'Atrai itens de longe',                 rarity:'c', max:3, apply:s => s.magnet += 9 },
    { id:'dash',    icon:'💨', name:'DASH DUPLO',        desc:'+1 carga de dash e recarga mais rápida',rarity:'u',max:3, apply:s => { s.dashMax += 1; s.enRegen += 6; } },
    { id:'shieldr', icon:'🛡️', name:'ESCUDO REGEN',     desc:'Ganha 1s de escudo a cada 8s',         rarity:'r', max:3, apply:s => s.autoShield += 1 },
    { id:'brain',   icon:'🧠', name:'BRAINROT RÁPIDO',   desc:'+45% de ganho de Brainrot',            rarity:'u', max:4, apply:s => s.brainGain *= 1.45 },
    { id:'drop',    icon:'🎁', name:'SORTE DE DROP',     desc:'+70% de chance de itens',              rarity:'u', max:4, apply:s => s.dropRate *= 1.70 },
    { id:'knock',   icon:'🥊', name:'IMPACTO PESADO',    desc:'+80% de empurrão nos inimigos',        rarity:'c', max:3, apply:s => s.knock  *= 1.80 },
    { id:'armor',   icon:'🦺', name:'PELE DE GIGACHAD',  desc:'-16% de dano recebido',                rarity:'u', max:5, apply:s => s.armor  *= 0.84 },
    { id:'thorns',  icon:'🌵', name:'ESPINHOS',          desc:'Reflete 35% do dano de contato',       rarity:'r', max:3, apply:s => s.thorns += 0.35 },
    { id:'ricochet',icon:'🪃', name:'RICOCHETE',         desc:'Projéteis quicam em paredes 1x',       rarity:'r', max:2, apply:s => s.bounce += 1 },
    { id:'bigbull', icon:'🔵', name:'PROJÉTIL GIGANTE',  desc:'+45% no tamanho e alcance do tiro',    rarity:'c', max:3, apply:s => s.mSize  *= 1.45 },
    { id:'greed',   icon:'💰', name:'GANÂNCIA',          desc:'+30% de pontos ganhos',                rarity:'c', max:5, apply:s => s.mScore *= 1.30 }
  ];

  MA.RARITY = {
    c: { name:'COMUM',  color:'#9fb3c8', w:60 },
    u: { name:'RARO',   color:'#00ffd5', w:30 },
    r: { name:'ÉPICO',  color:'#ff00c8', w:12 }
  };

  /* ------------------------------------------------------------- itens -- */
  MA.PICKUPS = [
    { id:'heal',   emoji:'🥤', color:0x8e2dc4, label:'GRIMACE SHAKE', text:'+35 HP',    w:26 },
    { id:'dmg',    emoji:'📈', color:0x00ff88, label:'STONKS',        text:'DANO x2',   w:18 },
    { id:'speed',  emoji:'😏', color:0x7a5bff, label:'RIZZ',          text:'VELOCIDADE',w:18 },
    { id:'shield', emoji:'🗿', color:0xb9c4cc, label:'GIGACHAD',      text:'ESCUDO',    w:16 },
    { id:'ammo',   emoji:'🔥', color:0xffc42e, label:'OVERDRIVE',     text:'TIRO TURBO',w:14 },
    { id:'nuke',   emoji:'💣', color:0xff2d6f, label:'NUKE DE MEME',  text:'BOOM!',     w:8  }
  ];

  /* -------------------------------------------------------- dificuldade -- */
  MA.DIFFS = [
    { id:'easy',  name:'NORMIE',   icon:'🙂', ehp:0.70, edmg:0.65, espd:0.90, spawn:1.25, pts:0.8,  desc:'Pra curtir a vibe e ver os memes.' },
    { id:'norm',  name:'MEME LORD',icon:'😎', ehp:1.00, edmg:1.00, espd:1.00, spawn:1.00, pts:1.0,  desc:'A experiência balanceada.' },
    { id:'hard',  name:'SIGMA',    icon:'🗿', ehp:1.45, edmg:1.40, espd:1.12, spawn:0.80, pts:1.45, desc:'Pra quem acorda às 5h.' },
    { id:'brain', name:'BRAINROT', icon:'🧠', ehp:2.10, edmg:1.90, espd:1.25, spawn:0.62, pts:2.2,  desc:'Sofrimento puro. Boa sorte.' }
  ];

  MA.TAUNTS = ['NICE!','DELETADO','BANIDO','RATIO','L + BOZO','GG EZ','REKT','CANCELADO','SKILL ISSUE','NO CAP','COOKED','AURA +100','FANUM TAXED','UNSUBSCRIBED'];
  MA.WAVE_LINES = ['o feed tá carregando...','eles vieram do For You','novos NPCs detectados','brainrot incoming','o algoritmo recomendou você','mais conteúdo sem contexto'];

  MA.RANKS = [
    { min:0,      name:'NPC',                  icon:'🤖' },
    { min:2500,   name:'NORMIE',               icon:'🙂' },
    { min:9000,   name:'MEME LORD',            icon:'😎' },
    { min:25000,  name:'SIGMA',                icon:'🗿' },
    { min:60000,  name:'GIGACHAD SUPREMO',     icon:'🏆' },
    { min:140000, name:'O PRÓPRIO ALGORITMO',  icon:'🧠' },
    { min:300000, name:'LENDA DA INTERNET',    icon:'👑' }
  ];
  MA.rankFor = function (score) {
    let r = MA.RANKS[0];
    MA.RANKS.forEach(x => { if (score >= x.min) r = x; });
    return r;
  };
})(window.MA);
