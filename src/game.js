/* MEME ARENA 3D — motor principal: loop, input, combate, ondas, fluxo */
(function (MA) {
  'use strict';
  const $ = MA.$, clamp = MA.clamp, rand = MA.rand, pick = MA.pick, TAU = MA.TAU;
  const V3 = () => new THREE.Vector3();
  const BOOT_STARTED = performance.now();

  let scene, camera, renderer, clock;
  let player = null;
  const enemies = [], bullets = [], eBullets = [], pickups = [];
  let keys = {}, mouseDown = false, yaw = 0, pitch = -.16, locked = false;
  let shake = 0, shakeT = 0, camPos = V3();
  let firstPerson = MA.store.get('fpv', false);
  let touchMove = { x: 0, y: 0 }, touchFire = false;
  const isTouch = ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  const G = {
    running: false, paused: false, over: false, choosing: false, booted: false,
    score: 0, wave: 0, combo: 1, comboT: 0, kills: 0, waveKills: 0, waveTarget: 0,
    spawnQueue: 0, spawnT: 0, interWave: 0, brainrot: 0, ult: 0,
    bossAlive: null, time: 0, startTime: 0, perks: {}, diff: MA.DIFFS[1],
    quality: 'high', shots: 0, hits: 0, maxCombo: 1, bossesKilled: 0
  };

  const S = {
    sens: 1.0, volume: .6, music: .45, quality: 'high',
    fov: 74, shake: 1, mute: false, invertY: false,
    shoulder: 1.35          // deslocamento lateral da câmera em 3ª pessoa (negativo = ombro esquerdo)
  };

  /* ====================================================== PERFIL / META */
  /* ============================== ETAPA 3: atalhos de multiplayer ====== */
  let netSeq = 0;                      // id de rede dos inimigos (host)
  const remoteEnemies = {};            // netId -> inimigo (cliente)
  const remotePickups = {};            // netId -> item do chão (cliente)
  function mpOn()     { return !!(MA.Multi && MA.Multi.active && MA.Multi.started); }
  function mpHost()   { return mpOn() && MA.Multi.isHost; }
  function mpClient() { return mpOn() && !MA.Multi.isHost; }
  function mpPvP()    { return mpOn() && MA.Multi.mode === 'pvp'; }
  function mpSend(m)  { if (mpOn()) MA.Multi.send(m); }

  function currentSkin()  { return MA.Profile.data ? MA.Profile.equippedSkin()  : MA.SKINS[0]; }
  function currentArmor() { return MA.Profile.data ? MA.Profile.equippedArmor() : MA.ARMORS[0]; }
  function currentWeapons() {
    const w = MA.Profile.data ? MA.Profile.equippedWeapons() : [];
    return w.length ? w : [0];
  }
  function currentAbility() {
    const a = MA.Profile.data ? MA.Profile.equippedAbility() : null;
    return a ? a.id : '';
  }

  /* ================================================================ BOOT */
  /* Cria o renderer tentando do melhor para o mais compatível. Em máquinas
     virtuais e notebooks sem GPU dedicada (como as usadas na certificação da
     Microsoft Store) o contexto "high-performance" pode falhar; antes disso
     derrubava o jogo inteiro e sobrava uma tela preta. */
  function createRenderer() {
    const tentativas = [
      { antialias: S.quality !== 'low', powerPreference: 'high-performance' },
      { antialias: false, powerPreference: 'default' },
      { antialias: false, powerPreference: 'low-power', failIfMajorPerformanceCaveat: false }
    ];
    let ultimo = null;
    for (const opts of tentativas) {
      try { return new THREE.WebGLRenderer(opts); }
      catch (e) { ultimo = e; console.warn('[MemeArena] WebGL recusou', opts, e && e.message); }
    }
    const err = new Error('WebGL indisponível: ' + (ultimo && ultimo.message ? ultimo.message : 'contexto não criado'));
    err.webgl = true;
    throw err;
  }

  /* Rede nunca pode travar a interface: numa máquina sem internet (ou com a
     CDN bloqueada) o await ficava pendurado para sempre e o jogador via uma
     tela vazia. Tudo que depende de rede passa por aqui. */
  function comLimite(promessa, ms, nome) {
    return Promise.race([
      Promise.resolve(promessa),
      new Promise((_, rej) => setTimeout(() => rej(new Error('tempo esgotado: ' + nome)), ms))
    ]);
  }

  /* Garante que SEMPRE exista uma tela visível para o jogador. */
  function telaVisivel() {
    return ['auth', 'hub', 'shop', 'lootbox', 'inventory', 'goals', 'market', 'multi', 'start', 'help', 'board', 'settings', 'over']
      .some(id => { const e = $(id); return e && !e.classList.contains('hid'); });
  }
  function garantirTela() {
    if (G.running || telaVisivel()) return;
    try { MA.MetaUI.screen('auth'); } catch (e) { recordClientError(e); }
  }

  function boot() {
    Object.assign(S, MA.store.get('settings', {}));
    /* quem já jogava antes não tem 'shoulder' salvo — cai no padrão do ombro */
    if (typeof S.shoulder !== 'number' || !isFinite(S.shoulder)) S.shoulder = 1.35;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(S.fov, innerWidth / innerHeight, .1, 650);
    renderer = createRenderer();
    applyQuality();
    renderer.setSize(innerWidth, innerHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.06;
    $('app').appendChild(renderer.domElement);
    clock = new THREE.Clock();

    G.quality = S.quality;
    G.map = MA.mapById(MA.store.get('map', 'arena'));
    MA.World.build(scene, S.quality, G.map);
    MA.FX.init(scene);
    MA.UI.init();
    player = MA.createPlayer(scene, currentSkin(), currentArmor());
    player.obj.position.set(0, 0, 0);

    /* Skins modeladas à mão (.glb): carrega em segundo plano e, se achar
       algum modelo, refaz o boneco e as miniaturas com ele. */
    if (MA.SkinModels) {
      MA.SkinModels.preload().then(n => {
        if (!n) return;
        if (MA.Previews) MA.Previews.cache = Object.create(null);
        rebuildPlayerLook();
      }).catch(() => { /* segue com o boneco procedural */ });
    }

    camera.position.set(0, 12, 46);
    camera.lookAt(0, 5, 0);

    bindInput();
    buildMenus();
    addEventListener('resize', onResize);

    MA.Audio.setVolume(S.volume);
    MA.Audio.setMusicVolume(S.music);

    G.booted = true;
    /* A entrada é uma etapa real: não desaparece sozinha. Assim a marca, a
       classificação Livre e o comando para entrar continuam sempre visíveis. */
    const splash = $('loading');
    const enterGame = $('enterGame');
    const splashStatus = splash && splash.querySelector('.splash-loading');
    const closeSplash = () => {
      if (!splash || splash.classList.contains('leave')) return;
      MA.Audio.init();
      splash.classList.add('leave');
      setTimeout(() => splash.classList.add('hid'), 460);
    };
    const wait = Math.max(0, 1500 - (performance.now() - BOOT_STARTED));
    setTimeout(() => {
      if (!splash) return;
      splash.classList.add('ready');
      if (splashStatus) splashStatus.textContent = 'PROTOCOLO PRONTO · TEMPORADA 67';
      if (enterGame) {
        enterGame.disabled = false;
        enterGame.onclick = closeSplash;
      }
    }, wait);
    animate();
    initMeta();
  }

  async function initMeta() {
    MA.MetaUI.bind();
    if (MA.MPUI) MA.MPUI.init();
    if (MA.Market) MA.Market.init();
    /* rede de segurança: aconteça o que acontecer, em 12s tem tela na frente
       do jogador (exigência 10.1.2 da Microsoft Store) */
    const salvaVidas = setTimeout(garantirTela, 12000);
    try { await comLimite(MA.Net.init(), 7000, 'rede'); }
    catch (e) { console.warn('[MemeArena] rede indisponível, seguindo offline:', e && e.message); }
    try { MA.MetaUI.initAuth(); } catch (e) { recordClientError(e); }
    let prof = null;
    try { prof = await comLimite(MA.Net.restore(), 7000, 'restaurar sessão'); }
    catch (e) { console.warn('[MemeArena] sessão não restaurada:', e && e.message); }
    try {
      if (prof) {
        MA.Profile.set(prof);
        rebuildPlayerLook();
        MA.MetaUI.openHub();
      } else {
        MA.MetaUI.screen('auth');
      }
    } catch (e) {
      recordClientError(e);
      MA.MetaUI.screen('auth');
    } finally {
      clearTimeout(salvaVidas);
      garantirTela();
    }
  }

  /* recria o boneco do menu com a skin/armadura equipadas */
  function rebuildPlayerLook() {
    if (!player || G.running) return;
    scene.remove(player.obj); MA.disposeObject(player.obj);
    player = MA.createPlayer(scene, currentSkin(), currentArmor());
    const equipped = currentWeapons();
    player.weapon = equipped.length ? equipped[0] : 0;
    player.ability = currentAbility();
    MA.syncWeaponModel(player);
    player.obj.position.set(0, 0, 0);
  }
  MA._rebuildLook = rebuildPlayerLook;
  setTimeout(() => { if (MA._bindMulti) MA._bindMulti(); }, 0);
  MA._dbg = { get cam() { return camera; }, get player() { return player; }, get scene() { return scene; }, get G() { return G; }, get enemies() { return enemies; }, get pickups() { return pickups; } };

  /* troca de mapa: limpa o cenário antigo e constrói o novo */
  function setMap(id) {
    const m = MA.mapById(id);
    if (G.map && G.map.id === m.id) return;
    G.map = m;
    MA.store.set('map', m.id);

    /* remove tudo que não seja o jogador nem as entidades vivas */
    const keep = new Set();
    if (player) keep.add(player.obj);
    [enemies, bullets, eBullets, pickups].forEach(arr => arr.forEach(o => keep.add(o.obj)));
    for (let i = scene.children.length - 1; i >= 0; i--) {
      const c = scene.children[i];
      if (keep.has(c)) continue;
      scene.remove(c);
      MA.disposeObject(c);
    }
    MA.World.build(scene, S.quality, m);
    MA.FX.init(scene);
  }
  MA._setMap = setMap;

  /* chamado sempre que o hub abre: encerra a partida e recria o boneco */
  MA._prepHub = function () {
    G.running = false; G.paused = false; G.over = false; G.choosing = false;
    if (typeof clearAll === 'function') clearAll();
    ['hud', 'touch'].forEach(id => $(id).classList.add('hid'));
    MA.Audio.setIntensity(.15);
    if (document.exitPointerLock) document.exitPointerLock.call(document);
    rebuildPlayerLook();
    if (typeof refreshMenuStats === 'function') refreshMenuStats();
  };

  function applyQuality() {
    const q = S.quality;
    renderer.setPixelRatio(Math.min(devicePixelRatio, q === 'low' ? 1 : q === 'med' ? 1.5 : 2));
    renderer.shadowMap.enabled = q !== 'low';
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    G.quality = q;
  }

  function onResize() {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  }

  /* ============================================================== ONDAS */
  function startWave(n) {
    if (mpClient() || mpPvP()) { G.wave = n; G.waveTarget = 0; G.spawnQueue = 0; return; }
    G.wave = n;
    G.waveKills = 0;
    G.waveNoHit = true;
    G.interWave = 0;
    const d = G.diff;

    if (n % 5 === 0) {
      const idx = Math.min(Math.floor(n / 5) - 1, MA.BOSSES.length - 1);
      const extra = Math.max(0, Math.floor(n / 5) - MA.BOSSES.length);
      const def = MA.BOSSES[idx];
      const boss = MA.createEnemy(scene, def, {
        boss: true,
        hpScale: d.ehp * (1 + extra * .75) * (1 + n * .035),
        dmgScale: d.edmg * (1 + extra * .3),
        spdScale: d.espd
      });
      const sp = MA.World.spawnPoint(player.pos, 34);
      boss.obj.position.set(sp.x, 0, sp.z);
      boss.netId = ++netSeq;
      enemies.push(boss);
      G.bossAlive = boss;
      G.waveTarget = 1; G.spawnQueue = 0;
      MA.UI.banner('CHEFE', def.emoji + '  ' + def.name, 3400, 'boss');
      MA.UI.float('"' + def.taunt + '"', '#ff00c8', 30);
      MA.Audio.bossIn();
      MA.FX.ring(boss.obj.position.clone(), new THREE.Color(def.ring), 30, 1.3);
    } else {
      G.bossAlive = null;
      G.waveTarget = Math.round((5 + n * 2.1) * (G.diff.id === 'easy' ? .8 : 1));
      G.spawnQueue = G.waveTarget;
      G.spawnT = .4;
      MA.UI.banner('ONDA ' + n, pick(MA.WAVE_LINES), 2200);
      MA.Audio.waveUp();
    }

    if (mpHost()) mpSend({ t: 'wave', n });
    MA.UI.updateWeaponList(player, G);
    MA.Audio.setIntensity(clamp(n / 14, .15, 1));
  }

  function spawnTick(dt) {
    if (mpClient() || mpPvP()) return;
    if (G.spawnQueue <= 0) return;
    G.spawnT -= dt;
    if (G.spawnT > 0) return;
    G.spawnT = clamp((1.45 - G.wave * .055) * G.diff.spawn, .22, 1.6);

    const pool = MA.MEMES.filter(m => m.tier <= Math.ceil(G.wave / 1.6));
    const def = pick(pool.length ? pool : [MA.MEMES[0]]);
    const eliteChance = G.wave >= 4 ? clamp(.04 + G.wave * .012, 0, .3) : 0;
    const e = MA.createEnemy(scene, def, {
      elite: Math.random() < eliteChance,
      hpScale: G.diff.ehp * (1 + (G.wave - 1) * .16),
      dmgScale: G.diff.edmg * (1 + (G.wave - 1) * .05),
      spdScale: G.diff.espd * (1 + (G.wave - 1) * .012)
    });
    const sp = MA.World.spawnPoint(player.pos, 24);
    e.obj.position.set(sp.x, 0, sp.z);
    enemies.push(e);
    G.spawnQueue--;
    MA.FX.ring(e.obj.position.clone(), new THREE.Color(def.color), 4.5, .55);
    MA.FX.burst(e.obj.position.clone().setY(1), new THREE.Color(def.color), 12, 8, .2);
  }

  function waveCleared() {
    /* "intocável": limpou a onda sem levar nenhum dano */
    if (MA.Goals && G.waveNoHit) { MA.Goals.track('flawless', 1); MA.Goals.track('flaw', 1); }
    const bonus = Math.round(280 * G.wave * G.diff.pts * player.mScore);
    G.score += bonus;
    player.hp = clamp(player.hp + 14, 0, player.maxhp);
    MA.UI.banner('ONDA ' + G.wave + ' LIMPA', '+' + MA.fmt(bonus) + ' de bônus', 2400);
    for (let i = 0; i < 2; i++) {
      const sp = MA.World.spawnPoint(player.pos, 8);
      pickups.push(MA.createPickup(scene, sp.x, sp.z, weightedPickup()));
    }
    setTimeout(offerPerks, 1300);
  }

  /* ============================================================== PERKS */
  function offerPerks() {
    if (G.over || !G.running) return;
    const bag = [];
    MA.PERKS.forEach(p => {
      const have = G.perks[p.id] || 0;
      if (have >= p.max) return;
      const w = MA.RARITY[p.rarity].w;
      for (let i = 0; i < w; i++) bag.push(p);
    });
    const chosen = [];
    while (chosen.length < 3 && bag.length) {
      const p = pick(bag);
      if (!chosen.includes(p)) chosen.push(p);
      if (chosen.length >= new Set(bag).size) break;
    }
    if (!chosen.length) { startWave(G.wave + 1); return; }
    G.choosing = true;
    if (locked && document.exitPointerLock) document.exitPointerLock.call(document);
    MA.Audio.perk();
    MA.UI.showPerks(chosen, takePerk);
    G.perkChoices = chosen;
  }

  function takePerk(p) {
    p.apply(player);
    G.perks[p.id] = (G.perks[p.id] || 0) + 1;
    MA.UI.updatePerkBar(G.perks);
    MA.UI.hidePerks();
    G.choosing = false;
    G.perkChoices = null;
    MA.Audio.pickup();
    MA.UI.float(p.icon + ' ' + p.name, MA.RARITY[p.rarity].color, 28);
    if (!isTouch) requestLock();
    startWave(G.wave + 1);
  }

  /* ============================================================= COMBATE */
  /* Direção do disparo. Em 3ª pessoa a câmera fica no ombro, então a arma
     não está na linha da mira: se o tiro saísse paralelo ao olhar ele passaria
     sempre ao lado do alvo. Aqui a bala converge no ponto que a mira do centro
     da tela está apontando — no inimigo sob a mira, ou num ponto distante. */
  const aimFwd = V3(), aimRel = V3(), aimPoint = V3();
  function aimDir(origin) {
    aimFwd.set(0, 0, -1).applyQuaternion(camera.quaternion).normalize();
    if (firstPerson) return aimFwd.clone();
    let hit = 150;
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (!e || e.dead || !e.obj) continue;
      aimRel.copy(e.obj.position); aimRel.y += 1.25;
      aimRel.sub(camera.position);
      const t = aimRel.dot(aimFwd);
      if (t <= 1.5 || t >= hit) continue;
      const r = e.isBoss ? 4.4 : e.elite ? 1.9 : 1.45;
      if (aimRel.lengthSq() - t * t <= r * r) hit = t;
    }
    aimPoint.copy(camera.position).addScaledVector(aimFwd, hit);
    return aimPoint.clone().sub(origin).normalize();
  }

  function fire() {
    const w = MA.WEAPONS[player.weapon];
    if (player.cooldown > 0) return;
    const rateMul = player.mRate * (G.ult > 0 ? .45 : 1) * (player.bRate > 0 ? .55 : 1) *
      (player.abilityBuff > 0 ? .67 : 1);
    player.cooldown = w.rate * rateMul;
    player.recoil = 1;
    player.muzzle.material.opacity = 1;

    const origin = V3(); player.tip.getWorldPosition(origin);
    const dir = aimDir(origin);

    const n = w.count + player.extraShots;
    const dmgBase = w.dmg * player.mDmg * (player.bDmg > 0 ? 2 : 1) *
      (G.ult > 0 ? 1.8 : 1) * (player.abilityBuff > 0 ? 1.35 : 1);

    for (let i = 0; i < n; i++) {
      const d = dir.clone();
      const sp = w.spread + (n > w.count ? .02 : 0);
      if (sp > 0) { d.x += rand(-sp, sp); d.y += rand(-sp, sp); d.z += rand(-sp, sp); d.normalize(); }
      spawnBullet(origin, d, w, dmgBase);
    }
    G.shots += n;
    MA.Audio.shoot(w.kind);
    addShake(w.kind === 'rocket' ? .34 : w.kind === 'shot' ? .26 : w.kind === 'rail' ? .3 : .07);
    MA.FX.burst(origin, w.color, w.kind === 'shot' ? 7 : 3, 6, .12, 4);
  }

  function spawnBullet(origin, d, w, dmgBase) {
    const size = w.size * player.mSize;
    const geo = w.kind === 'rocket'
      ? new THREE.ConeGeometry(size, size * 3, 10)
      : w.kind === 'rail'
        ? new THREE.CylinderGeometry(size * .5, size * .5, 3.4, 8)
        : w.kind === 'boomerang'
          ? new THREE.TorusGeometry(size * 1.45, size * .32, 7, 18, Math.PI * 1.38)
          : w.kind === 'orb'
            ? new THREE.IcosahedronGeometry(size, 1)
            : w.kind === 'prism'
              ? new THREE.OctahedronGeometry(size, 0)
              : new THREE.SphereGeometry(size, 10, 8);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: w.color }));
    if (w.kind === 'rocket' || w.kind === 'rail') m.rotation.x = Math.PI / 2;
    if (w.kind === 'prism') m.scale.z = 1.8;
    const holder = new THREE.Group(); holder.add(m);
    holder.position.copy(origin);
    holder.lookAt(origin.clone().add(d));
    const tr = new THREE.Sprite(new THREE.SpriteMaterial({
      map: MA.Tex.glow('#ffffff'), color: w.color, transparent: true,
      opacity: .85, blending: THREE.AdditiveBlending, depthWrite: false
    }));
    tr.scale.setScalar(size * (w.kind === 'rail' ? 11 : 7));
    holder.add(tr);
    scene.add(holder);
    bullets.push({
      obj: holder, vel: d.clone().multiplyScalar(w.speed), speed: w.speed, dmg: dmgBase,
      life: w.life, maxLife: w.life, age: 0, splash: w.splash || 0,
      color: w.color, kind: w.kind, returnAt: w.returnAt || 0,
      gravityPull: w.gravityPull || 0, returned: false,
      pierce: (w.pierce || 0) + player.pierce, bounce: player.bounce, hitList: []
    });
  }

  function dealDamage(e, dmg, hitPos, allowCrit) {
    if (e.dead) return 0;
    if (mpClient() && e.netId) {
      /* quem manda na vida do inimigo é o host; aqui só prevemos o efeito */
      mpSend({ t: 'hit', i: e.netId, d: Math.round(dmg) });
    } else if (mpHost() && e.netId && MA.Multi && MA.Multi.me) {
      /* O último golpe local também precisa substituir um acerto remoto anterior. */
      e.lastHitBy = MA.Multi.me.id;
    }
    let final = dmg, crit = false;
    if (allowCrit !== false && Math.random() < player.crit) { final *= 2.5; crit = true; }
    e.hp -= final;
    e.flash = .12;
    MA.updateHB(e);
    G.hits++;
    MA.UI.hitmark(crit);
    if (crit) { MA.Audio.crit(); MA.FX.popup(hitPos.clone().setY(hitPos.y + 1), 'CRIT ' + Math.round(final), '#ffe600', 1.3); }
    else { MA.Audio.hit(); if (Math.random() < .16) MA.FX.popup(hitPos.clone().setY(hitPos.y + 1), '-' + Math.round(final), '#ffffff', .85); }
    MA.FX.burst(hitPos, new THREE.Color(e.def.color), crit ? 9 : 5, 7, .14);

    if (player.lifesteal > 0) {
      const heal = final * player.lifesteal;
      if (player.hp < player.maxhp) {
        player.hp = clamp(player.hp + heal, 0, player.maxhp);
        if (Math.random() < .2) MA.FX.popup(player.pos.clone().setY(3), '+' + Math.max(1, Math.round(heal)), '#39ff88', .8);
      }
    }
    if (e.hp <= 0) killEnemy(e, hitPos);
    return final;
  }

  async function grantSeasonBossReward() {
    if (!MA.Season || !MA.Season.bossReward) return;
    let reward;
    try { reward = await MA.Season.bossReward(); }
    catch (e) {
      if (MA.MetaUI) MA.MetaUI.toast('❌ Falha ao validar recompensa do chefe.', 'bad');
      return;
    }
    if (!reward) return;
    if (reward.error) {
      /* O multiplayer pode anunciar a mesma morte por dois caminhos. A recarga
         do servidor impede prêmio duplicado sem poluir a tela do jogador. */
      if (!/recarga/i.test(reward.error) && MA.MetaUI) MA.MetaUI.toast('❌ ' + reward.error, 'bad');
      return;
    }
    const itemDrop = reward.type === 'item';
    if (MA.MetaUI) {
      MA.MetaUI.toast((itemDrop ? '🎁 <b>DROP DO CHEFE:</b> ' : '⬡ <b>RECOMPENSA DO CHEFE:</b> ') + reward.name);
    }
    if (itemDrop) MA.Audio.pickup();
  }

  function killEnemy(e, at) {
    if (e.dead) return;
    e.dead = true;
    G.combo = Math.min(99, G.combo + 1);
    G.maxCombo = Math.max(G.maxCombo, G.combo);
    G.comboT = 3.2;

    const pts = Math.round(e.pts * Math.min(G.combo, 25) * G.diff.pts * player.mScore);
    G.score += pts;
    G.kills++; G.waveKills++;
    if (MA.Goals) {
      MA.Goals.track('kills', 1);
      if (e.elite) MA.Goals.track('elite', 1);
      if (e.isBoss) {
        MA.Goals.track('boss', 1);
        MA.Goals.trackSet('bosses', e.def.id);
        if (G.diff && (G.diff.id === 'hard' || G.diff.id === 'brain')) {
          MA.Goals.track('hardboss', 1);
        }
      }
    }
    G.brainrot = clamp(G.brainrot + (e.isBoss ? 70 : 4.6 * player.brainGain), 0, 100);

    const col = new THREE.Color(e.def.color);
    MA.FX.burst(at, col, e.isBoss ? 110 : e.elite ? 40 : 22, e.isBoss ? 22 : 11, e.isBoss ? .5 : .26);
    MA.FX.ring(e.obj.position.clone(), col, e.isBoss ? 28 : e.elite ? 11 : 7, e.isBoss ? 1.2 : .5);
    MA.FX.popup(e.obj.position.clone().setY(2.6), '+' + MA.fmt(pts), '#ffe600', e.isBoss ? 2 : 1);
    MA.UI.kill(e.def.name, e.def.emoji, e.elite ? '#ffd400' : e.def.color);
    MA.UI.float(pick(MA.TAUNTS) + (G.combo > 2 ? ' x' + G.combo : ''), e.isBoss ? '#ff00c8' : '#ffe600', e.isBoss ? 42 : 24);

    if (player.deathBoom > 0) {
      explode(e.obj.position.clone().setY(1.2), 6 + player.deathBoom, 26 * player.deathBoom * player.mDmg, 0xff8a3d, false);
    }

    if (e.isBoss) {
      G.bossesKilled++;
      MA.Audio.boom(); addShake(1.1);
      MA.UI.banner('CHEFE DERROTADO', e.def.name + ' foi cancelado', 2800, 'boss');
      const localKill = !mpClient() && (!mpHost() || !e.netId || !e.lastHitBy ||
        (MA.Multi && MA.Multi.me && e.lastHitBy === MA.Multi.me.id));
      if (localKill) grantSeasonBossReward();
      for (let i = 0; i < 3; i++) {
        const sp = MA.World.spawnPoint(player.pos, 6);
        pickups.push(MA.createPickup(scene, sp.x, sp.z, MA.PICKUPS[i === 0 ? 0 : i === 1 ? 1 : 3]));
      }
    } else {
      MA.Audio.kill(); addShake(.1);
      if (Math.random() < .12 * player.dropRate * (e.elite ? 3 : 1))
        pickups.push(MA.createPickup(scene, e.obj.position.x, e.obj.position.z, weightedPickup()));
    }

    if (mpHost() && e.netId) mpSend({ t: 'ekill', i: e.netId, b: !!e.isBoss, by: e.lastHitBy || MA.Multi.me.id });
    scene.remove(e.obj); MA.disposeObject(e.obj);
    const i = enemies.indexOf(e); if (i >= 0) enemies.splice(i, 1);
    if (e.netId) delete remoteEnemies[e.netId];
    if (G.bossAlive === e) G.bossAlive = null;
  }


  /* ==================================================================
     ETAPA 3 — multiplayer: inimigos replicados, PvP, morte e renascer
     ================================================================== */

  /* cliente: inimigos chegam prontos pelo snapshot do host */
  function applySnapshot(m) {
    if (!mpClient() || !G.running) return;
    G.wave = m.w; G.waveTarget = m.tgt; G.spawnQueue = m.q;
    const vistos = {};
    m.e.forEach(d => {
      vistos[d.i] = 1;
      let e = remoteEnemies[d.i];
      if (!e) {
        const def = MA.MEMES.concat(MA.BOSSES).filter(x => x.id === d.d)[0] || MA.MEMES[0];
        e = MA.createEnemy(scene, def, { boss: !!d.b, elite: !!d.e, hpScale: 1, dmgScale: 1, spdScale: 1 });
        e.netId = d.i; e.remote = true;
        e.obj.position.set(d.x, 0, d.z);
        e.target = new THREE.Vector3(d.x, 0, d.z);
        remoteEnemies[d.i] = e; enemies.push(e);
        if (d.b) { G.bossAlive = e; MA.UI.banner('CHEFE', def.emoji + '  ' + def.name, 3000, 'boss'); }
      }
      e.target.set(d.x, 0, d.z);
      e.targetYaw = d.r; e.hp = d.h; e.hpMax = d.m;
    });
    aplicarItensDaRede(m.it);
    /* sumiu do snapshot = já morreu lá no host */
    Object.keys(remoteEnemies).forEach(k => {
      if (!vistos[k]) dropRemote(remoteEnemies[k], false);
    });
  }

  function dropRemote(e, fx) {
    if (!e) return;
    if (fx) {
      MA.FX.burst(e.obj.position.clone().setY(1.2), new THREE.Color(e.def.color), e.isBoss ? 90 : 20, 11, .28);
      MA.Audio.kill();
    }
    scene.remove(e.obj); MA.disposeObject(e.obj);
    const i = enemies.indexOf(e); if (i >= 0) enemies.splice(i, 1);
    if (G.bossAlive === e) G.bossAlive = null;
    delete remoteEnemies[e.netId];
  }

  function updateRemoteEnemies(dt) {
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      if (!e.target) continue;
      e.obj.position.lerp(e.target, Math.min(1, dt * 10));
      if (e.targetYaw !== undefined) {
        let d = e.targetYaw - e.obj.rotation.y;
        while (d > Math.PI) d -= Math.PI * 2;
        while (d < -Math.PI) d += Math.PI * 2;
        e.obj.rotation.y += d * Math.min(1, dt * 10);
      }
      e.animT += dt;
      if (e.anim) e.anim.forEach(fn => { try { fn(e, e.animT, dt); } catch (err) { /* ignora */ } });
      /* encostou em mim? no co-op o corpo a corpo é local, pra não ter atraso */
      const dist = Math.hypot(e.obj.position.x - player.pos.x, e.obj.position.z - player.pos.z);
      if (dist < 1.6 && player.invuln <= 0 && !G.over) hurtPlayer(e.dmg || 8, e.obj.position.clone(), null);
    }
  }

  /* host: aplica o dano que os outros jogadores pediram */
  function onRemoteHit(m) {
    if (!mpHost()) return;
    const e = enemies.filter(x => x.netId === m.i)[0];
    if (!e || e.dead) return;
    e.lastHitBy = m.from;
    dealDamage(e, m.d, e.obj.position.clone().setY(1.4), false);
  }

  /* todos: o host confirmou uma morte */
  function onEnemyKill(m) {
    const e = remoteEnemies[m.i];
    /* A previsão local pode já ter removido o modelo; o host ainda informa
       se era chefe para que o drop sazonal não se perca nem seja antecipado. */
    if (!e) {
      if (m.b && m.by === MA.Multi.me.id) grantSeasonBossReward();
      return;
    }
    if (m.by === MA.Multi.me.id) {       // o abate foi meu: ganho pontos
      const pts = Math.round(e.pts * Math.min(G.combo, 25) * G.diff.pts * player.mScore);
      G.score += pts; G.kills++; G.waveKills++;
      G.combo = Math.min(99, G.combo + 1); G.comboT = 3.2;
      G.maxCombo = Math.max(G.maxCombo, G.combo);
      G.brainrot = clamp(G.brainrot + (e.isBoss ? 70 : 4.6 * player.brainGain), 0, 100);
      MA.UI.kill(e.def.name, e.def.emoji, e.elite ? '#ffd400' : e.def.color);
      MA.FX.popup(e.obj.position.clone().setY(2.6), '+' + MA.fmt(pts), '#ffe600', 1);
      if (e.isBoss) {
        G.bossesKilled++;
        grantSeasonBossReward();
      }
      if (MA.Goals) {
        MA.Goals.track('kills', 1);
        if (e.elite) MA.Goals.track('elite', 1);
        if (e.isBoss) { MA.Goals.track('boss', 1); MA.Goals.trackSet('bosses', e.def.id); }
      }
    }
    dropRemote(e, true);
  }

  /* ------------------------------------------------------------- PvP */
  function pvpBulletCheck(b, p) {
    if (!mpPvP()) return false;
    const peers = MA.Multi.peerList;
    for (let i = 0; i < peers.length; i++) {
      const q = peers[i];
      if (q.dead || !q.obj) continue;
      const d = Math.hypot(p.x - q.pos.x, p.z - q.pos.z);
      if (d < 1.15 && p.y > .2 && p.y < 3.2) {
        mpSend({ t: 'pvp', to: q.id, d: Math.round(b.dmg) });
        MA.FX.burst(p.clone(), 0xff3d7f, 10, 8, .18);
        MA.UI.float('ACERTOU!', '#ff3d7f', 22);
        MA.Audio.tone(820, .07, 'square', .12);
        return true;
      }
    }
    return false;
  }

  let lastAttacker = null;
  function onPvpDamage(m) {
    if (!mpPvP()) return;
    if (m.frag) {                        // alguém caiu: foi abate meu?
      if (m.by === MA.Multi.me.id) {
        G.pvpKills = (G.pvpKills || 0) + 1;
        G.score += 250;
        MA.UI.kill('Abate em ' + (m.name || 'jogador'), '💀', '#ff3d7f');
        MA.UI.float('ABATE! (' + G.pvpKills + '/10)', '#ff3d7f', 34);
        MA.Audio.kill();
        if (G.pvpKills >= 10) {
          if (MA.Goals) MA.Goals.track('pvpwins', 1);
          mpSend({ t: 'over', winner: MA.Multi.me.name });
          MA.UI.banner('VITÓRIA', 'Você venceu o PvP!', 3200, 'boss');
          setTimeout(() => { if (G.running) toMenu(); }, 3400);
        }
      }
      return;
    }
    if (m.to !== MA.Multi.me.id || G.over) return;
    lastAttacker = m.from;
    hurtPlayer(m.d, null, null);
  }

  /* ------------------------------------------- abatido e renascimento */

  /* No co-op você renasce enquanto AINDA houver gente de pé. Se o grupo
     inteiro cai, a partida acaba — antes disso ela era eterna, porque
     o renascimento não tinha condição nenhuma de parada. */
  function coopGrupoCaido() {
    if (!mpOn() || mpPvP()) return false;
    if (downT <= 0) return false;                 // eu ainda estou de pé
    const outros = MA.Multi.peerList;
    for (let i = 0; i < outros.length; i++) {
      if (!outros[i].dead) return false;          // alguém aguenta firme
    }
    return true;
  }

  function fimDoCoop(avisarRede) {
    if (G.over) return;
    if (avisarRede) mpSend({ t: 'over', wipe: true });
    downT = 0;
    player.obj.visible = true;
    MA.UI.banner('O GRUPO CAIU', 'Ninguém sobrou de pé…', 3000, 'boss');
    setTimeout(() => gameOver(), 900);
  }

  let downT = 0;
  function mpDown(source) {
    if (G.over || downT > 0) return;
    downT = mpPvP() ? 4 : 7;
    player.obj.visible = false;
    player.invuln = 999;
    G.combo = 1;
    MA.FX.burst(player.pos.clone().setY(1.3), 0xff2d6f, 50, 12, .4);
    MA.UI.banner('VOCÊ CAIU', 'Renascendo em ' + downT + 's…', 2200, 'boss');
    mpSend({ t: 'p', x: player.pos.x, y: 0, z: player.pos.z, r: 0, h: 0, hm: player.hpMax, d: true, s: G.score | 0, k: G.kills | 0 });
    if (mpPvP() && lastAttacker) {
      mpSend({ t: 'pvp', frag: true, by: lastAttacker, name: MA.Multi.me.name });
      lastAttacker = null;
    }
    /* eu era o último de pé? então foi o grupo inteiro */
    if (coopGrupoCaido()) fimDoCoop(true);
  }

  function mpRespawnTick(dt) {
    if (downT <= 0) return;
    /* o último companheiro pode ter caído DEPOIS de mim */
    if (coopGrupoCaido()) { fimDoCoop(true); return; }
    downT -= dt;
    if (downT > 0) return;
    downT = 0;
    const sp = MA.World.spawnPoint(V3().set(0, 0, 0), 20);
    player.obj.position.set(sp.x, 0, sp.z);
    player.pos.set(sp.x, 0, sp.z);
    player.vel.set(0, 0, 0);
    player.hp = Math.max(1, Math.round(player.hpMax * (mpPvP() ? 1 : .6)));
    player.invuln = 2.2;
    player.obj.visible = true;
    MA.UI.banner('DE VOLTA', 'Vai lá!', 1400);
    MA.FX.ring(player.pos.clone(), new THREE.Color(0x49ffb0), 8, .6);
  }

  /* ------------------------------------- começar/terminar uma partida online */
  function startMultiMatch() {
    const m = MA.Multi;
    if (MA.Goals) MA.Goals.track('mpgames', 1);
    setMap(m.map);
    const d = MA.DIFFS.filter(x => x.id === m.diff)[0];
    if (d) { G.diff = d; MA.store.set('diff', d.id); }
    startGame();
    if (m.mode === 'pvp') {
      G.wave = 0; G.spawnQueue = 0; G.waveTarget = 0;
      clearAll();
      MA.UI.banner('PVP', 'Primeiro a 10 abates vence!', 2800, 'boss');
    }
    downT = 0;
  }
  MA._startMultiMatch = startMultiMatch;

  function bindMulti() {
    const m = MA.Multi;
    if (!m || m._bound) return;
    m._bound = true;
    m.on('start', () => { if (!m.isHost) startMultiMatch(); });
    m.on('snap', applySnapshot);
    m.on('pick', onRemotePick);
    m._pickFn = pickupsParaRede;
    m.on('hit', onRemoteHit);
    m.on('ekill', onEnemyKill);
    m.on('pvp', onPvpDamage);
    m.on('wave', d => { if (mpClient()) MA.UI.banner('ONDA ' + d.n, 'O grupo avança!', 2000); });
    /* o anfitrião caiu e eu assumi: herdo o comando dos inimigos */
    m.on('hostchange', () => { if (G.running && mpOn()) assumirComandoDosInimigos(); });
    m.on('over', d => {
      if (d && d.wipe) {                       /* derrota coletiva no co-op */
        if (G.over) return;
        downT = 0;
        player.obj.visible = true;
        MA.UI.banner('O GRUPO CAIU', 'Ninguém sobrou de pé…', 3000, 'boss');
        setTimeout(() => gameOver(), 900);
        return;
      }
      MA.UI.banner('FIM', (d.winner || '') + ' venceu!', 3200, 'boss');
      setTimeout(() => { if (G.running) toMenu(); }, 3400);
    });
  }
  MA._bindMulti = bindMulti;

  /* Vira host no meio da partida: os inimigos que eu só via pela rede
     passam a ser meus, com IA rodando aqui. Sem isso eles congelariam
     e a onda nunca terminaria. */
  function assumirComandoDosInimigos() {
    const ids = Object.keys(remoteEnemies);
    ids.forEach(k => {
      const e = remoteEnemies[k];
      if (!e) return;
      e.remote = false;
      e.target = null;
      e.targetYaw = undefined;
      if (!e.netId) e.netId = 'h' + Math.random().toString(36).slice(2, 8);
      delete remoteEnemies[k];
    });
    /* a onda continua de onde estava */
    if (G.waveTarget > 0) {
      const vivos = enemies.length;
      G.spawnQueue = Math.max(0, G.waveTarget - G.waveKills - vivos);
    }
    MA.UI.banner('VOCÊ É O ANFITRIÃO', 'o comando da sala é seu agora', 2600, 'boss');
  }
  MA._assumirHost = assumirComandoDosInimigos;

  /* o host descreve os itens do chão para o snapshot */
  function pickupsParaRede() {
    return pickups.map(p => ({
      i: p.netId || (p.netId = 'k' + Math.random().toString(36).slice(2, 8)),
      t: p.type.id,
      x: +p.obj.position.x.toFixed(1),
      z: +p.obj.position.z.toFixed(1)
    }));
  }

  /* o cliente recria/remove os itens que o host anunciou */
  function aplicarItensDaRede(lista) {
    if (!lista) return;
    const vistos = {};
    lista.forEach(d => {
      vistos[d.i] = 1;
      if (remotePickups[d.i]) {
        remotePickups[d.i].obj.position.x = d.x;
        remotePickups[d.i].obj.position.z = d.z;
        return;
      }
      const tipo = MA.PICKUPS.filter(x => x.id === d.t)[0] || MA.PICKUPS[0];
      const p = MA.createPickup(scene, d.x, d.z, tipo);
      p.netId = d.i; p.remote = true;
      remotePickups[d.i] = p; pickups.push(p);
    });
    Object.keys(remotePickups).forEach(k => {
      if (vistos[k]) return;
      const p = remotePickups[k];
      scene.remove(p.obj); MA.disposeObject(p.obj);
      const i = pickups.indexOf(p); if (i >= 0) pickups.splice(i, 1);
      delete remotePickups[k];
    });
  }

  /* um cliente avisou que pegou um item: o host tira da lista */
  function onRemotePick(m) {
    if (!mpHost()) return;
    const i = pickups.findIndex(p => p.netId === m.i);
    if (i < 0) return;
    const p = pickups[i];
    MA.FX.burst(p.obj.position.clone(), p.type.color, 14, 8, .2);
    scene.remove(p.obj); MA.disposeObject(p.obj); pickups.splice(i, 1);
  }

  function weightedPickup() {
    const total = MA.PICKUPS.reduce((s, p) => s + p.w, 0);
    let r = Math.random() * total;
    for (const p of MA.PICKUPS) { r -= p.w; if (r <= 0) return p; }
    return MA.PICKUPS[0];
  }

  function hurtPlayer(dmg, fromPos, source) {
    G.waveNoHit = false;
    if (player.invuln > 0 || G.over || !G.running) return;
    if (player.bShield > 0) {
      MA.FX.ring(player.pos.clone(), new THREE.Color(0xb9c4cc), 4, .3);
      MA.Audio.tone(900, .08, 'sine', .14);
      player.invuln = .35;
      return;
    }
    const final = dmg * player.armor;
    player.hp -= final;
    player.invuln = .55;
    G.combo = 1;
    MA.UI.damageFlash(final > 20);
    MA.Audio.hurt(); addShake(.45);
    MA.UI.float('-' + Math.round(final), '#ff2d6f', 30);
    if (fromPos) {
      const d = player.pos.clone().sub(fromPos).setY(0).normalize();
      player.vel.add(d.multiplyScalar(8));
    }
    if (player.thorns > 0 && source && !source.dead) {
      dealDamage(source, final * player.thorns, source.obj.position.clone().setY(1.5), false);
    }
    if (player.hp <= 0) {
      player.hp = 0;
      if (mpOn()) mpDown(source); else gameOver();
    }
  }

  function explode(pos, radius, dmg, color, selfHurt) {
    MA.Audio.boom(); addShake(.55);
    MA.FX.burst(pos, color, 36, 16, .34);
    MA.FX.burst(pos, 0xffffff, 14, 10, .2);
    MA.FX.ring(pos, new THREE.Color(color), radius * 1.5, .55);
    enemies.slice().forEach(e => {
      const d = e.obj.position.distanceTo(pos);
      if (d < radius) {
        const f = 1 - d / radius;
        dealDamage(e, dmg * f, e.obj.position.clone().setY(1.5));
        if (!e.dead) e.knock.add(e.obj.position.clone().sub(pos).setY(0).normalize()
          .multiplyScalar(f * (e.isBoss ? 2 : 14) * player.knock));
      }
    });
    if (selfHurt !== false && player.pos.distanceTo(pos) < radius * .65) hurtPlayer(5, pos);
  }

  function memeNuke() {
    MA.UI.banner('NUKE DE MEME', 'todo mundo foi ratiado', 1900);
    MA.Audio.boom(); addShake(1.2);
    MA.FX.ring(player.pos.clone(), new THREE.Color(0xff2d6f), MA.World.ARENA, 1.4);
    enemies.slice().forEach(e => {
      dealDamage(e, e.isBoss ? 320 * player.mDmg : 99999, e.obj.position.clone().setY(1.5), false);
    });
  }

  function activateUlt() {
    if (G.brainrot < 100 || G.ult > 0) { MA.Audio.deny(); return; }
    G.brainrot = 0; G.ult = 11;
    if (MA.Goals) { MA.Goals.track('ults', 1); MA.Goals.track('ult', 1); }
    player.ultAura.visible = true;
    MA.UI.banner('BRAINROT MODE', 'dano x1.8 · cadência x2 · invencível', 2300);
    MA.Audio.ult();
    MA.FX.ring(player.pos.clone(), new THREE.Color(0xff00c8), 20, 1);
    MA.Audio.setIntensity(1);
  }

  function activateAbility() {
    const def = player.ability && MA.ABILITIES.find(a => a.id === player.ability);
    if (!def) { MA.Audio.deny(); MA.UI.float('EQUIPE UMA HABILIDADE', '#9b65ff', 20); return; }
    if (player.abilityCd > 0 || G.over || G.paused || G.choosing) {
      MA.Audio.deny();
      if (player.abilityCd > 0) MA.UI.float('RECARGA ' + player.abilityCd.toFixed(1) + 's', '#9fb3c8', 18);
      return;
    }
    player.abilityCd = def.cooldown;
    if (MA.Goals) MA.Goals.track('abilities', 1);

    if (def.id === 'repulse6') {
      const at = player.pos.clone().setY(1.05);
      enemies.slice().forEach(e => {
        const dist = e.obj.position.distanceTo(at);
        if (dist > 6.2) return;
        const force = 1 - dist / 6.2;
        dealDamage(e, (28 + force * 18) * player.mDmg, e.obj.position.clone().setY(1.4));
        if (!e.dead) e.knock.add(e.obj.position.clone().sub(at).setY(0).normalize()
          .multiplyScalar((6 + force * 12) * (e.isBoss ? .28 : 1)));
      });
      player.invuln = Math.max(player.invuln, .35);
      MA.FX.ring(at, new THREE.Color(def.color), 9, .62);
      MA.FX.burst(at, def.color, 38, 14, .28);
      MA.UI.banner('REPULSÃO 6', '46 de dano · impacto circular', 1250);
      MA.Audio.boom(); addShake(.48);
    } else if (def.id === 'blink7') {
      const from = player.pos.clone();
      const dir = V3().set(-Math.sin(yaw), 0, -Math.cos(yaw));
      const target = from.clone().addScaledVector(dir, 7);
      MA.World.resolve(target, player.radius);
      player.pos.copy(target); player.obj.position.set(target.x, player.y, target.z);
      player.vel.addScaledVector(dir, 15);
      player.invuln = Math.max(player.invuln, .70);
      MA.FX.ring(from, new THREE.Color(def.color), 5, .34);
      MA.FX.ring(target, new THREE.Color(0x9b65ff), 6, .42);
      MA.FX.burst(target.clone().setY(1), def.color, 24, 10, .22);
      MA.UI.banner('PASSO 7', 'salto instantâneo · 0,7 s invulnerável', 1100);
      MA.Audio.dash(); addShake(.18);
    } else if (def.id === 'overclock67') {
      player.abilityBuff = 6.7;
      player.invuln = Math.max(player.invuln, .30);
      MA.FX.ring(player.pos.clone(), new THREE.Color(def.color), 12, .75);
      MA.FX.burst(player.pos.clone().setY(1.2), 0x2de2ff, 34, 11, .24);
      MA.UI.banner('SOBRECARGA 67', '6,7 s · dano +35% · cadência +49% · velocidade +25%', 1700);
      MA.Audio.ult(); addShake(.32);
    }
  }

  /* ============================================================ UPDATES */
  function update(dt) {
    G.time += dt;

    /* ---------------- input de movimento */
    let mx = 0, mz = 0;
    if (keys.KeyW || keys.ArrowUp) mz -= 1;
    if (keys.KeyS || keys.ArrowDown) mz += 1;
    if (keys.KeyA || keys.ArrowLeft) mx -= 1;
    if (keys.KeyD || keys.ArrowRight) mx += 1;
    mx += touchMove.x; mz += touchMove.y;
    const l = Math.hypot(mx, mz);
    if (l > 1) { mx /= l; mz /= l; }

    const fwd = V3().set(-Math.sin(yaw), 0, -Math.cos(yaw));
    const right = V3().set(Math.cos(yaw), 0, -Math.sin(yaw));
    const wish = V3().addScaledVector(fwd, -mz).addScaledVector(right, mx);
    if (wish.lengthSq() > 0) wish.normalize();

    const spd = 15.5 * player.mSpeed * (player.bSpeed > 0 ? 1.55 : 1) *
      (G.ult > 0 ? 1.22 : 1) * (player.abilityBuff > 0 ? 1.25 : 1);
    player.vel.x = MA.damp(player.vel.x, wish.x * spd, 9, dt);
    player.vel.z = MA.damp(player.vel.z, wish.z * spd, 9, dt);
    player.vel.x *= Math.pow(.0016, dt);
    player.vel.z *= Math.pow(.0016, dt);

    /* dash */
    if (player.dashCharges < player.dashMax) {
      player.dashTimer -= dt;
      if (player.dashTimer <= 0) { player.dashCharges = Math.min(player.dashMax, player.dashCharges + 1); player.dashTimer = 1.9; }
    }
    player.dashCd -= dt;
    if ((keys.ShiftLeft || keys.ShiftRight || keys._dash) && player.dashCd <= 0 && player.dashCharges >= 1 && wish.lengthSq() > 0) {
      keys._dash = false;
      player.dashCd = .35; player.dashCharges -= 1;
      if (player.dashTimer <= 0) player.dashTimer = 1.9;
      player.vel.addScaledVector(wish, 36);
      player.invuln = Math.max(player.invuln, .26);
      player.energy = clamp(player.energy - 22, 0, player.maxenergy);
      MA.FX.ring(player.pos.clone(), new THREE.Color(0x00ffd5), 5, .35);
      MA.FX.burst(player.pos.clone().setY(1), 0x00ffd5, 14, 7, .18);
      MA.Audio.dash();
    }
    player.energy = clamp(player.energy + dt * player.enRegen, 0, player.maxenergy);

    /* pulo */
    if (keys.Space && player.onGround) { player.vy = 13.5; player.onGround = false; MA.Audio.jump(); }
    player.vy -= 35 * dt;
    player.y += player.vy * dt;
    if (player.y <= 0) {
      if (!player.onGround) MA.FX.burst(player.pos.clone().setY(.2), 0x6a5bff, 7, 5, .14);
      player.y = 0; player.vy = 0; player.onGround = true;
    }

    player.pos.x += player.vel.x * dt;
    player.pos.z += player.vel.z * dt;
    MA.World.resolve(player.pos, player.radius);
    player.obj.position.set(player.pos.x, player.y, player.pos.z);
    player.obj.rotation.y = yaw;

    /* animação */
    const moving = wish.lengthSq() > .01;
    player.bob += dt * (moving ? 11 : 3);
    const sw = Math.sin(player.bob) * (moving ? .55 : .07);
    player.legL.rotation.x = sw; player.legR.rotation.x = -sw;
    player.armL.rotation.x = -sw * .8;
    player.obj.position.y += Math.abs(Math.sin(player.bob)) * (moving ? .07 : .02);
    player.gun.rotation.x = -pitch;
    player.armR.rotation.x = pitch - .2;
    player.recoil = MA.damp(player.recoil, 0, 16, dt);
    player.gun.position.z = (firstPerson ? -2.05 : -.22) + player.recoil * (firstPerson ? .2 : .36);
    player.muzzle.material.opacity = Math.max(0, player.muzzle.material.opacity - dt * 9);
    MA.animateWeaponModel(player, dt, mouseDown || touchFire);
    player.aura.rotation.z += dt * 1.6;

    /* acessórios de skin */
    const ud = player.obj.userData;
    if (ud.panim) ud.panim.forEach(fn => { try { fn(G.time, dt); } catch (e) { /* ignora */ } });
    if (ud.cape) { ud.cape.rotation.x = -.1 + Math.sin(G.time * 4) * .09 + (moving ? .14 : 0); }
    if (ud.wings) {
      const f = Math.sin(G.time * (moving ? 7 : 2.6)) * (moving ? .34 : .14);
      ud.wings.forEach((w, i) => {
        const s2 = i === 0 ? -1 : 1;
        w.rotation.y = s2 * (.72 + f);
        w.rotation.z = s2 * f * .35;
      });
    }
    if (ud.wings) ud.wings.forEach((w, i) => {
      const s2 = i === 0 ? -1 : 1;
      w.rotation.z = s2 * (.22 + Math.sin(G.time * 6) * .26);
    });
    if (ud.halo) { ud.halo.rotation.z += dt * 2.2; ud.halo.position.y = 2.95 + Math.sin(G.time * 2.4) * .07; }
    player.aura.material.opacity = .22 + Math.sin(G.time * 4) * .12;
    player.aura.material.color.setHex(
      player.bShield > 0 ? 0xb9c4cc : player.bDmg > 0 ? 0x39ff88 : player.bRate > 0 ? 0xffc42e : 0x00ffd5);
    player.shieldMesh.visible = player.bShield > 0;
    if (player.shieldMesh.visible) player.shieldMesh.rotation.y += dt * 2;

    /* timers */
    player.cooldown -= dt;
    player.invuln -= dt;
    player.abilityCd = Math.max(0, player.abilityCd - dt);
    player.abilityBuff = Math.max(0, player.abilityBuff - dt);
    player.bDmg = Math.max(0, player.bDmg - dt);
    player.bSpeed = Math.max(0, player.bSpeed - dt);
    player.bShield = Math.max(0, player.bShield - dt);
    player.bRate = Math.max(0, player.bRate - dt);
    if (player.autoShield > 0) {
      player.autoShieldT -= dt;
      if (player.autoShieldT <= 0) { player.autoShieldT = 8; player.bShield = Math.max(player.bShield, player.autoShield); }
    }
    if (G.ult > 0) {
      G.ult -= dt;
      player.invuln = Math.max(player.invuln, .1);
      player.ultAura.rotation.y += dt * 3;
      player.ultAura.scale.setScalar(1 + Math.sin(G.time * 8) * .1);
      if (G.ult <= 0) { player.ultAura.visible = false; MA.Audio.setIntensity(clamp(G.wave / 14, .15, 1)); }
    }
    if (G.comboT > 0) { G.comboT -= dt; if (G.comboT <= 0) G.combo = 1; }
    if (player.invuln > 0) player.body.material.opacity = 1;

    if ((mouseDown || touchFire) && !G.over) fire();

    /* ---------------- câmera */
    if (firstPerson) {
      /* visão em 1ª pessoa: câmera dentro da cabeça */
      const eye = V3().set(player.pos.x, player.y + 2.26, player.pos.z);
      eye.add(V3().set(-Math.sin(yaw), 0, -Math.cos(yaw)).multiplyScalar(.22));
      eye.y += Math.sin(player.bob) * .035;
      camera.position.lerp(eye, 1 - Math.exp(-30 * dt));
      camPos.copy(camera.position);
      const look = camera.position.clone().add(
        V3().set(-Math.sin(yaw), Math.tan(pitch) * 1.2, -Math.cos(yaw)).multiplyScalar(9));
      camera.lookAt(look);
    } else {
      /* 3ª pessoa estilo shooter: a câmera senta no ombro e o boneco fica
         deslocado pro lado, deixando a mira do centro da tela sempre livre */
      const right = V3().set(Math.cos(yaw), 0, -Math.sin(yaw));
      const pivot = V3().set(player.pos.x, player.y + 2.38, player.pos.z)
        .addScaledVector(right, S.shoulder);
      const dist = 7.6;
      const off = V3().set(
        Math.sin(yaw) * Math.cos(pitch),
        -Math.sin(pitch) + .2,
        Math.cos(yaw) * Math.cos(pitch)
      ).multiplyScalar(dist);
      const desired = pivot.clone().add(off);
      desired.y = Math.max(1.3, desired.y);
      camera.position.lerp(desired, 1 - Math.exp(-15 * dt));
      camPos.copy(camera.position);
      const look = pivot.clone().add(V3().set(-Math.sin(yaw), Math.tan(pitch) * 1.2, -Math.cos(yaw)).multiplyScalar(9));
      camera.lookAt(look);
    }

    if (shake > .001) {
      shakeT += dt * 42;
      const s = shake * S.shake;
      camera.position.x += Math.sin(shakeT * 1.7) * s * .42;
      camera.position.y += Math.cos(shakeT * 2.3) * s * .3;
      camera.position.z += Math.sin(shakeT * 2.9) * s * .42;
      shake *= Math.pow(.0008, dt);
    }

    updateBullets(dt);
    updateEnemies(dt);
    updatePickups(dt);
    MA.FX.update(dt);
    MA.World.update(dt, G.time);
    spawnTick(dt);

    /* fim de onda */
    if (!mpClient() && !mpPvP() && !G.over && !G.choosing && G.spawnQueue <= 0 && enemies.length === 0) {
      if (G.interWave <= 0) { G.interWave = 99; waveCleared(); }
    }

    if (MA.Multi && MA.Multi.active) {
      MA.Multi.tick(dt, player, G);
      MA.Multi.updateAvatars(scene, dt);
      MA.Multi.hostSnapshot(dt, enemies, G);
      mpRespawnTick(dt);
    }

    MA.UI.update(G, player);
    MA.UI.radar(G, player, enemies, pickups, yaw);
  }

  /* ---------------------------------------------------------- projéteis */
  function detonateBullet(b, pos) {
    if (!b.gravityPull) { explode(pos, b.splash, b.dmg, b.color); return; }
    MA.Audio.boom(); addShake(.48);
    MA.FX.burst(pos, b.color, 34, 13, .30);
    MA.FX.ring(pos, new THREE.Color(b.color), b.splash * 1.45, .52);
    enemies.slice().forEach(e => {
      const dist = e.obj.position.distanceTo(pos);
      if (dist >= b.splash) return;
      const force = 1 - dist / b.splash;
      dealDamage(e, b.dmg * (.45 + force * .55), e.obj.position.clone().setY(1.4));
      if (!e.dead) e.knock.add(pos.clone().sub(e.obj.position).setY(0).normalize()
        .multiplyScalar(force * b.gravityPull * (e.isBoss ? .28 : 1)));
    });
  }

  function updateBullets(dt) {
    const ARENA = MA.World.ARENA;
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.life -= dt; b.age += dt;
      let done = false;
      if (b.kind === 'boomerang') {
        if (b.obj.children[0]) b.obj.children[0].rotation.z += dt * 15;
        if (b.age >= b.returnAt) {
          if (!b.returned) { b.returned = true; b.hitList.length = 0; b.pierce += 2; }
          const hand = player.pos.clone().setY(player.y + 1.25);
          const back = hand.sub(b.obj.position);
          if (back.length() < .9 && b.age > b.returnAt + .12) done = true;
          else b.vel.lerp(back.normalize().multiplyScalar(b.speed * 1.08), Math.min(1, dt * 7));
        }
      }
      b.obj.position.addScaledVector(b.vel, dt);
      const p = b.obj.position;
      if (b.kind === 'rocket') b.obj.rotation.z += dt * 10;
      if (b.kind === 'orb') b.obj.rotation.y += dt * 6;
      if (b.kind === 'prism') b.obj.rotation.z += dt * 8;

      for (let j = 0; !done && j < enemies.length; j++) {
        const e = enemies[j];
        if (e.dead || b.hitList.indexOf(e) >= 0) continue;
        const dd = Math.hypot(p.x - e.obj.position.x, p.z - e.obj.position.z);
        if (dd < e.radius + .55 && p.y > 0 && p.y < e.radius * 3.6) {
          if (b.splash) { detonateBullet(b, p.clone()); done = true; }
          else {
            dealDamage(e, b.dmg, p.clone());
            if (!e.dead) e.knock.add(V3().set(e.obj.position.x - p.x, 0, e.obj.position.z - p.z)
              .normalize().multiplyScalar((e.isBoss ? .5 : 4) * player.knock));
            b.hitList.push(e);
            if (b.pierce > 0) { b.pierce--; b.dmg *= .82; }
            else done = true;
          }
          break;
        }
      }

      if (!done && pvpBulletCheck(b, p)) done = true;

      if (!done) {
        const hitWall = MA.World.outside(p) || MA.World.blocks(p);
        if (p.y < .12 || hitWall) {
          if (b.kind === 'boomerang' && !b.returned) {
            b.returned = true; b.age = b.returnAt; b.hitList.length = 0; b.pierce += 2;
            b.vel.multiplyScalar(-.65);
            p.x = clamp(p.x, -ARENA + 1.2, ARENA - 1.2);
            p.z = clamp(p.z, -ARENA + 1.2, ARENA - 1.2);
            MA.FX.burst(p.clone(), b.color, 6, 5, .12);
          } else if (b.bounce > 0 && hitWall && p.y >= .12) {
            b.bounce--;
            if (Math.abs(p.x) > ARENA - 1) b.vel.x *= -1;
            if (Math.abs(p.z) > ARENA - 1) b.vel.z *= -1;
            if (MA.World.blocks(p)) { b.vel.x *= -1; b.vel.z *= -1; }
            p.x = clamp(p.x, -ARENA + 1.2, ARENA - 1.2);
            p.z = clamp(p.z, -ARENA + 1.2, ARENA - 1.2);
            b.obj.lookAt(p.clone().add(b.vel));
            MA.FX.burst(p.clone(), b.color, 4, 4, .1);
          } else {
            if (b.splash) detonateBullet(b, p.clone());
            else MA.FX.burst(p.clone(), b.color, 4, 5, .12);
            done = true;
          }
        }
      }

      if (!done && b.life <= 0 && b.splash) { detonateBullet(b, p.clone()); done = true; }
      if (done || b.life <= 0) {
        scene.remove(b.obj); MA.disposeObject(b.obj);
        bullets.splice(i, 1);
      }
    }

    for (let i = eBullets.length - 1; i >= 0; i--) {
      const b = eBullets[i];
      b.life -= dt;
      b.obj.position.addScaledVector(b.vel, dt);
      if (b.grav) b.vel.y -= b.grav * dt;
      const p = b.obj.position;
      let gone = false;
      const pd = Math.hypot(p.x - player.pos.x, p.z - player.pos.z);
      if (pd < 1.25 && Math.abs(p.y - (player.y + 1.4)) < 1.7) {
        hurtPlayer(b.dmg, p.clone(), b.owner);
        MA.FX.burst(p.clone(), 0xff2d6f, 9, 7, .16);
        gone = true;
      }
      if (p.y < .12) {
        if (b.splash) explode(p.clone(), b.splash, b.dmg * .8, b.color || 0xff8a3d, false),
          (pd < b.splash ? hurtPlayer(b.dmg * .7, p.clone(), b.owner) : 0);
        gone = true;
      }
      if (MA.World.outside(p) || MA.World.blocks(p) || b.life <= 0) gone = true;
      if (gone) { scene.remove(b.obj); MA.disposeObject(b.obj); eBullets.splice(i, 1); }
    }
  }

  function enemyBullet(e, dir, speed, dmg, size, grav, splash) {
    const from = V3(); e.head.getWorldPosition(from);
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(size || .32, 10, 8),
      new THREE.MeshBasicMaterial({ color: e.def.ring })
    );
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: MA.Tex.glow('#ffffff'), color: new THREE.Color(e.def.color),
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
    }));
    sp.scale.setScalar((size || .32) * 6); m.add(sp);
    m.position.copy(from);
    scene.add(m);
    eBullets.push({
      obj: m, vel: dir.clone().normalize().multiplyScalar(speed), dmg,
      life: 5, grav: grav || 0, splash: splash || 0, owner: e, color: e.def.color
    });
    MA.Audio.tone(e.isBoss ? 170 : 320, .13, 'sawtooth', .09, 85);
  }

  /* ----------------------------------------------------------- inimigos */
  function updateEnemies(dt) {
    if (mpClient()) { updateRemoteEnemies(dt); return; }
    const pp = player.pos;
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      e.t += dt;
      if (e.spawnT > 0) {
        e.spawnT -= dt;
        const f = clamp(1 - e.spawnT / .55, 0, 1);
        e.obj.scale.setScalar(.01 + f * (1 - .01) * (1 + Math.sin(f * Math.PI) * .18));
        if (e.spawnT <= 0) e.obj.scale.setScalar(1);
      }
      e.flash = Math.max(0, e.flash - dt);
      e.body.material.emissiveIntensity = e.flash > 0 ? 3 : .7;

      const ep = e.obj.position;
      const toP = V3().set(pp.x - ep.x, 0, pp.z - ep.z);
      const dist = toP.length();
      if (dist > .001) toP.normalize();

      const move = e.isBoss ? bossAI(e, dist, toP, dt) : normalAI(e, dist, toP, dt);

      /* separação */
      let sx = 0, sz = 0;
      for (let j = 0; j < enemies.length; j++) {
        const o = enemies[j]; if (o === e) continue;
        const dx = ep.x - o.obj.position.x, dz = ep.z - o.obj.position.z;
        const d2 = dx * dx + dz * dz;
        const minD = (e.radius + o.radius) * 1.25;
        if (d2 < minD * minD && d2 > .0001) {
          const d = Math.sqrt(d2);
          sx += dx / d * (1 - d / minD); sz += dz / d * (1 - d / minD);
        }
      }
      move.x += sx * 1.5; move.z += sz * 1.5;
      if (move.lengthSq() > 0) move.normalize();

      let spd = e.speed * (e.charging > 0 ? 3.1 : 1);
      if (dist < e.radius + 1.4 && e.charging <= 0) spd *= .2;

      ep.x += move.x * spd * dt + e.knock.x * dt;
      ep.z += move.z * spd * dt + e.knock.z * dt;
      e.knock.multiplyScalar(Math.pow(.004, dt));
      MA.World.resolve(ep, e.radius);

      const tr = Math.atan2(pp.x - ep.x, pp.z - ep.z);
      let diff = tr - e.obj.rotation.y;
      while (diff > Math.PI) diff -= TAU;
      while (diff < -Math.PI) diff += TAU;
      e.obj.rotation.y += diff * Math.min(1, dt * 7);

      const b = Math.sin(e.t * (6 + e.speed));
      ep.y = Math.abs(b) * .18 * (e.isBoss ? 2.2 : 1);
      e.l1.rotation.x = b * .7; e.l2.rotation.x = -b * .7;
      e.a1.rotation.x = -b * .5; e.a2.rotation.x = b * .5;

      /* animações próprias do meme (hélices, rabo, anéis...) */
      if (e.anim && e.anim.length) {
        e.animT += dt;
        for (let ai = 0; ai < e.anim.length; ai++) e.anim[ai](e, e.animT, dt);
      }
      e.head.rotation.y = Math.sin(e.t * 2) * .14;
      if (e.elite) e.glow.material.opacity = .4 + Math.sin(e.t * 6) * .25;

      /* dano de contato */
      e.touchCd -= dt;
      if (dist < e.radius + player.radius + .6 && e.touchCd <= 0) {
        e.touchCd = e.isBoss ? .8 : 1.0;
        hurtPlayer(e.dmg, ep.clone(), e);
        MA.FX.burst(pp.clone().setY(1.4), 0xff2d6f, 10, 8, .18);
        if (e.charging > 0) e.charging = 0;
      }
    }
  }

  function normalAI(e, dist, toP, dt) {
    const m = V3();
    const side = V3().set(-toP.z, 0, toP.x);
    switch (e.def.ai) {
      case 'chase': m.copy(toP); break;
      case 'flank': m.copy(toP).add(side.multiplyScalar(e.orbitDir * (dist > 12 ? .8 : .3))); break;
      case 'orbit': {
        const radial = dist > 15 ? 1 : dist < 8 ? -.9 : 0;
        m.copy(side.multiplyScalar(e.orbitDir)).addScaledVector(toP, radial);
        break;
      }
      case 'ranged': {
        const radial = dist > 22 ? 1 : dist < 15 ? -1 : 0;
        m.copy(side.multiplyScalar(.5 * e.orbitDir)).addScaledVector(toP, radial);
        e.atkCd -= dt;
        if (e.atkCd <= 0 && dist < 46) {
          e.atkCd = rand(1.5, 2.9);
          const from = V3(); e.head.getWorldPosition(from);
          const d = player.pos.clone().setY(1.4).sub(from);
          enemyBullet(e, d, 24, e.dmg * .8, .32);
        }
        break;
      }
      case 'bomber': {
        const radial = dist > 24 ? 1 : dist < 16 ? -1 : 0;
        m.copy(side.multiplyScalar(.6 * e.orbitDir)).addScaledVector(toP, radial);
        e.atkCd -= dt;
        if (e.atkCd <= 0 && dist < 40) {
          e.atkCd = rand(2.4, 3.8);
          const from = V3(); e.head.getWorldPosition(from);
          const target = player.pos.clone().setY(0);
          const d = target.sub(from);
          const t = clamp(d.length() / 22, .6, 2.6);
          d.y += .5 * 16 * t * t;
          enemyBullet(e, d, 22, e.dmg * .9, .45, 16, 6);
        }
        break;
      }
      case 'teleport': {
        m.copy(toP);
        e.tpCd -= dt;
        if (e.tpCd <= 0 && dist > 7) {
          e.tpCd = rand(3.2, 6);
          MA.FX.burst(e.obj.position.clone().setY(1.2), new THREE.Color(e.def.color), 18, 9, .22);
          MA.FX.ring(e.obj.position.clone(), new THREE.Color(e.def.color), 5, .4);
          const a = rand(0, TAU), r = rand(5, 9);
          e.obj.position.x = clamp(player.pos.x + Math.cos(a) * r, -MA.World.ARENA + 3, MA.World.ARENA - 3);
          e.obj.position.z = clamp(player.pos.z + Math.sin(a) * r, -MA.World.ARENA + 3, MA.World.ARENA - 3);
          MA.World.resolve(e.obj.position, e.radius);
          MA.FX.burst(e.obj.position.clone().setY(1.2), new THREE.Color(e.def.color), 18, 9, .22);
          MA.Audio.tone(700, .18, 'sine', .11, 180);
        }
        break;
      }
      case 'charge': {
        e.chargeCd -= dt;
        if (e.charging > 0) { e.charging -= dt; m.copy(e.chargeDir); }
        else if (e.chargeCd <= 0 && dist < 28) {
          e.chargeCd = rand(3.5, 6);
          e.charging = .95;
          e.chargeDir.copy(toP);
          MA.FX.ring(e.obj.position.clone(), new THREE.Color(e.def.color), 3.4, .3);
          MA.Audio.tone(140, .3, 'sawtooth', .11, 400);
        } else m.copy(toP).multiplyScalar(.7);
        break;
      }
      default: m.copy(toP);
    }
    return m;
  }

  function bossAI(e, dist, toP, dt) {
    const m = V3();
    const hpf = e.hp / e.maxhp;
    const np = hpf > .66 ? 1 : hpf > .33 ? 2 : 3;
    if (np !== e.phase) {
      e.phase = np;
      MA.UI.banner('FASE ' + e.phase, e.def.name + ' está irritado', 1900, 'boss');
      MA.Audio.boom(); addShake(.85);
      MA.FX.ring(e.obj.position.clone(), new THREE.Color(e.def.ring), 22, 1);
      const n = 2 + e.phase * 2;
      for (let i = 0; i < n; i++) {
        const pool = MA.MEMES.filter(x => x.tier <= Math.ceil(G.wave / 1.6));
        const def = pick(pool.length ? pool : [MA.MEMES[0]]);
        const mi = MA.createEnemy(scene, def, {
          hpScale: G.diff.ehp * (1 + G.wave * .12),
          dmgScale: G.diff.edmg, spdScale: G.diff.espd
        });
        const a = rand(0, TAU);
        mi.obj.position.set(
          clamp(e.obj.position.x + Math.cos(a) * 9, -MA.World.ARENA + 3, MA.World.ARENA - 3), 0,
          clamp(e.obj.position.z + Math.sin(a) * 9, -MA.World.ARENA + 3, MA.World.ARENA - 3));
        enemies.push(mi);
      }
    }

    e.atkCd -= dt;
    const rate = e.phase === 1 ? 2.1 : e.phase === 2 ? 1.35 : .85;
    if (e.atkCd <= 0 && dist < 55) {
      e.atkCd = rate;
      const n = e.phase === 3 ? 7 : e.phase === 2 ? 5 : 3;
      const base = toP.clone();
      for (let i = 0; i < n; i++) {
        const a = (i - (n - 1) / 2) * .18;
        const d = base.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), a);
        d.y = -.06;
        enemyBullet(e, d, 28, e.dmg * .55, .5);
      }
    }

    e.chargeCd -= dt;
    if (e.charging > 0) {
      e.charging -= dt;
      m.copy(e.chargeDir);
      if (e.charging <= 0) {
        const pos = e.obj.position.clone().setY(1);
        MA.Audio.boom(); addShake(1);
        MA.FX.ring(pos, new THREE.Color(0xff2d6f), 20, .8);
        MA.FX.burst(pos, 0xff2d6f, 44, 16, .4);
        if (player.pos.distanceTo(pos) < 13) hurtPlayer(e.dmg * .9, pos, e);
      }
    } else if (e.chargeCd <= 0 && dist < 36) {
      e.chargeCd = e.phase === 3 ? 4 : 7;
      e.charging = 1.1;
      e.chargeDir.copy(toP);
      MA.Audio.tone(90, .5, 'sawtooth', .17, 300);
      MA.FX.ring(e.obj.position.clone(), new THREE.Color(0xff2d6f), 6.5, .42);
    } else {
      const radial = dist > 17 ? 1 : dist < 9 ? -.6 : .1;
      m.copy(V3().set(-toP.z, 0, toP.x).multiplyScalar(.55 * e.orbitDir)).addScaledVector(toP, radial);
    }
    return m;
  }

  /* -------------------------------------------------------------- itens */
  function updatePickups(dt) {
    for (let i = pickups.length - 1; i >= 0; i--) {
      const p = pickups[i];
      p.t += dt; p.life -= dt;
      p.obj.position.y = 1.15 + Math.sin(p.t * 2.4) * .3;
      p.core.rotation.y += dt * 2; p.core.rotation.x += dt * 1.3;
      if (p.life < 5) p.obj.visible = Math.floor(p.life * 8) % 2 === 0;

      const d = Math.hypot(p.obj.position.x - player.pos.x, p.obj.position.z - player.pos.z);
      if (d < player.magnet && d > 2) {
        const pull = V3().set(player.pos.x - p.obj.position.x, 0, player.pos.z - p.obj.position.z)
          .normalize().multiplyScalar(dt * 14);
        p.obj.position.add(pull);
      }
      if (d < 2.3) {
        if (p.remote) { mpSend({ t: 'pick', i: p.netId }); delete remotePickups[p.netId]; }
        applyPickup(p.type);
        MA.FX.burst(p.obj.position.clone(), p.type.color, 18, 9, .2);
        MA.FX.ring(p.obj.position.clone(), new THREE.Color(p.type.color), 5, .4);
        scene.remove(p.obj); MA.disposeObject(p.obj); pickups.splice(i, 1);
        continue;
      }
      if (p.life <= 0) { scene.remove(p.obj); MA.disposeObject(p.obj); pickups.splice(i, 1); }
    }
  }

  function applyPickup(t) {
    MA.Audio.pickup();
    if (MA.Goals) MA.Goals.track('item', 1);
    MA.UI.float(t.label + ' — ' + t.text, '#39ff88', 26);
    switch (t.id) {
      case 'heal':   player.hp = clamp(player.hp + 35, 0, player.maxhp); break;
      case 'dmg':    player.bDmg = 15; break;
      case 'speed':  player.bSpeed = 15; break;
      case 'shield': player.bShield = 10; break;
      case 'ammo':   player.bRate = 12; break;
      case 'nuke':   memeNuke(); break;
    }
    G.score += Math.round(60 * player.mScore);
  }

  function addShake(a) { shake = Math.min(1.3, shake + a); }

  /* ============================================================== FLUXO */
  function clearAll() {
    Object.keys(remoteEnemies).forEach(k => delete remoteEnemies[k]);
    Object.keys(remotePickups).forEach(k => delete remotePickups[k]);
    [enemies, bullets, eBullets, pickups].forEach(arr => {
      arr.forEach(o => { scene.remove(o.obj); MA.disposeObject(o.obj); });
      arr.length = 0;
    });
    MA.FX.clear();
  }

  function resetGame() {
    clearAll();
    if (player) { scene.remove(player.obj); MA.disposeObject(player.obj); }
    player = MA.createPlayer(scene, currentSkin(), currentArmor());
    player.allowedWeapons = currentWeapons();
    player.weapon = player.allowedWeapons.length ? player.allowedWeapons[0] : 0;
    player.ability = currentAbility();
    player.abilityCd = 0;
    MA.syncWeaponModel(player);
    Object.assign(G, {
      score: 0, wave: 0, combo: 1, comboT: 0, kills: 0, waveKills: 0, waveTarget: 0,
      spawnQueue: 0, spawnT: 0, interWave: 0, brainrot: 0, ult: 0, bossAlive: null,
      time: 0, startTime: performance.now(), perks: {}, over: false, paused: false,
      choosing: false, shots: 0, hits: 0, maxCombo: 1, bossesKilled: 0
    });
    yaw = 0; pitch = -.16; shake = 0;
    MA.UI.el.vig.style.opacity = '0';
    MA.UI.updatePerkBar(G.perks);
    MA.UI.el.killfeed.innerHTML = '';
    applyView();
    startWave(1);
  }

  function startGame() {
    MA.Audio.init(); MA.Audio.resume();
    ['start', 'over', 'pausebox', 'settings', 'board', 'perkScreen', 'help', 'auth', 'hub', 'shop', 'lootbox', 'inventory', 'multi']
      .forEach(id => $(id).classList.add('hid'));
    $('hud').classList.remove('hid');
    if (isTouch) $('touch').classList.remove('hid');
    resetGame();
    G.running = true;
    if (!isTouch) requestLock();
  }

  function gameOver() {
    if (G.over) return;
    G.over = true; G.running = false;
    MA.Audio.gameOver();
    MA.Audio.setIntensity(.1);
    if (document.exitPointerLock) document.exitPointerLock.call(document);

    const secs = Math.floor((performance.now() - G.startTime) / 1000);
    const mm = String(Math.floor(secs / 60)).padStart(2, '0'), ss = String(secs % 60).padStart(2, '0');
    const rank = MA.rankFor(G.score);
    const acc = G.shots ? Math.round(G.hits / G.shots * 100) : 0;

    $('gostats').innerHTML =
      stat('PONTUAÇÃO', MA.fmt(G.score), 'big') +
      stat('ONDA', G.wave) + stat('MEMES DELETADOS', G.kills) +
      stat('CHEFES', G.bossesKilled) + stat('COMBO MÁX.', 'x' + G.maxCombo) +
      stat('PRECISÃO', acc + '%') + stat('TEMPO', mm + ':' + ss) +
      stat('DIFICULDADE', G.diff.icon + ' ' + G.diff.name);
    $('rank').innerHTML = rank.icon + ' RANK: ' + rank.name;

    const isNew = MA.UI.saveScore(G.score, G.wave, G.diff.name, rank.name);
    $('newbest').classList.toggle('hid', !isNew);
    $('bestline').textContent = 'RECORDE: ' + MA.fmt(MA.store.get('best', 0));

    let ph = '';
    Object.keys(G.perks).forEach(id => {
      const d = MA.PERKS.find(x => x.id === id);
      if (d) ph += '<span class="pbadge">' + d.icon + '<i>' + G.perks[id] + '</i></span>';
    });
    $('goperks').innerHTML = ph ? '<div class="dim" style="margin-bottom:6px">PERKS OBTIDOS</div>' + ph : '';

    if (MA.Profile.data) {
      /* primeiro soma as estatísticas da partida, só depois confere as metas:
         senão conquistas baseadas em total (abates, chefes) atrasam uma partida */
      const res = MA.Profile.applyRun(G, secs);
      if (MA.Goals) {
        MA.Goals.trackSet('maps', MA.store.get('map', 'arena'));
        MA.Goals.fimDePartida(G, secs);
      }
      MA.MetaUI.showRewards(res);
      if (res.levels > 0) MA.Audio.pickup();
    } else { $('rewardBox').innerHTML = ''; }

    $('over').classList.remove('hid');
    $('hud').classList.add('hid');
    $('touch').classList.add('hid');
  }

  function stat(k, v, cls) {
    return '<div class="st ' + (cls || '') + '"><span>' + k + '</span><b>' + v + '</b></div>';
  }

  function togglePause(force) {
    if (!G.running || G.over || G.choosing) return;
    G.paused = force === undefined ? !G.paused : force;
    if (G.paused) {
      $('pausebox').classList.remove('hid');
      if (document.exitPointerLock) document.exitPointerLock.call(document);
    } else {
      $('pausebox').classList.add('hid');
      $('settings').classList.add('hid');
      if (!isTouch) requestLock();
    }
  }

  function toMenu() {
    G.running = false; G.paused = false; G.over = false; G.choosing = false;
    clearAll();
    ['pausebox', 'over', 'hud', 'touch', 'settings', 'board', 'perkScreen', 'help'].forEach(id => $(id).classList.add('hid'));
    if (MA.Profile && MA.Profile.data) { MA.MetaUI.openHub(); return; }
    $('start').classList.remove('hid');
    MA.Audio.setIntensity(.15);
    if (document.exitPointerLock) document.exitPointerLock.call(document);
    refreshMenuStats();
  }

  function renderMapList() {
    const ml = $('mapList');
    if (!ml) return;
    const lv = (MA.Profile && MA.Profile.data) ? MA.Profile.data.level : 99;
    ml.innerHTML = '';
    MA.MAPS.forEach(m => {
      const ok = MA.mapUnlocked(m, lv);
      const b = document.createElement('button');
      b.className = 'mapc' + (G.map && G.map.id === m.id ? ' sel' : '') + (ok ? '' : ' lock');
      b.innerHTML = '<i>' + m.icon + '</i><b>' + m.name + '</b><span>' +
        (ok ? m.desc : '🔒 libera no nível ' + m.level) + '</span>';
      b.onclick = () => {
        MA.Audio.init(); MA.Audio.ui();
        if (!ok) {
          MA.Audio.deny();
          MA.MetaUI.toast('🔒 ' + m.name + ' libera no nível ' + m.level + '.', 'bad');
          return;
        }
        setMap(m.id);
        renderMapList();
      };
      ml.appendChild(b);
    });
  }
  MA._renderMapList = renderMapList;

  /* =============================================================== INPUT */
  /* ----------------------------------------- 1ª pessoa x 3ª pessoa */
  function applyView() {
    if (!player) return;
    const ud = player.obj.userData;
    const esconder = [player.head, player.body, ud.hood, ud.neck].filter(Boolean);
    player.obj.traverse(o => {
      if (o === player.obj) return;
      o.userData.__hid3 = o.userData.__hid3 === undefined ? o.visible : o.userData.__hid3;
    });
    if (firstPerson) {
      /* some com tudo menos a arma — é o que a gente veria de dentro */
      player.obj.children.forEach(o => {
        if (o === player.gun) return;
        o.visible = false;
      });
      /* arma na pose de FPS: à frente e um pouco abaixo da linha dos olhos */
      player.gun.position.set(.52, 1.74, -2.05);
      player.gun.scale.setScalar(.5);
      if (player.armR) {
        player.armR.visible = true;
        player.armR.visible = false;
      }
    } else {
      player.obj.children.forEach(o => {
        o.visible = o.userData.__hid3 === undefined ? true : o.userData.__hid3;
      });
      const bodyScale = player.skin && player.skin.bulky ? 1.18 : 1;
      player.gun.position.set(1.02 * bodyScale, 1.22, -.20);
      player.gun.scale.setScalar(.86);
      if (player.armR) {
        player.armR.position.set(.75 * bodyScale, 1.29, 0);
        player.armR.rotation.z = .075;
        player.armR.scale.set(1, 1, 1);
      }
    }
    MA.UI.notice(firstPerson ? '👁️ Visão em 1ª pessoa (V para trocar)'
                             : '🎥 Visão em 3ª pessoa (V para trocar)');
  }

  function refreshViewBtn() {
    const b = $('sView');
    if (b) b.textContent = firstPerson ? '1ª PESSOA' : '3ª PESSOA';
  }

  function toggleView() {
    firstPerson = !firstPerson;
    MA.store.set('fpv', firstPerson);
    MA.Audio.ui();
    refreshViewBtn();
    applyView();
  }
  MA._toggleView = toggleView;
  MA._applyView = applyView;

  function requestLock() {
    const el = renderer.domElement;
    if (el.requestPointerLock) el.requestPointerLock();
  }

  function bindInput() {
    const el = renderer.domElement;

    document.addEventListener('pointerlockchange', () => {
      locked = document.pointerLockElement === el;
      if (!locked && G.running && !G.paused && !G.over && !G.choosing && !isTouch) togglePause(true);
    });

    document.addEventListener('mousemove', ev => {
      if (!locked) return;
      yaw -= ev.movementX * .0021 * S.sens;
      pitch -= ev.movementY * .0017 * S.sens * (S.invertY ? -1 : 1);
      pitch = clamp(pitch, -.95, .78);
    });

    el.addEventListener('mousedown', ev => {
      if (!G.running || G.paused || G.choosing) return;
      if (!locked && !isTouch) { requestLock(); return; }
      if (ev.button === 0) mouseDown = true;
      if (ev.button === 2) cycleWeapon(1);
    });
    addEventListener('mouseup', () => { mouseDown = false; });
    el.addEventListener('contextmenu', e => e.preventDefault());
    el.addEventListener('wheel', e => {
      if (!G.running || G.paused) return;
      cycleWeapon(e.deltaY > 0 ? 1 : -1);
    }, { passive: true });

    addEventListener('keydown', e => {
      if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
      keys[e.code] = true;

      if (G.choosing && G.perkChoices) {
        const n = ['Digit1', 'Digit2', 'Digit3'].indexOf(e.code);
        if (n >= 0 && G.perkChoices[n]) takePerk(G.perkChoices[n]);
        return;
      }
      if (!G.running) {
        if (e.code === 'Enter' && !$('start').classList.contains('hid')) startGame();
        return;
      }
      if (e.code === 'KeyQ') cycleWeapon(1);
      if (/^Digit[1-9]$/.test(e.code)) selectWeapon(parseInt(e.code.slice(5), 10) - 1);
      if (e.code === 'KeyE') activateUlt();
      if (e.code === 'KeyF') activateAbility();
      if (e.code === 'KeyP' || e.code === 'Escape') togglePause();
      if (e.code === 'KeyM') doMute();
      if (e.code === 'KeyV') toggleView();
      if (e.code === 'KeyR' && e.shiftKey) startGame();
    });
    addEventListener('keyup', e => { keys[e.code] = false; });
    addEventListener('blur', () => { keys = {}; mouseDown = false; });

    if (isTouch) setupTouch();
  }

  function cycleWeapon(dir) {
    const avail = player.allowedWeapons || MA.WEAPONS.map((w, i) => (G.wave >= w.unlock ? i : -1)).filter(i => i >= 0);
    if (!avail.length) return;
    const cur = avail.indexOf(player.weapon);
    player.weapon = avail[(cur + dir + avail.length) % avail.length];
    MA.syncWeaponModel(player);
    MA.Audio.switchW();
    MA.UI.updateWeaponList(player, G);
  }
  function selectWeapon(i) {
    if (i < 0 || i >= MA.WEAPONS.length) return;
    if (player.allowedWeapons ? player.allowedWeapons.indexOf(i) < 0 : G.wave < MA.WEAPONS[i].unlock) { MA.Audio.deny(); return; }
    player.weapon = i;
    MA.syncWeaponModel(player);
    MA.Audio.switchW(); MA.UI.updateWeaponList(player, G);
  }

  function setupTouch() {
    const stick = $('stick'), nub = $('nub');
    let sid = null, ox = 0, oy = 0;
    stick.addEventListener('touchstart', e => {
      const t = e.changedTouches[0]; sid = t.identifier;
      const r = stick.getBoundingClientRect(); ox = r.left + r.width / 2; oy = r.top + r.height / 2;
      e.preventDefault();
    }, { passive: false });
    addEventListener('touchmove', e => {
      for (const t of e.changedTouches) if (t.identifier === sid) {
        let dx = t.clientX - ox, dy = t.clientY - oy;
        const d = Math.hypot(dx, dy), max = 54;
        if (d > max) { dx = dx / d * max; dy = dy / d * max; }
        nub.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
        touchMove.x = dx / max; touchMove.y = dy / max;
      }
    }, { passive: true });
    addEventListener('touchend', e => {
      for (const t of e.changedTouches) if (t.identifier === sid) {
        sid = null; touchMove.x = touchMove.y = 0; nub.style.transform = '';
      }
    });
    const btn = (id, down, up) => {
      const b = $(id);
      b.addEventListener('touchstart', e => { down(); e.preventDefault(); }, { passive: false });
      b.addEventListener('touchend', e => { if (up) up(); e.preventDefault(); }, { passive: false });
    };
    btn('tFire', () => touchFire = true, () => touchFire = false);
    btn('tJump', () => { keys.Space = true; setTimeout(() => keys.Space = false, 120); });
    btn('tDash', () => { keys._dash = true; });
    btn('tUlt', () => activateUlt());
    btn('tAbility', () => activateAbility());
    btn('tSwap', () => cycleWeapon(1));
    btn('tView', () => toggleView());

    let lid = null, lx = 0, ly = 0;
    const cv = renderer.domElement;
    cv.addEventListener('touchstart', e => {
      const t = e.changedTouches[0]; lid = t.identifier; lx = t.clientX; ly = t.clientY;
    }, { passive: true });
    cv.addEventListener('touchmove', e => {
      for (const t of e.changedTouches) if (t.identifier === lid) {
        yaw -= (t.clientX - lx) * .0055 * S.sens;
        pitch -= (t.clientY - ly) * .0038 * S.sens * (S.invertY ? -1 : 1);
        pitch = clamp(pitch, -.95, .78);
        lx = t.clientX; ly = t.clientY;
      }
    }, { passive: true });
    cv.addEventListener('touchend', () => { lid = null; });
  }

  function doMute() {
    const m = MA.Audio.toggleMute();
    S.mute = m;
    $('muteBtn').textContent = m ? '🔇' : '🔊';
    MA.store.set('settings', S);
  }

  /* =============================================================== MENUS */
  function buildMenus() {
    bindViewButton();
    /* roster */
    const ros = $('roster');
    MA.MEMES.forEach(m => {
      const d = document.createElement('div');
      d.className = 'rc';
      d.innerHTML = '<i>' + m.emoji + '</i><b>' + m.name + '</b><span>' + m.hp + ' HP · ' + m.taunt + '</span>';
      ros.appendChild(d);
    });
    MA.BOSSES.forEach(b => {
      const d = document.createElement('div');
      d.className = 'rc boss';
      d.innerHTML = '<i>' + b.emoji + '</i><b>' + b.name + '</b><span>CHEFE · ' + b.hp + ' HP</span>';
      ros.appendChild(d);
    });

    /* armas na tela de ajuda */
    const wl = $('helpWeapons');
    MA.WEAPONS.forEach(w => {
      const d = document.createElement('div');
      d.className = 'rc';
      const shopDef = MA.WEAPON_SHOP[w.id] || {};
      const source = shopDef.boxOnly ? 'Caixa 67 ou drop aleatório de chefe'
        : shopDef.price ? 'loja · 🪙 ' + MA.fmt(shopDef.price) : 'loja';
      d.innerHTML = '<i>' + w.icon + '</i><b>' + w.name + '</b><span>' + w.desc +
                    '<br><em>' + source + '</em></span>';
      wl.appendChild(d);
    });

    /* mapas */
    renderMapList();

    /* dificuldades */
    const dl = $('diffList');
    MA.DIFFS.forEach((d, i) => {
      const b = document.createElement('button');
      b.className = 'diff' + (i === 1 ? ' sel' : '');
      b.innerHTML = '<i>' + d.icon + '</i><b>' + d.name + '</b><span>' + d.desc + '</span>';
      b.onclick = () => {
        G.diff = d;
        [...dl.children].forEach(c => c.classList.remove('sel'));
        b.classList.add('sel');
        MA.Audio.init(); MA.Audio.ui();
      };
      dl.appendChild(b);
    });

    /* botões */
    const on = (id, fn) => { const e = $(id); if (e) e.onclick = () => { MA.Audio.init(); MA.Audio.ui(); fn(); }; };
    on('playBtn', startGame);
    on('startBack', () => { $('start').classList.add('hid'); MA.MetaUI.openHub(); });
    on('againBtn', startGame);
    on('menuBtn', toMenu);
    on('quitBtn', toMenu);
    on('resumeBtn', () => togglePause(false));
    on('helpBtn', () => $('help').classList.remove('hid'));
    on('helpClose', () => $('help').classList.add('hid'));
    on('boardBtn', () => { MA.UI.renderBoard(); $('board').classList.remove('hid'); });
    on('boardClose', () => $('board').classList.add('hid'));
    on('boardClear', () => { MA.store.set('scores', []); MA.store.set('best', 0); MA.UI.renderBoard(); refreshMenuStats(); });
    on('setBtn', () => $('settings').classList.remove('hid'));
    on('setBtn2', () => $('settings').classList.remove('hid'));
    on('setClose', () => $('settings').classList.add('hid'));
    $('muteBtn').onclick = doMute;

    /* sliders */
    bindRange('sSens', 'sSensV', S.sens, v => { S.sens = v; }, v => v.toFixed(2) + 'x');
    bindRange('sVol', 'sVolV', S.volume, v => { S.volume = v; MA.Audio.setVolume(v); }, v => Math.round(v * 100) + '%');
    bindRange('sMus', 'sMusV', S.music, v => { S.music = v; MA.Audio.setMusicVolume(v); }, v => Math.round(v * 100) + '%');
    bindRange('sShoulder', 'sShoulderV', S.shoulder, v => { S.shoulder = v; },
      v => Math.abs(v) < .08 ? 'CENTRALIZADO'
        : (v > 0 ? 'DIREITO ' : 'ESQUERDO ') + Math.abs(v).toFixed(2).replace('.', ','));
    bindRange('sFov', 'sFovV', S.fov, v => { S.fov = v; camera.fov = v; camera.updateProjectionMatrix(); }, v => Math.round(v) + '°');
    bindRange('sShake', 'sShakeV', S.shake, v => { S.shake = v; }, v => Math.round(v * 100) + '%');

    const qs = $('sQual');
    qs.value = S.quality;
    qs.onchange = () => { S.quality = qs.value; applyQuality(); MA.store.set('settings', S); };
    const iv = $('sInv');
    iv.checked = !!S.invertY;
    iv.onchange = () => { S.invertY = iv.checked; MA.store.set('settings', S); };

    $('muteBtn').textContent = S.mute ? '🔇' : '🔊';
    if (S.mute) MA.Audio.muted = true;

    refreshMenuStats();
    if (isTouch) document.body.classList.add('touch');
  }

  function bindViewButton() {
    const b = $('sView');
    if (b) b.onclick = () => toggleView();
    refreshViewBtn();
  }

  function bindRange(id, outId, val, fn, fmt) {
    const el = $(id), out = $(outId);
    el.value = val;
    const upd = () => {
      const v = parseFloat(el.value);
      fn(v); out.textContent = fmt(v);
      MA.store.set('settings', S);
    };
    el.oninput = upd; upd();
  }

  function refreshMenuStats() {
    const best = MA.store.get('best', 0);
    const games = MA.store.get('scores', []).length;
    $('menuStats').innerHTML = best > 0
      ? '🏆 RECORDE <b>' + MA.fmt(best) + '</b>　·　' + MA.rankFor(best).icon + ' <b>' + MA.rankFor(best).name + '</b>　·　🎮 <b>' + games + '</b> partidas'
      : 'Primeira vez aqui? Bem-vindo ao caos.';
  }

  /* ================================================================ LOOP */
  let menuT = 0;
  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), .05);

    if (G.running && !G.paused && !G.over && !G.choosing) {
      update(dt);
    } else {
      MA.FX.update(dt);
      MA.World.update(dt, (G.time += dt * .3));
      if (!G.running) {
        const hubOpen = !$('hub').classList.contains('hid');
        if (hubOpen && player) {
          /* O lobby usa um retrato 3D dedicado no DOM para nunca ficar oculto
             pelo fundo. Esconde a cópia do canvas e mantém a câmera no palco. */
          player.obj.visible = false;
          menuT += dt;
          player.obj.position.set(0, Math.sin(menuT * 2.1) * .025, 0);
          player.obj.rotation.y = Math.sin(menuT * .72) * .13;
          player.legL.rotation.x = Math.sin(menuT * 2.1) * .025;
          player.legR.rotation.x = -player.legL.rotation.x;
          player.armL.rotation.z = -.075 + Math.sin(menuT * 1.7) * .022;
          player.aura.rotation.z += dt * .75;
          player.aura.material.opacity = .26 + Math.sin(menuT * 2.8) * .08;
          MA.animateWeaponModel(player, dt, false);
          const ud = player.obj.userData;
          if (ud.panim) ud.panim.forEach(fn => { try { fn(G.time, dt); } catch (e) { /* ignora */ } });
          camera.position.set(0, 2.65, -7.7);
          camera.lookAt(0, 1.35, 0);
        } else {
          if (player) player.obj.visible = true;
          menuT += dt * .12;
          const r = 52;
          camera.position.set(Math.cos(menuT) * r, 16 + Math.sin(menuT * 2) * 5, Math.sin(menuT) * r);
          camera.lookAt(0, 6, 0);
        }
      }
    }

    const fps = MA.FPS.tick();
    if (MA.UI.el.fps) MA.UI.el.fps.textContent = fps + ' FPS';
    renderer.render(scene, camera);
  }

  /* =============================================================== API */
  MA.Game = {
    start: startGame, menu: toMenu, pause: togglePause,
    musicOn: () => true,
    get quality() { return G.quality; },
    get state() { return G; },
    debug: {
      skipToWave(n) { enemies.slice().forEach(e => killEnemy(e, e.obj.position.clone())); G.interWave = 0; G.choosing = false; MA.UI.hidePerks(); startWave(n); },
      god() { player.maxhp = 99999; player.hp = 99999; },
      perk(id) { const p = MA.PERKS.find(x => x.id === id); if (p) takePerk(p); },
      nuke: () => memeNuke(),
      kill: () => gameOver(),
      down: () => mpDown(null)      /* teste: cair no multiplayer */
    }
  };
  window.MEMEARENA = MA.Game.debug;

  function recordClientError(error) {
    try {
      const current = JSON.parse(localStorage.getItem('memearena.diagnostics') || '[]');
      current.push({ at: new Date().toISOString(), message: String(error && (error.message || error) || 'erro desconhecido').slice(0, 300) });
      localStorage.setItem('memearena.diagnostics', JSON.stringify(current.slice(-10)));
    } catch (e) { /* diagnóstico nunca pode impedir o jogo */ }
  }

  /* A entrada NUNCA pode ficar em branco: se o 3D falhar (máquina sem GPU,
     WebGL desligado, driver em software), mostramos a tela de aviso já
     visível e clicável — antes o botão continuava com opacity:0 porque a
     classe .ready só era adicionada no caminho feliz. */
  function showBootFailure(error) {
    recordClientError(error);
    console.error('[MemeArena] Falha ao iniciar:', error);
    const splash = $('loading');
    if (!splash) return;
    splash.classList.remove('hid', 'leave');
    splash.classList.add('ready', 'failed');
    const semWebgl = !!(error && (error.webgl || /webgl/i.test(String(error.message || error))));
    const progress = document.querySelector('.splash-loading');
    if (progress) {
      progress.textContent = semWebgl
        ? 'Este dispositivo não liberou a aceleração 3D (WebGL). Atualize o driver de vídeo ou ative a aceleração por hardware e tente de novo.'
        : 'Não foi possível iniciar o jogo nesta máquina. Toque em recarregar para tentar de novo.';
    }
    const button = $('enterGame');
    if (button) {
      button.disabled = false;
      button.classList.add('retry');
      button.innerHTML = '<b>RECARREGAR JOGO</b><small>TENTAR NOVAMENTE</small>';
      button.onclick = () => location.reload();
    }
  }

  function bootSafely() {
    try { boot(); }
    catch (error) { showBootFailure(error); }
  }
  addEventListener('error', ev => recordClientError(ev.error || ev.message));
  addEventListener('unhandledrejection', ev => recordClientError(ev.reason));

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootSafely);
  else bootSafely();
})(window.MA);
