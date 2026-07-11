#!/usr/bin/env node
// Throwaway proof for the waystation set pieces: a small all-grass map with every new
// piece placed on the Things layer (every new gid exercised exactly once), for visual
// inspection against the grass ground.
//
//   node tools/_waystation-test.mjs && node tools/render-map.mjs tools/renders/waystation-test.json \
//     --out tools/renders/waystation-proof.png --scale 4

import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PIECES } from './waystation-tiles.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const W = 26, H = 14;
const GRASS_GID = 5, EMPTY = 1;
const ground = new Array(W * H).fill(GRASS_GID);
const things = new Array(W * H).fill(EMPTY);

const place = (name, tx, ty) => {
  const p = PIECES[name];
  p.ids.forEach((id, i) => {
    things[(ty + ((i / p.cols) | 0)) * W + tx + (i % p.cols)] = id + 1;
  });
};

place('hut', 2, 2);
place('tent', 9, 3);
place('well', 15, 3);
place('campfire', 19, 4);
place('crateA', 21, 3);
place('crateB', 22, 4);
place('signpost', 19, 7);

const layer = (name, id, data) => ({ data, height: H, id, name, opacity: 1, type: 'tilelayer', visible: true, width: W, x: 0, y: 0 });
const map = {
  compressionlevel: -1, height: H, infinite: false,
  layers: [layer('Ground', 1, ground), layer('Things', 2, things)],
  nextlayerid: 3, nextobjectid: 1, orientation: 'orthogonal', renderorder: 'right-down',
  tiledversion: '1.10.2', tileheight: 16,
  tilesets: [{ firstgid: 1, source: 'ks-forrest-tileset.tsx' }, { firstgid: 170, source: 'Collision.tsx' }],
  tilewidth: 16, type: 'map', version: '1.10', width: W,
};

const outPath = path.join(repoRoot, 'tools/renders/waystation-test.json');
writeFileSync(outPath, JSON.stringify(map));
console.log(`Wrote ${path.relative(repoRoot, outPath)} (${W}x${H})`);
