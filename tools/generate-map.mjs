#!/usr/bin/env node
// Map generator: turns a compact per-region definition (tools/regions/<name>.mjs)
// into a Tiled-format JSON map the game loader understands, written to
// src/data/maps/<name>.json.
//
//   node tools/generate-map.mjs ruins-approach
//
// Tile ids are sampled from the existing forrest art so generated maps render with
// the shipped kuesuto-tilemap.png tileset — no new art required. See DESIGN.md.

import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

// Real tile ids, sampled from src/data/maps/kuesuto-world.json:
//   Ground base grass = 5, Things "empty" = 1, common tree/decor = 112,
//   Collision marker = 170 (Collision.tsx firstgid), empty collision = 0.
const TILE = {
  GROUND_GRASS: 5,
  THINGS_EMPTY: 1,
  THINGS_TREE: 112,
  COLLISION_SOLID: 170,
  EMPTY: 0,
};

// Terrain legend: each glyph maps to one cell across the three tile layers.
//   '.' open, walkable grass
//   '#' forest/ruin wall (tree decor + collision)
const DEFAULT_LEGEND = {
  '.': { ground: TILE.GROUND_GRASS, things: TILE.THINGS_EMPTY, collision: TILE.EMPTY },
  '#': { ground: TILE.GROUND_GRASS, things: TILE.THINGS_TREE, collision: TILE.COLLISION_SOLID },
};

// How each named object kind is expanded into a Tiled object. Coordinates come in
// as tile coords; the caller converts to map pixels.
const OBJECT_BUILDERS = {
  'Player Start Location': () => ({
    type: 'Spawn',
    point: true,
    properties: [{ name: 'type', type: 'string', value: 'playerStart' }],
  }),
  'Enemy': (o) => ({
    type: 'npc',
    point: true,
    properties: [
      { name: 'hostile', type: 'bool', value: true },
      { name: 'type', type: 'string', value: o.type },
    ],
  }),
  'InteractableZone': (o) => ({
    type: 'InteractableZone',
    point: true,
    properties: [{ name: 'phrases', type: 'string', value: o.phrases }],
  }),
  'Transition': (o) => ({
    type: 'Transition',
    // A sized gate (not a point) so it reads as a doorway; widthTiles defaults to 1.
    width: (o.widthTiles ?? 1) * 16,
    height: (o.heightTiles ?? 1) * 16,
    properties: [
      { name: 'targetMap', type: 'string', value: o.targetMap },
      { name: 'entryPoint', type: 'string', value: o.entryPoint },
    ],
  }),
};

const buildTileLayers = (region) => {
  const { width, height, rows } = region;
  const legend = { ...DEFAULT_LEGEND, ...(region.legend ?? {}) };
  const ground = [];
  const things = [];
  const collision = [];
  for (let y = 0; y < height; y++) {
    const row = rows[y] ?? '';
    for (let x = 0; x < width; x++) {
      const glyph = row[x] ?? '#'; // pad short rows with wall
      const cell = legend[glyph] ?? legend['.'];
      ground.push(cell.ground);
      things.push(cell.things);
      collision.push(cell.collision);
    }
  }
  return { ground, things, collision };
};

const tileLayer = (name, id, data, width, height, opacity) => ({
  data,
  height,
  id,
  name,
  opacity,
  type: 'tilelayer',
  visible: true,
  width,
  x: 0,
  y: 0,
});

const buildObjects = (region) => {
  let nextId = 1;
  const objects = (region.objects ?? []).map((o) => {
    const builder = OBJECT_BUILDERS[o.name];
    if (!builder) {
      throw new Error(`Unknown object kind "${o.name}" in region "${region.name}"`);
    }
    const spec = builder(o);
    const obj = {
      height: spec.height ?? 0,
      id: nextId++,
      name: o.name,
      properties: spec.properties,
      rotation: 0,
      type: spec.type,
      visible: true,
      width: spec.width ?? 0,
      x: o.x * 16,
      y: o.y * 16,
    };
    if (spec.point) obj.point = true;
    return obj;
  });
  return { objects, nextObjectId: nextId };
};

const buildMap = (region) => {
  const { width, height } = region;
  const { ground, things, collision } = buildTileLayers(region);
  const { objects, nextObjectId } = buildObjects(region);
  return {
    compressionlevel: -1,
    height,
    infinite: false,
    layers: [
      tileLayer('Ground', 1, ground, width, height, 1),
      tileLayer('Things', 2, things, width, height, 1),
      tileLayer('Collision', 4, collision, width, height, 0.58),
      {
        draworder: 'topdown',
        id: 5,
        name: 'Positions',
        objects,
        opacity: 1,
        type: 'objectgroup',
        visible: true,
        x: 0,
        y: 0,
      },
    ],
    nextlayerid: 6,
    nextobjectid: nextObjectId,
    orientation: 'orthogonal',
    renderorder: 'right-down',
    tiledversion: '1.10.2',
    tileheight: 16,
    tilesets: [
      { firstgid: 1, source: 'ks-forrest-tileset.tsx' },
      { firstgid: 170, source: 'Collision.tsx' },
    ],
    tilewidth: 16,
    type: 'map',
    version: '1.10',
    width,
  };
};

const main = async () => {
  const name = process.argv[2];
  if (!name) {
    console.error('Usage: node tools/generate-map.mjs <region-name>');
    process.exit(1);
  }
  const regionPath = path.join(__dirname, 'regions', `${name}.mjs`);
  const region = (await import(pathToFileURL(regionPath).href)).default;
  if (region.name !== name) {
    throw new Error(`Region "${name}" declares name "${region.name}"`);
  }

  const map = buildMap(region);
  const outPath = path.join(repoRoot, 'src', 'data', 'maps', `${name}.json`);
  await writeFile(outPath, JSON.stringify(map));
  const layerLen = map.layers[0].data.length;
  console.log(
    `Wrote ${path.relative(repoRoot, outPath)} — ${region.width}x${region.height} ` +
    `(${layerLen} tiles/layer), ${map.layers[3].objects.length} objects.`,
  );
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
