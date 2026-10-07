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

## 1.5. Atalho: comece de um modelo meio pronto

Não precisa começar do zero. Três caminhos, do mais fácil ao mais livre:

### a) O boneco do próprio jogo (recomendado)

`assets/skins/base-boneco.glb` já está no projeto: é o boneco padrão do Meme Arena
exportado em 3D, **com as proporções exatas** (altura 2,74 com os pés, cabeça em
y≈2,13, braços, mãos, pernas e tênis separados e nomeados).

1. No Blender: `File → Import → glTF 2.0` e escolha `assets/skins/base-boneco.glb`.
2. Edite à vontade: mude o formato da cabeça, ponha chapéu, capa, mochila, troque as cores.
3. Exporte como `.glb` com outro nome e registre (passo 4).

Para gerar o arquivo de novo (se mudar o boneco do jogo):

```bash
npm install          # só na primeira vez (baixa o three para o script)
npm run export:base
```

### b) Bibliotecas de personagens grátis (CC0, pode usar comercialmente)

| Site | O que tem |
|---|---|
| https://quaternius.com | pacotes de personagens low-poly prontos (.glb/.blend), CC0 |
| https://kenney.nl/assets | bonecos estilizados e acessórios, CC0 |
| https://poly.pizza | busca de modelos low-poly, maioria CC0/CC-BY |
| https://www.mixamo.com | personagens **com rig e animações** prontos (grátis, conta Adobe) |
| https://sketchfab.com/search?features=downloadable&licenses=... | filtre por licença CC0 antes de baixar |

Importe no Blender, ajuste o estilo pra combinar com o jogo e exporte `.glb`.
**Atenção:** confira a licença de cada modelo — evite personagens de marcas/jogos
alheios, que travam a publicação na loja (veja `docs/IP_REVIEW.md`).

### c) Acessórios prontos (boné, coroa, chifres)

Já estão no projeto, com as medidas do jogo:

| Arquivo | O que é |
|---|---|
| `assets/skins/acessorio-bone.glb` | boné (casco + aba + botão), origem no centro da cabeça |
| `assets/skins/acessorio-coroa.glb` | coroa de 7 pontas |
| `assets/skins/acessorio-chifres.glb` | par de chifres |

**No Blender** (colocar na cabeça do seu boneco): `File → Import → glTF 2.0`, escolha o
acessório, `G` + `Z` para subir até a cabeça, `S` para ajustar o tamanho, `R` para girar.
Depois selecione o boneco e o acessório e exporte tudo junto como um `.glb`.

**Ou direto no jogo**, sem Blender nenhum:

```js
MA.SKIN_MODELS = {
  'cactopraia': {
    url: 'assets/skins/acessorio-bone.glb',
    mode: 'part', anchor: 'head',
    fit: false, keepPivot: true   // já nasce encaixado na cabeça
  }
};
```

Regerar os acessórios: `npm install && npm run export:acessorios`.

### d) Começar do zero

Só seguir a especificação abaixo.

---

## 2. Especificação do modelo (importante)

- **Altura**: o boneco do jogo tem **~2,6 unidades** de altura (cabeça em y≈2,13,
  topo em y≈2,61, pés em y≈0). Não precisa acertar na mosca: o jogo redimensiona
  automaticamente para a altura alvo (`height`, padrão 2.62).
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
em `src/items.js` (`cactopraia`, `gatosus`, `peixefora`, `sapopix`, ...).

### Modelo inteiro (substitui o boneco)

```js
MA.SKIN_MODELS = {
  'cactopraia': {
    url: 'assets/skins/meu-boneco.glb',
    mode: 'full',
    height: 2.62,   // altura final no jogo
    rotY: 0,        // Math.PI se nascer de costas
    y: 0,           // ajuste fino de altura
    clip: 'idle'    // animação do arquivo (se houver)
  }
};
```

### Só uma peça (mantém o boneco padrão)

```js
MA.SKIN_MODELS = {
  'gatosus': {
    url: 'assets/skins/acessorio-exemplo.glb',
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
| `height` | `2.62` | altura final (modo `full`) |
| `size` | maior dimensão | tamanho final da peça (modo `part`) |
| `scale` | `1` | multiplicador extra depois do ajuste automático |
| `fit` | `true` | `false` usa a escala original do arquivo |
| `keepPivot` | `false` | `true` respeita a origem do arquivo (não recentraliza) — ideal para acessórios já posicionados |
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
