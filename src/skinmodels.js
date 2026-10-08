/* =====================================================================
   MEME ARENA 3D — skins modeladas à mão (.glb / .gltf)

   O boneco padrão do jogo é 100% procedural (cápsulas, esferas e rostos
   desenhados em canvas). Este módulo é a ponte para modelos 3D feitos por
   fora: basta exportar um .glb, colocar em assets/skins/ e registrar aqui
   (ou em MA.SKIN_MODELS) que o jogo passa a usar o seu modelo.

   Dois modos:
     mode:'full' → seu modelo VIRA o personagem (esconde o boneco padrão).
     mode:'part' → seu modelo é só uma peça encaixada no boneco padrão
                   (chapéu, cabeça, mochila, acessório...).

   Nada aqui quebra o jogo: se o arquivo não existir ou o formato falhar,
   o boneco procedural continua aparecendo normalmente.

   Guia completo de modelagem/exportação: docs/SKINS_CUSTOM.md
   ===================================================================== */
(function (MA) {
  'use strict';

  /* ---------------------------------------------------------------------
     REGISTRO DAS SKINS MODELADAS À MÃO
     Chave = id da skin em MA.SKINS (src/items.js).

     Exemplo (descomente e troque pelo seu arquivo):

     'coolfries': {
       url: 'assets/skins/meu-boneco.glb', // caminho dentro do projeto
       mode: 'full',                       // 'full' (boneco inteiro) ou 'part'
       height: 2.62,                       // altura final em unidades do jogo
       rotY: 0,                            // gire se o modelo nascer de costas
       y: 0,                               // ajuste fino de altura
       clip: 'idle'                        // animação do .glb (se houver)
     },

     'pizza': {
       url: 'assets/skins/acessorio-exemplo.glb',
       mode: 'part',
       anchor: 'head',                 // head | hat | body | back | handL | handR | gun
       size: 1.05,                     // tamanho alvo da peça
       hide: ['head']                  // esconde a cabeça procedural
     }
     --------------------------------------------------------------------- */
  /* Elenco jogável Polygonal Mind 100 Avatars R1/R2. Todos os arquivos
     preservam o rig Mixamo e recebem clipes leves de idle, corrida e ataque
     durante a conversão. Os avatares já olham para a frente do jogo (-Z). */
  const POLYGONAL_MIND = {
    coolfries:'cool-fries.glb', milk:'milk.glb', hotdog:'hot-dog.glb',
    washingmachine:'washing-machine.glb', fridge:'fridge.glb',
    pizza:'pizza.glb', taco:'taco.glb', coolramen:'cool-ramen.glb', avocado:'avocado.glb',
    sunflower:'sunflower.glb', baguette:'baguette.glb', goldfishbag:'goldfish-bag.glb',
    captainlantern:'captain-lantern.glb', sharkperson:'shark-person.glb',
    moongirl:'moon-girl.glb', alienskeleton:'alien-skeleton.glb',
    robot:'robot.glb', tallguy:'tall-guy.glb', skeletoncostume:'skeleton-costume.glb',
    burnvictim:'burn-victim.glb', chaosbaby:'chaos-baby.glb', o:'o.glb',
    coolbananaguy:'cool-banana-guy.glb', mousemisprint:'mouse-misprint.glb',
    ramon:'ramon.glb', littlealienmenace:'little-alien-menace.glb', eggplant:'eggplant.glb',
    cosmicdweller:'cosmic-dweller.glb', turtle:'turtle.glb', tnt:'tnt.glb',
    coolpolygonalmind:'cool-polygonal-mind.glb', eyefighter:'eye-fighter.glb',
    cosmicperson:'cosmic-person.glb'
  };
  MA.SKIN_MODELS = MA.SKIN_MODELS || {};
  Object.keys(POLYGONAL_MIND).forEach(id => {
    if (MA.SKIN_MODELS[id]) return;
    MA.SKIN_MODELS[id] = {
      url: 'assets/skins/polygonal-mind/' + POLYGONAL_MIND[id],
      mode: 'full', height: 2.62, rotY: 0, clip: 'idle', hide: 'all'
    };
  });

  /* Modelos completos que substituem NPCs procedurais de src/builds.js.
     Os inimigos olham para +Z: o DOGE nasce voltado para -X e gira +90°;
     Tralalero e Tung Tung nascem em +X e giram -90°; Bombardiro já nasce
     voltado para +Z e inclui sua animação de voo. */
  MA.ENEMY_MODELS = MA.ENEMY_MODELS || {
    doge: {
      url: 'assets/skins/doge.glb',
      mode: 'full',
      height: 1.6,
      y: 0.48,
      rotY: Math.PI / 2,
      hide: 'all'
    },
    tralala: {
      url: 'assets/skins/tralalero.glb',
      mode: 'full',
      height: 2.2,
      rotY: -Math.PI / 2,
      hide: 'all'
    },
    tung: {
      url: 'assets/skins/tung.glb',
      mode: 'full',
      height: 2.8,
      rotY: -Math.PI / 2,
      hide: 'all'
    },
    dogeboss: {
      url: 'assets/skins/doge.glb',
      mode: 'full',
      height: 4.2,
      y: 0.9,
      rotY: Math.PI / 2,
      hudY: 5.85,
      hide: 'all'
    },
    tralaboss: {
      url: 'assets/skins/tralalero.glb',
      mode: 'full',
      height: 4.8,
      rotY: -Math.PI / 2,
      hudY: 5.7,
      hide: 'all'
    },
    tungboss: {
      url: 'assets/skins/tung.glb',
      mode: 'full',
      height: 5.5,
      rotY: -Math.PI / 2,
      hudY: 6.4,
      hide: 'all'
    },
    bombard: {
      url: 'assets/skins/bombardiro.glb',
      mode: 'full',
      height: 1.3,
      y: 0.65,
      rotY: 0,
      hudY: 2.45,
      clip: 'bombardiro|flying',
      hide: 'all'
    },
    bombaboss: {
      url: 'assets/skins/bombardiro.glb',
      mode: 'full',
      height: 3.4,
      y: 1.3,
      rotY: 0,
      hudY: 5.45,
      clip: 'bombardiro|flying',
      hide: 'all'
    }
  };

  const ANCHORS = ['head', 'hat', 'body', 'back', 'handL', 'handR', 'gun'];
  const cache = new Map();    /* url -> { scene, animations } (só sucesso)    */
  const inflight = new Map(); /* url -> Promise                                */
  const failures = new Map(); /* url -> timestamp da última falha              */
  let loader = null;
  let loaderBroken = false;

  /* Falha não é sentença: o cache só guarda SUCESSO. Um erro de rede/parse
     fica registrado em `failures` com cooldown — enquanto o cooldown vigora
     a gente não martela a rede, mas depois de 5s qualquer load/apply tenta
     de novo. Assim uma oscilação nunca trava a skin no boneco procedural
     para sempre (nem nas miniaturas, nem no jogo). */
  const FAIL_COOLDOWN = 5000;

  function getLoader() {
    if (loader) return loader;
    if (loaderBroken) return null;
    if (typeof THREE === 'undefined' || !THREE.GLTFLoader) {
      loaderBroken = true;
      console.warn('[MemeArena] GLTFLoader indisponível — skins .glb desativadas');
      return null;
    }
    loader = new THREE.GLTFLoader();
    return loader;
  }

  /* ------------------------------------------------------------ spec ---- */
  function normalize(spec) {
    if (!spec) return null;
    if (typeof spec === 'string') spec = { url: spec };
    if (!spec.url) return null;
    const mode = spec.mode === 'part' ? 'part' : 'full';
    const anchor = ANCHORS.indexOf(spec.anchor) >= 0 ? spec.anchor : 'head';
    return {
      url: spec.url,
      mode,
      anchor,
      /* 'full': altura total do boneco. 'part': maior dimensão da peça. */
      height: typeof spec.height === 'number' ? spec.height : (mode === 'full' ? 2.62 : 0),
      size: typeof spec.size === 'number' ? spec.size : 0,
      scale: typeof spec.scale === 'number' ? spec.scale : 1,
      fit: spec.fit !== false,
      keepPivot: !!spec.keepPivot,
      x: spec.x || 0, y: spec.y || 0, z: spec.z || 0,
      rotX: spec.rotX || 0, rotY: spec.rotY || 0, rotZ: spec.rotZ || 0,
      hudY: typeof spec.hudY === 'number' ? spec.hudY : null,
      hide: spec.hide === undefined ? (mode === 'full' ? 'all' : []) : spec.hide,
      clip: spec.clip || '',
      shadow: spec.shadow !== false,
      spin: !!spec.spin
    };
  }

  function specFor(skin) {
    if (!skin) return null;
    return normalize(MA.SKIN_MODELS[skin.id] || skin.model || null);
  }

  function enemySpecFor(def) {
    if (!def) return null;
    return normalize(MA.ENEMY_MODELS[def.id] || def.model || null);
  }

  /* ----------------------------------------------------------- loading -- */
  function load(url) {
    const hit = cache.get(url);
    if (hit) return Promise.resolve(hit);
    if (inflight.has(url)) return inflight.get(url);
    /* Falha recente: respeita o cooldown e deixa tentar de novo depois. */
    const failedAt = failures.get(url);
    if (failedAt && performance.now() - failedAt < FAIL_COOLDOWN) {
      return Promise.resolve(null);
    }
    const l = getLoader();
    if (!l) return Promise.resolve(null);
    const p = new Promise(resolve => {
      l.load(url,
        gltf => {
          const entry = { scene: gltf.scene || (gltf.scenes && gltf.scenes[0]), animations: gltf.animations || [] };
          if (!entry.scene) { failures.set(url, performance.now()); resolve(null); return; }
          failures.delete(url);
          cache.set(url, entry);
          resolve(entry);
        },
        undefined,
        err => {
          console.warn('[MemeArena] não consegui carregar a skin 3D:', url, err && err.message ? err.message : err);
          failures.set(url, performance.now());
          resolve(null);
        });
    }).then(r => { inflight.delete(url); return r; });
    inflight.set(url, p);
    return p;
  }

  /* Milissegundos restantes de cooldown após uma falha (0 = pode tentar
     agora). Permite que quem agenda repetições (miniaturas) espere o tempo
     certo em vez de gastar tentativas dentro do cooldown. */
  function retryDelay(url) {
    const failedAt = failures.get(url);
    if (!failedAt) return 0;
    const left = FAIL_COOLDOWN - (performance.now() - failedAt);
    return left > 0 ? left : 0;
  }

  /* No boot, carrega apenas a skin inicial/equipada e os quatro NPCs. As
     outras skins entram sob demanda ao abrir loja/inventário. Isso evita
     transferir o catálogo inteiro (~5 MB) antes do primeiro jogo. */
  function preload(ids) {
    const urls = [];
    const wanted = new Set(Array.isArray(ids) ? ids : []);
    const starter = (MA.SKINS || []).find(s => s.starter);
    if (starter) wanted.add(starter.id);
    if (MA.Profile && MA.Profile.data && MA.Profile.data.equipped) {
      wanted.add(MA.Profile.data.equipped.skin);
    }
    (MA.SKINS || []).filter(s => wanted.has(s.id)).forEach(s => {
      const sp = specFor(s);
      if (sp && urls.indexOf(sp.url) < 0) urls.push(sp.url);
    });
    Object.keys(MA.ENEMY_MODELS || {}).forEach(id => {
      const sp = normalize(MA.ENEMY_MODELS[id]);
      if (sp && urls.indexOf(sp.url) < 0) urls.push(sp.url);
    });
    if (!urls.length) return Promise.resolve(0);
    return Promise.all(urls.map(load)).then(list => list.filter(Boolean).length);
  }

  function hasLoaded(skin) {
    const sp = specFor(skin);
    return !!(sp && cache.get(sp.url));
  }

  /* ------------------------------------------------------------- clone -- */
  function cloneScene(src) {
    if (THREE.SkeletonUtils && THREE.SkeletonUtils.clone) return THREE.SkeletonUtils.clone(src);
    return src.clone(true);
  }

  /* Marca os materiais como já convertidos: os modelos glTF vêm em espaço
     linear, então MA.linearizeColors não deve mexer neles. */
  function markLinear(root, trans) {
    root.traverse(o => {
      if (!o.material) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      const out = mats.map(m => {
        if (!m) return m;
        let mat = m;
        if (trans) { mat = m.clone(); mat.transparent = true; mat.opacity = .55; }
        mat.userData = mat.userData || {};
        mat.userData.__lin = true;
        return mat;
      });
      o.material = Array.isArray(o.material) ? out : out[0];
    });
  }

  /* Centraliza em X/Z, apoia no chão e ajusta a escala pelo tamanho alvo. */
  function fitToSpec(root, sp) {
    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root);
    if (!isFinite(box.min.y) || box.isEmpty()) return;
    const size = new THREE.Vector3(); box.getSize(size);
    const center = new THREE.Vector3(); box.getCenter(center);

    let k = sp.scale;
    if (sp.fit) {
      const target = sp.mode === 'full' ? sp.height : (sp.size || Math.max(size.x, size.y, size.z));
      const current = sp.mode === 'full' ? size.y : Math.max(size.x, size.y, size.z);
      if (current > 1e-5 && target > 0) k = (target / current) * sp.scale;
    }
    root.scale.setScalar(k);

    const holder = new THREE.Group();
    holder.add(root);
    if (sp.keepPivot) {
      /* respeita a origem do arquivo (útil para acessórios já posicionados) */
      root.position.set(0, 0, 0);
    } else {
      /* origem do grupo = pés do modelo, no eixo central */
      root.position.set(-center.x * k, -box.min.y * k, -center.z * k);
      if (sp.mode === 'part') root.position.y = -center.y * k; /* peças ficam centradas no encaixe */
    }
    holder.rotation.set(sp.rotX, sp.rotY, sp.rotZ);
    holder.position.set(sp.x, sp.y, sp.z);
    return holder;
  }

  /* ------------------------------------------------------------- hide --- */
  const PART_KEYS = ['body', 'head', 'neck', 'hood', 'hips', 'armL', 'armR', 'legL', 'legR'];

  /* No modo part o modelo pode ser filho justamente da peça que substitui.
     Esconder o Object3D inteiro também esconderia o .glb; por isso ocultamos
     apenas os materiais procedurais que já existem e mantemos o anchor ativo. */
  function hideRenderable(root) {
    root.traverse(o => {
      if (!o.material || (o.userData && o.userData.__customModel)) return;
      const materials = Array.isArray(o.material) ? o.material : [o.material];
      const hidden = materials.map(material => {
        if (!material) return material;
        const copy = material.clone ? material.clone() : material;
        copy.visible = false;
        return copy;
      });
      o.material = Array.isArray(o.material) ? hidden : hidden[0];
    });
  }

  function hideProcedural(ctx, hide) {
    /* Jogadores preservam arma e efeitos; NPCs preservam barra de vida e
       brilho do chão, que continuam ligados à física procedural. */
    const keep = [ctx.gun, ctx.aura, ctx.ultAura, ctx.shieldMesh, ctx.hb, ctx.glow];
    if (hide === 'all') {
      ctx.g.children.forEach(child => {
        if (keep.indexOf(child) >= 0) return;
        if (child.userData && child.userData.__customModel) return;
        child.visible = false;
      });
      return;
    }
    (Array.isArray(hide) ? hide : [hide]).forEach(name => {
      if (PART_KEYS.indexOf(name) < 0) return;
      const o = ctx[name];
      if (o) hideRenderable(o);
    });
  }

  function anchorOf(ctx, name) {
    switch (name) {
      case 'head': return { parent: ctx.head, offset: [0, 0, 0] };
      case 'hat': return { parent: ctx.head, offset: [0, .46, 0] };
      case 'body': return { parent: ctx.body, offset: [0, 0, 0] };
      case 'back': return { parent: ctx.body, offset: [0, .1, .42] };
      case 'handL': return { parent: ctx.armL, offset: [0, -.42, 0] };
      case 'handR': return { parent: ctx.armR, offset: [0, -.42, 0] };
      case 'gun': return { parent: ctx.gun, offset: [0, 0, 0] };
      default: return { parent: ctx.g, offset: [0, 0, 0] };
    }
  }

  /* -------------------------------------------------------------- apply - */
  function mount(ctx, sp, entry) {
    if (!entry || !entry.scene) return null;
    const model = cloneScene(entry.scene);
    markLinear(model, ctx.trans);
    if (sp.shadow) model.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = false; } });

    const holder = fitToSpec(model, sp) || model;
    holder.userData.__customModel = true;

    if (sp.mode === 'full') {
      hideProcedural(ctx, sp.hide);
      ctx.g.add(holder);
      /* Modelos voadores ou muito largos podem ter proporção diferente do
         boneco procedural; permite manter a barra logo acima do GLB. */
      if (ctx.hb && sp.hudY !== null) ctx.hb.position.y = sp.hudY;
    } else {
      const a = anchorOf(ctx, sp.anchor);
      if (sp.hide && sp.hide !== 'all') hideProcedural(ctx, sp.hide);
      holder.position.x += a.offset[0];
      holder.position.y += a.offset[1];
      holder.position.z += a.offset[2];
      (a.parent || ctx.g).add(holder);
    }

    /* Animações próprias do arquivo. Além de iniciar no idle, guardamos todas
       as ações para o jogo alternar suavemente entre parado, corrida e tiro. */
    if (entry.animations && entry.animations.length) {
      const mixer = new THREE.AnimationMixer(model);
      const actions = Object.create(null);
      entry.animations.forEach(clip => {
        if (!clip || !clip.name) return;
        const action = mixer.clipAction(clip);
        actions[clip.name] = action;
        actions[clip.name.toLowerCase()] = action;
      });
      let current = null;
      const play = (name, fade) => {
        const key = String(name || '').toLowerCase();
        const preferred = String(sp.clip || '').toLowerCase();
        const next = actions[name] || actions[key] || actions[sp.clip] || actions[preferred] ||
          actions.idle || actions.flying_idle || mixer.clipAction(entry.animations[0]);
        if (!next || next === current) return false;
        const blend = typeof fade === 'number' ? Math.max(0, fade) : .12;
        next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).play();
        if (current && blend > 0) {
          current.fadeOut(blend);
          next.fadeIn(blend);
        } else if (current) current.stop();
        current = next;
        animator.state = name;
        return true;
      };
      const animator = { mixer, actions, state: '', play };
      ctx.g.userData.skinMixer = mixer;
      ctx.g.userData.skinAnimator = animator;
      play(sp.clip || 'idle', 0);
      /* Aplica o primeiro frame também nas miniaturas renderizadas uma única
         vez, que não chegam a passar pelo loop normal do jogo. */
      mixer.update(0);
      if (ctx.anim) ctx.anim((t, dt) => mixer.update(dt));
    }
    if (sp.spin && ctx.anim) ctx.anim((t, dt) => { holder.rotation.y += dt * .8; });

    ctx.g.userData.customModel = holder;
    return holder;
  }

  /* Chamado por MA.createPlayer. Usa o modelo na hora se já estiver em
     cache (miniaturas da loja dependem disso) ou encaixa assim que chegar. */
  function apply(ctx) {
    const sp = specFor(ctx.skin);
    if (!sp) return false;
    const ready = cache.get(sp.url);
    if (ready) { mount(ctx, sp, ready); return true; }
    /* Ainda não carregou (ou falhou e está no cooldown): tenta carregar e
       encaixa assim que chegar. Falhas antigas são retomadas pelo cooldown. */
    load(sp.url).then(entry => {
      if (!entry || !ctx.g || !ctx.g.parent) return;
      try { mount(ctx, sp, entry); } catch (e) { console.warn('[MemeArena] modelo da skin falhou:', sp.url, e); }
    });
    return false;
  }

  /* Mesmo fluxo para NPCs. O corpo procedural permanece como fallback caso
     o download ou o parse do modelo falhe. */
  function applyEnemy(ctx) {
    const sp = enemySpecFor(ctx.def);
    if (!sp) return false;
    const ready = cache.get(sp.url);
    if (ready) { mount(ctx, sp, ready); return true; }
    load(sp.url).then(entry => {
      if (!entry || !ctx.g || !ctx.g.parent) return;
      try { mount(ctx, sp, entry); } catch (e) { console.warn('[MemeArena] modelo do NPC falhou:', sp.url, e); }
    });
    return false;
  }

  const STATE_CLIPS = {
    idle: ['idle', 'flying_idle', 'static'],
    walk: ['walk', 'fast_flying', 'run', 'idle', 'flying_idle'],
    run: ['run', 'fast_flying', 'walk', 'idle', 'flying_idle'],
    air: ['jump_idle', 'jump', 'fast_flying', 'flying_idle', 'idle'],
    shoot: ['punch', 'bite_front', 'headbutt', 'holding-right-shoot',
      'holding-both-shoot', 'holding-right', 'idle', 'flying_idle'],
    melee: ['bite_front', 'headbutt', 'punch', 'attack-melee-right',
      'attack-melee-left', 'idle', 'flying_idle'],
    die: ['death', 'die', 'idle', 'flying_idle']
  };

  /* target pode ser o resultado de createPlayer ou o Group diretamente. */
  function setState(target, state, fade) {
    const group = target && (target.obj || target.g || target);
    const animator = group && group.userData && group.userData.skinAnimator;
    if (!animator) return false;
    const choices = STATE_CLIPS[state] || [state, 'idle'];
    const clip = choices.find(name => animator.actions[name]);
    return clip ? animator.play(clip, fade) : false;
  }

  MA.SkinModels = {
    specFor, enemySpecFor, apply, applyEnemy, preload, load, hasLoaded, setState, retryDelay,
    register(id, spec) { MA.SKIN_MODELS[id] = spec; return load(normalize(spec).url); },
    registerEnemy(id, spec) { MA.ENEMY_MODELS[id] = spec; return load(normalize(spec).url); },
    get loaded() { return cache; }
  };
})(window.MA);
