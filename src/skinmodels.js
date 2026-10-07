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

     'chill': {
       url: 'assets/skins/chill.glb',  // caminho dentro do projeto
       mode: 'full',                   // 'full' (boneco inteiro) ou 'part'
       height: 2.62,                   // altura final em unidades do jogo
       rotY: 0,                        // gire se o modelo nascer de costas
       y: 0,                           // ajuste fino de altura
       clip: 'idle'                    // animação do .glb (se houver)
     },

     'doge': {
       url: 'assets/skins/doge-cabeca.glb',
       mode: 'part',
       anchor: 'head',                 // head | hat | body | back | handL | handR | gun
       size: 1.05,                     // tamanho alvo da peça
       hide: ['head']                  // esconde a cabeça procedural
     }
     --------------------------------------------------------------------- */
  MA.SKIN_MODELS = MA.SKIN_MODELS || {
    /* O arquivo foi modelado olhando para -X. A rotação alinha o focinho à
       frente do jogo (-Z), e o tamanho mantém a cabeça proporcional ao corpo. */
    doge: {
      url: 'assets/skins/doge.glb',
      mode: 'part',
      anchor: 'head',
      size: 1.15,
      y: 0.03,
      rotY: -Math.PI / 2,
      hide: ['head']
    }
  };

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
  const cache = new Map();   /* url -> { scene, animations } | null (falhou) */
  const inflight = new Map();/* url -> Promise                                */
  let loader = null;

  function getLoader() {
    if (loader) return loader;
    if (typeof THREE === 'undefined' || !THREE.GLTFLoader) return null;
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
    if (cache.has(url)) return Promise.resolve(cache.get(url));
    if (inflight.has(url)) return inflight.get(url);
    const l = getLoader();
    if (!l) {
      console.warn('[MemeArena] GLTFLoader indisponível — skins .glb desativadas');
      cache.set(url, null);
      return Promise.resolve(null);
    }
    const p = new Promise(resolve => {
      l.load(url,
        gltf => {
          const entry = { scene: gltf.scene || (gltf.scenes && gltf.scenes[0]), animations: gltf.animations || [] };
          if (!entry.scene) { cache.set(url, null); resolve(null); return; }
          cache.set(url, entry);
          resolve(entry);
        },
        undefined,
        err => {
          console.warn('[MemeArena] não consegui carregar a skin 3D:', url, err && err.message ? err.message : err);
          cache.set(url, null);
          resolve(null);
        });
    }).then(r => { inflight.delete(url); return r; });
    inflight.set(url, p);
    return p;
  }

  /* Carrega tudo que estiver registrado. Chamado no boot para que as
     miniaturas da loja (que renderizam de forma síncrona) já peguem os
     modelos prontos. Nunca rejeita. */
  function preload() {
    const urls = [];
    (MA.SKINS || []).forEach(s => {
      const sp = specFor(s);
      if (sp && urls.indexOf(sp.url) < 0) urls.push(sp.url);
    });
    [MA.SKIN_MODELS, MA.ENEMY_MODELS].forEach(registry => {
      Object.keys(registry || {}).forEach(id => {
        const sp = normalize(registry[id]);
        if (sp && urls.indexOf(sp.url) < 0) urls.push(sp.url);
      });
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

    /* animações próprias do arquivo (idle, run, ...) */
    if (entry.animations && entry.animations.length) {
      const mixer = new THREE.AnimationMixer(model);
      const clip = (sp.clip && THREE.AnimationClip.findByName(entry.animations, sp.clip)) || entry.animations[0];
      if (clip) mixer.clipAction(clip).play();
      ctx.g.userData.skinMixer = mixer;
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
    if (cache.has(sp.url)) return false; /* já falhou antes: segue procedural */
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
    if (cache.has(sp.url)) return false;
    load(sp.url).then(entry => {
      if (!entry || !ctx.g || !ctx.g.parent) return;
      try { mount(ctx, sp, entry); } catch (e) { console.warn('[MemeArena] modelo do NPC falhou:', sp.url, e); }
    });
    return false;
  }

  MA.SkinModels = {
    specFor, enemySpecFor, apply, applyEnemy, preload, load, hasLoaded,
    register(id, spec) { MA.SKIN_MODELS[id] = spec; return load(normalize(spec).url); },
    registerEnemy(id, spec) { MA.ENEMY_MODELS[id] = spec; return load(normalize(spec).url); },
    get loaded() { return cache; }
  };
})(window.MA);
