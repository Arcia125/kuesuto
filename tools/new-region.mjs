#!/usr/bin/env node
// Scaffold a new region definition with a winding corridor that satisfies the
// generator's layout requirements (corridor ±3, deep bands >= 10 tiles, 3-tile margin).
//   node tools/new-region.mjs <region-name> [--width 58] [--height 44]
// Writes tools/regions/<region-name>.mjs, then edit its objects/lore and run:
//   node tools/map-preview.mjs <region-name>

import { writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const name = args.find((a) => !a.startsWith('--'));
const get = (flag, dflt) => { const i = args.indexOf(`--${flag}`); return i >= 0 ? Number(args[i + 1]) : dflt; };
if (!name) { console.error('Usage: node tools/new-region.mjs <region-name> [--width 58] [--height 44]'); process.exit(1); }

const W = get('width', 58);
const H = get('height', 44);
if (H < 40) console.warn(`Warning: height ${H} < 40 leaves little room for tree blobs above/below the corridor.`);

const outPath = path.join(__dirname, 'regions', `${name}.mjs`);
if (existsSync(outPath)) { console.error(`${outPath} already exists — edit it instead.`); process.exit(1); }

const src = `// Region definition: "${name}". '.' = walkable floor, '#' = forest wall.
// Tile-unit coordinates. Generated scaffold — edit the corridor shape, objects, and lore,
// then run: node tools/map-preview.mjs ${name}
// Layout rules: corridor band ±3 around mid(x); keep >= 10 wall tiles above/below the
// corridor extremes (for tree blobs) and >= 3 tiles of wall on every map edge.

const WIDTH = ${W};
const HEIGHT = ${H};

// Winding corridor centre line. Adjust amplitude/wavelength to taste.
const mid = (x) => Math.round(HEIGHT / 2 + 5 * Math.sin((x - 3) / 7));
const HALF = 3;

const isFloor = (x, y) => x >= 3 && x <= WIDTH - 9 && Math.abs(y - mid(x)) <= HALF;

const rows = [];
for (let y = 0; y < HEIGHT; y++) {
  let row = '';
  for (let x = 0; x < WIDTH; x++) {
    row += isFloor(x, y) ? '.' : '#';
  }
  rows.push(row);
}

// Helper: a point on the corridor at column x (dy offsets vertically from the centre).
const on = (x, dy = 0) => ({ x, y: mid(x) + dy });

export default {
  name: '${name}',
  width: WIDTH,
  height: HEIGHT,
  rows,
  objects: [
    { name: 'Player Start Location', ...on(6) },

    // { name: 'InteractableZone', ...on(12), phrases: 'First line.|Second line.' },
    // { name: 'Enemy', type: 'corrupted_slime', ...on(18, -1) },
    // { name: 'Enemy', type: 'fast_slime', ...on(25, 1) },

    // Exit gate — targetMap must be a registered map; entryPoint must match a
    // 'Player Start Location'/entry object there.
    { name: 'Transition', ...on(WIDTH - 11, -1), widthTiles: 3, heightTiles: 3,
      targetMap: 'forrest', entryPoint: 'From Ruins' },
  ],
};
`;

writeFileSync(outPath, src);
console.log(`Wrote ${outPath}`);
console.log(`Next: edit objects/lore, then run: node tools/map-preview.mjs ${name}`);
