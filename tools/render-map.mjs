#!/usr/bin/env node
// Offline map renderer: composites a map's Ground + Things layers into a PNG using
// the shipped kuesuto-tilemap.png, so map quality can be reviewed without running
// the game. Supports rendering a crop of large maps and optional overlays.
//
//   node tools/render-map.mjs <map-name> [--out <file.png>] [--scale N]
//                             [--crop x,y,w,h]            (in TILES)
//                             [--collision]               (red overlay on solid cells)
//                             [--grid]                    (faint tile grid)
//
// Examples:
//   node tools/render-map.mjs ruins-approach --out tmp/ruins.png --scale 2
//   node tools/render-map.mjs kuesuto-world --crop 40,160,48,40 --collision

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const mapName = args.find((a) => !a.startsWith('--'));
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? (args[i + 1] ?? true) : undefined;
};
if (!mapName) {
  console.error('Usage: node tools/render-map.mjs <map-name> [--out f.png] [--scale N] [--crop x,y,w,h] [--collision] [--grid]');
  process.exit(1);
}

const TILE = 16;
const map = JSON.parse(readFileSync(path.join(repoRoot, 'src/data/maps', `${mapName}.json`), 'utf8'));
const sheet = PNG.sync.read(readFileSync(path.join(repoRoot, 'public/kuesuto-tilemap.png')));
const SHEET_COLS = Math.floor(sheet.width / TILE);

const layer = (name) => map.layers.find((l) => l.name === name && l.type === 'tilelayer');
const ground = layer('Ground')?.data ?? [];
const things = layer('Things')?.data ?? [];
const collision = layer('Collision')?.data ?? [];

// Crop (tile units); default = whole map.
let [cx, cy, cw, ch] = [0, 0, map.width, map.height];
const cropArg = flag('crop');
if (typeof cropArg === 'string') {
  [cx, cy, cw, ch] = cropArg.split(',').map(Number);
}
const scale = Number(flag('scale') ?? 1);
const showCollision = args.includes('--collision');
const showGrid = args.includes('--grid');

const out = new PNG({ width: cw * TILE * scale, height: ch * TILE * scale });

// Blit one 16x16 tile (gid, firstgid=1 tileset only) at tile coords (tx,ty) in the crop.
const blit = (gid, tx, ty, alphaBlend) => {
  if (gid <= 0 || gid >= 170) return; // 170+ = Collision.tsx marker, not art
  const id = gid - 1;
  const sx = (id % SHEET_COLS) * TILE;
  const sy = Math.floor(id / SHEET_COLS) * TILE;
  for (let py = 0; py < TILE; py++) {
    for (let px = 0; px < TILE; px++) {
      const si = ((sy + py) * sheet.width + (sx + px)) * 4;
      const a = sheet.data[si + 3];
      if (alphaBlend && a === 0) continue;
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          const ox = (tx * TILE + px) * scale + dx;
          const oy = (ty * TILE + py) * scale + dy;
          const oi = (oy * out.width + ox) * 4;
          if (alphaBlend && a < 255) {
            const na = a / 255;
            out.data[oi] = sheet.data[si] * na + out.data[oi] * (1 - na);
            out.data[oi + 1] = sheet.data[si + 1] * na + out.data[oi + 1] * (1 - na);
            out.data[oi + 2] = sheet.data[si + 2] * na + out.data[oi + 2] * (1 - na);
            out.data[oi + 3] = 255;
          } else {
            out.data[oi] = sheet.data[si];
            out.data[oi + 1] = sheet.data[si + 1];
            out.data[oi + 2] = sheet.data[si + 2];
            out.data[oi + 3] = 255;
          }
        }
      }
    }
  }
};

const tintCell = (tx, ty, r, g, b, strength) => {
  for (let py = 0; py < TILE * scale; py++) {
    for (let px = 0; px < TILE * scale; px++) {
      const oi = ((ty * TILE * scale + py) * out.width + (tx * TILE * scale + px)) * 4;
      out.data[oi] = out.data[oi] * (1 - strength) + r * strength;
      out.data[oi + 1] = out.data[oi + 1] * (1 - strength) + g * strength;
      out.data[oi + 2] = out.data[oi + 2] * (1 - strength) + b * strength;
    }
  }
};

for (let y = 0; y < ch; y++) {
  for (let x = 0; x < cw; x++) {
    const i = (cy + y) * map.width + (cx + x);
    blit(ground[i], x, y, false);
    blit(things[i], x, y, true);
    if (showCollision && collision[i]) tintCell(x, y, 255, 40, 40, 0.35);
  }
}

if (showGrid) {
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
    for (let k = 0; k < TILE * scale; k++) {
      for (const [ox, oy] of [[k, 0], [0, k]]) {
        const oi = ((y * TILE * scale + oy) * out.width + (x * TILE * scale + ox)) * 4;
        out.data[oi] = out.data[oi] * 0.85; out.data[oi + 1] = out.data[oi + 1] * 0.85; out.data[oi + 2] = out.data[oi + 2] * 0.85;
      }
    }
  }
}

const outPath = path.resolve(repoRoot, typeof flag('out') === 'string' ? flag('out') : `tools/renders/${mapName}.png`);
import('node:fs').then(({ mkdirSync }) => {
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, PNG.sync.write(out));
  console.log(`Wrote ${outPath} (${out.width}x${out.height})`);
});
