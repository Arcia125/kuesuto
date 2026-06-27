// Region definition: "ruins-approach" — the Ancient Ruins threshold east of
// Verdelight Glade. A forest-edge corridor that funnels the player east, past a
// couple of corrupted creatures and some mystery-toned lore, to a gate back to the
// forrest. Reuses forest tiles; corruption is conveyed by enemy tinting, not art.
//
// Coordinates below are in TILE units; the generator converts to map pixels (×16).
// Layout is kept well inside the map bounds so the camera never reads past an edge
// (viewport ≈ player tile ±9 horizontal / +6 vertical at the current sprite scale).

const WIDTH = 58;
const HEIGHT = 24;

// Walkable corridor (inclusive tile bounds); everything else is forest wall.
const FLOOR = { x0: 3, x1: 47, y0: 9, y1: 14 };

const isFloor = (x, y) => x >= FLOOR.x0 && x <= FLOOR.x1 && y >= FLOOR.y0 && y <= FLOOR.y1;

const rows = [];
for (let y = 0; y < HEIGHT; y++) {
  let row = '';
  for (let x = 0; x < WIDTH; x++) {
    row += isFloor(x, y) ? '.' : '#';
  }
  rows.push(row);
}

export default {
  name: 'ruins-approach',
  width: WIDTH,
  height: HEIGHT,
  rows,
  objects: [
    // Entry from the forrest gate (matches that Transition's entryPoint).
    { name: 'Player Start Location', x: 6, y: 11 },

    { name: 'InteractableZone', x: 12, y: 11, phrases:
      'The trees here are wrong - bark gone grey, leaves curled and black.|Whatever is taking the glade, it has already passed through here.' },

    { name: 'Enemy', type: 'corrupted_slime', x: 18, y: 11 },
    { name: 'Enemy', type: 'fast_slime', x: 24, y: 10 },
    { name: 'Enemy', type: 'corrupted_slime', x: 30, y: 12 },
    { name: 'Enemy', type: 'fast_slime', x: 38, y: 13 },

    { name: 'InteractableZone', x: 44, y: 11, phrases:
      'Ancient stone, half-swallowed by the earth - older than Verdelight itself.|Something here remembers being whole. You feel watched.' },

    // Gate back to the forrest. Sized like a doorway; the trigger spawns at its centre.
    { name: 'Transition', x: 45, y: 10, widthTiles: 3, heightTiles: 3,
      targetMap: 'forrest', entryPoint: 'From Ruins' },
  ],
};
