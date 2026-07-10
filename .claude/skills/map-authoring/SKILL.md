---
name: map-authoring
description: This skill should be used when creating, editing, reviewing, or generating Kuesuto maps — "make a map", "new area/region", "edit terrain", "fix the forest", "render the map", "review map visually", or anything touching src/data/maps/*.json or tools/forest-gen.mjs.
---

# Kuesuto map authoring

Read this WHOLE file before touching any map. Deeper background: `tools/MAP-GENERATION.md`.

## Rules you must never break

1. **NEVER edit the tile arrays in `src/data/maps/*.json` by hand or with ad-hoc scripts.**
   Always go through the generator (`tools/forest-gen.mjs`). Hand edits have twice produced
   visibly broken maps that the user rejected.
2. **NEVER place tree tiles individually.** Trees are multi-tile sprites (a canopy of many
   tiles plus trunk tiles). Placing or removing part of one leaves half-drawn trees on
   screen. Whole sprites only — the generator's stamp system handles this for you.
3. **NEVER judge a map by its JSON.** Always render it to a PNG and look at the image
   (steps below). Terrain quality is a visual property.
4. **Trees form walls that guide the player along a path.** This is intentional level
   design. Do not open walls up into fields, and do not fill open fields with trees.
5. It is normal and correct that walls are solid (collision tile 170) even where no tree is
   drawn, as long as the player cannot reach those cells (they are behind tree fences).

## How to create or change a map — exact steps

**Step 0 (new maps).** Scaffold a valid region in one command:
```
node tools/new-region.mjs <region-name>
```
This writes `tools/regions/<region-name>.mjs` with a winding corridor that already
satisfies all layout requirements — then edit its objects/lore and corridor shape.

**Step 1.** Edit or create the region definition: `tools/regions/<region-name>.mjs`.
Copy `tools/regions/ruins-approach.mjs` as a template. A region exports:
`{ name, width, height, rows, objects }` where `rows` is an array of strings,
one character per tile: `'.'` = walkable floor, `'#'` = forest wall.
Objects use TILE coordinates (not pixels). Supported object names:
`'Player Start Location'`, `'Enemy'` (with `type: 'corrupted_slime' | 'fast_slime' | 'slime'`),
`'InteractableZone'` (with `phrases: 'line1|line2'`), `'Transition'` (with
`targetMap`, `entryPoint`, `widthTiles`, `heightTiles`).

Layout requirements:
- Walkable corridors must be at least 7 tiles wide (band of ±3 around a centre line).
- Wall bands above/below corridors must be at least 10 tiles tall, or the big tree
  blobs will not fit and the area will look empty.
- Keep all floor at least 3 tiles away from the map border.

**Steps 2+3 (one command).** Generate the map JSON AND render it:
```
node tools/map-preview.mjs <region-name>
```
This runs the generator (writes `src/data/maps/<region-name>.json`; FAILS with an error if
the player cannot walk from the start to every Transition — fix the region and rerun) and
renders `tools/renders/<region-name>-preview.png`. Then use the Read tool on that PNG. Check: no half-drawn trees, trail winds through the
map, tree fences line the corridor, deep areas have big canopy blobs, decor is scattered.
If something looks wrong, fix and render again as `-v2.png`, `-v3.png`, etc.

Useful renderer flags: `--crop x,y,w,h` (tile units, for zooming in), `--collision`
(red overlay on solid cells), `--grid` (faint tile grid). It also accepts a path to any
map JSON instead of a name. To see how the hand-authored map does something, render a crop
of `kuesuto-world` and compare. `tools/dump-tiles.mjs <map> <layer> x,y,w,h` prints the raw
tile ids for a rectangle when you need exact numbers.

**Step 4.** If this is a NEW map, register it in `src/map.ts`: import the JSON and add an
entry to `this.tileMaps` exactly like the existing `'ruins-approach'` entry.

**Step 5.** Verify in the real game: run `npm run build` (must pass), then with the dev
server running open:
```
http://localhost:5173/kuesuto/?map=<region-name>&freecam
```
`?map=` starts the game on that map; `&freecam` makes the player a fast immortal ghost
that walks through walls, for flying around and inspecting terrain.

**Step 6.** Commit with a descriptive message (never add Co-Authored-By trailers).

## Facts about the tile system (do not rediscover these)

- Tileset image: `public/kuesuto-tilemap.png` — 169 tiles, 13 columns, 16×16 px each.
  Tileset JSON: `src/data/tilesets/ks-forrest-tileset.json`.
- Map layers: `Ground` (terrain), `Things` (trees/decor; 1 = empty), `Collision`
  (170 = solid, 0 = open — the game reads ONLY this layer for collision), `Positions`
  (objects). Data arrays are plain uncompressed integers, row-major, width×height.
- Ground autotiling: the tileset's "Grass Forrest" corner wangset, 2 colors
  (1 = Dirt, 2 = Grass). 14 of 16 corner combos exist; the 2 diagonal-opposite combos are
  missing, so dirt trails must stay at least 2 tiles wide.
- Tree stamps live in `tools/stamps.mjs`, extracted at runtime from the hand map
  (`kuesuto-world.json`) so they are always pixel-correct: canopy blobs, a 5×5 tree,
  a 2×3 hedge unit. Add new stamps by finding a clean example in the hand map
  (render + dump to locate it) and adding an `extract(x, y, w, h)` line.
- Scale model: entity world coords = tile coords × 160; map object coords are tile × 16.
