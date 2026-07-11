#!/usr/bin/env node
// Compose the Thornwick Waystation set pieces (props + buildings) and append them to
// the tileset sheet as complete new rows (15..19, ids 195..257 where used).
//
// Composed procedurally in house style — every color is sampled from the existing
// sheet's palette, 1px dark outlines, grass base color baked in (NO tile in the sheet
// uses transparency; Things tiles bake the grass background, so these do too). AI
// generation (ai-sprites skill) was unavailable in this environment; per the
// tileset-extension skill, procedural composition is the proven fallback and these
// pieces are standalone set pieces (no wang seam constraints).
//
//   node tools/waystation-tiles.mjs        # rewrites public/kuesuto-tilemap.png
//
// Idempotent: recomposes rows 15..19 every run. Register with waystation-register.mjs.

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const sheetPath = path.join(repoRoot, 'public/kuesuto-tilemap.png');

const T = 16;
const COLS = 13;
const FIRST_NEW_ROW = 15; // sheet currently ends at row 14 (height 240)

// --- palette (all sampled from public/kuesuto-tilemap.png) ---
const GRASS    = [62, 137, 72];    // all-grass ground tile base
const OUTLINE  = [0, 0, 0];
const NAVY     = [24, 20, 37];     // house-style inner rim / darkest shadow
const CHAR     = [22, 35, 46];     // charcoal / dark interior
const WOOD     = [184, 111, 80];   // lit plank
const WOOD_MID = [115, 62, 57];    // plank base / beams
const WOOD_DK  = [62, 39, 49];     // plank shadow
const WOOD_HI  = [194, 133, 105];  // pale worn wood (sign board, crate rim)
const STONE_HI = [192, 203, 220];
const STONE    = [139, 155, 180];
const STONE_DK = [90, 105, 136];
const STONE_SH = [58, 68, 102];
const ROOF     = [162, 38, 51];    // shingle base (dark red)
const ROOF_HI  = [228, 59, 68];    // shingle lit row
const WATER    = [18, 78, 137];
const WATER_HI = [0, 153, 219];
const TEAL     = [32, 93, 110];    // tent canvas base
const TEAL_HI  = [47, 122, 140];   // tent canvas lit face
const TEAL_DK  = [27, 79, 94];     // tent canvas shadow
const FLAME_LO = [247, 118, 34];
const FLAME    = [254, 174, 52];
const FLAME_HI = [254, 231, 97];
const ROPE     = [228, 166, 114];

// --- piece registry: sheet cells (tile ids) each piece occupies, row-major ---
// gid = id + 1. Layout keeps every multi-tile piece a contiguous block in the sheet.
const id = (row, col) => row * COLS + col;
export const PIECES = {
  campfire: { cols: 1, rows: 1, ids: [id(15, 0)] },
  crateA:   { cols: 1, rows: 1, ids: [id(15, 1)] },
  crateB:   { cols: 1, rows: 1, ids: [id(15, 2)] },
  signpost: { cols: 1, rows: 1, ids: [id(15, 3)] },
  well:     { cols: 2, rows: 2, ids: [id(15, 4), id(15, 5), id(16, 4), id(16, 5)] },
  tent:     { cols: 4, rows: 3, ids: [
    id(16, 0), id(16, 1), id(16, 2), id(16, 3),
    id(17, 0), id(17, 1), id(17, 2), id(17, 3),
    id(18, 0), id(18, 1), id(18, 2), id(18, 3)] },
  hut:      { cols: 5, rows: 4, ids: [
    id(16, 6), id(16, 7), id(16, 8), id(16, 9), id(16, 10),
    id(17, 6), id(17, 7), id(17, 8), id(17, 9), id(17, 10),
    id(18, 6), id(18, 7), id(18, 8), id(18, 9), id(18, 10),
    id(19, 6), id(19, 7), id(19, 8), id(19, 9), id(19, 10)] },
};
const LAST_NEW_ROW = 19;

// --- tiny raster helpers over a local piece canvas (w*16 x h*16, grass pre-filled) ---
const canvas = (cols, rows) => {
  const w = cols * T, h = rows * T;
  const px = new Array(w * h).fill(GRASS);
  return {
    w, h, px,
    put(x, y, c) { if (x >= 0 && y >= 0 && x < w && y < h) px[y * w + x] = c; },
    get(x, y) { return px[y * w + x]; },
    rect(x0, y0, x1, y1, c) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.put(x, y, c); },
    hline(x0, x1, y, c) { this.rect(x0, y, x1, y, c); },
    vline(x, y0, y1, c) { this.rect(x, y0, x, y1, c); },
    // 1px dark outline around everything that isn't grass (reads as the house style's
    // silhouette edge; only replaces grass pixels, never the art itself).
    outlineNonGrass() {
      const isArt = (x, y) => x >= 0 && y >= 0 && x < w && y < h && px[y * w + x] !== GRASS;
      const mark = [];
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        if (px[y * w + x] !== GRASS) continue;
        if (isArt(x - 1, y) || isArt(x + 1, y) || isArt(x, y - 1) || isArt(x, y + 1)) mark.push([x, y]);
      }
      for (const [x, y] of mark) px[y * w + x] = OUTLINE;
    },
  };
};

