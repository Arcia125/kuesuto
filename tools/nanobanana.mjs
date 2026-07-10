#!/usr/bin/env node
// Generate candidate art with Gemini image generation ("nano-banana"), optionally
// conditioned on reference images (e.g. the game tilemap for style matching).
// Reads GEMINI_API_KEY from the environment. Output PNGs land in tools/generated/.
//
//   node tools/nanobanana.mjs --prompt "..." [--ref path.png ...] [--out name.png]
//
// NOTE: results are "pixel-art style", not pixel-exact; anything destined for the
// tileset still needs downscale + palette-quantize (see tools/MAP-GENERATION.md).

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'generated');

const args = process.argv.slice(2);
const getAll = (name) => args.flatMap((a, i) => (a === `--${name}` ? [args[i + 1]] : []));
const get = (name) => getAll(name)[0];

const prompt = get('prompt');
if (!prompt) { console.error('Usage: node tools/nanobanana.mjs --prompt "..." [--ref img.png] [--out name.png]'); process.exit(1); }

// Keys start with "AIza"; strip any accidentally pasted leading junk/whitespace.
let key = (process.env.GEMINI_API_KEY ?? '').trim();
const at = key.indexOf('AIza');
if (at > 0) key = key.slice(at);
if (!key) { console.error('GEMINI_API_KEY is not set.'); process.exit(1); }

const parts = [];
for (const ref of getAll('ref')) {
  parts.push({ inline_data: { mime_type: 'image/png', data: readFileSync(ref).toString('base64') } });
}
parts.push({ text: prompt });

const MODEL = 'gemini-2.5-flash-image';
const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ contents: [{ parts }] }),
});
if (!res.ok) { console.error(`HTTP ${res.status}: ${await res.text()}`); process.exit(1); }
const body = await res.json();

mkdirSync(outDir, { recursive: true });
let n = 0;
for (const part of body.candidates?.[0]?.content?.parts ?? []) {
  if (part.text) console.log(`[model] ${part.text}`);
  const data = part.inlineData?.data ?? part.inline_data?.data;
  if (!data) continue;
  const name = get('out') ?? `nanobanana-${Date.now()}.png`;
  const outPath = path.join(outDir, n === 0 ? name : name.replace(/\.png$/, `-${n}.png`));
  writeFileSync(outPath, Buffer.from(data, 'base64'));
  console.log(`Wrote ${outPath}`);
  n++;
}
if (n === 0) console.error('No image in response (safety block or text-only reply).');
