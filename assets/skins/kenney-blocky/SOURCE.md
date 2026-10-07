# Kenney Blocky Characters 2.0 — source record

- Original pack: **Blocky Characters 2.0**
- Original author: **Kenney**
- Official page: https://kenney.nl/assets/blocky-characters
- Official archive name: `kenney_blocky-characters_20.zip`
- License: **Creative Commons Zero 1.0 Universal (CC0 1.0)**
- License URL: https://creativecommons.org/publicdomain/zero/1.0/
- Access date: **2026-10-07**

## GLB files used by Meme Arena

The 18 self-contained GLB files in this directory were retrieved from the
Tiny Game Engine Kenney asset mirror:

- Repository: https://github.com/Hidencod/tge-assets
- Source path: `packs/blocky-characters/`
- Pinned source commit: `08f0c913f6783cc81f9f6105a7cdda8562b1c192`

That mirror embeds Kenney's shared texture into each GLB; mesh, node animation,
and authored appearance remain from the Kenney pack. Its included license
states that the converted derivative files are also CC0.

Meme Arena keeps the geometry, node hierarchy and 27 authored animation clips
unchanged. To reduce mobile GPU memory, each embedded 1024×1024 atlas was
resampled to 256×256 while preserving its UV layout. Runtime integration also
changes scale, facing direction, shadows, animation selection, and catalog
names/descriptions.
