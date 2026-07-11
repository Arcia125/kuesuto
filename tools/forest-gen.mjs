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
const DIRT = 1, GRASS = 2; // wang color ids

// --- wang corner lookup: [TR,BR,BL,TL] color string -> ground tile (firstgid=1) ---
const buildWangLookup = (name) => {
  const ws = tileset.wangsets.find((w) => w.name === name);
  if (!ws) throw new Error(`Wangset "${name}" not found in tileset`);
  const lut = new Map();
  for (const wt of ws.wangtiles) {
    const key = [wt.wangid[1], wt.wangid[3], wt.wangid[5], wt.wangid[7]].join('');
    if (!lut.has(key)) lut.set(key, wt.tileid + 1);
  }
  return lut;
};
const WANG = buildWangLookup('Grass Forrest');        // colors: 1=Dirt, 2=Grass
const WANG_WATER = buildWangLookup('Grass Water');    // colors: 1=Water, 2=Grass
const WANG_CANOPY = buildWangLookup('Grass Canopy');  // colors: 1=Canopy, 2=Grass
// Corner lookup with majority fallback for the two diagonal-opposite combos wangsets omit.
const wangTile = (lut, tr, br, bl, tl) => {
  const key = `${tr}${br}${bl}${tl}`;
  if (lut.has(key)) return lut.get(key);
  const primary = [tr, br, bl, tl].filter((c) => c === 1).length;
  return primary >= 2 ? (lut.get('1111') ?? TILE.GRASS) : (lut.get('2222') ?? TILE.GRASS);
};
const groundTile = (tr, br, bl, tl) => wangTile(WANG, tr, br, bl, tl);
const waterTile = (tr, br, bl, tl) => wangTile(WANG_WATER, tr, br, bl, tl);
const canopyTile = (tr, br, bl, tl) => wangTile(WANG_CANOPY, tr, br, bl, tl);

// --- whole-sprite stamps extracted from the hand-authored forest (see tools/stamps.mjs) ---
import { STAMPS, DECOR_TILES } from './stamps.mjs';
// --- structure stamps: buildings/props with their own collision masks (waystation art) ---
import { STRUCTURE_STAMPS } from './structure-stamps.mjs';

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
  // Named spawn point a Transition on another map can target via entryPoint
  // (e.g. { name: 'From Ruins', kind: 'Entry' }).
  'Entry': () => ({ type: 'Spawn', point: true, properties: [{ name: 'type', type: 'string', value: 'playerStart' }] }),
  'Dark Wizard': () => ({ type: 'npc', point: true, properties: [{ name: 'hostile', type: 'bool', value: false }, { name: 'type', type: 'string', value: 'Dark Wizard' }] }),
  'Enemy': (o) => ({ type: 'npc', point: true, properties: [{ name: 'hostile', type: 'bool', value: true }, { name: 'type', type: 'string', value: o.type }] }),
  // Friendly villager NPC; `type` selects the entity class in SpawnSystem
  // (e.g. { name: 'Npc', type: 'villager_keeper', x, y }).
  'Npc': (o) => ({ type: 'npc', point: true, properties: [{ name: 'hostile', type: 'bool', value: false }, { name: 'type', type: 'string', value: o.type }] }),
  'InteractableZone': (o) => ({ type: 'InteractableZone', point: true, properties: [{ name: 'phrases', type: 'string', value: o.phrases }] }),
  // Optional story gate: `requiredFlag` blocks the transition until the narrative flag
  // is set; `lockedText` is the refusal bubble shown on a blocked attempt.
  'Transition': (o) => ({ type: 'Transition', width: (o.widthTiles ?? 1) * 16, height: (o.heightTiles ?? 1) * 16, properties: [
    { name: 'targetMap', type: 'string', value: o.targetMap },
    { name: 'entryPoint', type: 'string', value: o.entryPoint },
    ...(o.requiredFlag ? [{ name: 'requiredFlag', type: 'string', value: o.requiredFlag }] : []),
    ...(o.lockedText ? [{ name: 'lockedText', type: 'string', value: o.lockedText }] : []),
  ] }),
};

