#!/usr/bin/env node
// Compose the "Grass Canopy" corner-wangset tiles and append them to the tileset sheet.
//
// The hand-authored map's tree blobs already contain correct canopy-edge art, but that
// art is a soft rounded-lump ("scale") style whose bumps deliberately span tile borders
// (the interior alternates gids 135/158/161, edges are offset scallops). Reused in the
// ARBITRARY corner-combo arrangements a generator needs, those tiles would seam. So — as
// the tileset-extension skill prescribes and tools/water-tiles.mjs demonstrates — the 13
// canopy wang tiles are composed procedurally, which makes edge continuity true BY
// CONSTRUCTION: every pixel's canopy-ness is a bilinear interpolation of the tile's four
// corner colors, so the profile along any tile edge depends only on that edge's two
// corners; two wang-compatible neighbours therefore share identical edge pixels.
//
// Colours are all sampled from the existing canopy art (see the palette block), so the
// new tiles sit in the same family as the hand-drawn blobs and butt seamlessly against
// the existing all-grass tile (gid 5).
//
// Trees have vertical structure: south-facing canopy edges hang TRUNK FRINGE into the
// grass below (that is how the hand map's blobs read as trees, not hedges). Each south
// edge / bottom-corner tile therefore grows self-contained trunk tufts in its own grass
// region, kept away from the L/R tile borders so adjacent south tiles still join cleanly.
//
//   node tools/canopy-tiles.mjs        # rewrites public/kuesuto-tilemap.png
//
// New tiles land in row 14 (ids 182..194). Idempotent: recomposes the row every run.

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const sheetPath = path.join(repoRoot, 'public/kuesuto-tilemap.png');

const TILE = 16;
const COLS = 13;
const NEW_ROW_Y = 224; // first new row (current sheet height)

// Palette — sampled from the existing canopy blobs + all-grass tile gid 5.
const GRASS     = [62, 137, 72];   // exact color of the all-grass ground tile (gid 5)
const CANOPY    = [38, 92, 66];    // canopy leaf base (lighter clump)
const CANOPY_DK = [25, 60, 62];    // canopy leaf shadow (darker clump)
const RIM       = [24, 20, 37];    // navy inner rim just inside the silhouette
const OUTLINE   = [0, 0, 0];       // dark silhouette outline against grass
const TRUNK     = [115, 62, 57];   // trunk core
const TRUNK_HI  = [184, 111, 80];  // trunk lit side
const TRUNK_DK  = [62, 39, 49];    // trunk shadow side

// Wang layout for ids 182..194, as (tr, br, bl, tl) with 1 = Canopy, 2 = Grass.
// (all-canopy interior 1111 gets a real tile; all-grass 2222 reuses gid 5, wangset only.)
export const CANOPY_WANG_TILES = [
  { id: 182, c: [1, 1, 1, 1] }, // all canopy (interior)
  { id: 183, c: [2, 1, 1, 1] }, // grass TR (inner corner)
  { id: 184, c: [1, 2, 1, 1] }, // grass BR (inner corner)
  { id: 185, c: [1, 1, 2, 1] }, // grass BL (inner corner)
  { id: 186, c: [1, 1, 1, 2] }, // grass TL (inner corner)
  { id: 187, c: [1, 2, 2, 2] }, // canopy TR (outer corner)
  { id: 188, c: [2, 1, 2, 2] }, // canopy BR (outer corner)
  { id: 189, c: [2, 2, 1, 2] }, // canopy BL (outer corner)
  { id: 190, c: [2, 2, 2, 1] }, // canopy TL (outer corner)
  { id: 191, c: [1, 2, 2, 1] }, // canopy top half  -> SOUTH edge (trunks below)
  { id: 192, c: [2, 1, 1, 2] }, // canopy bottom half -> NORTH edge
  { id: 193, c: [2, 2, 1, 1] }, // canopy left half  -> WEST edge
  { id: 194, c: [1, 1, 2, 2] }, // canopy right half -> EAST edge
];

// canopy-ness field: bilinear interpolation of corner values (canopy=1, grass=0).
// f > 0.5 => canopy. Along any edge f depends only on that edge's two corners, so
// wang-compatible neighbours share identical edge pixels (seamless by construction).
const field = (c, x, y) => {
  const [tr, br, bl, tl] = c.map((v) => (v === 1 ? 1 : 0));
  const u = (x + 0.5) / TILE, v = (y + 0.5) / TILE;
  return tl * (1 - u) * (1 - v) + tr * u * (1 - v) + bl * (1 - u) * v + br * u * v;
};

