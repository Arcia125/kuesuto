#!/usr/bin/env node
// Convert AI-generated "pixel-art style" images into true pixel art in the game's
// palette: downscale by the detected (or given) pixel scale, snap every pixel to the
// nearest color found in kuesuto-tilemap.png, and turn magenta background transparent.
//
//   node tools/pixelize.mjs <in.png> [--scale N] [--out out.png]

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const inPath = args.find((a) => !a.startsWith('--'));
const get = (name) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : undefined; };
if (!inPath) { console.error('Usage: node tools/pixelize.mjs <in.png> [--scale N] [--out out.png]'); process.exit(1); }

const src = PNG.sync.read(readFileSync(inPath));

// --- game palette from the tilemap ---
const sheet = PNG.sync.read(readFileSync(path.join(repoRoot, 'public/kuesuto-tilemap.png')));
const palette = [];
const seen = new Set();
for (let i = 0; i < sheet.data.length; i += 4) {
  if (sheet.data[i + 3] < 255) continue;
  const key = (sheet.data[i] << 16) | (sheet.data[i + 1] << 8) | sheet.data[i + 2];
  if (seen.has(key)) continue;
  seen.add(key);
  palette.push([sheet.data[i], sheet.data[i + 1], sheet.data[i + 2]]);
}

// --- detect pixel scale: most common run length of identical colors along rows ---
const detectScale = () => {
  const counts = new Map();
  for (let y = 0; y < src.height; y += 37) {
    let run = 1;
    for (let x = 1; x < src.width; x++) {
      const i = (y * src.width + x) * 4, p = i - 4;
      const same = Math.abs(src.data[i] - src.data[p]) < 8 && Math.abs(src.data[i + 1] - src.data[p + 1]) < 8 && Math.abs(src.data[i + 2] - src.data[p + 2]) < 8;
      if (same) run++;
      else { if (run >= 2 && run <= 32) counts.set(run, (counts.get(run) ?? 0) + 1); run = 1; }
    }
  }
  let best = 8, bestCount = 0;
  for (const [k, v] of counts) if (v > bestCount) { best = k; bestCount = v; }
  return best;
};
const scale = Number(get('scale') ?? detectScale());

const outW = Math.floor(src.width / scale), outH = Math.floor(src.height / scale);
const out = new PNG({ width: outW, height: outH });

const isMagenta = (r, g, b) => r > 150 && b > 80 && g < 90 && Math.abs(r - b) < 130;

for (let y = 0; y < outH; y++) {
  for (let x = 0; x < outW; x++) {
    // sample the center pixel of each cell (robust against soft cell edges)
    const sx = x * scale + (scale >> 1), sy = y * scale + (scale >> 1);
    const si = (sy * src.width + sx) * 4;
    const [r, g, b] = [src.data[si], src.data[si + 1], src.data[si + 2]];
    const oi = (y * outW + x) * 4;
    if (isMagenta(r, g, b)) { out.data[oi + 3] = 0; continue; }
    let best = 0, bestD = Infinity;
    for (let p = 0; p < palette.length; p++) {
      const dr = r - palette[p][0], dg = g - palette[p][1], db = b - palette[p][2];
      const d = dr * dr + dg * dg + db * db;
      if (d < bestD) { bestD = d; best = p; }
    }
    out.data[oi] = palette[best][0]; out.data[oi + 1] = palette[best][1]; out.data[oi + 2] = palette[best][2]; out.data[oi + 3] = 255;
  }
}

const outPath = get('out') ?? inPath.replace(/\.png$/, `-px.png`);
writeFileSync(outPath, PNG.sync.write(out));
console.log(`Wrote ${outPath} (${outW}x${outH}, scale=${scale}, palette=${palette.length} colors)`);
