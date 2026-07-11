#!/usr/bin/env node
// Register the "Grass Canopy" corner wangset into the tileset JSON, bump tilecount/
// imageheight to cover the new row 14 (ids 182..194), and regenerate the sprite frames
// so the game can draw frames[gid-1] for every tile. Idempotent.
//
//   node tools/canopy-register.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import { CANOPY_WANG_TILES } from './canopy-tiles.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const tilesetPath = path.join(repoRoot, 'src/data/tilesets/ks-forrest-tileset.json');
const spritePath = path.join(repoRoot, 'src/data/spriteJSON/kuesuto-tilemap.json');
const sheetPath = path.join(repoRoot, 'public/kuesuto-tilemap.png');

const TILE = 16;
const sheet = PNG.sync.read(readFileSync(sheetPath));
const COLS = Math.floor(sheet.width / TILE);
const ROWS = Math.floor(sheet.height / TILE);
const TILECOUNT = COLS * ROWS; // whole grid over the sheet

// --- tileset JSON: counts + wangset ---
const tileset = JSON.parse(readFileSync(tilesetPath, 'utf8'));
tileset.tilecount = TILECOUNT;
tileset.imageheight = sheet.height;
tileset.imagewidth = sheet.width;

// wangid corner slots [1,3,5,7] = [TR,BR,BL,TL]; edge slots stay 0.
const wangid = (c) => [0, c[0], 0, c[1], 0, c[2], 0, c[3]];
const wangtiles = [
  { tileid: 4, wangid: wangid([2, 2, 2, 2]) }, // all-grass reuses gid 5
  ...CANOPY_WANG_TILES.map(({ id, c }) => ({ tileid: id, wangid: wangid(c) })),
];
const canopyWangset = {
  colors: [
    { color: '#2d5c3e', name: 'Canopy', probability: 1, tile: -1 },
    { color: '#00ff00', name: 'Grass', probability: 1, tile: -1 },
  ],
  name: 'Grass Canopy', tile: -1, type: 'corner', wangtiles,
};
tileset.wangsets = tileset.wangsets.filter((w) => w.name !== 'Grass Canopy');
tileset.wangsets.push(canopyWangset);
writeFileSync(tilesetPath, JSON.stringify(tileset, null, 1));

// --- sprite frames: exactly one 16px frame per tile over the whole grid ---
const sprite = JSON.parse(readFileSync(spritePath, 'utf8'));
sprite.meta.size = { w: sheet.width, h: sheet.height };
sprite.frames = [];
for (let i = 0; i < TILECOUNT; i++) {
  const x = (i % COLS) * TILE, y = Math.floor(i / COLS) * TILE;
  sprite.frames.push({
    filename: '', frame: { x, y, w: TILE, h: TILE }, rotated: false, trimmed: false,
    spriteSourceSize: { x: 0, y: 0, w: TILE, h: TILE },
    sourceSize: { w: TILE, h: TILE }, duration: 100,
  });
}
writeFileSync(spritePath, JSON.stringify(sprite));

console.log(`Tileset: tilecount=${TILECOUNT}, imageheight=${sheet.height}, wangset "Grass Canopy" (${wangtiles.length} wangtiles). Frames: ${sprite.frames.length}.`);
