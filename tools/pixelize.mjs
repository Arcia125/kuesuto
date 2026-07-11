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

// "Magenta-ness": how strongly a pixel is contaminated by the chroma background.
// Pure chroma scores ~255; clean subject pixels score near/below 0; the AA ring
// between them scores in the middle.
const chromaness = (r, g, b) => (r + b) / 2 - g;
const KEY = 110;   // above this -> background
const SPILL = 40;  // above this near an edge -> AA-ring pixel, despill/drop

const snap = (r, g, b) => {
  let best = 0, bestD = Infinity;
  for (let p = 0; p < palette.length; p++) {
    const dr = r - palette[p][0], dg = g - palette[p][1], db = b - palette[p][2];
    const d = dr * dr + dg * dg + db * db;
    if (d < bestD) { bestD = d; best = p; }
  }
  return palette[best];
};

// Pass 1: per output cell, majority-vote transparency; a boundary cell contains both
// blended and pure-subject source pixels, so represent it by its LEAST chroma-
// contaminated pixel instead of the center (this alone removes most of the AA ring).
const alpha = new Uint8Array(outW * outH);
const spill = new Float32Array(outW * outH);
for (let y = 0; y < outH; y++) {
  for (let x = 0; x < outW; x++) {
    let bg = 0, bestM = Infinity, rr = 0, gg = 0, bb = 0;
    for (let py = 0; py < scale; py++) for (let px = 0; px < scale; px++) {
      const si = ((y * scale + py) * src.width + (x * scale + px)) * 4;
      const m = chromaness(src.data[si], src.data[si + 1], src.data[si + 2]);
      if (m > KEY) { bg++; continue; }
      if (m < bestM) { bestM = m; rr = src.data[si]; gg = src.data[si + 1]; bb = src.data[si + 2]; }
    }
    const i = y * outW + x;
    if (bg > (scale * scale) / 2 || bestM === Infinity) { alpha[i] = 0; continue; }
    alpha[i] = 1;
    spill[i] = bestM;
    const [pr, pg, pb] = snap(rr, gg, bb);
    const oi = i * 4;
    out.data[oi] = pr; out.data[oi + 1] = pg; out.data[oi + 2] = pb; out.data[oi + 3] = 255;
  }
}

// Pass 2: erode leftover ring — an opaque cell that borders transparency AND is still
// chroma-contaminated is a blend artifact, not subject; drop it.
for (let y = 0; y < outH; y++) {
  for (let x = 0; x < outW; x++) {
    const i = y * outW + x;
    if (!alpha[i] || spill[i] <= SPILL) continue;
    const edge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([ox, oy]) => {
      const nx = x + ox, ny = y + oy;
      return nx < 0 || ny < 0 || nx >= outW || ny >= outH || !alpha[ny * outW + nx];
    });
    if (edge) { out.data[i * 4 + 3] = 0; alpha[i] = 0; }
  }
}

const outPath = get('out') ?? inPath.replace(/\.png$/, `-px.png`);
writeFileSync(outPath, PNG.sync.write(out));
console.log(`Wrote ${outPath} (${outW}x${outH}, scale=${scale}, palette=${palette.length} colors)`);
