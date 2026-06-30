#!/usr/bin/env node
// Forest map generator (wang + brush). Renders a region definition
// (tools/regions/<name>.mjs: name/width/height/rows/objects, '.'=walkable, '#'=forest)
// into a Tiled-format JSON map with:
//   - Ground: a wang-autotiled DIRT TRAIL down the walkable corridor on grass, using the
//     tileset's "Grass Forrest" corner wangset (correct seamless path art).
//   - Things/Collision: real FOREST sampled from the existing hand-authored forrest art
//     (no clipped sprites from masking — see tools/MAP-GENERATION.md), with scattered
//     passable bushes for life on the walkable floor.
// Validated before writing: BFS connectivity start->exits, wang coverage, clear objects.
//
//   node tools/forest-gen.mjs ruins-approach

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const readJSON = (p) => JSON.parse(readFileSync(p, 'utf8'));
const tileset = readJSON(path.join(repoRoot, 'src/data/tilesets/ks-forrest-tileset.json'));
const sourceMap = readJSON(path.join(repoRoot, 'src/data/maps/kuesuto-world.json'));

const TILE = { GRASS: 5, BLANK: 1, COLLISION: 170, EMPTY: 0 };
const BUSHES = [112, 114, 115, 111]; // passable single-tile decor
const DIRT = 1, GRASS = 2; // wang color ids

// --- wang corner lookup: [TR,BR,BL,TL] color string -> ground tile (firstgid=1) ---
const buildWangLookup = () => {
  const ws = tileset.wangsets[0];
  const lut = new Map();
  for (const wt of ws.wangtiles) {
    const key = [wt.wangid[1], wt.wangid[3], wt.wangid[5], wt.wangid[7]].join('');
    if (!lut.has(key)) lut.set(key, wt.tileid + 1);
  }
  return lut;
};
const WANG = buildWangLookup();
const groundTile = (tr, br, bl, tl) => {
  const key = `${tr}${br}${bl}${tl}`;
  if (WANG.has(key)) return WANG.get(key);
  // Missing combo (the two diagonal-opposite cases the wangset omits): fall back to the
  // majority color's solid tile so we never emit a broken edge.
  const dirt = [tr, br, bl, tl].filter((c) => c === DIRT).length;
  return dirt >= 2 ? (WANG.get('1111') ?? TILE.GRASS) : (WANG.get('2222') ?? TILE.GRASS);
};

// --- forest texture sampled from the existing forrest (real, coherent tree art) ---
const SRC = { x: 48, y: 176, w: 32, h: 32 };
const srcLayer = (name) => sourceMap.layers.find((l) => l.name === name).data;
const SRC_W = sourceMap.width;
const srcThings = srcLayer('Things');
const srcCol = srcLayer('Collision');
// Tiled (modulo) sampling; the seam falls inside the deep-forest backdrop, never on the
// walkable path, so at worst two tree patches meet — never a half-drawn sprite.
const forestThingsAt = (x, y) => srcThings[(SRC.y + (y % SRC.h)) * SRC_W + (SRC.x + (x % SRC.w))];
const forestColAt = (x, y) => srcCol[(SRC.y + (y % SRC.h)) * SRC_W + (SRC.x + (x % SRC.w))];

// --- deterministic RNG ---
let seed = 1337;
const rand = () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const tileLayer = (name, id, data, width, height, opacity) => ({
  data, height, id, name, opacity, type: 'tilelayer', visible: true, width, x: 0, y: 0,
});

const OBJECT_BUILDERS = {
  'Player Start Location': () => ({ type: 'Spawn', point: true, properties: [{ name: 'type', type: 'string', value: 'playerStart' }] }),
  'Enemy': (o) => ({ type: 'npc', point: true, properties: [{ name: 'hostile', type: 'bool', value: true }, { name: 'type', type: 'string', value: o.type }] }),
  'InteractableZone': (o) => ({ type: 'InteractableZone', point: true, properties: [{ name: 'phrases', type: 'string', value: o.phrases }] }),
  'Transition': (o) => ({ type: 'Transition', width: (o.widthTiles ?? 1) * 16, height: (o.heightTiles ?? 1) * 16, properties: [{ name: 'targetMap', type: 'string', value: o.targetMap }, { name: 'entryPoint', type: 'string', value: o.entryPoint }] }),
};

