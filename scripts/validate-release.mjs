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
check('IDs são únicos dentro de cada categoria', () => {
  for (const [name, list] of Object.entries({ skins: MA.SKINS, armors: MA.ARMORS, weapons: MA.WEAPONS, abilities: MA.ABILITIES })) {
    assert.equal(new Set(list.map(x => x.id)).size, list.length, `IDs duplicados em ${name}`);
  }
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
check('skins modeladas à mão apontam para arquivos existentes', () => {
  run('src/skinmodels.js', contentContext);
  const registry = MA.SKIN_MODELS || {};
  const specs = [];
  for (const [id, spec] of Object.entries(registry)) {
    assert.ok(MA.SKINS.some(s => s.id === id), `MA.SKIN_MODELS: skin inexistente "${id}"`);
    specs.push([id, spec]);
  }
  for (const skin of MA.SKINS) if (skin.model) specs.push([skin.id, skin.model]);
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
  for (const rel of ['termos.html', 'assets/splash-season67.jpg', 'assets/hub-season67.jpg', 'assets/screens/00-season67.jpg', 'src/season.js']) assert.ok(sw.includes(rel), `${rel} fora do cache`);
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
