# Generating beautiful, bug-free Kuesuto maps

Notes from investigating why the `enrich-forest` pass produced broken trees, and how to
do terrain correctly. Tileset: `src/data/tilesets/ks-forrest-tileset.json`
(`kuesuto-tilemap.png`, 169 tiles, 16×16, 13 cols).

## The three-layer art model

A map is three tile layers + an object layer:

- **Ground** — base terrain (grass/dirt). *Autotile-able* (see wangset below).
- **Things** — decoration and **trees**. Trees are **multi-tile sprites** (a canopy spanning
  several tiles with a trunk). Map tile id `1` = blank.
- **Collision** — a *separate* layer; tile `170` (from `Collision.tsx`, firstgid 170) marks a
  blocked cell. The game reads collision from THIS layer, not from the tileset's per-tile
  collision shapes. So: place `170` wherever a solid trunk/wall sits.

## Why the enrich pass broke (the two bugs)

1. **Clipped tree sprites.** Trees are multi-tile. The enrich pass copied Things tiles through
   a *circular / noisy mask*, which sliced sprites in half — orphan canopies, half-trunks.
   **Rule: trees must be written as whole sprite units, never partially.**
2. **Destroyed guidance.** The original forest uses tree *walls* to funnel the player along a
   path. Filling the open field flattened that intent. **Rule: forest walls are level design,
   not empty space to fill.**

The existing `generate-map.mjs` avoids bug #1 only by using a single self-contained tile (`112`)
for every wall cell — safe but monotone (not "beautiful").

## The two correct techniques

### A. Ground & paths via the wang corner set (verified)
The tileset has one wangset, **"Grass Forrest"**, `type: corner`, 2 colors (1=Dirt, 2=Grass),
17 wangtiles. Corner wang stores colors in wangid slots `[1,3,5,7]` = `[TR,BR,BL,TL]`.

Build a reverse lookup `corners → tile`:
```
2222 -> 5    (all grass)      1111 -> 82   (all dirt)
1112 -> 77   1121 -> 75   1122 -> 81   1211 -> 74   1221 -> 85   1222 -> 84
2111 -> 76   2112 -> 79   2122 -> 78   2211 -> 83   2212 -> 80   2221 -> 86
```
Model terrain as a `(W+1)×(H+1)` grid of corner colors; paint dirt where a trail/clearing
goes; for each tile read its 4 corners and emit the matching tile. Result = seamless dirt
paths and clearings — the guiding path, done with real path art.

**Caveat:** only 14 of 16 combos exist; the 2 diagonal-opposite cases (`1212`, `2121`) are
absent (normal for wangsets). Avoid 1-tile diagonal dirt: use brush widths ≥ 2 tiles, or
fall back to all-grass/all-dirt for a diagonal corner.

### B. Trees & forest via whole-sprite brushes (never partial)
Define a small **brush library** — each brush is a fixed `w×h` footprint of Things tile ids
plus which cells get Collision `170` (e.g. `big_tree` 2×3, `small_tree` 2×2, `bush` 1×1 using
the passable singles `112/114/115/111`). Source the exact tile arrangements by sampling
coherent blocks from the existing hand-authored forest in `kuesuto-world.json` (guaranteed
correct), or from the tileset grid.

Placement rules that guarantee no visual bugs:
- Maintain an **occupancy grid**; a brush only stamps where its whole footprint is free.
- Stamp on an **aligned grid** (consistent parity) so multi-tile trees tile edge-to-edge
  exactly as in the source — no seams, no clipping.
- For dense walls, tile brushes contiguously; for ambience, scatter single passable bushes
  on walkable ground.

## Composition for "engaging" (not just bug-free)

1. Lay out **navigable space first**: a main path (wang dirt trail) that widens into
   **clearings/rooms** at encounters and landmarks — this is what guides and paces the player.
2. **Bound the path with forest-brush walls** (dense near corridors → funneling; thinning at
   clearings) so the trees do the guiding, as the original intended.
3. Place **landmarks** at decision points (a stone circle, a pond if water tiles exist) for
   orientation and interest.
4. **Decorate** walkable areas sparsely with passable bushes/flowers for life.
5. **Validate** every generation: BFS connectivity start→exits; assert object tiles are clear;
   assert no brush was clipped (occupancy check); assert no missing-wang corner combo.

## Pragmatic recommendation

- A generator can produce a **correct, decent greybox** with A + B above (wang-correct ground,
  whole-tree brushes, validated). Good for structure and iteration.
- "Beautiful & engaging" **composition** is genuinely hard procedurally. The highest-quality
  route is to author in **Tiled**, which natively supports this wangset (terrain brush) and
  tile stamps with live preview, exporting the same JSON the loader already reads. The missing
  `.tsx`/`.tmx` sources can be reconstructed from the JSON tileset + a map.
- Suggested split: **generator for greybox + Tiled for hand-polish**, or invest in a
  brush-and-wang generator if we want fully in-repo procedural maps.
