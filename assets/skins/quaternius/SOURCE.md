# Quaternius Ultimate Monsters — origem e transformação

## Obra e licença

- **Título oficial:** Ultimate Monsters
- **Autor:** Quaternius
- **Página oficial:** https://quaternius.com/packs/ultimatemonsters.html
- **Publicação indicada:** outubro de 2022
- **Conteúdo oficial:** 50 modelos totalmente animados, com formatos glTF, FBX, OBJ e Blend
- **Licença declarada pelo autor:** CC0 1.0 Universal
- **Texto da licença:** https://creativecommons.org/publicdomain/zero/1.0/
- **Data de acesso:** 7 de outubro de 2026

## Cópias efetivamente recuperadas

A página oficial registra autoria e licença. Como o pacote oficial é entregue
por uma pasta do Google Drive que encerrou a conexão TLS neste ambiente, os
arquivos glTF/GLB foram recuperados de dois espelhos públicos no GitHub. Os
espelhos não substituem a fonte oficial da licença; ficam registrados para a
cadeia exata de proveniência e reprodutibilidade.

1. **OuroborosCollective/Wasd**
   - Repositório: https://github.com/OuroborosCollective/Wasd
   - Commit: `1140770331b125fa4c6f8c95dd859d1ce472c54a`
   - Caminho de origem: `client/public/assets/models/monsters/`
   - Arquivos utilizados: `blob_Chicken.gltf`, `blob_Cat.gltf`,
     `blob_Fish.gltf`, `blob_GreenSpikyBlob.gltf`, `big_Bunny.gltf`,
     `big_Frog.gltf`, `big_Dino.gltf`, `big_Alien.gltf`, `big_Ninja.gltf`,
     `big_Monkroose.gltf`, `big_MushroomKing.gltf` e `big_Birb.gltf`.

2. **Benson-LU77/Claude.guide**
   - Repositório: https://github.com/Benson-LU77/Claude.guide
   - Commit recuperado: `25b5bc22f997dfa4d3fea5c77fc2484f5d589264`
   - Pull request que documenta a integração: https://github.com/Benson-LU77/Claude.guide/pull/3
   - Caminho de origem: `assets/quaternius/`
   - Arquivos utilizados: `Alpaking.glb`, `Armabee_Evolved.glb`,
     `Blob_Cactoro.glb`, `Blob_Mushnub_Evolved.glb`, `Blob_Wizard.glb`,
     `Blob_Yeti.glb`, `Dragon_Evolved.glb`, `Ghost_Skull.glb`,
     `Glub_Evolved.glb`, `Hywirl.glb`, `Pigeon.glb` e `Squidle.glb`.

## Transformações

### Arquivos recuperados de OuroborosCollective/Wasd

Os glTFs autocontidos foram convertidos para GLB com glTF-Transform. Foram:

- preservadas apenas as animações úteis que existiam em cada modelo entre
  `Idle`, `Run`, `Walk`, `Jump`, `Jump_Idle`, `Death`, `Punch` e `Bite_Front`;
- reamostradas as curvas com tolerância `1e-3`;
- deduplicados e removidos recursos sem uso;
- quantizados `NORMAL` em 10 bits, `TEXCOORD_0` em 12 bits e pesos em 8 bits;
- mantidas as posições sem quantização, evitando alterar a medição de altura;
- declarada explicitamente a extensão obrigatória `KHR_mesh_quantization`,
  conforme a especificação glTF;
- reduzidos de 1024×1024 para 256×256, com filtro box, os oito atlas da família
  `big_*`; os quatro atlas da família `blob_*` já tinham 32×32 e foram mantidos;
- preservados geometria, rig, UVs, paleta e identidade visual; os arquivos
  foram renomeados para os nomes do catálogo em português.

### Arquivos recuperados de Benson-LU77/Claude.guide

O espelho documenta no script `tools/optimize-monsters.mjs` a criação desses
GLBs a partir do pacote Quaternius. A transformação preserva apenas ações de
jogo, reamostra em tolerância `1e-3`, deduplica, remove dados sem uso e quantiza
normais, UVs, juntas e pesos sem quantizar posições. No Meme Arena esses GLBs
foram renomeados, tiveram acessores sem uso removidos e receberam a declaração
obrigatória `KHR_mesh_quantization`; geometria visível, animações e atlas 32×32
foram mantidos.

## Arquivos publicados e modelos de origem

| Arquivo no Meme Arena | Modelo de origem |
|---|---|
| `abelha-chefe.glb` | Armabee Evolved |
| `alpaca-rei.glb` | Alpaking |
| `cacto-praia.glb` | Blob Cactoro |
| `coelho-maromba.glb` | Big Bunny |
| `cogumelo-bugado.glb` | Blob Mushnub Evolved |
| `cranio-flutuante.glb` | Ghost Skull |
| `dino-coach.glb` | Big Dino |
| `dragao-caos.glb` | Dragon Evolved |
| `et-bombado.glb` | Big Alien |
| `galinha-caos.glb` | Blob Chicken |
| `gato-sus.glb` | Blob Cat |
| `glub-turbo.glb` | Glub Evolved |
| `hywirl.glb` | Hywirl |
| `lula-lunar.glb` | Squidle |
| `mago-geleia.glb` | Blob Wizard |
| `monstro-boleto.glb` | Big Monkroose |
| `ninja-meme.glb` | Big Ninja |
| `ourico-radioativo.glb` | Blob Green Spiky Blob |
| `passaro-pistola.glb` | Big Birb |
| `peixe-fora.glb` | Blob Fish |
| `pombo-correio.glb` | Pigeon |
| `rei-cogumelo.glb` | Big Mushroom King |
| `sapo-pix.glb` | Big Frog |
| `yeti-bolso.glb` | Blob Yeti |

## Orçamento técnico resultante

- 24 GLBs autocontidos;
- aproximadamente 5,08 MB no total;
- 1 a 3 primitivas (draw calls) por modelo;
- aproximadamente 1,7 mil a 8,3 mil triângulos por modelo;
- uma textura 32×32 ou 256×256 por modelo;
- clipes de idle, deslocamento e ataque preservados em todos os modelos, com
  morte e salto quando disponíveis.
