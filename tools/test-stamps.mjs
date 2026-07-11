#!/usr/bin/env node
// Visual test bed for the stamp library: composes each stamp (and chained variants)
// onto a grass field, writes a temp map JSON, ready for tools/render-map.mjs.
//   node tools/test-stamps.mjs && node tools/render-map.mjs tools/renders/stamp-test.json --scale 2
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { STAMPS } from './stamps.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const W = 70, H = 40;
const ground = new Array(W * H).fill(5);
const things = new Array(W * H).fill(1);
const collision = new Array(W * H).fill(0);

const stamp = (s, tx, ty) => {
  for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) {
    const v = s.things[y * s.w + x];
    if (v === 0) continue;
    const i = (ty + y) * W + (tx + x);
    things[i] = v;
    collision[i] = s.collision[y * s.w + x];
  }
};

stamp(STAMPS.blobSmall, 2, 2);
stamp(STAMPS.blobMedium, 18, 2);
stamp(STAMPS.tree, 2, 20);                            // single tree
for (let k = 0; k < 3; k++) stamp(STAMPS.tree, 10, 18 + k * 5);  // vertical chain
for (let k = 0; k < 8; k++) stamp(STAMPS.hedgeUnit, 20 + k * 2, 22); // horizontal hedge
stamp(STAMPS.hedgeCapR, 36, 22);
// hedge meeting a tree corner
stamp(STAMPS.tree, 46, 20);
for (let k = 0; k < 5; k++) stamp(STAMPS.hedgeUnit, 51 + k * 2, 22);

const tileLayer = (name, id, data) => ({ data, height: H, id, name, opacity: 1, type: 'tilelayer', visible: true, width: W, x: 0, y: 0 });
const map = {
  compressionlevel: -1, height: H, infinite: false,
  layers: [tileLayer('Ground', 1, ground), tileLayer('Things', 2, things), tileLayer('Collision', 4, collision)],
  nextlayerid: 6, nextobjectid: 1, orientation: 'orthogonal', renderorder: 'right-down',
  tiledversion: '1.10.2', tileheight: 16,
  tilesets: [{ firstgid: 1, source: 'ks-forrest-tileset.tsx' }, { firstgid: 170, source: 'Collision.tsx' }],
  tilewidth: 16, type: 'map', version: '1.10', width: W,
};
const out = path.join(__dirname, 'renders', 'stamp-test.json');
mkdirSync(path.dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(map));
console.log(`Wrote ${out}`);
