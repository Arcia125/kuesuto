// Throwaway demo region proving the `canopies` capability: a straight walkable corridor
// with irregular canopy-wall masses (unioned circles, incl. concave inlets) forming the
// treeline walls via the "Grass Canopy" wangset — arbitrary outline, solid collision.
const WIDTH = 48, HEIGHT = 34;
const isFloor = (x, y) => x >= 3 && x <= 44 && y >= 14 && y <= 20;
const rows = [];
for (let y = 0; y < HEIGHT; y++) {
  let row = '';
  for (let x = 0; x < WIDTH; x++) row += isFloor(x, y) ? '.' : '#';
  rows.push(row);
}
export default {
  name: '_canopy-demo', width: WIDTH, height: HEIGHT, rows,
  // Curvy treeline masses above and below the corridor (any outline).
  canopies: [
    { x: 10, y: 6, r: 6 }, { x: 18, y: 5, r: 5 }, { x: 26, y: 7, r: 6 },
    { x: 34, y: 5, r: 5 }, { x: 41, y: 7, r: 6 }, { x: 22, y: 9, r: 7 },
    { x: 9, y: 28, r: 6 }, { x: 17, y: 29, r: 5 }, { x: 27, y: 27, r: 7 },
    { x: 36, y: 29, r: 6 }, { x: 43, y: 27, r: 5 },
  ],
  objects: [
    { name: 'Player Start Location', x: 5, y: 17 },
    { name: 'Transition', x: 43, y: 17, widthTiles: 2, heightTiles: 2,
      targetMap: 'forrest', entryPoint: 'From Ruins' },
  ],
};
