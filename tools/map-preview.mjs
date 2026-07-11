#!/usr/bin/env node
// One-shot: generate a region's map JSON and render it to a PNG for review.
//   node tools/map-preview.mjs <region-name>
// Writes src/data/maps/<region>.json and tools/renders/<region>-preview.png,
// then prints the PNG path (Read that file to judge the map visually).

import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const name = process.argv[2];
if (!name) { console.error('Usage: node tools/map-preview.mjs <region-name>'); process.exit(1); }

const run = (script, args) => execFileSync(process.execPath, [path.join(__dirname, script), ...args], { stdio: 'inherit' });
run('forest-gen.mjs', [name]);
const out = `tools/renders/${name}-preview.png`;
run('render-map.mjs', [name, '--scale', '2', '--out', out]);
console.log(`\nPreview ready — Read this file to review the map: ${out}`);
