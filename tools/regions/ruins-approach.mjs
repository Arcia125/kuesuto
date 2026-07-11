// Region definition: "ruins-approach" — the Ancient Ruins threshold east of
// Verdelight Glade. A winding forest corridor that funnels the player east, past a
// couple of corrupted creatures and some mystery-toned lore, to a gate back to the
// forrest. Reuses forest tiles; corruption is conveyed by enemy tinting, not art.
//
// Coordinates below are in TILE units; the generator converts to map pixels (×16).
// The corridor snakes along mid(x) so the trail winds instead of running straight;
// the deep bands above/below are tall enough for canopy blobs.

const WIDTH = 58;
const HEIGHT = 44;

// Winding corridor: centre line drifts sinusoidally, band is ±3 tiles.
const mid = (x) => 21 + Math.round(5 * Math.sin((x - 3) / 7));
const HALF = 3;

const isFloor = (x, y) => x >= 3 && x <= 49 && Math.abs(y - mid(x)) <= HALF;

const rows = [];
for (let y = 0; y < HEIGHT; y++) {
  let row = '';
  for (let x = 0; x < WIDTH; x++) {
    row += isFloor(x, y) ? '.' : '#';
  }
  rows.push(row);
}

const on = (x, dy = 0) => ({ x, y: mid(x) + dy });

export default {
  name: 'ruins-approach',
  width: WIDTH,
  height: HEIGHT,
  rows,
  canopyWalls: true, // LTTP treeline walls following the winding corridor

  objects: [
    // Entry from the forrest gate (matches that Transition's entryPoint).
    { name: 'Player Start Location', ...on(6) },

    { name: 'InteractableZone', ...on(12), phrases:
      'The trees here are wrong - bark gone grey, leaves curled and black.|Whatever is taking the glade, it has already passed through here.' },

    { name: 'Enemy', type: 'corrupted_slime', ...on(18, -1) },
    { name: 'Enemy', type: 'fast_slime', ...on(25, 1) },
    { name: 'Enemy', type: 'corrupted_slime', ...on(32, 0) },
    { name: 'Enemy', type: 'fast_slime', ...on(39, -1) },

    { name: 'InteractableZone', ...on(45), phrases:
      'Ancient stone, half-swallowed by the earth - older than Verdelight itself.|Something here remembers being whole. You feel watched.' },

    // Gate back to the forrest. Sized like a doorway; the trigger spawns at its centre.
    { name: 'Transition', ...on(47, -1), widthTiles: 3, heightTiles: 3,
      targetMap: 'forrest', entryPoint: 'From Ruins' },
  ],
};
