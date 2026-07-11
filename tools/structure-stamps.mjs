#!/usr/bin/env node
// Structure stamps: multi-tile set pieces (buildings + solid props) placed on WALKABLE
// floor by forest-gen's `structures` region field. Unlike the forest brush stamps
// (tools/stamps.mjs), these carry a COLLISION mask alongside the art — a building is
// solid except its doorway alcove, which stays walkable so the player can stand in the
// doorway. gids come from the waystation piece registry (tools/waystation-tiles.mjs),
// so the art and the stamps can never drift apart.
//
// Shape: { w, h, things: gid[], collision: (0|1)[] } — row-major, collision 1 = solid
// (forest-gen writes TILE.COLLISION), 0 = walkable alcove.

import { PIECES } from './waystation-tiles.mjs';

const gids = (name) => PIECES[name].ids.map((id) => id + 1);
const solid = (n) => new Array(n).fill(1);

export const STRUCTURE_STAMPS = {
  campfire: { w: 1, h: 1, things: gids('campfire'), collision: solid(1) },
  crateA:   { w: 1, h: 1, things: gids('crateA'),   collision: solid(1) },
  crateB:   { w: 1, h: 1, things: gids('crateB'),   collision: solid(1) },
  signpost: { w: 1, h: 1, things: gids('signpost'), collision: solid(1) },
  well:     { w: 2, h: 2, things: gids('well'),     collision: solid(4) },
  // Tent mouth spans the two center tiles of the bottom row (open front).
  tent: {
    w: 4, h: 3, things: gids('tent'),
    collision: [
      1, 1, 1, 1,
      1, 1, 1, 1,
      1, 0, 0, 1,
    ],
  },
  // Hut door alcove is the bottom-center tile.
  hut: {
    w: 5, h: 4, things: gids('hut'),
    collision: [
      1, 1, 1, 1, 1,
      1, 1, 1, 1, 1,
      1, 1, 1, 1, 1,
      1, 1, 0, 1, 1,
    ],
  },
};
