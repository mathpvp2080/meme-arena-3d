# Skins modeladas à mão (.glb)

O jogo nasceu com bonecos 100% procedurais (cápsulas/esferas do three.js + rostos
desenhados em canvas). Agora dá para **modelar a skin por fora e plugar no jogo**:
basta exportar um `.glb`, jogar em `assets/skins/` e registrar o id da skin.

Se nenhum modelo estiver registrado, nada muda — o jogo continua procedural.

---

## 1. Fluxo recomendado (de graça e sem dor de cabeça)

| Etapa | Ferramenta sugerida |
|---|---|
| Modelar | **Blender** (grátis, blender.org) — ou Blockbench/MagicaVoxel se quiser estilo voxel |
| Pintar | Texturas no próprio Blender, ou cores sólidas no material (mais leve e combina com o jogo) |
| Exportar | `File → Export → glTF 2.0 (.glb/.gltf)`, formato **glTF Binary (.glb)** |

No Blockbench: `File → Export → GLTF`. No MagicaVoxel: exporte `.obj` e converta
no Blender para `.glb`.

---

## 2. Especificação do modelo (importante)

- **Altura**: o boneco do jogo tem ~1,95 unidades (1 unidade ≈ 1 metro). Não precisa
  acertar na mosca: o jogo redimensiona automaticamente para a altura alvo (`height`).
- **Origem (pivot)**: entre os **pés**, no centro. O jogo também corrige isso sozinho
  (apoia no chão e centraliza em X/Z), mas modelar certo evita surpresas.
- **Frente**: o personagem olha para **−Z** no jogo. No Blender, modele olhando para
  **−Y** (a "vista de frente", `Numpad 1`) e exporte com o padrão `+Y up`. Se mesmo
  assim ele nascer de costas, é só pôr `rotY: Math.PI` no registro.
- **Escala/rotação aplicadas**: no Blender, `Ctrl+A → All Transforms` antes de exportar.
- **Orçamento**: até ~15.000 triângulos e texturas de no máximo 1024×1024 (PNG/WEBP).
  O jogo roda em celular; passar disso derruba o FPS.
- **Materiais**: use o **Principled BSDF** (cor base, metallic, roughness). Evite nodes
  exóticos — o glTF só exporta PBR padrão.
- **Compressão**: **não** use Draco nem KTX2 (o loader embarcado não traz os decoders).
- **Arquivo**: um único `.glb` (com texturas embutidas). Até ~5 MB por skin é saudável.
- **Rig/animação (opcional)**: armature com skinning funciona. Exporte com
  `Include → Armature` e as *actions* desejadas. O jogo toca o clipe indicado em `clip`
  (ou o primeiro). Modelos estáticos também funcionam: o jogo aplica o balanço/andar por código.

---

## 3. Onde colocar o arquivo

```
assets/skins/meu-boneco.glb
```

(É só colar o arquivo na pasta. Se preferir, me manda que eu registro pra você.)

---

## 4. Registrar a skin

Abra `src/skinmodels.js` e preencha `MA.SKIN_MODELS`. A chave é o **id da skin**
em `src/items.js` (`chill`, `hacker`, `doge`, `rizzler`, ...).

### Modelo inteiro (substitui o boneco)

```js
MA.SKIN_MODELS = {
  'chill': {
    url: 'assets/skins/meu-boneco.glb',
    mode: 'full',
    height: 1.95,   // altura final no jogo
    rotY: 0,        // Math.PI se nascer de costas
    y: 0,           // ajuste fino de altura
    clip: 'idle'    // animação do arquivo (se houver)
  }
};
```

### Só uma peça (mantém o boneco padrão)

```js
MA.SKIN_MODELS = {
  'doge': {
    url: 'assets/skins/orelhas-doge.glb',
    mode: 'part',
    anchor: 'hat',      // head | hat | body | back | handL | handR | gun
    size: 0.9,          // maior dimensão da peça
    y: 0.05,
    hide: ['head']      // opcional: esconde partes procedurais
  }
};
```

### Campos aceitos

| Campo | Padrão | O que faz |
|---|---|---|
| `url` | — | caminho do `.glb` dentro do projeto (obrigatório) |
| `mode` | `'full'` | `'full'` substitui o boneco, `'part'` encaixa uma peça |
| `anchor` | `'head'` | ponto de encaixe no modo `part` |
| `height` | `1.95` | altura final (modo `full`) |
| `size` | maior dimensão | tamanho final da peça (modo `part`) |
| `scale` | `1` | multiplicador extra depois do ajuste automático |
| `fit` | `true` | `false` usa a escala original do arquivo |
| `x` `y` `z` | `0` | deslocamento fino |
| `rotX` `rotY` `rotZ` | `0` | rotação em radianos |
| `hide` | `'all'` no `full` | partes procedurais a esconder: `'all'` ou `['head','body','armL',...]` |
| `clip` | primeiro clipe | nome da animação do `.glb` |
| `spin` | `false` | gira o modelo devagar (bom para peças decorativas) |
| `shadow` | `true` | projeta sombra |

---

## 5. Testar

```bash
npm test                      # valida catálogo, assets e os modelos registrados
python3 -m http.server 8080   # abre o jogo em http://localhost:8080
```

O `npm test` reclama se o `.glb` registrado não existir, se o id da skin não existir,
se o formato não for `.glb/.gltf` ou se o arquivo estiver fora do projeto
(a CSP do jogo só permite assets do próprio domínio — nada de link externo).

---

## 6. Deu ruim? (soluções rápidas)

| Sintoma | Causa provável | Conserto |
|---|---|---|
| Boneco não aparece | caminho errado / Draco | confira o `url` no console (F12) e exporte sem compressão |
| Aparece de costas | eixo de frente | `rotY: Math.PI` |
| Gigante ou minúsculo | `fit: false` | volte para `fit: true` e ajuste `height` |
| Flutuando / enterrado | pivot fora dos pés | ajuste `y` ou mova a origem no Blender |
| Todo preto/sem cor | material não PBR | use Principled BSDF e reexporte |
| Mudou o arquivo e o jogo não atualiza | cache do service worker | suba o `?v=` do `index.html` e o `meme-arena-3d-vNN` do `sw.js` |
| Miniatura da loja ainda velha | cache de preview | recarregue com Ctrl+F5 (o preload refaz as miniaturas) |

---

## 7. Como isso funciona por dentro

- `lib/GLTFLoader.js` e `lib/SkeletonUtils.js` — loader oficial do three.js r128
  (licença MIT), copiados para o projeto para funcionar offline e dentro da CSP.
- `src/skinmodels.js` — registro, cache, ajuste automático de escala/pivot,
  encaixe nos pontos do boneco, animações e preload.
- `src/entities.js` — `createPlayer()` chama `MA.SkinModels.apply()` depois de montar
  o boneco procedural; o modelo entra no lugar (ou junto) sem mexer em física,
  hitbox, arma ou armadura.
- `src/game.js` — faz o preload no boot e refaz o boneco/miniaturas quando os
  modelos chegam.

Hitbox, altura de câmera e mira continuam usando os valores do boneco padrão,
então uma skin modelada **nunca** dá vantagem competitiva.