// Crown texture for the canopy interior: a dense lattice of overlapping crown lobes
// (quincunx per 16px period, distances wrapped mod 16 so the pattern continues across
// tile borders — seamless by construction). Dense coverage matters: edge and corner
// tiles only expose a FRAGMENT of the tile's canopy region, and with a single centered
// lobe those fragments landed in the empty gutter and rendered as flat dark voids —
// the "gap in the trees" look. The lit/dark balance (~46% lit) matches the hand-art
// crown tiles (135/158/161), which use this exact palette.
const LOBES = [[8, 4], [0, 12]]; // brick-offset rows of wide lobes
const leafPixel = (x, y) => {
  const lx = x % TILE, ly = y % TILE;
  let d = Infinity, nx = 0, ny = 0;
  for (const [bx, by] of LOBES) {
    let dx = Math.abs(lx - bx); dx = Math.min(dx, TILE - dx);
    let dy = Math.abs(ly - by); dy = Math.min(dy, TILE - dy);
    const dd = Math.hypot(dx / 1.6, dy); // wide, shallow ellipse = LTTP crown lobe
    if (dd < d) { d = dd; nx = lx - bx; ny = ly - by; }
  }
  if (d <= 2.1 && d > 1.2 && ny < 0.5 && nx < 1) return CANOPY_DK; // swirl arc in the dome
  if (d <= 3.5) return CANOPY;                                     // lit dome
  if (d <= 4.6) return CANOPY_DK;                                  // dark ring
  return RIM;                                                      // navy seams between rows
};

// Base terrain color for a pixel, purely a function of its canopy field value (so any tile
// edge depends only on that edge's two corners -> seamless with wang-compatible neighbours).
const basePixel = (f, x, y) => {
  if (f <= 0.5) return GRASS;
  if (f <= 0.55) return OUTLINE;                 // 1px dark silhouette on canopy side
  if (f <= 0.62) return RIM;                     // navy inner rim
  return leafPixel(x, y);
};

// Trunk fringe: only on tiles whose canopy overhangs grass at the bottom (south edges and
// bottom corners). Tufts sit in two fixed interior columns, kept >= 3px from the L/R
// borders so two adjacent south tiles still share pure grass/canopy edges.
const TUFT_COLS = [4, 11];
const composeTile = (put, corners) => {
  const fAt = (x, y) => field(corners, x, y);
  const southTile = fAt(8, 3) > 0.5 && fAt(8, 15) <= 0.5;

  const trunk = {}; // "x,y" -> color, painted over the grass region
  if (southTile) {
    for (const cx of TUFT_COLS) {
      // canopy overhangs this column only if there is canopy near the top here
      if (fAt(cx, 2) <= 0.5) continue;
      // find the underside: first grass row scanning down this column
      let yTop = TILE;
      for (let y = 0; y < TILE; y++) if (fAt(cx, y) <= 0.5) { yTop = y; break; }
      if (yTop >= TILE) continue;
      const h = Math.min(4, TILE - yTop);
      for (let k = 0; k < h; k++) {
        const y = yTop + k;
        trunk[`${cx - 1},${y}`] = TRUNK_HI;
        trunk[`${cx},${y}`] = TRUNK;
        trunk[`${cx + 1},${y}`] = TRUNK_DK;
      }
      // little root/base outline at the bottom of the tuft
      const yb = yTop + h - 1;
      trunk[`${cx - 1},${yb}`] = OUTLINE;
      trunk[`${cx + 1},${yb}`] = OUTLINE;
    }
  }

  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const t = trunk[`${x},${y}`];
      put(x, y, t ?? basePixel(fAt(x, y), x, y));
    }
  }
};

const main = () => {
  const src = PNG.sync.read(readFileSync(sheetPath));
  const newH = Math.max(src.height, NEW_ROW_Y + TILE);
  const out = new PNG({ width: src.width, height: newH });
  src.data.copy(out.data, 0, 0, src.width * src.height * 4);

  for (const { id, c } of CANOPY_WANG_TILES) {
    const tx = (id % COLS) * TILE;
    const ty = Math.floor(id / COLS) * TILE;
    composeTile((x, y, [r, g, b]) => {
      const i = ((ty + y) * out.width + (tx + x)) * 4;
      out.data[i] = r; out.data[i + 1] = g; out.data[i + 2] = b; out.data[i + 3] = 255;
    }, c);
  }

  writeFileSync(sheetPath, PNG.sync.write(out));
  console.log(`Wrote ${path.relative(repoRoot, sheetPath)} (${out.width}x${out.height}, canopy tiles ids 182..194)`);
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
