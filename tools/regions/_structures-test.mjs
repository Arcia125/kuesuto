// Throwaway proof region for structure stamps (see tools/structure-stamps.mjs):
// every structure placed in one clearing, an Npc posted right beside the hut wall
// (proves the object ring-clear no longer punches holes into footprints), and a
// flag-gated Transition (proves requiredFlag/lockedText pass through to the JSON).
//
//   node tools/map-preview.mjs _structures-test

const W = 30, H = 24;
const rows = [];
for (let y = 0; y < H; y++) {
  let row = '';
  for (let x = 0; x < W; x++) {
    row += (x >= 3 && x <= 26 && y >= 4 && y <= 19) ? '.' : '#';
  }
  rows.push(row);
}

export default {
  name: '_structures-test',
  width: W,
  height: H,
  rows,
  canopyWalls: true,
  trails: [[[3, 12], [26, 12]]],
  structures: [
    { id: 'hut', x: 6, y: 5 },
    { id: 'tent', x: 14, y: 5 },
    { id: 'well', x: 21, y: 6 },
    { id: 'campfire', x: 12, y: 15 },
    { id: 'crateA', x: 16, y: 15 },
    { id: 'crateB', x: 17, y: 16 },
    { id: 'signpost', x: 7, y: 15 },
  ],
  objects: [
    { name: 'Player Start Location', x: 4, y: 12 },
    // One tile off the hut's SE corner: its 3x3 ring overlaps the footprint.
    { name: 'Npc', x: 11, y: 9, type: 'villager_keeper' },
    { name: 'InteractableZone', x: 20, y: 16, phrases: 'test line one|test line two' },
    { name: 'Transition', x: 25, y: 12, widthTiles: 1, heightTiles: 2,
      targetMap: 'forrest', entryPoint: 'Player Start Location',
      requiredFlag: 'test_flag', lockedText: 'The way is barred.' },
  ],
};
