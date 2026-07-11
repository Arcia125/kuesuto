#!/usr/bin/env node
// Register the waystation set-piece rows (composed by waystation-tiles.mjs) into the
// tileset JSON — bump tilecount/imageheight to cover the grown sheet — and regenerate
// the sprite frames so the game can draw frames[gid-1] for EVERY tile (the frames
// array has been silently short before; always regenerate the full grid). No wangset:
// these are standalone pieces, referenced by explicit gids from structure stamps and
// object builders. Idempotent.
//
//   node tools/waystation-register.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import { PIECES } from './waystation-tiles.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const tilesetPath = path.join(repoRoot, 'src/data/tilesets/ks-forrest-tileset.json');
const spritePath = path.join(repoRoot, 'src/data/spriteJSON/kuesuto-tilemap.json');
const sheetPath = path.join(repoRoot, 'public/kuesuto-tilemap.png');

const TILE = 16;
const sheet = PNG.sync.read(readFileSync(sheetPath));
const COLS = Math.floor(sheet.width / TILE);
const ROWS = Math.floor(sheet.height / TILE);
const TILECOUNT = COLS * ROWS;

// --- tileset JSON: counts only ---
const tileset = JSON.parse(readFileSync(tilesetPath, 'utf8'));
tileset.tilecount = TILECOUNT;
tileset.imageheight = sheet.height;
tileset.imagewidth = sheet.width;
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

console.log(`Tileset: tilecount=${TILECOUNT}, image ${sheet.width}x${sheet.height}. Frames: ${sprite.frames.length}.`);
console.log('gid manifest (gid = tile id + 1):');
for (const [name, p] of Object.entries(PIECES)) {
  console.log(`  ${name}: ${p.cols}x${p.rows}, gids [${p.ids.map((i) => i + 1).join(', ')}]`);
}
