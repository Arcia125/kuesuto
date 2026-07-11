---
name: tileset-extension
description: This skill should be used when adding new tiles to the Kuesuto tileset — "extend the tileset", "new terrain type", "add water/cliff/stone tiles", "new wangset", "add tiles for a biome", or anything modifying public/kuesuto-tilemap.png or ks-forrest-tileset.json.
---

# Extending the Kuesuto tileset

Proven method (used to build the "Grass Water" wangset — see `tools/water-tiles.mjs` for a
complete working example, and commit 267cc76). Read the ai-sprites skill too if AI
generation is involved.

## The method that works

1. **AI as a style oracle, not a tile source.** If the new terrain needs colors/motifs the
   game palette lacks, run one nano-banana generation (see ai-sprites skill) and SAMPLE its
   colors programmatically. Never paste AI pixels into connector tiles — they cannot meet
   the seam constraint and palette-snap speckles new colors.
2. **Compose tiles procedurally with continuity by construction.** For a corner wangset,
   derive each pixel from bilinear interpolation of the tile's 4 corner terrains: then any
   shared edge depends only on that edge's two corners, so wang-compatible neighbors are
   IDENTICAL along the join — seamless is guaranteed, not hoped for.
   Detailing (outlines, foam, ripples) must be a pure function of the interpolated terrain
   field, and dashes/motifs must stay off tile borders.
3. **Match house style:** 1px dark outline between terrains, a light rim on the "soft" side
   (mirror how the dirt trail and water shoreline do it), uniform base colors sampled from
   existing tiles (grass = the exact color of tile gid 5).

## The three files that MUST change together

- `public/kuesuto-tilemap.png` — append new 16px tiles as complete new ROWS at the bottom
  (13 columns of 16px; sheet width stays 208). Never move or repaint existing tiles.
- `src/data/tilesets/ks-forrest-tileset.json` — update `tilecount` and `imageheight`; add a
  NEW wangset (type `corner`; wangid corner slots `[1,3,5,7]` = `[TR,BR,BL,TL]`; provide the
  14 standard combos — the 2 diagonal-opposite ones don't exist, generators fall back).
  Never edit existing wangsets.
- `src/data/spriteJSON/kuesuto-tilemap.json` — the game draws `frames[gid-1]`, so the frames
  array MUST have exactly one entry per tile and matching `meta.size`. Regenerate it
  programmatically (16px grid over the whole sheet). It has been silently short before.

Constraint: gids ≥ 170 collide with Collision.tsx's firstgid. This is safe for ART (the
game resolves art to the forest tileset first, collision by layer NAME), but never use a
new tile as a collision marker.

## Proving it (mandatory before commit)

Build a small test map exercising every new tile in context (irregular shapes, diagonals)
— pattern it on `tools/_pond-test.mjs` — render with `tools/render-map.mjs`, and inspect
the PNG with the Read tool at 1x and zoomed (`tools/view.mjs`). Zero seams, no misaligned
edges, style matches neighbors. Also re-render an EXISTING map to prove old gids still
resolve identically. `npm run build` must pass. Commit all three files together with the
proof render.

## Current gaps (candidates for future extension)

- Corruption/thorn decor set for Shadowthorn Heart (standalone tiles — easiest).
- Hedge end caps + the 2 wang diagonal glue tiles (quadrant-stitch from existing art).
- Ruins/stone floor + wall wangset for the ruins interior maps.

## Done: "Grass Canopy" wangset (arbitrary-outline LTTP treelines)

`tools/canopy-tiles.mjs` composes the 13 canopy corner tiles (ids 182..194, sheet row 14)
and `tools/canopy-register.mjs` registers the `Grass Canopy` wangset (1=Canopy, 2=Grass),
bumps tilecount/imageheight, and regenerates the sprite frames. `tools/forest-gen.mjs`
gained a `canopies` region field (array of `{x,y,r}` circles, unioned) that draws solid
forest walls of ANY outline via this wangset — analogous to the `waters`/WANG_WATER path.
Proof: `tools/_canopy-test.mjs` (irregular concave cluster) + `tools/renders/canopy-proof.png`
and the generator render `tools/renders/canopy-gen-proof.png`.

Decisions worth knowing before extending it:
- **Edges composed procedurally; interiors reuse the hand-art crowns.** The hand-map blob
  art (gids 135/158/161 interior, scalloped edges) is a soft rounded-lump style whose bumps
  deliberately span tile borders, so it is NOT on a strict corner grid — reused in novel
  EDGE combos it seams. Colours are all sampled from that art, but the 12 edge tiles are
  re-derived by bilinear field so continuity is true by construction (same method as
  water-tiles.mjs). For DEEP INTERIOR cells (all 4 corners canopy) the generator emits the
  hand-map blob-interior pattern instead — gid 135 on the (x+y)-even checker, 158/161 on
  the other — so big masses read as repeated LTTP crown lobes, not a flat slab. The
  wangset's own all-canopy tile (182) carries a per-tile crown lobe as fallback for
  wangset-only consumers.
- **Generator coordination rules** (in forest-gen): the canopy mask never covers walkable
  cells and keeps ≥2 grass tiles from trail dirt (mask shrinks, not the trail) so the two
  corner lattices can't bite notches/slivers; stamps treat canopy cells + a 1-tile margin
  as occupied; hedge fences only appear in contiguous groups of ≥2 units (no lone
  fragments); ambience decor stays off trail-edge wang tiles.
- **Trunk fringe lives IN the south tiles (single-tile solution).** Trees show trunks below
  their leaves, so every tile whose canopy overhangs grass at the bottom grows small trunk
  tufts in its own grass region, in two fixed interior columns kept ≥3px off the L/R borders
  (so adjacent south tiles still share pure edges). No second tile row is needed below south
  edges — generators just draw the wangset and the trunks come for free.
