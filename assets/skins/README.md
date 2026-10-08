# assets/skins

Coloque aqui os modelos 3D feitos à mão (`.glb`), um arquivo por skin.
Depois registre o id da skin em `src/skinmodels.js` (`MA.SKIN_MODELS`).

Guia completo: ../../docs/SKINS_CUSTOM.md

## polygonal-mind/

Contém as 33 aparências jogáveis R1/R2 do projeto 100 Avatars, de Polygonal
Mind. Os GLBs preservam o rig e incluem `idle`, `run` e `punch`. Licença,
proveniência, transformação e mapeamento exato estão em
`polygonal-mind/LICENSE.md` e `polygonal-mind/SOURCE.md`.

Regenerar a partir do repositório oficial clonado:
`POLYGONAL_SOURCE=/caminho/100Avatars npm run build:polygonal-skins`.

## base-boneco.glb
Modelo base do jogo (proporções exatas) para você importar no Blender e editar.
Regenerar: `npm install && npm run export:base`.

## Acessórios prontos
`acessorio-bone.glb`, `acessorio-coroa.glb`, `acessorio-chifres.glb` — peças de cabeça
com as medidas do jogo (origem no centro da cabeça, y≈2.13).
Regenerar: `npm install && npm run export:acessorios`.
