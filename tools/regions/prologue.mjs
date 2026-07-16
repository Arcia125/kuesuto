// Thornwick Waystation — the game's opening map (see DESIGN.md, "Prologue").
// A small clearing on the forest road: hut west, tent east, well + campfire in the
// yard, a dirt road running south gate-ward to north gate. The north exit into
// Verdelight Glade (`forrest`) is story-gated on `prologue_complete` and one-way
// (no return trigger; the forrest side has no transition back here).
//
//   node tools/map-preview.mjs prologue

const W = 40, H = 36;

// Walkable floor: south road + central yard + building pads + north gate corridor.
const pads = [
  { x0: 16, y0: 18, x1: 23, y1: 32 }, // south road corridor (8 wide)
  { x0: 10, y0: 10, x1: 16, y1: 16 }, // hut pad (west)
  { x0: 24, y0: 11, x1: 29, y1: 16 }, // tent pad (east)
  // Hunter's clearing: squares off the yard circle's ragged SE rim (aligned with the
  // tent pad's east edge) so the treeline runs one clean line past the hunter's post
  // instead of a stair-stepped notch of bare canopy-edge tiles.
  { x0: 24, y0: 17, x1: 29, y1: 24 },
  { x0: 17, y0: 3, x1: 22, y1: 17 },  // north gate corridor
];
const yard = { x: 20, y: 17, r: 9 };
const rows = [];
for (let y = 0; y < H; y++) {
  let row = '';
  for (let x = 0; x < W; x++) {
    const inPad = pads.some((p) => x >= p.x0 && x <= p.x1 && y >= p.y0 && y <= p.y1);
    const inYard = Math.hypot(x - yard.x, y - yard.y) <= yard.r;
    row += (inPad || inYard) ? '.' : '#';
  }
  rows.push(row);
}

export default {
  name: 'prologue',
  width: W,
  height: H,
  rows,
  canopyWalls: true,
  trails: [
    // The road: straight through the waystation, south entrance to north gate.
    [[20, 32], [20, 4]],
    // The yard: a broad trampled plaza where the road passes the well and campfire.
    { points: [[20, 18]], half: 4.2 },
    // Worn spur to the hut door (door alcove is at (13,14); the spur stops short
    // so the alcove tile itself stays grass under the door art).
    [[18, 18], [13, 16]],
  ],
  structures: [
    { id: 'hut', x: 11, y: 11 },       // footprint x11-15, y11-14; door alcove (13,14)
    { id: 'tent', x: 25, y: 12 },      // footprint x25-28, y12-14; mouth (26-27,14)
    { id: 'well', x: 15, y: 19 },      // footprint x15-16, y19-20
    { id: 'campfire', x: 24, y: 20 },
    { id: 'crateA', x: 27, y: 15 },
    { id: 'crateB', x: 28, y: 16 },
    { id: 'signpost', x: 17, y: 28 },  // greets arrivals on the south road
  ],
  objects: [
    { name: 'Player Start Location', x: 20, y: 31 },
    { name: 'InteractableZone', x: 18, y: 28, phrases:
      'The board reads: THORNWICK WAYSTATION. Beds, water, road news.|Scratched underneath, newer and smaller: GLADE ROAD CLOSED. Ask at the gate.' },
    // The cast. Types select entity classes in SpawnSystem (villagerEntity.ts).
    { name: 'Npc', x: 14, y: 21, type: 'villager_child' },   // by the well
    { name: 'Npc', x: 26, y: 17, type: 'villager_carter' },  // by the tent + crates
    { name: 'Npc', x: 26, y: 23, type: 'villager_hunter' },  // southeast treeline
    { name: 'Npc', x: 20, y: 8, type: 'villager_keeper' },   // holding the gate corridor
    // North gate: story-locked until the keeper opens it, then one-way into the glade.
    { name: 'Transition', x: 19, y: 4, widthTiles: 3, heightTiles: 2,
      targetMap: 'forrest', entryPoint: 'Player Start Location',
      requiredFlag: 'prologue_complete',
      lockedText: 'Barred. The keeper holds the gate.' },
  ],
};
