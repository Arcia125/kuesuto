// Region definition: "forrest" — Verdelight Glade, the starting map (fresh rebuild of
// the original hand map; kuesuto-world.json remains in-repo as the stamp art source).
//
// Layout: the player wakes in a southern clearing; a winding path leads northwest to
// Morghal's clearing; a side path climbs north to a corrupted pocket (the 3 purple
// slimes); a long path runs east from Morghal's clearing to the gate that exits to
// ruins-approach. Tree walls carry the guidance, as the original intended.
//
// Coordinates are TILE units. '.' floor / '#' forest wall.

const WIDTH = 72;
const HEIGHT = 64;

// Walkable space = union of clearings (circles) and corridors (capsules around segments).
const CLEARINGS = [
  { x: 50, y: 56, r: 6 },  // start
  { x: 20, y: 34, r: 7 },  // Morghal
  { x: 24, y: 12, r: 6 },  // corrupted pocket
  { x: 62, y: 28, r: 4 },  // gate yard
];
const PATHS = [ // polylines, corridor half-width 3
  [[50, 56], [44, 48], [30, 44], [22, 38]],   // start -> Morghal
  [[18, 28], [14, 20], [20, 13]],             // Morghal -> corrupted pocket
  [[26, 36], [38, 32], [50, 30], [60, 28]],   // Morghal -> gate
];
const HALF = 3;

const dist2seg = (px, py, [ax, ay], [bx, by]) => {
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  const cx = ax + t * dx, cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
};

const isFloor = (x, y) => {
  if (x < 3 || y < 3 || x >= WIDTH - 3 || y >= HEIGHT - 3) return false;
  for (const c of CLEARINGS) if (Math.hypot(x - c.x, y - c.y) <= c.r) return true;
  for (const line of PATHS) {
    for (let i = 0; i + 1 < line.length; i++) {
      if (dist2seg(x, y, line[i], line[i + 1]) <= HALF) return true;
    }
  }
  return false;
};

const rows = [];
for (let y = 0; y < HEIGHT; y++) {
  let row = '';
  for (let x = 0; x < WIDTH; x++) {
    row += isFloor(x, y) ? '.' : '#';
  }
  rows.push(row);
}

export default {
  name: 'forrest',
  width: WIDTH,
  height: HEIGHT,
  rows,
  trails: PATHS, // dirt trail follows the actual path polylines
  canopyWalls: true, // LTTP treeline walls following the clearing/corridor outlines
  // Pond on the east road's south shoulder — a landmark at the last bend before the
  // gate; overlaps the corridor edge so the road visibly skirts the shoreline.
  waters: [{ x: 47, y: 34, r: 4 }, { x: 51, y: 33, r: 3 }],

  objects: [
    // --- start clearing ---
    { name: 'Player Start Location', x: 50, y: 58 },
    { name: 'InteractableZone', x: 48, y: 53, phrases:
      'The air here feels heavy. Something is wrong with the forest.' },
    { name: 'Enemy', type: 'slime', x: 44, y: 47 },

    // --- path to Morghal ---
    { name: 'Enemy', type: 'slime', x: 30, y: 43 },
    { name: 'Dark Wizard', x: 20, y: 33 },

    // --- corrupted pocket (quest targets) ---
    { name: 'Enemy', type: 'fast_slime', x: 15, y: 22 },
    { name: 'InteractableZone', x: 22, y: 15, phrases:
      'The ground is stained dark. Corrupted creatures have made this place their own.' },
    { name: 'Enemy', type: 'corrupted_slime', x: 22, y: 10 },
    { name: 'Enemy', type: 'corrupted_slime', x: 26, y: 12 },
    { name: 'Enemy', type: 'corrupted_slime', x: 24, y: 14 },

    // --- east road to the ruins gate ---
    { name: 'Enemy', type: 'slime', x: 38, y: 33 },
    { name: 'Enemy', type: 'fast_slime', x: 50, y: 29 },
    { name: 'InteractableZone', x: 58, y: 29, phrases:
      'Through the trees, you can see the outline of ancient stone. Ruins lie ahead.' },
    { name: 'From Ruins', kind: 'Entry', x: 61, y: 29 },
    { name: 'Transition', x: 63, y: 27, widthTiles: 3, heightTiles: 3,
      targetMap: 'ruins-approach', entryPoint: 'Player Start Location' },
  ],
};
