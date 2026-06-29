// Enrich the forrest map (kuesuto-world.json): grow the forest outward with organic
// stamped groves of REAL copied forest art, densify the passable bushes that already
// dot the field, and keep a clear walkable corridor from the player's start to the
// ruins gate. Deterministic (seeded) so the map is reproducible from this tool.
//
// Only the Ground/Things/Collision tile layers and nothing else are touched. Every
// Positions object keeps a cleared radius so NPCs/enemies never spawn inside a tree,
// and a BFS connectivity check guarantees the gate is still reachable before writing.
//
// Usage: node tools/enrich-forest.mjs   (operates in place on the committed map)

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MAP_PATH = join(__dirname, '..', 'src', 'data', 'maps', 'kuesuto-world.json');

const map = JSON.parse(readFileSync(MAP_PATH, 'utf8'));
const W = map.width, H = map.height;
const layer = (n) => map.layers.find((l) => l.name === n);
const ground = layer('Ground').data;
const things = layer('Things').data;
const col = layer('Collision').data;
const idx = (x, y) => y * W + x;

const PASSABLE_BUSHES = [112, 114, 115, 111];
const BLANK = 1;
const COLLISION = 170;

// --- deterministic RNG (mulberry32) ---
let seed = 0x9e3779b9;
const rand = () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const pick = (arr) => arr[(rand() * arr.length) | 0];

// --- object tiles to protect (in tile coords) ---
const objects = map.layers.find((l) => l.type === 'objectgroup').objects;
const protectedTiles = objects.map((o) => ({ x: Math.round(o.x / 16), y: Math.round(o.y / 16) }));
const PROTECT_R = 7;
const isProtected = (x, y) => protectedTiles.some((p) => Math.abs(p.x - x) <= PROTECT_R && Math.abs(p.y - y) <= PROTECT_R);

// --- clear corridor along the quest route (tile coords) ---
const route = [
  { x: 78, y: 239 },  // player start
  { x: 47, y: 213 },  // Morghal
  { x: 47, y: 158 },  // corrupted cluster
  { x: 112, y: 137 }, // ruins gate
];
const CORRIDOR_HALF = 5;
const distToSegment = (px, py, a, b) => {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len2 = dx * dx + dy * dy || 1;
  let t = ((px - a.x) * dx + (py - a.y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = a.x + t * dx, cy = a.y + t * dy;
  return Math.hypot(px - cx, py - cy);
};
const inCorridor = (x, y) => {
  for (let i = 0; i < route.length - 1; i++) {
    if (distToSegment(x, y, route[i], route[i + 1]) <= CORRIDOR_HALF) return true;
  }
  return false;
};

// --- the existing dense pocket (don't re-stamp over it) ---
const inPocket = (x, y) => x >= 14 && x <= 82 && y >= 158 && y <= 248;

const BORDER = 8; // keep clear of the solid map-edge tree wall
const inInterior = (x, y) => x >= BORDER && x < W - BORDER && y >= BORDER && y < H - BORDER;
const writable = (x, y) => inInterior(x, y) && !isProtected(x, y) && !inCorridor(x, y) && !inPocket(x, y);

// === pass 1: organic grove stamps (grow the forest) ===
// Source = a dense core block of the existing forest; copied verbatim through a noisy
// circular mask so groves read as organic blobs, not rectangles.
const SRC = { x: 44, y: 176, w: 28, h: 28 };
const sampleSrc = (dx, dy) => {
  const sx = SRC.x + ((dx % SRC.w) + SRC.w) % SRC.w;
  const sy = SRC.y + ((dy % SRC.h) + SRC.h) % SRC.h;
  return idx(sx, sy);
};

const groveCenters = [
  { x: 60, y: 40 }, { x: 110, y: 34 }, { x: 165, y: 48 }, { x: 210, y: 70 },
  { x: 150, y: 95 }, { x: 205, y: 120 }, { x: 95, y: 70 }, { x: 40, y: 95 },
  { x: 175, y: 150 }, { x: 220, y: 175 }, { x: 120, y: 175 }, { x: 60, y: 130 },
];
let groveTiles = 0;
for (const c of groveCenters) {
  const R = 9 + ((rand() * 5) | 0); // 9..13
  for (let dy = -R - 2; dy <= R + 2; dy++) {
    for (let dx = -R - 2; dx <= R + 2; dx++) {
      const x = c.x + dx, y = c.y + dy;
      if (!writable(x, y)) continue;
      const noise = (rand() - 0.5) * 4;
      if (Math.hypot(dx, dy) + noise > R) continue;
      const s = sampleSrc(dx, dy);
      const di = idx(x, y);
      ground[di] = ground[s];
      things[di] = things[s];
      col[di] = col[s];
      groveTiles++;
    }
  }
}

// === pass 2: densify passable bushes across the open field ===
// Clustered: a low-frequency value field gates placement so bushes form groves, not a
// uniform sprinkle. Corridor stays sparse so the path reads as open.
const valueAt = (x, y) =>
  0.5 + 0.5 * Math.sin(x * 0.11 + 1.7) * Math.cos(y * 0.13 - 0.6) * Math.sin((x + y) * 0.05);
let bushes = 0;
for (let y = BORDER; y < H - BORDER; y++) {
  for (let x = BORDER; x < W - BORDER; x++) {
    const di = idx(x, y);
    if (col[di] !== 0 || things[di] !== BLANK) continue; // only empty grass
    if (isProtected(x, y) || inPocket(x, y)) continue;
    const corridor = inCorridor(x, y);
    const density = corridor ? 0.04 : 0.30 * valueAt(x, y);
    if (rand() < density) { things[di] = pick(PASSABLE_BUSHES); bushes++; }
  }
}

// === safety: re-clear object tiles + immediate ring (no trees on NPCs/enemies) ===
const CLEAR_R = 2;
for (const p of protectedTiles) {
  for (let dy = -CLEAR_R; dy <= CLEAR_R; dy++) {
    for (let dx = -CLEAR_R; dx <= CLEAR_R; dx++) {
      const x = p.x + dx, y = p.y + dy;
      if (x < 0 || y < 0 || x >= W || y >= H) continue;
      const di = idx(x, y);
      col[di] = 0;
      things[di] = BLANK;
    }
  }
}

// === safety: BFS connectivity player-start -> ruins gate over non-collision tiles ===
const start = route[0], goal = route[route.length - 1];
const seen = new Uint8Array(W * H);
const queue = [idx(start.x, start.y)];
seen[queue[0]] = 1;
let reached = false;
for (let head = 0; head < queue.length; head++) {
  const ci = queue[head];
  const cx = ci % W, cy = (ci / W) | 0;
  if (Math.abs(cx - goal.x) <= 1 && Math.abs(cy - goal.y) <= 1) { reached = true; break; }
  const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (const [ox, oy] of nb) {
    const nx = cx + ox, ny = cy + oy;
    if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
    const ni = idx(nx, ny);
    if (seen[ni] || col[ni] !== 0) continue;
    seen[ni] = 1;
    queue.push(ni);
  }
}
if (!reached) {
  console.error('ABORT: BFS could not reach the ruins gate from player start. Map NOT written.');
  process.exit(1);
}

writeFileSync(MAP_PATH, JSON.stringify(map));
console.log(`Enriched forest written. groveTiles=${groveTiles}, bushesAdded=${bushes}, gate reachable=OK`);
