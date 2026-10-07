#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const failures = [];
const check = (name, fn) => {
  try { fn(); console.log('✓', name); }
  catch (error) { failures.push([name, error]); console.error('✗', name, '-', error.message); }
};
const run = (rel, context) => vm.runInContext(read(rel), context, { filename: rel });

const contentWindow = { MA: {} };
const contentContext = vm.createContext({ window: contentWindow, console, Date, Math, setTimeout, clearTimeout });
run('src/data.js', contentContext);
run('src/maps.js', contentContext);
run('src/items.js', contentContext);
run('src/season.js', contentContext);
run('src/goals.js', contentContext);
const MA = contentWindow.MA;

check('catálogo mantém 14 skins, 9 armaduras, 9 armas e 3 habilidades', () => {
  assert.equal(MA.SKINS.length, 14);
  assert.equal(MA.ARMORS.length, 9);
  assert.equal(MA.WEAPONS.length, 9);
  assert.equal(MA.ABILITIES.length, 3);
});
check('mapas aleatórios incluem a Cidade do Caos somente no competitivo', () => {
  assert.equal(MA.MAPS.length, 6);
  const city = MA.mapById('cidade');
  assert.deepEqual(Array.from(city.modes), ['pvp', 'pvpve']);
  assert.ok(!MA.mapsForMode('solo').some(m => m.id === 'cidade'));
  assert.ok(MA.mapsForMode('pvp').some(m => m.id === 'cidade'));
  assert.equal(MA.MAPS.every(m => MA.mapUnlocked(m, 1)), true, 'mapa ainda bloqueado por nível');
});
check('álbum cobre todos os mapas, NPCs e chefes sem bônus de combate', () => {
  assert.equal(MA.STICKERS.length, MA.MAPS.length + MA.MEMES.length + MA.BOSSES.length);
  assert.equal(MA.STICKERS.filter(s => s.kind === 'map').length, MA.MAPS.length);
  assert.equal(MA.STICKERS.filter(s => s.kind === 'npc').length, MA.MEMES.length);
  assert.equal(MA.STICKERS.filter(s => s.kind === 'boss').length, MA.BOSSES.length);
  for (const sticker of MA.STICKERS) {
    assert.equal(sticker.noSell, true);
    for (const key of ['hp', 'dr', 'dmg', 'speed', 'armor']) assert.equal(sticker[key], undefined, `${sticker.id} altera ${key}`);
    assert.ok(MA.findItem('sticker', sticker.id), `figurinha ausente no catálogo: ${sticker.id}`);
  }
});
check('IDs são únicos dentro de cada categoria', () => {
  for (const [name, list] of Object.entries({ skins: MA.SKINS, armors: MA.ARMORS, weapons: MA.WEAPONS, abilities: MA.ABILITIES, stickers: MA.STICKERS, memes: MA.MEMES, bosses: MA.BOSSES })) {
    assert.equal(new Set(list.map(x => x.id)).size, list.length, `IDs duplicados em ${name}`);
  }
});
check('elenco ativo contém somente os quatro NPCs e suas versões chefes', () => {
  assert.equal(MA.MEMES.map(x => x.id).join(','), 'doge,tralala,tung,bombard');
  assert.equal(MA.BOSSES.map(x => x.id).join(','), 'dogeboss,tralaboss,tungboss,bombaboss');
  assert.equal(MA.MEMES.map(x => x.tier).join(','), '1,2,3,4');
});
check('quatro chefes se alternam e escalam a cada nova rotação', () => {
  const encounters = [5, 10, 15, 20, 25, 30, 35, 40, 45].map(MA.bossEncounter);
  assert.equal(encounters.map(x => x.def && x.def.id).join(','),
    'dogeboss,tralaboss,tungboss,bombaboss,dogeboss,tralaboss,tungboss,bombaboss,dogeboss');
  assert.equal(encounters.map(x => x.extra).join(','), '0,0,0,0,1,1,1,1,2');
  assert.match(read('src/game.js'), /MA\.bossEncounter\(n\)/, 'jogo não usa o seletor validado');
});
check('pool sazonal tem 14 referências válidas e exclusivas de caixa', () => {
  assert.equal(MA.SEASON.itemKeys.length, 14);
  for (const key of MA.SEASON.itemKeys) {
    const [type, id] = key.split(':');
    const item = MA.findItem(type, id);
    assert.ok(item, `item sazonal ausente: ${key}`);
    assert.equal(item.boxOnly, true, `${key} deveria ser boxOnly`);
  }
});
check('recompensas de conquistas apontam para itens existentes', () => {
  for (const achievement of MA.Goals.ACHIEVEMENTS) {
    if (achievement.item) assert.ok(MA.findItem(achievement.item.type, achievement.item.id), `${achievement.id} → item inválido`);
  }
  assert.ok(!read('src/goals.js').includes("id: 'bfg'"), 'weapon:bfg ainda referenciada');
});
check('probabilidades da Caixa 67 totalizam 100%', () => {
  const sum = Object.values(MA.SEASON.odds).reduce((a, b) => a + b, 0);
  assert.equal(sum, 100);
});

