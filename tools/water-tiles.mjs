#!/usr/bin/env node
// Compose the "Grass Water" corner-wangset tiles and append them to the tileset sheet.
//
// AI generation (nano-banana) proved the style/colors for pond water in this game's
// look (tools/generated/water-v1.png) but — as the ai-sprites skill predicts — cannot
// produce pixel-exact connector tiles. So the 13 wang tiles are composed here
// procedurally, which makes edge continuity true BY CONSTRUCTION:
//   * every pixel's terrain is decided by bilinear interpolation of the tile's four
//     corner colors, so the color profile along any tile edge is a function of only
//     that edge's two corners — two adjacent wang-compatible tiles therefore always
//     share identical edge pixels;
//   * grass regions use the exact uniform color of the existing all-grass tile (gid 5),
//     so shore tiles butt seamlessly against existing grass;
//   * water/foam/outline colors were sampled from the nano-banana output so the pond
//     reads in the same palette family as the rest of the sheet.
//
//   node tools/water-tiles.mjs        # rewrites public/kuesuto-tilemap.png (208x224)
//
// New tiles land in row 13 (ids 169..181). Idempotent: recomposes the row every run.

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const sheetPath = path.join(repoRoot, 'public/kuesuto-tilemap.png');

const TILE = 16;
const COLS = 13;
const NEW_ROW_Y = 208; // first new row (was the old sheet height)

// Palette (sampled from tools/generated/water-v1.png + existing grass tile gid 5)
const GRASS = [62, 137, 72];      // exact color of the all-grass ground tile
const WATER = [32, 93, 110];      // calm water base
const WATER_DK = [27, 79, 94];    // subtle darker water shade
const RIPPLE = [47, 122, 140];    // ripple highlight dashes
const FOAM = [160, 216, 220];     // shoreline foam rim
const OUTLINE = [22, 35, 46];     // dark shoreline outline (navy, like the AI shore)

// Wang layout for ids 169..181, as (tr, br, bl, tl) with 1 = Water, 2 = Grass.
// (all-grass 2222 reuses existing tile id 4 / gid 5 — registered in the wangset only)
export const WATER_WANG_TILES = [
  { id: 169, c: [1, 1, 1, 1] }, // all water
  { id: 170, c: [2, 1, 1, 1] }, // grass TR corner
  { id: 171, c: [1, 2, 1, 1] }, // grass BR corner
  { id: 172, c: [1, 1, 2, 1] }, // grass BL corner
  { id: 173, c: [1, 1, 1, 2] }, // grass TL corner
  { id: 174, c: [1, 2, 2, 2] }, // water TR corner
  { id: 175, c: [2, 1, 2, 2] }, // water BR corner
  { id: 176, c: [2, 2, 1, 2] }, // water BL corner
  { id: 177, c: [2, 2, 2, 1] }, // water TL corner
  { id: 178, c: [2, 1, 1, 2] }, // grass top half
  { id: 179, c: [1, 2, 2, 1] }, // grass bottom half
  { id: 180, c: [1, 1, 2, 2] }, // grass left half
  { id: 181, c: [2, 2, 1, 1] }, // grass right half
];

// Fixed ripple dashes (kept >=2px away from tile borders so every tile edge is pure
// water color — required for seamless joins). Each dash is 2px wide.
const RIPPLES = [
  [3, 3], [4, 3], [10, 5], [11, 5], [5, 9], [6, 9], [12, 11], [2, 12], [3, 12], [9, 13],
];
const RIPPLES_DK = [[8, 2], [13, 8], [4, 6], [10, 10]];

// grassness field: bilinear interpolation of corner values (grass=1, water=0).
// f > 0.5 => grass. Along any edge f depends only on that edge's two corners.
const field = (c, x, y) => {
  const [tr, br, bl, tl] = c.map((v) => (v === 2 ? 1 : 0));
  const u = (x + 0.5) / TILE, v = (y + 0.5) / TILE;
  return tl * (1 - u) * (1 - v) + tr * u * (1 - v) + bl * (1 - u) * v + br * u * v;
};

const composeTile = (put, corners) => {
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const f = field(corners, x, y);
      let col;
      if (f > 0.5) {
        col = f <= 0.565 ? OUTLINE : GRASS;             // 1px dark outline on grass side
      } else if (f > 0.40) {
        col = FOAM;                                      // foam rim on water side
      } else if (f > 0.33) {
        col = WATER_DK;                                  // darker settle band under foam
      } else {
        col = WATER;
        if (RIPPLES.some(([rx, ry]) => rx === x && ry === y) && f < 0.2) col = RIPPLE;
        else if (RIPPLES_DK.some(([rx, ry]) => rx === x && ry === y) && f < 0.2) col = WATER_DK;
      }
      put(x, y, col);
    }
  }
};

const main = () => {
  const src = PNG.sync.read(readFileSync(sheetPath));
  const newH = Math.max(src.height, NEW_ROW_Y + TILE);
  const out = new PNG({ width: src.width, height: newH });
  src.data.copy(out.data, 0, 0, src.width * src.height * 4);

  for (const { id, c } of WATER_WANG_TILES) {
    const tx = (id % COLS) * TILE;
    const ty = Math.floor(id / COLS) * TILE;
    composeTile((x, y, [r, g, b]) => {
      const i = ((ty + y) * out.width + (tx + x)) * 4;
      out.data[i] = r; out.data[i + 1] = g; out.data[i + 2] = b; out.data[i + 3] = 255;
    }, c);
  }

  writeFileSync(sheetPath, PNG.sync.write(out));
  console.log(`Wrote ${path.relative(repoRoot, sheetPath)} (${out.width}x${out.height}, water tiles ids 169..181)`);
};

// Only run as a script (the wang table is importable by generators/tests).
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