const build = (region) => {
  const { width: W, height: H, rows } = region;
  const walkable = (x, y) => (rows[y]?.[x] ?? '#') === '.';

  const TRAIL_HALF = 1.0;
  // Dirt trail: if the region provides `trails` (arrays of [x,y] polyline points), paint
  // dirt within TRAIL_HALF of those lines — required for diagonal/branching paths.
  // Fallback for simple horizontal corridors: the per-column walkable midline.
  const dist2seg = (px, py, [ax, ay], [bx, by]) => {
    const dx = bx - ax, dy = by - ay;
    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1)));
    return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
  };
  const colMid = [];
  for (let x = 0; x < W; x++) {
    let lo = -1, hi = -1;
    for (let y = 0; y < H; y++) if (walkable(x, y)) { if (lo < 0) lo = y; hi = y; }
    colMid[x] = lo < 0 ? -1 : (lo + hi) / 2;
  }
  // A trail is either a bare polyline (default width) or { points, half } for custom
  // widths — e.g. a broad trampled yard is a single-point "trail" with a big radius.
  const trails = (region.trails ?? []).map((t) => (Array.isArray(t) ? { points: t, half: TRAIL_HALF } : t));
  const nearTrail = (x, y) => {
    for (const { points, half } of trails) {
      if (points.length === 1) { if (Math.hypot(x - points[0][0], y - points[0][1]) <= half) return true; continue; }
      for (let i = 0; i + 1 < points.length; i++) {
        if (dist2seg(x, y, points[i], points[i + 1]) <= half) return true;
      }
    }
    return false;
  };
  // Structures bake a grass background into their art, so the ground under a footprint
  // must stay grass even where a trail/plaza runs. Excluding just the footprint isn't
  // enough: the corner-wang lattice can't render grass slivers thinner than the tile
  // lattice (same reason trails must be >= 2 wide), so exclude a 1-tile APRON around
  // each footprint too — every structure sits in its own little grass bay.
  const structApron = new Uint8Array(W * H);
  for (const s of region.structures ?? []) {
    const st = STRUCTURE_STAMPS[s.id];
    if (!st) continue; // unknown ids throw with a good message in the placement pass
    for (let y = s.y - 1; y <= s.y + st.h; y++) for (let x = s.x - 1; x <= s.x + st.w; x++) {
      if (x >= 0 && y >= 0 && x < W && y < H) structApron[y * W + x] = 1;
    }
  }

  // Dirt mask as a grid so we can post-process it: where two trails diverge they can
  // pinch off a lone grass cell inside the dirt. The wangset has no tile for a dirt
  // ring around grass (missing diagonal combos), so it renders as a hard square notch.
  // Closing pass: grass cells nearly surrounded by dirt get absorbed into the trail.
  const dirtGrid = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    dirtGrid[y * W + x] = (walkable(x, y) && !structApron[y * W + x] && (trails.length
      ? nearTrail(x, y)
      : (colMid[x] >= 0 && Math.abs(y - colMid[x]) <= TRAIL_HALF))) ? 1 : 0;
  }
  // Morphological closing (dilate radius 1, then erode radius 1): removes grass
  // channels/slivers narrower than ~2 tiles (the wedge between diverging trails)
  // while leaving straight trail edges byte-identical. Only walkable cells may
  // become dirt — never paint road under a collision wall.
  {
    const anyNeighbor = (grid, x, y, want) => {
      for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
        const nx = x + ox, ny = y + oy;
        const v = (nx >= 0 && ny >= 0 && nx < W && ny < H) ? grid[ny * W + nx] : 0;
        if (v === want) return true;
      }
      return false;
    };
    const dilated = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      dilated[y * W + x] = anyNeighbor(dirtGrid, x, y, 1) ? 1 : 0;
    }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (!dirtGrid[i] && walkable(x, y) && !structApron[i] && !anyNeighbor(dilated, x, y, 0)) dirtGrid[i] = 1;
    }
  }
  const tileIsDirt = (x, y) => x >= 0 && y >= 0 && x < W && y < H && dirtGrid[y * W + x] === 1;

  // Mask precedence: TRAIL beats WATER beats CANOPY, each yielding with a grass buffer,
  // so the three corner lattices never fight over a cell (fighting = bitten roads,
  // flat-cut shorelines, art drawn over art).
  const nearDirt = (x, y) => {
    for (let oy = -2; oy <= 2; oy++) for (let ox = -2; ox <= 2; ox++) {
      if (tileIsDirt(x + ox, y + oy)) return true;
    }
    return false;
  };

  // Water: `waters` = array of circles {x,y,r}. Water is a solid barrier (collision).
  // Keep bodies >= 2 tiles wide (missing wang diagonals). Yields to the trail: shrinks
  // to keep >= 2 grass tiles between shoreline and road (never bites the road).
  const waters = region.waters ?? [];
  const tileIsWater = (x, y) => {
    if (x < 1 || y < 1 || x >= W - 1 || y >= H - 1) return false;
    if (nearDirt(x, y)) return false;
    for (const c of waters) if (Math.hypot(x - c.x, y - c.y) <= c.r) return true;
    return false;
  };
  // Canopy must stay 3 tiles from water: shoreline art extends 1 cell beyond the water
  // mask and canopy things extend 1 cell beyond the canopy mask — 3 keeps a clean grass
  // cell between them so canopy never paints over foam.
  const nearWater = (x, y) => {
    for (let oy = -3; oy <= 3; oy++) for (let ox = -3; ox <= 3; ox++) {
      if (tileIsWater(x + ox, y + oy)) return true;
    }
    return false;
  };
  // Corner lattice (W+1 x H+1): a corner is dirt if any of its 4 surrounding tiles is dirt.
  const cornerDirt = (cx, cy) => {
    for (const [ox, oy] of [[-1, -1], [0, -1], [-1, 0], [0, 0]]) {
      const x = cx + ox, y = cy + oy;
      if (x >= 0 && y >= 0 && x < W && y < H && tileIsDirt(x, y)) return true;
    }
    return false;
  };
  const cc = (cx, cy) => (cornerDirt(cx, cy) ? DIRT : GRASS);
  const cornerWater = (cx, cy) => {
    for (const [ox, oy] of [[-1, -1], [0, -1], [-1, 0], [0, 0]]) {
      if (tileIsWater(cx + ox, cy + oy)) return true;
    }
    return false;
  };
  const cw = (cx, cy) => (cornerWater(cx, cy) ? 1 : 2); // Grass Water colors: 1=Water, 2=Grass

  const ground = new Array(W * H);
  const things = new Array(W * H);
  const collision = new Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      // Water overrides trail/floor art; any water-touching corner switches the cell to
      // the Grass Water wangset so the shoreline autotiles seamlessly.
      const wc = [cw(x + 1, y), cw(x + 1, y + 1), cw(x, y + 1), cw(x, y)];
      ground[i] = wc.includes(1)
        ? waterTile(...wc)
        : groundTile(cc(x + 1, y), cc(x + 1, y + 1), cc(x, y + 1), cc(x, y));
      things[i] = TILE.BLANK;
      // Every wall cell is SOLID regardless of art — visual gaps beyond the tree fences
      // are unreachable, so they can stay decorative grass without becoming holes.
      // Water is a barrier too, even inside the walkable floor.
      collision[i] = (walkable(x, y) && !tileIsWater(x, y)) ? TILE.EMPTY : TILE.COLLISION;
    }
  }

  // --- Canopies: arbitrary-outline forest walls via the "Grass Canopy" corner wangset
  // (the LTTP treeline as any shape). `canopies` = array of circles {x,y,r}; their union
  // is the canopy mask, autotiled with seamless edges + south trunk fringe. Any tile whose
  // centre is under the mask becomes a SOLID wall. Applied before stamping so the blob/
  // hedge/tree stamps treat canopy cells as occupied and never overwrite them. Regions
  // without `canopies` are unaffected — the stamp-based blobs keep working unchanged. ---
  const canopies = region.canopies ?? [];
  // The mask never eats the corridor, keeps >= 2 grass tiles from trail dirt (nearDirt)
  // and >= 3 from water (nearWater) — shrinking the CANOPY, never the road or the lake.
  // `canopyWalls: true` makes the ENTIRE wall area the canopy mask — LTTP treeline walls
  // that exactly follow the corridor/clearing outline — replacing scattered blob stamps.
  // (Mask runs to the map border so edge masses read as continuous deep forest.)
  const canopyWalls = region.canopyWalls === true;
  const tileIsCanopy = (x, y) => {
    if (canopyWalls) {
      if (x < 0 || y < 0 || x >= W || y >= H) return true; // off-map counts as forest
      return !walkable(x, y) && !nearDirt(x, y) && !nearWater(x, y);
    }
    if (x < 1 || y < 1 || x >= W - 1 || y >= H - 1) return false;
    if (walkable(x, y) || nearDirt(x, y) || nearWater(x, y)) return false;
    for (const c of canopies) if (Math.hypot(x - c.x, y - c.y) <= c.r) return true;
    return false;
  };
  const cornerCanopy = (cx, cy) => {
    for (const [ox, oy] of [[-1, -1], [0, -1], [-1, 0], [0, 0]]) {
      if (tileIsCanopy(cx + ox, cy + oy)) return true;
    }
    return false;
  };
  const ccan = (cx, cy) => (cornerCanopy(cx, cy) ? 1 : 2); // Grass Canopy: 1=Canopy, 2=Grass
  // Interior cells (all 4 corners canopy) use the hand-map blob-interior crown pattern —
  // gid 135 on the (x+y)-even checker, 158/161 on the other (exactly how the hand blobs
  // tile their interiors) — so big masses read as LTTP treetop lobes, not a flat slab.
  // The composed wangset tiles are used for the EDGES, where arbitrary outlines happen.
  const interiorGid = (x, y) => ((x + y) % 2 === 0 ? 135 : ((x >> 1) + y) % 2 ? 158 : 161);
  if (canopies.length || canopyWalls) {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const corners = [ccan(x + 1, y), ccan(x + 1, y + 1), ccan(x, y + 1), ccan(x, y)];
      if (!corners.includes(1)) continue;          // fully-grass cell: leave as is
      things[y * W + x] = corners.every((c) => c === 1)
        ? interiorGid(x, y)                         // deep interior: hand-art crown lobes
        : canopyTile(...corners);                   // outline: composed wang edge tile
      if (tileIsCanopy(x, y)) collision[y * W + x] = TILE.COLLISION; // solid interior
    }
  }
  // --- Structures: buildings/props stamped onto WALKABLE floor with their own collision
  // masks (solid walls, walkable doorway alcoves). Placement is authored, not random, so
  // violations are hard errors: every footprint cell must be in-bounds walkable floor with
  // blank things. Placed before fences/blobs/shrub/decor (those all respect non-blank
  // things) and recorded in structureMask so the object ring-clear pass below cannot
  // punch holes into a building. ---
  const structures = region.structures ?? [];
  const structureMask = new Uint8Array(W * H);
  for (const s of structures) {
    const st = STRUCTURE_STAMPS[s.id];
    if (!st) throw new Error(`Unknown structure "${s.id}" at (${s.x},${s.y}) — known: ${Object.keys(STRUCTURE_STAMPS).join(', ')}`);
    for (let y = 0; y < st.h; y++) for (let x = 0; x < st.w; x++) {
      const mx = s.x + x, my = s.y + y;
      if (mx < 0 || my < 0 || mx >= W || my >= H) throw new Error(`Structure "${s.id}" at (${s.x},${s.y}) runs out of bounds at (${mx},${my}).`);
      const i = my * W + mx;
      if (!walkable(mx, my) || tileIsWater(mx, my)) throw new Error(`Structure "${s.id}" at (${s.x},${s.y}) needs walkable floor at (${mx},${my}).`);
      if (things[i] !== TILE.BLANK) throw new Error(`Structure "${s.id}" at (${s.x},${s.y}) overlaps existing art at (${mx},${my}).`);
      if (tileIsDirt(mx, my)) console.warn(`Warning: structure "${s.id}" covers trail dirt at (${mx},${my}) — the road runs under it.`);
      things[i] = st.things[y * st.w + x];
      collision[i] = st.collision[y * st.w + x] ? TILE.COLLISION : TILE.EMPTY;
      structureMask[i] = 1;
    }
  }

  // Stamps must never butt against the wangset canopy: treat mask cells + a 1-tile margin
  // as occupied for brush placement.
  const nearCanopy = (x, y) => {
    for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
      if (tileIsCanopy(x + ox, y + oy)) return true;
    }
    return false;
  };

  // Whole-sprite stamping: a brush is placed only where its FULL footprint is free wall
  // (never clipped — clipping is what produces broken trees; see tools/MAP-GENERATION.md).
  const stampFits = (s, tx, ty) => {
    for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) {
      if (s.things[y * s.w + x] === 0) continue;
      const mx = tx + x, my = ty + y;
      if (mx < 0 || my < 0 || mx >= W || my >= H) return false;
      if (walkable(mx, my) || tileIsWater(mx, my) || nearCanopy(mx, my) || things[my * W + mx] !== TILE.BLANK) return false;
    }
    return true;
  };
  const stamp = (s, tx, ty) => {
    if (!stampFits(s, tx, ty)) return false;
    for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) {
      const v = s.things[y * s.w + x];
      if (v !== 0) things[(ty + y) * W + (tx + x)] = v;
    }
    return true;
  };

  // --- Fences: hedges along horizontal floor boundaries, tree columns along vertical ones,
  // like the hand-authored map bounds its trail. Only whole sprites; gaps left by the
  // winding boundary get shrub-filled below. ---
  // Hedges only on straight horizontal runs (>= 2 units) so no lone fragment ever appears;
  // stepped/diagonal sections are shrub-filled below instead.
  const { tree, hedgeUnit, blobSmall, blobMedium } = STAMPS;
  const isWall = (x, y) => x >= 0 && y >= 0 && x < W && y < H && !walkable(x, y);
  for (let y = 0; y < H; y++) {
    for (const dir of [1, -1]) { // floor below / floor above
      for (let x = 0; x < W; ) {
        const boundary = (xx) => isWall(xx, y) && walkable(xx, y + dir);
        if (!boundary(x)) { x++; continue; }
        let end = x;
        while (boundary(end + 1)) end++;
        const len = end - x + 1;
        if (len >= hedgeUnit.w) {
          const top = dir === 1 ? y - hedgeUnit.h + 1 : y;
          // A hedge segment must be >= 2 contiguous units, or it reads as a lone stray
          // fragment (e.g. when the wangset canopy occupies the rest of the run).
          // Collect the placeable slots first, then only stamp contiguous groups of >= 2.
          const slots = [];
          for (let hx = x; hx + hedgeUnit.w - 1 <= end; hx += hedgeUnit.w) {
            if (stampFits(hedgeUnit, hx, top)) slots.push(hx);
          }
          for (let i = 0; i < slots.length; ) {
            let j = i;
            while (j + 1 < slots.length && slots[j + 1] === slots[j] + hedgeUnit.w) j++;
            if (j > i) for (let k = i; k <= j; k++) stamp(hedgeUnit, slots[k], top);
            i = j + 1;
          }
        }
        x = end + 1;
      }
    }
  }
  // Tree columns on straight vertical runs.
  for (let x = 0; x < W; x++) {
    for (const dir of [1, -1]) { // floor right / floor left
      for (let y = 0; y < H; ) {
        const boundary = (yy) => isWall(x, yy) && walkable(x + dir, yy);
        if (!boundary(y)) { y++; continue; }
        let end = y;
        while (boundary(end + 1)) end++;
        if (end - y + 1 >= tree.h) {
          const left = dir === 1 ? x - tree.w + 1 : x;
          for (let ty = y; ty + tree.h - 1 <= end; ty += tree.h) stamp(tree, left, ty);
        }
        y = end + 1;
      }
    }
  }

  // --- Deep forest: scatter canopy blobs where the whole footprint is free wall, then
  // fill remaining bare wall (bands too thin for blobs) with single 5x5 trees so no
  // large solid area reads as open walkable grass. ---
  const blobs = [blobMedium, blobSmall, blobSmall];
  for (let attempt = 0; attempt < W * H / 8; attempt++) {
    const s = blobs[(rand() * blobs.length) | 0];
    stamp(s, (rand() * (W - s.w)) | 0, (rand() * (H - s.h)) | 0);
  }
  for (let attempt = 0; attempt < W * H / 4; attempt++) {
    stamp(tree, (rand() * (W - tree.w)) | 0, (rand() * (H - tree.h)) | 0);
  }

  // --- Shrub-fill: any bare wall cell touching the corridor gets a self-contained bush,
  // so every solid cell the player can reach has a visual barrier. ---
  const SHRUB = 112;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (walkable(x, y) || tileIsWater(x, y) || things[y * W + x] !== TILE.BLANK) continue;
    // Skip shoreline cells too (any water corner): their ground is autotiled foam, and a
    // shrub's opaque grass background would paint over it. The lake is its own barrier.
    if ([cw(x + 1, y), cw(x + 1, y + 1), cw(x, y + 1), cw(x, y)].includes(1)) continue;
    const nearFloor = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]
      .some(([ox, oy]) => walkable(x + ox, y + oy) && !tileIsWater(x + ox, y + oy));
    if (nearFloor) things[y * W + x] = SHRUB;
  }

  // --- Ambience: passable decor on open grass (floor off-trail + unreached wall grass). ---
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    if (things[i] !== TILE.BLANK || tileIsDirt(x, y)) continue;
    // Keep the trail's autotiled EDGE tiles clear too — decor there reads as a notch
    // bitten into the road.
    if ([cc(x + 1, y), cc(x + 1, y + 1), cc(x, y + 1), cc(x, y)].includes(DIRT)) continue;
    // Keep water and its autotiled shoreline clear of decor.
    if ([cw(x + 1, y), cw(x + 1, y + 1), cw(x, y + 1), cw(x, y)].includes(1)) continue;
    if (rand() < 0.06) things[i] = DECOR_TILES[(rand() * DECOR_TILES.length) | 0];
  }

  // Force object tiles + a ring clear & walkable (no tree on an NPC, ground readable).
  // Structure cells are exempt: an NPC posted beside a hut must not blank the hut's wall
  // tiles or carve its collision (the object's own center cell still must not be inside
  // a footprint — that is an authoring error caught below).
  const objs = region.objects ?? [];
  for (const o of objs) {
    if (structureMask[o.y * W + o.x]) throw new Error(`Object "${o.name}" at (${o.x},${o.y}) is inside a structure footprint.`);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const x = o.x + dx, y = o.y + dy;
      if (x < 0 || y < 0 || x >= W || y >= H) continue;
      const i = y * W + x;
      if (structureMask[i]) continue;
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
    const builder = OBJECT_BUILDERS[o.kind ?? o.name];
    if (!builder) throw new Error(`Unknown object kind "${o.kind ?? o.name}"`);
    const spec = builder(o);
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
  const { DECOR_TILES } = await import('./stamps.mjs');
  for (const v of map.layers[1].data) { if (v === TILE.BLANK) continue; if (DECOR_TILES.includes(v)) bushes++; else trees++; }
  console.log(`Wrote ${path.relative(repoRoot, outPath)} — ${region.width}x${region.height}, ${map.layers[3].objects.length} objects, forestTiles=${trees}, bushes=${bushes}, gate reachable=OK`);
};

main().catch((e) => { console.error(e); process.exit(1); });
