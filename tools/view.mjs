#!/usr/bin/env node
// Nearest-neighbor upscale a PNG for visual review (pixel art is unreadable at 1x).
//   node tools/view.mjs <in.png> [--scale N] [--out out.png]
// Default output: <in>-view.png next to the input, scale 6.

import { readFileSync, writeFileSync } from 'node:fs';
import { PNG } from 'pngjs';

const args = process.argv.slice(2);
const inPath = args.find((a) => !a.startsWith('--'));
const get = (name) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : undefined; };
if (!inPath) { console.error('Usage: node tools/view.mjs <in.png> [--scale N] [--out out.png]'); process.exit(1); }

const s = Number(get('scale') ?? 6);
const img = PNG.sync.read(readFileSync(inPath));
const out = new PNG({ width: img.width * s, height: img.height * s });
for (let y = 0; y < out.height; y++) {
  for (let x = 0; x < out.width; x++) {
    const si = (((y / s) | 0) * img.width + ((x / s) | 0)) * 4;
    const oi = (y * out.width + x) * 4;
    out.data[oi] = img.data[si]; out.data[oi + 1] = img.data[si + 1];
    out.data[oi + 2] = img.data[si + 2]; out.data[oi + 3] = img.data[si + 3];
  }
}
const outPath = get('out') ?? inPath.replace(/\.png$/, '-view.png');
writeFileSync(outPath, PNG.sync.write(out));
console.log(`Wrote ${outPath} (${out.width}x${out.height})`);
