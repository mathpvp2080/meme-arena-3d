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

check('catálogo mantém 33 skins variadas, 9 armaduras, 9 armas e 3 habilidades', () => {
  assert.equal(MA.SKINS.length, 33);
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
check('pool sazonal contém as 28 skins não Common de caixa ou chefe', () => {
  assert.equal(MA.SEASON.itemKeys.length, 28);
  for (const key of MA.SEASON.itemKeys) {
    const [type, id] = key.split(':');
    const item = MA.findItem(type, id);
    assert.ok(item, `item sazonal ausente: ${key}`);
    assert.equal(type, 'skin');
    assert.equal(item.boxOnly, true, `${key} deveria ficar fora da loja do sistema`);
    assert.ok(['box','boss','both'].includes(item.acquisition), `${key}: aquisição inválida`);
  }
});
check('recompensas de conquistas apontam para itens existentes', () => {
  for (const achievement of MA.Goals.ACHIEVEMENTS) {
    if (achievement.item) assert.ok(MA.findItem(achievement.item.type, achievement.item.id), `${achievement.id} → item inválido`);
  }
  assert.ok(!read('src/goals.js').includes("id: 'bfg'"), 'weapon:bfg ainda referenciada');
});
check('caixa/chefe usam 50% skin, 50% recursos e raridades condicionais exatas', () => {
  assert.equal(JSON.stringify(MA.SEASON.odds), JSON.stringify({ resources:50, skin:50 }));
  assert.equal(JSON.stringify(MA.SKIN_DROP_ODDS), JSON.stringify({
    uncommon:40, legendary:29.5, mythical:20, ultimate:10, secret:.5
  }));
  assert.equal(MA.Season._rollRarity(0), 'uncommon');
  assert.equal(MA.Season._rollRarity(39.999), 'uncommon');
  assert.equal(MA.Season._rollRarity(40), 'legendary');
  assert.equal(MA.Season._rollRarity(69.5), 'mythical');
  assert.equal(MA.Season._rollRarity(89.5), 'ultimate');
  assert.equal(MA.Season._rollRarity(99.5), 'secret');
});

const rollProfile = {
  data: { coins: 20000, level: 1, xp: 0, inventory: ['skin:coolfries','armor:hoodie'], equipped:{skin:'coolfries'}, stats: {} },
  addCoins(n) { this.data.coins += n; }, addXp() { return 0; },
  owns(type, id) { return this.data.inventory.includes(`${type}:${id}`); },
  grant(type, id) { if (!this.owns(type,id)) this.data.inventory.push(`${type}:${id}`); },
  save: async () => ({ ok: true })
};
MA.Profile = rollProfile; MA.Net = { online: false }; MA.Goals = null;
MA.Season.active = () => true;
const originalRandom = Math.random;
let sequence = [.1, .999, 0];
Math.random = () => sequence.shift() ?? 0;
const forcedSkin = MA.Season._roll('box');
sequence = [.75, .9];
Math.random = () => sequence.shift() ?? 0;
const forcedResources = MA.Season._roll('boss');
Math.random = originalRandom;
check('cada sorteio local entrega no máximo uma skin ou recursos automáticos', () => {
  assert.equal(forcedSkin.type, 'item');
  assert.equal(forcedSkin.item.rarity, 'secret');
  assert.ok(['box','both'].includes(forcedSkin.item.acquisition));
  assert.equal(forcedResources.type, 'both');
  assert.equal(forcedResources.coins, 500);
  assert.equal(forcedResources.xp, 500);
});

const index = read('index.html');
check('todos os assets locais do HTML existem', () => {
  const refs = [...index.matchAll(/(?:src|href)="([^"#?]+)(?:\?[^"#]*)?"/g)].map(m => m[1]);
  for (const ref of refs) {
    if (/^(?:https?:|data:|mailto:)/.test(ref) || ref === './') continue;
    assert.ok(fs.existsSync(path.join(root, ref)), `arquivo ausente: ${ref}`);
  }
});
check('hub tem identidade permanente Meme Arena e estados úteis', () => {
  const css = read('css/hub.css');
  const meta = read('src/metaui.js');
  const hubMarkup = index.slice(index.indexOf('<div id="hub"'), index.indexOf('<!-- =========================================================== LOJA'));
  for (const id of ['hubNetworkState', 'hubStickerProgress', 'hubStickerFill', 'hubOperatorId', 'playBtnHub']) {
    assert.match(hubMarkup, new RegExp(`id="${id}"`), `controle ausente no hub: ${id}`);
  }
  for (const cls of ['lobby-brand', 'queue-status', 'hub-mode-pills', 'hub-match-features', 'lobby-collection-progress', 'character-brand-bg', 'character-sticker-burst', 'map-orbit', 'map-readout', 'arena-footer-mark']) {
    assert.ok(hubMarkup.includes(`class="${cls}`) || hubMarkup.includes(` ${cls}`), `bloco visual ausente: ${cls}`);
  }
  for (const signature of ['CAIXAS E RECOMPENSAS', 'ITENS E OFERTAS', 'SKINS E LOADOUT', 'MAPAS E PERSONAGENS', 'TROCAS E PRESENTES', 'MODO DE JOGO']) {
    assert.ok(hubMarkup.includes(signature), `assinatura visual ausente: ${signature}`);
  }
  for (const seasonalShell of ['ARENA CONTROL', 'PASSE 67', 'MATCH // 67', 'LAUNCH // 67', 'OPERADOR EM CAMPO']) {
    assert.ok(!hubMarkup.includes(seasonalShell), `moldura principal ainda depende da temporada: ${seasonalShell}`);
  }
  assert.ok(!hubMarkup.includes('id="mpBtn"'), 'botão GRUPO redundante ainda está no hub');
  for (const mode of ['solo', 'coop', 'pvp']) assert.ok(hubMarkup.includes(`data-hub-mode="${mode}"`), `pré-seleção ausente: ${mode}`);
  assert.match(css, /MEME ARENA SHELL · identidade permanente do menu principal/);
  assert.match(css, /rail de adesivos: cinco silhuetas e cores inequívocas/);
  assert.match(css, /MEME ARENA \/\/ ESCOLHA O MODO/, 'seletor de modo fora da identidade permanente');
  assert.doesNotMatch(css, /#hub \.lobby-play\{[^}]*grid-column:2\/4/, 'JOGAR voltou a ocupar o centro da tela');
  assert.match(css, /@media\(max-width:540px\)/, 'hub sem adaptação para celular estreito');
  assert.match(meta, /selectHubMode\(mode, persist\)/);
  assert.match(meta, /launchHubMode\(\)/);
  assert.match(meta, /MA\.store\.set\('hubMode'/);
  assert.match(meta, /hubOperatorId/);
  assert.match(meta, /SESSÃO LOCAL/);
  assert.match(meta, /ownedStickers/);
});
check('JOGAR roteia Solo, Coop e equipes com capacidades válidas', () => {
  const meta = read('src/metaui.js');
  const multi = read('src/multi.js');
  const schema = read('supabase/schema_multiplayer.sql');
  assert.match(index, /id="playmode"/);
  for (const id of ['soloModeBtn', 'coopModeBtn', 'pvpModeBtn']) assert.match(index, new RegExp(`id="${id}"`));
  for (const mode of ['data-mode="coop"', 'data-mode="pvp"', 'data-mode="pvpve"']) assert.ok(index.includes(mode), `modo ausente: ${mode}`);
  assert.match(meta, /on\('playBtnHub', \(\) => this\.launchHubMode\(\)\)/);
  assert.match(meta, /MA\._startSoloAuto\(\)/);
  assert.match(meta, /MA\.MPUI\.open\(mode === 'pvp' \? 'pvp' : 'coop'\)/);
  assert.match(multi, /return competitive\(mode \|\| this\.mode\) \? 12 : 6/);
  assert.match(multi, /t\.pink >= 2 && t\.cyan >= 2/);
  assert.match(schema, /mode in \('coop','pvp','pvpve'\)/);
  assert.match(schema, /players between 1 and 12/);
});
check('pré-seleção do hub persiste e JOGAR usa o modo escolhido', () => {
  const classes = () => {
    const values = new Set();
    return { values, toggle(name, on) { on ? values.add(name) : values.delete(name); } };
  };
  const node = (mode) => ({
    dataset: mode ? { hubMode: mode } : {}, classList: classes(), textContent: '', attrs: {},
    setAttribute(name, value) { this.attrs[name] = value; }
  });
  const buttons = ['solo', 'coop', 'pvp'].map(node);
  const ids = Object.fromEntries([
    'hubModeCode', 'hubModeReadout', 'hubModeCapacity', 'hubModeTitle', 'hubMapName',
    'hubModeFeature', 'hubModeHint', 'hubPlayModeLabel',
    'hubModeCoopMeta', 'hubModePvpMeta', 'playBtnHub'
  ].map(id => [id, node()]));
  const card = node();
  let saved = null, opened = null, soloStarted = false;
  const fakeMA = {
    $: id => ids[id] || null,
    CONFIG: { MULTIPLAYER_LEVEL: 5 },
    Profile: { canMultiplayer: () => true, equippedWeapons: () => [0] },
    store: { get: (_key, fallback) => saved || fallback, set: (_key, value) => { saved = value; } },
    MPUI: { open: mode => { opened = mode; } },
    Audio: {},
    _startSoloAuto: () => { soloStarted = true; }
  };
  const fakeDocument = {
    querySelectorAll: selector => selector === '[data-hub-mode]' ? buttons : [],
    querySelector: selector => selector === '#hub .mode-card' ? card : null,
    createElement: () => node()
  };
  const fakeWindow = { MA: fakeMA };
  const context = vm.createContext({ window: fakeWindow, document: fakeDocument, console, setTimeout, clearTimeout });
  run('src/metaui.js', context);
  fakeMA.MetaUI.selectHubMode('coop');
  assert.equal(saved, 'coop');
  assert.equal(ids.hubPlayModeLabel.textContent, 'COOP PVE');
  assert.equal(card.dataset.mode, 'coop');
  assert.equal(buttons[1].attrs['aria-pressed'], 'true');
  fakeMA.MetaUI.launchHubMode();
  assert.equal(opened, 'coop');
  fakeMA.MetaUI.selectHubMode('solo');
  fakeMA.MetaUI.launchHubMode();
  assert.equal(soloStarted, true);
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
check('catálogo jogável reúne 33 modelos Polygonal Mind sem publicar NPCs', () => {
  const expectedIds = ['coolfries', 'milk', 'hotdog', 'washingmachine', 'fridge', 'pizza', 'taco', 'coolramen', 'avocado', 'sunflower', 'baguette', 'goldfishbag', 'captainlantern', 'sharkperson', 'moongirl', 'alienskeleton', 'robot', 'tallguy', 'skeletoncostume', 'burnvictim', 'chaosbaby', 'o', 'coolbananaguy', 'mousemisprint', 'ramon', 'littlealienmenace', 'eggplant', 'cosmicdweller', 'turtle', 'tnt', 'coolpolygonalmind', 'eyefighter', 'cosmicperson'];
  const skinIds = MA.SKINS.map(skin => skin.id);
  assert.deepEqual(Array.from(skinIds), expectedIds);
  for (const npc of ['doge','tralala','tung','bombard']) assert.ok(!skinIds.includes(npc), `NPC jogável: ${npc}`);
  assert.equal(Object.keys(MA.SKIN_MODELS || {}).length, 33);
  assert.equal(MA.SKINS.filter(skin => skin.starter).map(skin => skin.id).join(','), 'coolfries');
  assert.equal(MA.SKINS.filter(skin => skin.rarity === 'common').length, 5);
  assert.equal(MA.SKINS.filter(skin => skin.rarity === 'secret').length, 17);

  const urls = new Set();
  for (const skin of MA.SKINS) {
    const spec = MA.SKIN_MODELS[skin.id];
    assert.ok(spec, `modelo Polygonal Mind ausente: ${skin.id}`);
    assert.match(spec.url, /^assets\/skins\/polygonal-mind\/[a-z0-9-]+\.glb$/);
    assert.equal(spec.mode, 'full');
    assert.equal(spec.height, 2.62);
    assert.equal(spec.rotY, 0);
    assert.equal(spec.clip, 'idle');
    assert.equal(spec.hide, 'all');
    urls.add(spec.url);
    assert.ok(!/Character/i.test(skin.name), `${skin.id}: nome expõe Character`);
    assert.ok(skin.name.length >= 1 && skin.desc.length >= 25, `${skin.id}: identidade de loja incompleta`);
  }
  assert.equal(urls.size, 33, 'duas skins apontam para o mesmo modelo');
});
check('raridades, valores progressivos, nomes obrigatórios e mercado seguem a economia aprovada', () => {
  const ranges = {
    common:[0,10000], uncommon:[10000,25000], legendary:[25000,40000],
    mythical:[40000,60000], ultimate:[60000,100000], secret:[100000,1000000]
  };
  for (const [rarity, [min,max]] of Object.entries(ranges)) {
    const values = MA.SKINS.filter(s => s.rarity === rarity).map(s => s.baseValue);
    assert.ok(values.length, `raridade vazia: ${rarity}`);
    assert.ok(values.every(v => v >= min && v <= max), `${rarity}: valor fora da faixa`);
    assert.equal(Array.from(values).join(','), Array.from(values).sort((a,b) => a-b).join(','), `${rarity}: valores não progressivos`);
  }
  for (const skin of MA.SKINS) {
    assert.equal(skin.marketValue, Math.round(skin.baseValue * .7), `${skin.id}: mercado não é 70%`);
    assert.equal(skin.marketMin, skin.marketValue); assert.equal(skin.marketMax, skin.marketValue);
    if (skin.rarity === 'common') {
      assert.equal(skin.acquisition, 'shop'); assert.equal(skin.boxOnly, false);
    } else {
      assert.ok(['box','boss','both'].includes(skin.acquisition)); assert.equal(skin.boxOnly, true);
    }
  }
  const requiredSecrets = ['Cosmic Dweller','Turtle','TNT','Cool Polygonal Mind','Eye Fighter','Cosmic Person',
    'Robot','Tall Guy','Skeleton Costume','Burn Victim','Chaos Baby','O','Cool Banana Guy',
    'Mouse Misprint','Ramon','Little Alien Menace','Eggplant'];
  assert.equal(Array.from(MA.SKINS.filter(s => s.rarity === 'secret'), s => s.name).sort().join(','), requiredSecrets.sort().join(','));
  for (const forbidden of ['Mickey Mousn’t','Gnome']) assert.ok(!MA.SKINS.some(s => s.name === forbidden));
});
check('perfil local preserva compras e equipamento dos catálogos anteriores', () => {
  run('src/profile.js', contentContext);
  const migrated = MA.Profile.set({
    level: 12, xp: 44, coins: 9876,
    inventory: ['skin:chill','skin:rookie','skin:mechred','skin:shadow','armor:hoodie'],
    equipped: { skin: 'shadow', armor: 'hoodie', weapons: [], ability: '' }, stats: {}
  });
  assert.equal(migrated.inventory.filter(item => item === 'skin:coolfries').length, 1, 'duplicata não consolidada');
  assert.ok(migrated.inventory.includes('skin:turtle'), 'compra anterior não migrou');
  assert.ok(migrated.inventory.includes('skin:skeletoncostume'), 'skin equipada não foi preservada');
  assert.ok(!migrated.inventory.some(item => /skin:(chill|rookie|mechred|shadow)$/.test(item)), 'ID antigo sobrou');
  assert.equal(migrated.equipped.skin, 'skeletoncostume');
  assert.equal(migrated.coins, 9876); assert.equal(migrated.level, 12);
});
check('preços SQL das 33 skins coincidem com os 70% fixos do cliente', () => {
  const schema = read('supabase/schema_multiplayer.sql');
  const deploy = read('supabase/DEPLOY_LAUNCH.sql');
  for (const skin of MA.SKINS) {
    const bounds = skin.starter ? { min:10, max:10 } : MA.marketPriceBounds(skin);
    const pattern = new RegExp(`\\('skin:${skin.id}',\\s*${bounds.min},\\s*${bounds.max},\\s*${skin.starter ? 'false' : 'true'}\\)`);
    assert.match(schema, pattern, `${skin.id}: limite ausente no schema multiplayer`);
    assert.match(deploy, pattern, `${skin.id}: limite ausente no deploy consolidado`);
  }
});
check('GLBs Polygonal Mind preservam rig, clips e orçamento móvel', () => {
  const geometrySignatures = new Set();
  let totalBytes = 0, totalTriangles = 0;
  for (const skin of MA.SKINS) {
    const rel = MA.SKIN_MODELS[skin.id].url;
    const glb = fs.readFileSync(path.join(root, rel)); totalBytes += glb.length;
    assert.ok(glb.length < 300000, `${rel}: arquivo acima de 300 KB`);
    const jsonLength = glb.readUInt32LE(12);
    const doc = JSON.parse(glb.toString('utf8', 20, 20 + jsonLength).replace(/[\u0000\s]+$/g, ''));
    assert.equal((doc.images || []).length, 1, `${rel}: deveria usar uma textura`);
    assert.equal((doc.skins || []).length, 1, `${rel}: rig ausente`);
    assert.ok((doc.images || []).every(image => Number.isInteger(image.bufferView) && !image.uri), `${rel}: textura externa`);
    assert.ok((doc.buffers || []).every(buffer => !buffer.uri), `${rel}: buffer externo`);
    assert.ok((doc.extensionsRequired || []).includes('KHR_mesh_quantization'), `${rel}: sem quantização`);
    const animations = Object.fromEntries((doc.animations || []).map(a => [a.name, a.channels.length]));
    assert.deepEqual(animations, { idle:4, run:7, punch:4 }, `${rel}: clips incompletos`);

    let vertices=0, triangles=0, primitives=0;
    for (const mesh of doc.meshes || []) for (const primitive of mesh.primitives || []) {
      primitives++; const position=doc.accessors[primitive.attributes.POSITION]; vertices+=position.count;
      triangles+=Math.floor((primitive.indices===undefined ? position.count : doc.accessors[primitive.indices].count)/3);
    }
    assert.equal(primitives, 1, `${rel}: draw calls`);
    assert.ok(triangles >= 2000 && triangles <= 6000, `${rel}: ${triangles} triângulos`);
    totalTriangles += triangles;
    geometrySignatures.add(`${vertices}:${triangles}:${(doc.nodes || []).length}`);

    const binHeader=20+jsonLength; const imageView=doc.bufferViews[doc.images[0].bufferView];
    const pngStart=binHeader+8+(imageView.byteOffset || 0);
    assert.equal(glb.toString('hex',pngStart,pngStart+8),'89504e470d0a1a0a',`${rel}: textura não é PNG`);
    const width=glb.readUInt32BE(pngStart+16), height=glb.readUInt32BE(pngStart+20);
    assert.ok(width<=512 && height<=512, `${rel}: textura ${width}x${height}`);
  }
  assert.equal(geometrySignatures.size, 33, 'modelos não têm geometria própria');
  assert.ok(totalBytes < 5300000, `pacote muito grande: ${totalBytes}`);
  assert.ok(totalTriangles < 140000, `elenco excede orçamento: ${totalTriangles}`);
  assert.match(read('src/skinmodels.js'), /setState\(target, state, fade\)/);
  assert.match(read('src/game.js'), /MA\.SkinModels\.setState\(player, skinState\)/);
  assert.match(read('src/multi.js'), /MA\.SkinModels\.setState\(p\.obj, moving \? 'run' : 'idle'\)/);
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
check('pacote Polygonal Mind preserva autor, licença, fonte e transformações', () => {
  const notices = read('ATTRIBUTIONS.md');
  const source = read('assets/skins/polygonal-mind/SOURCE.md');
  const license = read('assets/skins/polygonal-mind/LICENSE.md');
  for (const credit of ['Polygonal Mind','100 Avatars R1','100 Avatars R2','CC BY 4.0',
    'ff07c2ad0017819c4e5366656ee1e5bcc4029bd4','October 7, 2026']) {
    assert.ok(index.includes(credit) || notices.includes(credit) || source.includes(credit) || license.includes(credit), `crédito ausente: ${credit}`);
  }
  assert.match(license, /Attribution 4\.0 International/);
  assert.match(source, /github\.com\/PolygonalMind\/100Avatars/);
  assert.match(source, /idle.*run.*punch/s);
  assert.match(source, /textures are resized only when larger than 512×512/i);
  assert.match(index, /33 skins jogáveis por <b>Polygonal Mind<\/b>/);
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
  const registrationVersion = read('src/utils.js').match(/serviceWorker\.register\('sw\.js\?v=(\d+)'/);
  assert.ok(registrationVersion, 'registro do service worker sem versão');
  assert.equal(registrationVersion[1], swVersion[1], 'registro e cache do service worker em versões diferentes');
  for (const rel of ['termos.html', 'css/hub.css', 'assets/splash-season67.jpg', 'assets/hub-season67.jpg', 'assets/screens/00-season67.jpg', 'assets/skins/doge.glb', 'assets/skins/tralalero.glb', 'assets/skins/tung.glb', 'assets/skins/bombardiro.glb', 'assets/kaykit-city/citybits_texture.png', 'src/cityassets.js', 'src/season.js']) assert.ok(sw.includes(rel), `${rel} fora do cache`);
  assert.ok(sw.includes(MA.SKIN_MODELS.coolfries.url), 'starter fora do cache offline');
  assert.ok(!sw.includes(MA.SKIN_MODELS.cosmicperson.url), 'catálogo inteiro não deve atrasar o boot');
  const previews = read('src/previews.js');
  assert.match(previews, /await MA\.SkinModels\.load\(spec\.url\)/, 'preview não espera o GLB sob demanda');
  assert.match(previews, /job\.type === 'skin' \|\| job\.type === 'avatar'/);
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
  assert.match(sql, /if p_box='box67' then v_price:=670; v_count:=1/);
  assert.match(sql, /elsif p_box='vault67' then v_price:=1830; v_count:=3/);
  assert.match(sql, /revoke all on function public\.season67_open_box/);
  assert.match(sql, /set coins = coins \+ l\.price where id = l\.seller_id/, 'vendedor não recebe 100%');
  assert.ok(!/create policy "dono anuncia"/.test(sql), 'escrita direta no mercado ainda permitida');
});
check('migração SQL troca ambos os catálogos sem apagar compras ou alterar NPCs', () => {
  const patch = read('supabase/patch_polygonal_mind_skins.sql');
  for (const pair of [['chill','coolfries'],['doge','hotdog'],['king','captainlantern'],
    ['rookie','coolfries'],['lumber','hotdog'],['executive','captainlantern'],
    ['crash','cosmicdweller'],['mechred','turtle'],['mechviolet','eyefighter'],['shadow','skeletoncostume']]) {
    assert.ok(patch.includes(`'${pair[0]}'`) && patch.includes(`'${pair[1]}'`), `migração ausente: ${pair.join(' → ')}`);
  }
  assert.match(patch, /jsonb_array_elements_text/);
  assert.match(patch, /update public\.market_listings/);
  assert.match(patch, /new\.inventory := '\["skin:coolfries","armor:hoodie"\]'/);
  assert.ok(!patch.includes('MA.ENEMY_MODELS'));
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
