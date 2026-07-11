#!/usr/bin/env node
// Throwaway proof for the "Grass Water" wangset: builds a small grass map with an
// irregular pond + a stream arm using ONLY the wangset lookup (same corner-lattice
// logic as forest-gen's groundTile), writes a Tiled-format JSON, so it can be
// rendered with tools/render-map.mjs and inspected for seams.
//
//   node tools/_pond-test.mjs && node tools/render-map.mjs tools/renders/pond-test.json \
//     --out tools/renders/pond-proof.png --scale 4

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const tileset = JSON.parse(readFileSync(path.join(repoRoot, 'src/data/tilesets/ks-forrest-tileset.json'), 'utf8'));

const ws = tileset.wangsets.find((w) => w.name === 'Grass Water');
if (!ws) throw new Error('Grass Water wangset not found');
const WATER = 1, GRASS = 2;
const LUT = new Map();
for (const wt of ws.wangtiles) {
  LUT.set([wt.wangid[1], wt.wangid[3], wt.wangid[5], wt.wangid[7]].join(''), wt.tileid + 1);
}
const groundTile = (tr, br, bl, tl) => {
  const key = `${tr}${br}${bl}${tl}`;
  if (LUT.has(key)) return LUT.get(key);
  // missing diagonal-opposite combos: majority fallback, as in forest-gen
  const water = [tr, br, bl, tl].filter((c) => c === WATER).length;
  return water >= 2 ? LUT.get('1111') : LUT.get('2222');
};

const W = 24, H = 18;
// Water body: two overlapping ellipses (pond) + a diagonal stream arm (>=2 tiles wide).
const wet = (x, y) => {
  const e1 = ((x - 9) / 5.5) ** 2 + ((y - 7) / 4) ** 2 <= 1;
  const e2 = ((x - 14) / 4.5) ** 2 + ((y - 10) / 3.5) ** 2 <= 1;
  const stream = x >= 16 && x <= 23 && Math.abs(y - (10 + (x - 16) * 0.5)) <= 1.4;
  return e1 || e2 || stream;
};
const cornerWater = (cx, cy) => {
  for (const [ox, oy] of [[-1, -1], [0, -1], [-1, 0], [0, 0]]) {
    const x = cx + ox, y = cy + oy;
    if (x >= 0 && y >= 0 && x < W && y < H && wet(x, y)) return true;
  }
  return false;
};
const cc = (cx, cy) => (cornerWater(cx, cy) ? WATER : GRASS);

const ground = new Array(W * H);
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    ground[y * W + x] = groundTile(cc(x + 1, y), cc(x + 1, y + 1), cc(x, y + 1), cc(x, y));
  }
}

const map = {
  compressionlevel: -1, height: H, infinite: false,
  layers: [
    { data: ground, height: H, id: 1, name: 'Ground', opacity: 1, type: 'tilelayer', visible: true, width: W, x: 0, y: 0 },
    { data: new Array(W * H).fill(1), height: H, id: 2, name: 'Things', opacity: 1, type: 'tilelayer', visible: true, width: W, x: 0, y: 0 },
  ],
  nextlayerid: 3, nextobjectid: 1, orientation: 'orthogonal', renderorder: 'right-down',
  tiledversion: '1.10.2', tileheight: 16,
  tilesets: [{ firstgid: 1, source: 'ks-forrest-tileset.tsx' }, { firstgid: 183, source: 'Collision.tsx' }],
  tilewidth: 16, type: 'map', version: '1.10', width: W,
};

const outPath = path.join(repoRoot, 'tools/renders/pond-test.json');
writeFileSync(outPath, JSON.stringify(map));
console.log(`Wrote ${path.relative(repoRoot, outPath)} (${W}x${H})`);
