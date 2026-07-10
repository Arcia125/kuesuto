#!/usr/bin/env node
// Throwaway proof for the "Grass Canopy" wangset: an irregular, curvy tree-cluster
// outline (unioned blobs, with concave bites) drawn purely through the wangset lookup
// (same corner-lattice logic forest-gen uses), so it can be rendered and inspected for
// seams / half-trees / correct south trunk fringe.
//
//   node tools/_canopy-test.mjs && node tools/render-map.mjs tools/renders/canopy-test.json \
//     --out tools/renders/canopy-proof.png --scale 3

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const tileset = JSON.parse(readFileSync(path.join(repoRoot, 'src/data/tilesets/ks-forrest-tileset.json'), 'utf8'));

const ws = tileset.wangsets.find((w) => w.name === 'Grass Canopy');
if (!ws) throw new Error('Grass Canopy wangset not found');
const CANOPY = 1, GRASS = 2;
const LUT = new Map();
for (const wt of ws.wangtiles) {
  LUT.set([wt.wangid[1], wt.wangid[3], wt.wangid[5], wt.wangid[7]].join(''), wt.tileid + 1);
}
const canopyTile = (tr, br, bl, tl) => {
  const key = `${tr}${br}${bl}${tl}`;
  if (LUT.has(key)) return LUT.get(key);
  const c = [tr, br, bl, tl].filter((v) => v === CANOPY).length;
  return c >= 2 ? LUT.get('1111') : LUT.get('2222');
};

const W = 40, H = 30;
// Irregular cluster: union of circles (curvy convex hull-ish) minus a concave bite.
const wooded = (x, y) => {
  const disc = (cx, cy, r) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
  const inside =
    disc(13, 12, 8) || disc(24, 11, 7) || disc(20, 18, 8) ||
    disc(31, 16, 6) || disc(9, 18, 5) || disc(28, 22, 5);
  const bite = disc(20, 9, 4.2) || disc(31, 22, 3.2); // concave notches
  return inside && !bite;
};
const cornerWood = (cx, cy) => {
  for (const [ox, oy] of [[-1, -1], [0, -1], [-1, 0], [0, 0]]) {
    const x = cx + ox, y = cy + oy;
    if (x >= 0 && y >= 0 && x < W && y < H && wooded(x, y)) return true;
  }
  return false;
};
const cc = (cx, cy) => (cornerWood(cx, cy) ? CANOPY : GRASS);

const ground = new Array(W * H).fill(5); // all grass base
const things = new Array(W * H).fill(1);
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    // draw the canopy on the Things layer (trees are decoration over grass ground)
    things[y * W + x] = canopyTile(cc(x + 1, y), cc(x + 1, y + 1), cc(x, y + 1), cc(x, y));
  }
}

const map = {
  compressionlevel: -1, height: H, infinite: false,
  layers: [
    { data: ground, height: H, id: 1, name: 'Ground', opacity: 1, type: 'tilelayer', visible: true, width: W, x: 0, y: 0 },
    { data: things, height: H, id: 2, name: 'Things', opacity: 1, type: 'tilelayer', visible: true, width: W, x: 0, y: 0 },
  ],
  nextlayerid: 3, nextobjectid: 1, orientation: 'orthogonal', renderorder: 'right-down',
  tiledversion: '1.10.2', tileheight: 16,
  tilesets: [{ firstgid: 1, source: 'ks-forrest-tileset.tsx' }, { firstgid: 196, source: 'Collision.tsx' }],
  tilewidth: 16, type: 'map', version: '1.10', width: W,
};

const outPath = path.join(repoRoot, 'tools/renders/canopy-test.json');
writeFileSync(outPath, JSON.stringify(map));
console.log(`Wrote ${path.relative(repoRoot, outPath)} (${W}x${H})`);