// Exercita a garantia local: seis rolagens sem item tornam a sétima sazonal.
const rollProfile = {
  data: { coins: 20000, level: 1, xp: 0, inventory: ['skin:chill','armor:hoodie'], stats: {} },
  addCoins(n) { this.data.coins += n; }, addXp() { return 0; },
  owns(type, id) { return this.data.inventory.includes(`${type}:${id}`); },
  grant(type, id) { this.data.inventory.push(`${type}:${id}`); },
  save: async () => ({ ok: true })
};
MA.Profile = rollProfile; MA.Net = { online: false }; MA.Goals = null;
MA.Season.active = () => true;
const originalRandom = Math.random;
Math.random = () => 0.5;
const sevenBoxes = [];
for (let i = 0; i < 7; i++) {
  const result = await MA.Season.openBox('box67');
  sevenBoxes.push({ result, pity: result.progress.pity });
}
Math.random = originalRandom;
check('garantia local entrega item na sétima caixa sem drop', () => {
  assert.equal(sevenBoxes[5].pity, 6);
  assert.equal(sevenBoxes[6].result.results[0].type, 'item');
  assert.equal(sevenBoxes[6].result.results[0].guaranteed, true);
  assert.equal(MA.Season.progress().pity, 0);
});

const index = read('index.html');
check('todos os assets locais do HTML existem', () => {
  const refs = [...index.matchAll(/(?:src|href)="([^"#?]+)(?:\?[^"#]*)?"/g)].map(m => m[1]);
  for (const ref of refs) {
    if (/^(?:https?:|data:|mailto:)/.test(ref) || ref === './') continue;
    assert.ok(fs.existsSync(path.join(root, ref)), `arquivo ausente: ${ref}`);
  }
});
check('JOGAR roteia Solo, Coop e equipes com capacidades válidas', () => {
  const meta = read('src/metaui.js');
  const multi = read('src/multi.js');
  const schema = read('supabase/schema_multiplayer.sql');
  assert.match(index, /id="playmode"/);
  for (const id of ['soloModeBtn', 'coopModeBtn', 'pvpModeBtn']) assert.match(index, new RegExp(`id="${id}"`));
  for (const mode of ['data-mode="coop"', 'data-mode="pvp"', 'data-mode="pvpve"']) assert.ok(index.includes(mode), `modo ausente: ${mode}`);
  assert.match(meta, /MA\._startSoloAuto\(\)/);
  assert.match(multi, /return competitive\(mode \|\| this\.mode\) \? 12 : 6/);
  assert.match(multi, /t\.pink >= 2 && t\.cyan >= 2/);
  assert.match(schema, /mode in \('coop','pvp','pvpve'\)/);
  assert.match(schema, /players between 1 and 12/);
});
check('dificuldade automática usa nível, tamanho do Coop e ameaça PvPvE', () => {
  const game = read('src/game.js');
  assert.equal(MA.diffForLevel(1).id, 'easy');
  assert.equal(MA.diffForLevel(20).id, 'hard');
  assert.ok(MA.coopDiff(6).ehp > MA.coopDiff(2).ehp);
  assert.match(game, /G\.npcThreatKills \/ 10/);
  assert.match(game, /player\.hp = player\.maxhp = 140/);
  assert.match(game, /player\.allowedWeapons = \[0\]/);
});
check('modelos 3D registrados apontam para arquivos existentes', () => {
  run('src/skinmodels.js', contentContext);
  const specs = [];
  for (const [id, spec] of Object.entries(MA.SKIN_MODELS || {})) {
    assert.ok(MA.SKINS.some(s => s.id === id), `MA.SKIN_MODELS: skin inexistente "${id}"`);
    specs.push([`skin:${id}`, spec]);
  }
  for (const skin of MA.SKINS) if (skin.model) specs.push([`skin:${skin.id}`, skin.model]);
  const enemyDefs = [...MA.MEMES, ...MA.BOSSES];
  for (const [id, spec] of Object.entries(MA.ENEMY_MODELS || {})) {
    assert.ok(enemyDefs.some(def => def.id === id), `MA.ENEMY_MODELS: NPC inexistente "${id}"`);
    specs.push([`npc:${id}`, spec]);
  }
  for (const [id, raw] of specs) {
    const spec = typeof raw === 'string' ? { url: raw } : raw;
    assert.ok(spec && spec.url, `${id}: modelo sem url`);
    assert.match(spec.url, /\.(glb|gltf)$/i, `${id}: use .glb ou .gltf (${spec.url})`);
    const modelPath = path.join(root, spec.url);
    assert.ok(fs.existsSync(modelPath), `${id}: arquivo ausente ${spec.url}`);
    if (spec.mode === 'part') assert.ok(['head', 'hat', 'body', 'back', 'handL', 'handR', 'gun'].includes(spec.anchor || 'head'), `${id}: anchor inválido`);
    assert.ok(!spec.url.startsWith('http'), `${id}: hospede o modelo no projeto (CSP só permite 'self')`);
    if (/\.glb$/i.test(spec.url)) {
      const glb = fs.readFileSync(modelPath);
      assert.ok(glb.length >= 12, `${id}: arquivo GLB truncado`);
      assert.equal(glb.toString('ascii', 0, 4), 'glTF', `${id}: cabeçalho GLB inválido`);
      assert.equal(glb.readUInt32LE(4), 2, `${id}: o jogo requer GLB versão 2`);
      assert.equal(glb.readUInt32LE(8), glb.length, `${id}: tamanho declarado do GLB é inválido`);
    }
  }
});
check('DOGE usa o modelo customizado com escala e frente alinhadas', () => {
  const spec = MA.SKIN_MODELS && MA.SKIN_MODELS.doge;
  assert.ok(spec, 'registro da skin DOGE ausente');
  assert.equal(spec.url, 'assets/skins/doge.glb');
  assert.equal(spec.mode, 'part');
  assert.equal(spec.anchor, 'head');
  assert.ok(spec.size > 0, 'DOGE sem escala ajustada');
  assert.equal(spec.rotY, -Math.PI / 2, 'DOGE não está voltado para -Z');
  assert.equal(Array.from(spec.hide || []).join(','), 'head', 'DOGE deve substituir a cabeça procedural');
});
check('DOGE substitui o NPC procedural como cabeça flutuante', () => {
  const spec = MA.ENEMY_MODELS && MA.ENEMY_MODELS.doge;
  assert.ok(spec, 'registro do NPC DOGE ausente');
  assert.equal(spec.url, 'assets/skins/doge.glb');
  assert.equal(spec.mode, 'full');
  assert.ok(spec.height > 0, 'NPC DOGE sem escala ajustada');
  assert.ok(spec.y > 0, 'NPC DOGE deveria flutuar acima do chão');
  assert.equal(spec.rotY, Math.PI / 2, 'NPC DOGE não está voltado para +Z');
  assert.equal(spec.hide, 'all', 'NPC DOGE deve esconder o corpo procedural');
});
check('Tralalero substitui o NPC procedural com escala e frente alinhadas', () => {
  const spec = MA.ENEMY_MODELS && MA.ENEMY_MODELS.tralala;
  assert.ok(spec, 'registro do NPC Tralalero ausente');
  assert.equal(spec.url, 'assets/skins/tralalero.glb');
  assert.equal(spec.mode, 'full');
  assert.ok(spec.height > 0, 'Tralalero sem escala ajustada');
  assert.equal(spec.rotY, -Math.PI / 2, 'Tralalero não está voltado para +Z');
  assert.equal(spec.hide, 'all', 'Tralalero deve substituir o modelo procedural');
});
check('Tung Tung substitui o NPC procedural com escala e frente alinhadas', () => {
  const spec = MA.ENEMY_MODELS && MA.ENEMY_MODELS.tung;
  assert.ok(spec, 'registro do NPC Tung Tung ausente');
  assert.equal(spec.url, 'assets/skins/tung.glb');
  assert.equal(spec.mode, 'full');
  assert.ok(spec.height > 0, 'Tung Tung sem escala ajustada');
  assert.equal(spec.rotY, -Math.PI / 2, 'Tung Tung não está voltado para +Z');
  assert.equal(spec.hide, 'all', 'Tung Tung deve substituir o modelo procedural');
});
check('cada novo NPC reutiliza seu GLB em uma versão chefe maior', () => {
  const pairs = [
    ['doge', 'dogeboss', 'assets/skins/doge.glb'],
    ['tralala', 'tralaboss', 'assets/skins/tralalero.glb'],
    ['tung', 'tungboss', 'assets/skins/tung.glb'],
    ['bombard', 'bombaboss', 'assets/skins/bombardiro.glb']
  ];
  for (const [regularId, bossId, url] of pairs) {
    const regular = MA.ENEMY_MODELS && MA.ENEMY_MODELS[regularId];
    const boss = MA.ENEMY_MODELS && MA.ENEMY_MODELS[bossId];
    assert.ok(regular && boss, `par de modelos ausente: ${regularId}/${bossId}`);
    assert.equal(regular.url, url);
    assert.equal(boss.url, url);
    assert.equal(boss.mode, 'full');
    assert.equal(boss.hide, 'all');
    assert.ok(boss.height > regular.height, `${bossId} deveria ser maior que ${regularId}`);
    assert.ok(boss.hudY > boss.height, `barra do ${bossId} deveria ficar acima do modelo`);
  }
  const builds = read('src/builds.js');
  const faces = read('src/faces.js');
  for (const id of ['dogeboss', 'tralaboss', 'tungboss', 'bombaboss']) {
    assert.match(builds, new RegExp(`${id}\\(c\\)`), `fallback 3D ausente: ${id}`);
    assert.match(faces, new RegExp(`${id}\\(x, S, def\\)`), `fallback de rosto ausente: ${id}`);
  }
});
check('Bombardiro usa o GLB animado no NPC normal e no chefe', () => {
  const normal = MA.ENEMY_MODELS && MA.ENEMY_MODELS.bombard;
  const boss = MA.ENEMY_MODELS && MA.ENEMY_MODELS.bombaboss;
  for (const [name, spec] of [['normal', normal], ['chefe', boss]]) {
    assert.ok(spec, `registro do Bombardiro ${name} ausente`);
    assert.equal(spec.url, 'assets/skins/bombardiro.glb');
    assert.equal(spec.mode, 'full');
    assert.equal(spec.rotY, 0, `Bombardiro ${name} não está voltado para +Z`);
    assert.equal(spec.clip, 'bombardiro|flying');
    assert.equal(spec.hide, 'all');
    assert.ok(spec.height > 0 && spec.y > 0 && spec.hudY > spec.y, `escala/voo/HUD inválido no ${name}`);
  }
  assert.ok(boss.height > normal.height, 'chefe Bombardiro deveria ser maior');
});
check('modelos CC BY têm atribuição visível e registro permanente', () => {
  const notices = read('ATTRIBUTIONS.md');
  for (const value of ['徹水', 'CalnnHotCake', 'shtran', '5I9ouA0S-WG', 'wQErnZDU4ed', 'Q6SvoDhhwA', '0dae807a3ff3443d9ed2cd303482f21a', 'creativecommons.org/licenses/by/4.0/', '13 de maio de 2025', 'Creative Commons Attribution']) {
    assert.ok(index.includes(value) || notices.includes(value), `crédito ausente: ${value}`);
  }
  assert.match(index, /CRÉDITOS DOS MODELOS 3D/);
  assert.match(index, /CalnnHotCake/);
  assert.match(index, /徹水/);
});
check('mapa urbano KayKit preserva modelos, licença CC0 e crédito', () => {
  const notices = read('ATTRIBUTIONS.md');
  const city = read('src/cityassets.js');
  const names = ['building_A', 'building_B', 'building_C', 'building_D', 'building_E',
    'road_straight', 'road_junction', 'streetlight', 'car_sedan', 'car_taxi', 'car_police'];
  for (const name of names) {
    assert.ok(city.includes(`'${name}'`), `ativo urbano não usado: ${name}`);
    assert.ok(fs.existsSync(path.join(root, `assets/kaykit-city/${name}.gltf`)), `gltf ausente: ${name}`);
    assert.ok(fs.existsSync(path.join(root, `assets/kaykit-city/${name}.bin`)), `bin ausente: ${name}`);
  }
  assert.ok(fs.existsSync(path.join(root, 'assets/kaykit-city/citybits_texture.png')));
  assert.match(read('assets/kaykit-city/LICENSE.txt'), /Creative Commons Zero, CC0/);
  for (const credit of ['Kay Lousberg', 'City Builder Bits', 'CC0 1.0', 'KayKit-Game-Assets']) {
    assert.ok(index.includes(credit) || notices.includes(credit), `crédito KayKit ausente: ${credit}`);
  }
});
check('entrada resiste a máquina sem GPU e sem rede (certificação 10.1.2)', () => {
  const jogo = read('src/game.js');
  const rede = read('src/net.js');
  const html = read('index.html');
  const css = read('css/season67.css');
  assert.match(jogo, /function createRenderer/, 'sem fallback de WebGL');
  assert.match(jogo, /failIfMajorPerformanceCaveat/, 'sem tentativa de WebGL por software');
  assert.match(jogo, /classList\.add\('ready', 'failed'\)/, 'tela de erro precisa ficar visível e clicável');
  assert.match(jogo, /function comLimite/, 'chamadas de rede sem tempo limite');
  assert.match(jogo, /setTimeout\(garantirTela, 12000\)/, 'sem rede de segurança para exibir uma tela');
  assert.match(rede, /tempo esgotado/, 'carregamento do SDK remoto sem tempo limite');
  assert.ok(html.includes('CSS crítico embutido'), 'index.html sem CSS crítico embutido');
  assert.match(css, /@supports not \(\(-webkit-background-clip: text\)/, 'sem fallback para título recortado');
  const manifest = JSON.parse(read('manifest.webmanifest'));
  assert.equal(manifest.display, 'standalone', 'display fullscreen quebra a janela do pacote Windows');
});
check('service worker e manifesto incluem somente assets existentes', () => {
  const sw = read('sw.js');
  const swVersion = sw.match(/meme-arena-3d-v(\d+)/);
  assert.ok(swVersion, 'service worker sem versão de cache');
  /* o ?v= dos scripts do index precisa acompanhar a versão do cache,
     senão o navegador serve arquivo velho depois de um deploy */
  const indexVersions = new Set([...read('index.html').matchAll(/\?v=(\d+)/g)].map(m => m[1]));
  assert.equal(indexVersions.size, 1, `index.html mistura versões de cache: ${[...indexVersions].join(', ')}`);
  assert.equal([...indexVersions][0], swVersion[1], 'index.html e service worker em versões diferentes');
  for (const rel of ['termos.html', 'assets/splash-season67.jpg', 'assets/hub-season67.jpg', 'assets/screens/00-season67.jpg', 'assets/skins/doge.glb', 'assets/skins/tralalero.glb', 'assets/skins/tung.glb', 'assets/skins/bombardiro.glb', 'assets/kaykit-city/citybits_texture.png', 'src/cityassets.js', 'src/season.js']) assert.ok(sw.includes(rel), `${rel} fora do cache`);
  for (const [, asset] of sw.matchAll(/'\.\/([^']*)'/g)) assert.ok(fs.existsSync(path.join(root, asset || '.')), `cache aponta para arquivo ausente: ${asset}`);
  const manifest = JSON.parse(read('manifest.webmanifest'));
  for (const asset of [...manifest.icons, ...manifest.screenshots]) assert.ok(fs.existsSync(path.join(root, asset.src)), `manifesto aponta para arquivo ausente: ${asset.src}`);
  assert.ok(!manifest.screenshots.some(x => /06-hub|07-loja/.test(x.src)), 'screenshots antigas ainda publicadas');
});
check('entrada informa senha sem recuperação e convidado temporário', () => {
  assert.match(index, /não há recuperação por e-mail/i);
  assert.match(index, /Convidado:<\/b> sessão temporária/i);
});
check('fluxo de convidado não usa signUp nem a senha pública legada', () => {
  const ui = read('src/metaui.js');
  assert.match(ui, /MA\.Net\.startGuest\(\)/);
  assert.ok(!ui.includes("'convidado123'"));
  assert.ok(!ui.match(/authGuest[\s\S]{0,500}\.signUp\(/));
});

function storage() {
  const map = new Map();
  return { getItem: k => map.has(k) ? map.get(k) : null, setItem: (k, v) => map.set(k, String(v)), removeItem: k => map.delete(k), _map: map };
}
const localStorage = storage();
const sessionStorage = storage();
const netWindow = {
  MA: {
    CONFIG: { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_ANON_KEY: 'public-anon-key', START_COINS: 600 },
    store: { get: (k, d) => d, set() {} }
  },
  __forceLocal: true
};
const netContext = vm.createContext({ window: netWindow, console, Date, Math, localStorage, sessionStorage, setTimeout, clearTimeout });
run('src/net.js', netContext);
await netWindow.MA.Net.init();
const guest = await netWindow.MA.Net.startGuest();

check('adaptador Guest grava apenas no sessionStorage', () => {
  assert.equal(netWindow.MA.Net.isGuest, true);
  assert.equal(netWindow.MA.Net.online, false);
  assert.match(guest.user.username, /^Convidado\d{4}$/);
  assert.equal(localStorage._map.size, 0, 'Guest escreveu no localStorage de contas');
  assert.ok(sessionStorage.getItem('memearena.guest.session'));
});
guest.profile.coins = 777;
await netWindow.MA.Net.saveProfile(guest.profile, true);
const restoredGuest = await netWindow.MA.Net.restore();
await netWindow.MA.Net.signOut();
check('perfil Guest restaura na mesma sessão e pode ser encerrado', () => {
  assert.equal(restoredGuest.coins, 777);
  assert.equal(sessionStorage.getItem('memearena.guest.session'), null);
});
const reservedAttempt = await netWindow.MA.Net.signUp('Convidado1234', 'senha-segura');
check('padrão Convidado#### é reservado para cadastro', () => {
  assert.match(reservedAttempt.error, /reservado/i);
});

check('patch SQL contém limpeza restrita e RPCs sazonais', () => {
  const sql = read('supabase/DEPLOY_LAUNCH.sql');
  assert.match(sql, /\^Convidado\[0-9\]\{4\}\$/);
  assert.match(sql, /lower\(coalesce\(u\.email/);
  for (const fn of ['season67_open_box', 'season67_forge_box', 'season67_boss_reward', 'season67_consume_boost']) assert.ok(sql.includes(fn), `${fn} ausente`);
  assert.match(sql, /create table if not exists public\.season67_progress/);
  assert.match(sql, /guard_seasonal_progress/);
  assert.match(sql, /normalize_profile_insert/);
  assert.match(sql, /revoke all on function public\.season67_open_box/);
  assert.ok(!/create policy "dono anuncia"/.test(sql), 'escrita direta no mercado ainda permitida');
});
check('CSP não depende de script inline e dados sociais são escapados', () => {
  assert.match(index, /Content-Security-Policy/);
  assert.ok(!/<script>/.test(index), 'script inline encontrado');
  assert.match(read('src/utils.js'), /MA\.esc\s*=/);
  assert.match(read('src/market.js'), /MA\.esc\(g\.note\)/);
  assert.match(read('src/mod.js'), /MA\.Net\.online/);
});
check('política e termos têm identidade e data atuais', () => {
  assert.match(read('privacidade.html'), /MEME ARENA 3D/);
  assert.match(read('privacidade.html'), /5 de outubro de 2026/);
  assert.match(read('termos.html'), /Moedas, skins, armas/);
});
check('classificação Livre está declarada e coerente em todo o produto', () => {
  const politica = read('privacidade.html');
  const termos = read('termos.html');
  const index = read('index.html');
  assert.match(politica, /Classificação: Livre \(L\)/, 'política sem a classificação confirmada');
  assert.match(politica, /Interação entre usuários/i, 'política precisa citar chat/multiplayer');
  assert.match(politica, /não existem compras com dinheiro real/i, 'política precisa citar ausência de compras reais');
  assert.match(termos, /Livre \(L\)/, 'termos sem a classificação');
  assert.match(index, /Classificação indicativa Livre/, 'selo da entrada fora do padrão');
  assert.ok(!/Não anuncie o selo Livre como oficial/.test(read('docs/MICROSOFT_STORE.md')), 'documentação ainda trata o selo como não confirmado');
});

if (failures.length) {
  console.error(`\n${failures.length} validação(ões) falharam.`);
  process.exitCode = 1;
} else {
  console.log('\nRelease validation passed.');
}