// --- campfire: stone ring, charred logs, teardrop flame ---
const drawCampfire = () => {
  const c = canvas(1, 1);
  const cx = 7.5, cy = 9.5;
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    // squashed ellipse ring (ry < rx: seen from the game's slight top-down)
    const d = Math.hypot((x - cx) / 7, (y - cy) / 5.4);
    if (d > 1) continue;
    if (d > 0.68) c.put(x, y, y < cy ? STONE : STONE_DK);      // ring stones
    else c.put(x, y, CHAR);                                    // fire pit
  }
  // stone facets (dark seams so the ring reads as separate stones)
  for (const [x, y] of [[3, 7], [11, 7], [1, 10], [13, 10], [4, 13], [10, 13], [7, 14]]) c.put(x, y, STONE_SH);
  for (const [x, y] of [[4, 6], [10, 6], [7, 5]]) c.put(x, y, STONE_HI);
  // log ends peeking through the pit
  c.rect(5, 11, 6, 12, WOOD_MID); c.rect(9, 11, 10, 12, WOOD_DK);
  // flame: layered teardrop above the pit center
  const flame = [
    [7, 2, 8, 2, FLAME_LO],
    [6, 3, 9, 3, FLAME_LO],
    [6, 4, 9, 4, FLAME],
    [5, 5, 10, 5, FLAME],
    [5, 6, 10, 6, FLAME],
    [6, 7, 9, 7, FLAME],
    [6, 8, 9, 8, FLAME],
    [7, 9, 8, 9, FLAME_LO],
  ];
  for (const [x0, y0, x1, y1, col] of flame) c.rect(x0, y0, x1, y1, col);
  c.rect(7, 5, 8, 7, FLAME_HI); // hot core
  c.outlineNonGrass();
  return c;
};

// --- crates: plank box, cross brace; B is the older/darker variant, brace flipped ---
const drawCrate = (variant) => {
  const c = canvas(1, 1);
  const lit = variant === 'A' ? WOOD : WOOD_MID;
  const base = variant === 'A' ? WOOD_MID : WOOD_DK;
  const rim = variant === 'A' ? WOOD_HI : WOOD;
  c.rect(2, 3, 13, 14, base);
  c.rect(2, 3, 13, 4, rim);                 // lit top lid edge
  c.rect(3, 5, 12, 12, lit);                // face
  c.hline(3, 12, 8, base);                  // plank split
  // cross brace (A: \ , B: /)
  for (let i = 0; i <= 7; i++) {
    const x = variant === 'A' ? 4 + i : 11 - i;
    c.put(x, 5 + i, WOOD_DK); c.put(x + 1, 5 + i, WOOD_DK);
  }
  c.rect(3, 13, 12, 13, WOOD_DK);           // ground shadow line inside the box
  // corner nails
  for (const [x, y] of [[3, 5], [12, 5], [3, 12], [12, 12]]) c.put(x, y, NAVY);
  c.outlineNonGrass();
  return c;
};

// --- signpost: post + worn board with carved text scratches ---
const drawSignpost = () => {
  const c = canvas(1, 1);
  c.rect(7, 3, 8, 14, WOOD_MID);            // post
  c.vline(8, 3, 14, WOOD_DK);               // post shadow side
  c.rect(2, 4, 13, 9, WOOD_HI);             // board
  c.rect(2, 4, 13, 4, [232, 183, 150]);     // board lit top edge (palette skin-tan)
  c.vline(2, 4, 9, WOOD);                   // board end grain
  c.vline(13, 4, 9, WOOD);
  // carved "text"
  c.hline(4, 8, 6, WOOD_DK); c.hline(10, 11, 6, WOOD_DK);
  c.hline(4, 6, 8, WOOD_DK); c.hline(8, 11, 8, WOOD_DK);
  // grass tufts at the base
  c.put(6, 14, [99, 199, 77]); c.put(10, 13, [99, 199, 77]);
  c.outlineNonGrass();
  return c;
};

