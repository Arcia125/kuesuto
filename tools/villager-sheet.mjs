#!/usr/bin/env node
// Compose the four Thornwick villager sprite sheets (keeper, child, hunter, carter)
// in exactly the ks-dark-wizard sheet format: 64x32 PNG, 7 16px frames on a 4x2 grid —
// Bounce Down = frames 0-2 (idle bob), BlinK Down = frames 3-6 (eye states) — plus a
// spriteJSON cloned from ks-dark-wizard.json (same frame keys, tags, durations; only
// meta.image differs). VillagerEntity renders idle-down always, like the wizard.
//
// Drawn as ASCII pixel grids in house style (1px outline, palette sampled from the
// game's existing art, transparent background like the wizard sheet). AI generation
// was unavailable in this environment (no GEMINI_API_KEY); these hand-authored grids
// are the plan's fallback and can be regenerated piecewise from AI art later.
//
//   node tools/villager-sheet.mjs   # writes public/ks-<name>.png + spriteJSON

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const T = 16;

// Shared palette (all sampled from public/kuesuto-tilemap.png)
const C = {
  K: [0, 0, 0],            // outline
  S: [232, 183, 150],      // skin
  s: [194, 133, 105],      // skin shadow (chin/mouth)
  N: [24, 20, 37],         // eyes (dark, human — unlike the wizard's glow)
  M: [115, 62, 57],        // mouth line / leather
  W: [115, 62, 57],        // leather strap / belt
  w: [184, 111, 80],       // leather lit
  B: [254, 231, 97],       // brass / straw bright
  b: [228, 166, 114],      // straw shaded
  H: [62, 39, 49],         // dark hair
  h: [254, 174, 52],       // bright hair (child) — orange
  G: [38, 92, 66],         // forest green cloth
  g: [25, 60, 62],         // forest green shadow
  T: [32, 93, 110],        // teal cloth
  t: [27, 79, 94],         // teal shadow
  O: [254, 174, 52],       // orange cloth (child tunic)
  o: [247, 118, 34],       // orange shadow
};

// Each villager: a 16x16 ASCII grid ('.' = transparent), a palette map into C,
// and eye pixel positions (2px tall) the compositor animates for the blink tag.
const VILLAGERS = {
  keeper: {
    // Sturdy, dark-haired, forest-green tunic, broad belt with a brass clasp —
    // the man who holds the gate.
    map: { K: 'K', H: 'H', S: 'S', s: 's', M: 'M', T: 'G', d: 'g', W: 'W', B: 'B' },
    bobSplit: 10, // head rows 0-9 squash onto the shoulders at row 10
    eyes: [[5, 6], [10, 6]],
    grid: [
      '................',
      '.....KKKKKK.....',
      '....KHHHHHHK....',
      '...KHHHHHHHHK...',
      '...KHHSSSSHHK...',
      '...KSSSSSSSSK...',
      '...KSSSSSSSSK...',
      '...KSSSSSSSSK...',
      '...KSSSMMSSSK...',
      '....KssssssK....',
      '...KTTTTTTTTK...',
      '..KTTTTTTTTTTK..',
      '..KTTTTddTTTTK..',
      '..KWWWWWBWWWWK..',
      '..KTTTTTTTTTTK..',
      '..KKKKKKKKKKKK..',
    ],
  },
  child: {
    // Small — a head shorter than everyone — bright orange tunic, sun-colored mop.
    map: { K: 'K', H: 'B', S: 'S', s: 's', T: 'O', d: 'o' },
    bobSplit: 12, // head rows 4-11 squash onto the tunic at row 12
    eyes: [[6, 9], [9, 9]],
    grid: [
      '................',
      '................',
      '................',
      '................',
      '......KKKK......',
      '.....KHHHHK.....',
      '....KHHHHHHK....',
      '....KHSSSSHK....',
      '....KSSSSSSK....',
      '....KSSSSSSK....',
      '....KSSSSSSK....',
      '.....KssssK.....',
      '....KTTTTTTK....',
      '...KTTTddTTTK...',
      '...KTTTTTTTTK...',
      '...KKKKKKKKKK...',
    ],
  },
  hunter: {
    // Hood up like the rumors' "dark wizard" — but a plain human face looks out.
    // Forest-green cloak, leather strap across the chest.
    map: { K: 'K', G: 'G', g: 'g', S: 'S', s: 's', W: 'W', w: 'w' },
    bobSplit: 10, // hood rows 0-9 squash onto the cloak at row 10
    eyes: [[6, 6], [9, 6]],
    grid: [
      '................',
      '.....KKKKKK.....',
      '....KGGGGGGK....',
      '...KGGGGGGGGK...',
      '...KGggggggGK...',
      '...KGSSSSSSGK...',
      '...KGSSSSSSGK...',
      '...KGSSSSSSGK...',
      '...KGgSSSSgGK...',
      '....KGssssGK....',
      '...KGGGGGGGGK...',
      '..KGGGGGGGGGGK..',
      '..KGGwWWWWwGGK..',
      '..KGGGGGGGGGGK..',
      '..KGGGGGGGGGGK..',
      '..KKKKKKKKKKKK..',
    ],
  },
  carter: {
    // Russet headscarf knotted at the side, teal work tunic, leather suspenders —
    // all road and freight.
    map: { K: 'K', R: 'w', r: 'M', S: 'S', s: 's', M: 'M', T: 'T', d: 't', W: 'W' },
    bobSplit: 10, // scarf + face rows 0-9 squash onto the tunic at row 10
    eyes: [[5, 6], [10, 6]],
    grid: [
      '................',
      '.....KKKKKK.....',
      '....KRRRRRRK....',
      '...KRRRRRRRRK...',
      '...KRrrrrrRRKK..',
      '...KSSSSSSSSKrK.',
      '...KSSSSSSSSKK..',
      '...KSSSSSSSSK...',
      '...KSSSMMSSSK...',
      '....KssssssK....',
      '...KTTTTTTTTK...',
      '..KTTTTTTTTTTK..',
      '..KTWTTddTTWTK..',
      '..KTWTTTTTTWTK..',
      '..KTTTTTTTTTTK..',
      '..KKKKKKKKKKKK..',
    ],
  },
};

