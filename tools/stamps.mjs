// Stamp (brush) library extracted from the hand-authored kuesuto-world map, so every
// multi-tile tree arrangement is pixel-correct by construction (see tools/MAP-GENERATION.md).
//
// A stamp = { w, h, things: number[], collision: number[] } where things value 0 means
// "transparent — don't write this cell". Collision is copied from the source map.
//
// Source rects were located visually with tools/render-map.mjs + tools/dump-tiles.mjs.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const world = JSON.parse(readFileSync(path.join(repoRoot, 'src/data/maps/kuesuto-world.json'), 'utf8'));
const W = world.width;
const layer = (name) => world.layers.find((l) => l.name === name).data;
const srcThings = layer('Things');
const srcCol = layer('Collision');

// Passable 1-tile decor that may sit next to a tree in the source — not part of the stamp.
const DECOR = new Set([109, 110, 111, 112, 114, 115, 116]);
const isBlank = (v) => v === 0 || v === 1 || DECOR.has(v);

// Extract a rect; blank/decor cells become 0 (transparent); trims empty border rows/cols.
export const extract = (x0, y0, w, h) => {
  let things = [], collision = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y0 + y) * W + (x0 + x);
    things.push(isBlank(srcThings[i]) ? 0 : srcThings[i]);
    collision.push(isBlank(srcThings[i]) ? 0 : srcCol[i]);
  }
  // trim
  const used = (x, y) => things[y * w + x] !== 0;
  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (used(x, y)) {
    minX = Math.min(minX, x); minY = Math.min(minY, y);
    maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
  }
  const tw = maxX - minX + 1, th = maxY - minY + 1;
  const t = [], c = [];
  for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
    t.push(things[y * w + x]); c.push(collision[y * w + x]);
  }
  return { w: tw, h: th, things: t, collision: c };
};

// --- The library (source rects in kuesuto-world tile coords) ---
export const STAMPS = {
  // Diamond canopy blob, ~11x10 (trunks along lower edges).
  blobSmall: extract(28, 172, 11, 10),
  // Wider trapezoid blob from the north forest.
  blobMedium: extract(54, 174, 26, 15),
  // One big tree, 5 wide x 5 tall (used vertically-chained as fence columns).
  tree: extract(41, 206, 5, 5),
  // Horizontal hedge repeating unit (2 wide x 3 tall) + right end cap.
  hedgeUnit: extract(46, 231, 2, 3),
  hedgeCapR: extract(72, 231, 2, 3),
};

// Passable ambience decor (single tiles, no collision).
export const DECOR_TILES = [112, 114, 115, 111, 109, 110, 116];