// --- well: stone ring with water, two posts, crossbar, rope + bucket ---
const drawWell = () => {
  const c = canvas(2, 2);
  const cx = 15.5, cy = 20;
  for (let y = 0; y < c.h; y++) for (let x = 0; x < c.w; x++) {
    const d = Math.hypot((x - cx) / 13, (y - cy) / 9);
    if (d > 1) continue;
    if (d > 0.62) c.put(x, y, y < cy - 2 ? STONE : (y > cy + 4 ? STONE_DK : STONE)); // ring
    else c.put(x, y, WATER);                                                        // water
  }
  // ring shaping: lit inner-top lip, dark seams, highlight stones
  for (let x = 8; x <= 23; x++) { const y = 12 + ((x % 5 === 0) ? 1 : 0); if (c.get(x, y) === STONE) c.put(x, y, STONE_HI); }
  for (const [x, y] of [[5, 16], [26, 16], [3, 21], [28, 21], [7, 26], [24, 26], [12, 28], [19, 28]]) c.put(x, y, STONE_SH);
  // water: navy rim at the top edge of the pool + two glints
  for (let x = 10; x <= 21; x++) if (c.get(x, 16) === WATER) c.put(x, 16, NAVY);
  c.rect(12, 19, 14, 19, WATER_HI); c.rect(17, 21, 18, 21, WATER_HI);
  // posts (standing on the ring, clear of the water)
  c.rect(4, 4, 6, 16, WOOD_MID); c.vline(6, 4, 16, WOOD_DK); c.vline(4, 4, 16, WOOD);
  c.rect(25, 4, 27, 16, WOOD_MID); c.vline(27, 4, 16, WOOD_DK); c.vline(25, 4, 16, WOOD);
  // crossbar + rope + bucket
  c.rect(3, 3, 28, 5, WOOD_MID); c.hline(3, 28, 3, WOOD); c.hline(3, 28, 5, WOOD_DK);
  c.vline(15, 6, 11, ROPE); c.vline(16, 6, 11, ROPE);
  c.rect(13, 12, 18, 15, WOOD_MID); c.rect(13, 12, 18, 12, WOOD_HI); c.vline(18, 12, 15, WOOD_DK);
  c.outlineNonGrass();
  return c;
};

// --- tent: teal canvas A-frame, dark mouth, pennant ---
const drawTent = () => {
  const c = canvas(4, 3);
  const apexX = 31.5, apexY = 6, baseY = 45;
  const halfAt = (y) => 2 + (29 - 2) * (y - apexY) / (baseY - apexY); // 2px at apex -> 29 at base
  for (let y = apexY; y <= baseY; y++) {
    const half = halfAt(y);
    for (let x = Math.ceil(apexX - half); x <= Math.floor(apexX + half); x++) {
      // faces: lit left of the ridge, base right; darker near both slope edges
      const edge = half - Math.abs(x - apexX);
      let col = x < apexX ? TEAL_HI : TEAL;
      if (edge < 2.2) col = TEAL_DK;
      c.put(x, y, col);
    }
  }
  // ridge seam
  for (let y = apexY; y <= baseY; y++) c.put(32, y, TEAL_DK);
  // horizontal canvas seams (stay off tile borders per house style)
  for (const y of [18, 30, 42]) {
    const half = halfAt(y) - 3;
    for (let x = Math.ceil(apexX - half); x <= Math.floor(apexX + half); x++) {
      if ((x + y) % 2 === 0) c.put(x, y, x < apexX ? TEAL : TEAL_DK);
    }
  }
  // mouth: dark triangle, bottom center (covers tile cols 1-2 -> the walkable alcove)
  for (let y = 24; y <= baseY; y++) {
    const half = (y - 24) * 0.52;
    for (let x = Math.ceil(31.5 - half); x <= Math.floor(31.5 + half); x++) c.put(x, y, CHAR);
  }
  c.vline(31, 26, baseY, NAVY); c.vline(32, 26, baseY, NAVY); // inner shadow fold
  // pole tip + pennant
  c.rect(31, 2, 32, 5, WOOD_MID);
  c.rect(33, 2, 37, 3, ROOF_HI); c.put(38, 2, ROOF_HI);
  // ground pegs at the base corners
  c.rect(2, 44, 3, 45, WOOD_DK); c.rect(60, 44, 61, 45, WOOD_DK);
  c.outlineNonGrass();
  return c;
};