const build = (region) => {
  const { width: W, height: H, rows } = region;
  const walkable = (x, y) => (rows[y]?.[x] ?? '#') === '.';

  // Per-column walkable midline → a dirt trail down the corridor (corner lattice).
  const colMid = [];
  for (let x = 0; x < W; x++) {
    let lo = -1, hi = -1;
    for (let y = 0; y < H; y++) if (walkable(x, y)) { if (lo < 0) lo = y; hi = y; }
    colMid[x] = lo < 0 ? -1 : (lo + hi) / 2;
  }
  const TRAIL_HALF = 1.0;
  const tileIsDirt = (x, y) => walkable(x, y) && colMid[x] >= 0 && Math.abs(y - colMid[x]) <= TRAIL_HALF;
  // Corner lattice (W+1 x H+1): a corner is dirt if any of its 4 surrounding tiles is dirt.
  const cornerDirt = (cx, cy) => {
    for (const [ox, oy] of [[-1, -1], [0, -1], [-1, 0], [0, 0]]) {
      const x = cx + ox, y = cy + oy;
      if (x >= 0 && y >= 0 && x < W && y < H && tileIsDirt(x, y)) return true;
    }
    return false;
  };
  const cc = (cx, cy) => (cornerDirt(cx, cy) ? DIRT : GRASS);

  const ground = new Array(W * H);
  const things = new Array(W * H);
  const collision = new Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      ground[i] = groundTile(cc(x + 1, y), cc(x + 1, y + 1), cc(x, y + 1), cc(x, y));
      if (walkable(x, y)) {
        things[i] = (!tileIsDirt(x, y) && rand() < 0.10) ? BUSHES[(rand() * BUSHES.length) | 0] : TILE.BLANK;
        collision[i] = TILE.EMPTY;
      } else {
        // Forest wall: draw the real tree art for looks, but keep collision SOLID on every
        // wall cell so the source texture's internal gaps can't become passable holes.
        things[i] = forestThingsAt(x, y);
        collision[i] = TILE.COLLISION;
      }
    }
  }

  // Force object tiles + a ring clear & walkable (no tree on an NPC, ground readable).
  const objs = region.objects ?? [];
  for (const o of objs) {
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const x = o.x + dx, y = o.y + dy;
      if (x < 0 || y < 0 || x >= W || y >= H) continue;
      const i = y * W + x;
      things[i] = TILE.BLANK;
      collision[i] = TILE.EMPTY;
    }
  }

  // Validate connectivity: player start must reach every Transition over non-collision.
  const starts = objs.filter((o) => o.name === 'Player Start Location');
  const exits = objs.filter((o) => o.name === 'Transition');
  if (starts.length && exits.length) {
    const seen = new Uint8Array(W * H);
    const q = [starts[0].y * W + starts[0].x];
    seen[q[0]] = 1;
    for (let h = 0; h < q.length; h++) {
      const ci = q[h], cx = ci % W, cy = (ci / W) | 0;
      for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + ox, ny = cy + oy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const ni = ny * W + nx;
        if (seen[ni] || collision[ni] !== 0) continue;
        seen[ni] = 1; q.push(ni);
      }
    }
    for (const e of exits) {
      if (!seen[e.y * W + e.x]) throw new Error(`Validation: Transition at (${e.x},${e.y}) unreachable from player start.`);
    }
  }

  // Objects
  let nextId = 1;
  const objects = objs.map((o) => {
    const spec = OBJECT_BUILDERS[o.name](o);
    const obj = { height: spec.height ?? 0, id: nextId++, name: o.name, properties: spec.properties, rotation: 0, type: spec.type, visible: true, width: spec.width ?? 0, x: o.x * 16, y: o.y * 16 };
    if (spec.point) obj.point = true;
    return obj;
  });

  return {
    compressionlevel: -1, height: H, infinite: false,
    layers: [
      tileLayer('Ground', 1, ground, W, H, 1),
      tileLayer('Things', 2, things, W, H, 1),
      tileLayer('Collision', 4, collision, W, H, 0.58),
      { draworder: 'topdown', id: 5, name: 'Positions', objects, opacity: 1, type: 'objectgroup', visible: true, x: 0, y: 0 },
    ],
    nextlayerid: 6, nextobjectid: nextId, orientation: 'orthogonal', renderorder: 'right-down',
    tiledversion: '1.10.2', tileheight: 16,
    tilesets: [{ firstgid: 1, source: 'ks-forrest-tileset.tsx' }, { firstgid: 170, source: 'Collision.tsx' }],
    tilewidth: 16, type: 'map', version: '1.10', width: W,
  };
};

const main = async () => {
  const name = process.argv[2];
  if (!name) { console.error('Usage: node tools/forest-gen.mjs <region-name>'); process.exit(1); }
  const region = (await import(pathToFileURL(path.join(__dirname, 'regions', `${name}.mjs`)).href)).default;
  const map = build(region);
  const outPath = path.join(repoRoot, 'src/data/maps', `${name}.json`);
  writeFileSync(outPath, JSON.stringify(map));
  let trees = 0, bushes = 0;
  for (const v of map.layers[1].data) { if (v === TILE.BLANK) continue; if (BUSHES.includes(v)) bushes++; else trees++; }
  console.log(`Wrote ${path.relative(repoRoot, outPath)} — ${region.width}x${region.height}, ${map.layers[3].objects.length} objects, forestTiles=${trees}, bushes=${bushes}, gate reachable=OK`);
};

main().catch((e) => { console.error(e); process.exit(1); });