// --- frame composition ---
// f0/f2: base, eyes open. f1: bob — a head SQUASH like the wizard's art, not a
// whole-sprite shift: rows above bobSplit drop 1px onto anchored shoulders/feet
// (shifting everything read as a one-frame jerk at 10x scale and wiped the bottom
// outline row for that frame).
// f3/f5: eyes half (lower pixel only). f4: eyes closed (dark lash line). f6: open.
const drawFrame = (out, frameIndex, v, { bob = false, eye = 'open' }) => {
  const ox = (frameIndex % 4) * T;
  const oy = ((frameIndex / 4) | 0) * T;
  const put = (x, y, rgb) => {
    if (y < 0 || y >= T) return;
    const i = ((oy + y) * out.width + (ox + x)) * 4;
    out.data[i] = rgb[0]; out.data[i + 1] = rgb[1]; out.data[i + 2] = rgb[2]; out.data[i + 3] = 255;
  };
  const split = bob ? v.bobSplit : 0;
  const drawRow = (y, dy) => {
    const row = v.grid[y];
    for (let x = 0; x < T; x++) {
      const ch = row[x];
      if (ch === '.') continue;
      const key = v.map[ch];
      if (!key) throw new Error(`No palette mapping for "${ch}"`);
      put(x, y + dy, C[key]);
    }
  };
  // Body first (anchored), then the head rows 1px lower on top of it.
  // (Without bob, split is 0 and the first loop draws the whole grid in place.)
  for (let y = split; y < T; y++) drawRow(y, 0);
  for (let y = 0; y < split; y++) drawRow(y, 1);
  for (const [exRaw, eyRaw] of v.eyes) {
    const ex = exRaw, ey = eyRaw + (bob && eyRaw < split ? 1 : 0);
    if (eye === 'open') { put(ex, ey, C.N); put(ex, ey + 1, C.N); }
    else if (eye === 'half') { put(ex, ey + 1, C.N); }
    else if (eye === 'closed') { put(ex, ey + 1, C.M); }
  }
};

const wizardJSON = JSON.parse(readFileSync(path.join(repoRoot, 'src/data/spriteJSON/ks-dark-wizard.json'), 'utf8'));

for (const [name, v] of Object.entries(VILLAGERS)) {
  const out = new PNG({ width: 64, height: 32 });
  drawFrame(out, 0, v, { eye: 'open' });
  drawFrame(out, 1, v, { bob: true, eye: 'open' });
  drawFrame(out, 2, v, { eye: 'open' });
  drawFrame(out, 3, v, { eye: 'half' });
  drawFrame(out, 4, v, { eye: 'closed' });
  drawFrame(out, 5, v, { eye: 'half' });
  drawFrame(out, 6, v, { eye: 'open' });

  const pngPath = path.join(repoRoot, `public/ks-${name}.png`);
  writeFileSync(pngPath, PNG.sync.write(out));

  const json = JSON.parse(JSON.stringify(wizardJSON));
  json.meta.image = `ks-${name}.png`;
  const jsonPath = path.join(repoRoot, `src/data/spriteJSON/ks-${name}.json`);
  writeFileSync(jsonPath, JSON.stringify(json, null, 1));
  console.log(`Wrote public/ks-${name}.png + src/data/spriteJSON/ks-${name}.json`);
}
