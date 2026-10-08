# Polygonal Mind 100 Avatars — source and transformation record

## Work, author, retrieval and license

- **Collections:** 100 Avatars R1 and 100 Avatars R2
- **Author / licensor:** Polygonal Mind team
- **Official source repository:** https://github.com/PolygonalMind/100Avatars
- **Retrieved commit:** `ff07c2ad0017819c4e5366656ee1e5bcc4029bd4`
- **Official release inspected:** https://github.com/PolygonalMind/100Avatars/releases/tag/v24.02.1
- **Visual catalog mirrors:** https://poly.pizza/bundle/100-Avatars-R1-amJ23JjkKG and https://poly.pizza/bundle/100-Avatars-R2-1VwH0yHhlS
- **Retrieval date:** October 7, 2026
- **License used by this project:** Creative Commons Attribution 4.0 International (CC BY 4.0)
- **License URL:** https://creativecommons.org/licenses/by/4.0/
- **Bundled license copy:** `LICENSE.md`

The official repository includes `CCLicense.md`, containing the CC BY 4.0 terms, so this project follows that stricter and directly supplied license. Poly Pizza labels its R1/R2 bundle pages as CC0; that conflicting mirror label is not used as the governing license here.

The source README also asks that unmodified avatars not be sold directly. Meme Arena does not sell or expose the source model files as standalone assets. The models are transformed, animated, optimized and integrated into a game. Its player market trades game inventory entitlements for game coins, not the underlying 3D files. This note does not replace legal review before a commercial release.

## Transformations

The reproducible build is `scripts/build-polygonal-skins.mjs`. It reads the official top-level VRM for each source ID and creates one self-contained GLB per playable skin.

- VRM containers are converted to standard GLB usable by Three.js.
- The skinned Mixamo-compatible mesh, skeleton, UVs and visible base-color texture are preserved.
- VRM/MToon metadata and unused viseme/expression morph targets are removed.
- Mesh data is welded, deduplicated, pruned and quantized with `KHR_mesh_quantization`.
- Source textures are resized only when larger than 512×512 and recompressed as PNG.
- Three lightweight gameplay clips are authored from each retained rig: `idle`, `run` and `punch`.
- Public game names are English, omit source numbers and omit the word “Character”.
- Source IDs remain internal metadata for auditability and are not presented as skin names.
- The resulting 33 GLBs total approximately 5.16 MB.

Rebuild after obtaining the official repository:

```bash
POLYGONAL_SOURCE=/path/to/100Avatars npm run build:polygonal-skins
```

## Published files and exact source mapping

| Game file | Public game name | Official source ID and source alias | Round |
|---|---|---|---|
| `alien-skeleton.glb` | Alien Skeleton | 109 — AlienSkeleton | R2 |
| `avocado.glb` | Avocado | 088 — Avocado | R1 |
| `baguette.glb` | Cool Baguette | 133 — CoolBaguette | R2 |
| `burn-victim.glb` | Burn Victim | 066 — Bacondude | R1 |
| `captain-lantern.glb` | Captain Lantern | 119 — CaptainLantern | R2 |
| `chaos-baby.glb` | Chaos Baby | 026 — Udom | R1 |
| `cool-banana-guy.glb` | Cool Banana Guy | 024 — CoolBanana | R1 |
| `cool-fries.glb` | Cool Fries | 118 — COOLFRIES | R2 |
| `cool-polygonal-mind.glb` | Cool Polygonal Mind | 200 — CoolPolygonalMind | R2 |
| `cool-ramen.glb` | Cool Ramen | 138 — CoolRamen | R2 |
| `cosmic-dweller.glb` | Cosmic Dweller | 124 — CosmicDweller | R2 |
| `cosmic-person.glb` | Cosmic Person | 129 — CosmicPerson | R2 |
| `eggplant.glb` | Eggplant | 090 — Eggplant | R1 |
| `eye-fighter.glb` | Eye Fighter | 168 — EYEFighter | R2 |
| `fridge.glb` | Fridge | 196 — Cool_Fridge | R2 |
| `goldfish-bag.glb` | Goldfish Bag | 105 — GoldfishBagPerson | R2 |
| `hot-dog.glb` | Hot Dog | 087 — Hotdog | R1 |
| `little-alien-menace.glb` | Little Alien Menace | 002 — CoolAlien | R1 |
| `milk.glb` | Milk | 084 — Milk | R1 |
| `moon-girl.glb` | Moon Girl | 177 — MoonGirl | R2 |
| `mouse-misprint.glb` | Mouse Misprint | 003 — Jimmy | R1 |
| `o.glb` | O | 007 — Observer | R1 |
| `pizza.glb` | Pizza | 103 — CoolPizza | R2 |
| `ramon.glb` | Ramon | 078 — Pipe | R1 |
| `robot.glb` | Robot | 051 — Polybot | R1 |
| `shark-person.glb` | Shark Person | 120 — SharkPerson | R2 |
| `skeleton-costume.glb` | Skeleton Costume | 029 — Skelly | R1 |
| `sunflower.glb` | Sunflower | 104 — SunflowerPerson | R2 |
| `taco.glb` | Taco | 162 — CoolTaco | R2 |
| `tall-guy.glb` | Tall Guy | 073 — Pepo | R1 |
| `tnt.glb` | TNT | 152 — COOLTNT | R2 |
| `turtle.glb` | Turtle | 182 — CoolTurtle | R2 |
| `washing-machine.glb` | Washing Machine | 192 — CoolWashingMachine | R2 |

## Catalog rules recorded in code

`src/items.js` is the authoritative gameplay manifest. It records public name, source ID, source round, rarity, acquisition route, base value and fixed player-market value for each skin. The 17 user-selected Secret skins are explicitly tested by `scripts/validate-release.mjs`.