// --- hut: plank walls, red shingle roof, door alcove bottom-center, two windows ---
const drawHut = () => {
  const c = canvas(5, 4);
  const wallTop = 34, wallBot = 62, ridgeY = 2, eaveY = 33;
  // walls (inset 3px from the piece edges so the roof reads as overhanging)
  c.rect(3, wallTop, 76, wallBot, WOOD_MID);
  for (let y = wallTop; y <= wallBot; y += 4) c.hline(3, 76, y, WOOD_DK);      // plank courses
  for (let x = 6; x <= 76; x += 9) for (let y = wallTop; y <= wallBot; y++) {
    if (c.get(x, y) === WOOD_MID) c.put(x, y, WOOD);                           // lit plank ends
  }
  // support beams
  for (const x of [3, 39, 75]) { c.rect(x, wallTop, x + 1, wallBot, WOOD_DK); }
  c.rect(3, wallBot, 76, wallBot, NAVY);                                       // base shadow
  // windows (shutter-framed, teal glass with a glint)
  for (const wx of [10, 58]) {
    c.rect(wx, 42, wx + 11, 52, WOOD_DK);
    c.rect(wx + 2, 44, wx + 9, 50, TEAL);
    c.rect(wx + 2, 44, wx + 4, 46, [160, 216, 220]);
    c.hline(wx, wx + 11, 53, NAVY);                                            // sill shadow
  }
  // door: full-height opening in the bottom-center tile (col 2: x32..47)
  c.rect(33, 40, 46, wallBot, WOOD_DK);      // frame
  c.rect(35, 42, 44, wallBot, CHAR);         // opening
  c.vline(35, 42, wallBot, NAVY); c.vline(44, 42, wallBot, NAVY);
  c.rect(33, 40, 46, 41, WOOD);              // lintel
  // roof: trapezoid over everything above the eave
  const halfAt = (y) => 16 + (40 - 16) * (y - ridgeY) / (eaveY - ridgeY);
  for (let y = ridgeY; y <= eaveY; y++) {
    const half = Math.min(40, halfAt(y));
    for (let x = Math.ceil(39.5 - half); x <= Math.floor(39.5 + half); x++) {
      if (x < 0 || x > 79) continue;
      const shingleRow = ((y - ridgeY) % 6) < 2;
      const edge = half - Math.abs(x - 39.5);
      let col = shingleRow ? ROOF_HI : ROOF;
      if (edge < 2) col = ROOF;                                  // keep slope edges calm
      if ((x + ((y / 6) | 0) * 3) % 7 === 0 && !shingleRow) col = [104, 56, 108]; // shingle nicks (palette plum)
      c.put(x, y, col);
    }
  }
  c.hline(24, 55, ridgeY, ROOF_HI);           // lit ridge cap
  c.hline(24, 55, ridgeY + 1, ROOF_HI);
  // slope outlines
  for (let y = ridgeY; y <= eaveY; y++) {
    const half = Math.min(40, halfAt(y));
    c.put(Math.ceil(39.5 - half), y, NAVY); c.put(Math.floor(39.5 + half), y, NAVY);
  }
  c.hline(0, 79, eaveY, NAVY);                // eave edge
  c.hline(3, 76, wallTop, WOOD_DK);           // eave shadow on the wall
  c.outlineNonGrass();
  return c;
};

// --- compose onto the sheet ---
const main = () => {
  const src = PNG.sync.read(readFileSync(sheetPath));
  const newH = Math.max(src.height, (LAST_NEW_ROW + 1) * T);
  const out = new PNG({ width: src.width, height: newH });
  src.data.copy(out.data, 0, 0, src.width * Math.min(src.height, FIRST_NEW_ROW * T) * 4);

  const blit = (piece, art) => {
    piece.ids.forEach((tileId, i) => {
      const sx = (i % piece.cols) * T, sy = ((i / piece.cols) | 0) * T;
      const tx = (tileId % COLS) * T, ty = ((tileId / COLS) | 0) * T;
      for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
        const [r, g, b] = art.get(sx + x, sy + y);
        const o = ((ty + y) * out.width + (tx + x)) * 4;
        out.data[o] = r; out.data[o + 1] = g; out.data[o + 2] = b; out.data[o + 3] = 255;
      }
    });
  };

  blit(PIECES.campfire, drawCampfire());
  blit(PIECES.crateA, drawCrate('A'));
  blit(PIECES.crateB, drawCrate('B'));
  blit(PIECES.signpost, drawSignpost());
  blit(PIECES.well, drawWell());
  blit(PIECES.tent, drawTent());
  blit(PIECES.hut, drawHut());

  writeFileSync(sheetPath, PNG.sync.write(out));
  console.log(`Wrote ${path.relative(repoRoot, sheetPath)} (${out.width}x${out.height})`);
  for (const [name, p] of Object.entries(PIECES)) {
    console.log(`  ${name}: ${p.cols}x${p.rows}, gids [${p.ids.map((i) => i + 1).join(', ')}]`);
  }
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
