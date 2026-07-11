#!/usr/bin/env node
// Print a rect of tile ids from a map layer as a grid (for reverse-engineering brushes).
//   node tools/dump-tiles.mjs <map-name> <layer> x,y,w,h
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const [mapName, layerName, rect] = process.argv.slice(2);
const [x0, y0, w, h] = rect.split(',').map(Number);
const map = JSON.parse(readFileSync(path.join(repoRoot, 'src/data/maps', `${mapName}.json`), 'utf8'));
const data = map.layers.find((l) => l.name === layerName).data;
for (let y = y0; y < y0 + h; y++) {
  let row = '';
  for (let x = x0; x < x0 + w; x++) row += String(data[y * map.width + x]).padStart(4, ' ');
  console.log(String(y).padStart(3, ' ') + ':' + row);
}
