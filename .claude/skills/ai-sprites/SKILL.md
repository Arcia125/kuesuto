---
name: ai-sprites
description: This skill should be used when generating game art with AI — "generate sprites", "new tiles", "nano banana", "make a set piece", "AI art", "pixelize", or extending kuesuto-tilemap.png with new artwork.
---

# AI sprite generation (nano-banana → game-ready pixel art)

Read this WHOLE file before generating art. Requires the `GEMINI_API_KEY` environment
variable (the script tolerates accidentally pasted junk before the "AIza" prefix; if the
key is missing, ask the user to set it — do not hardcode keys anywhere).

## The pipeline — exact steps

**Step 1. Generate** (always pass the tileset as a style reference — this is what keeps
new art consistent with the game's existing style):
```
node tools/nanobanana.mjs --prompt "<see prompt rules>" --ref public/kuesuto-tilemap.png --out <name>-v1.png
```
Output lands in `tools/generated/`. `--ref` is repeatable — for pieces that must sit in a
scene, also pass a rendered map crop (e.g. `tools/renders/world-forest.png`) so the model
sees the tiles in context.

**Step 2. Convert to true pixel art in the game palette:**
```
node tools/pixelize.mjs tools/generated/<name>-v1.png --scale 8 --out tools/generated/<name>-px.png
```
Always pass `--scale 8` for 1024px outputs (auto-detect is unreliable). This chroma-keys
the magenta background to transparent, downsamples to the real pixel grid, and snaps every
pixel to the palette extracted from `public/kuesuto-tilemap.png`.

**Step 3. Look at the result** (pixel art is unreadable at 1x):
```
node tools/view.mjs tools/generated/<name>-px.png --scale 6
```
Then use the Read tool on the `-view.png` it prints. Judge it, adjust the prompt, repeat.
Quality bar: `tools/generated/ruins-px8b-view.png`.

## Prompt rules (learned the hard way — user-confirmed)

- **NEVER ask for a transparent background.** The model paints a fake grey checkerboard.
  Always request "on a plain solid magenta (#FF00FF) background"; transparency is applied
  by pixelize's chroma key. If the subject itself is purple/pink, use a different chroma
  color in the prompt and adjust `chromaness()` in `tools/pixelize.mjs` to match.
- Always include: "using the attached 16x16 pixel-art tileset as an exact style and
  palette reference", "same pixel density (16px per tile)", "aligned to a 16px grid",
  "flat orthographic top-down perspective", "dark outlines", "clear spacing between pieces".
- Expect the perspective to drift toward 3/4-isometric anyway; regenerate or accept.
- In multi-piece sheets expect ~1 in 4 pieces malformed. Regenerate just that piece with
  its own prompt rather than trying to retouch pixels.

## What pixelize already solves (do not re-solve)

The anti-aliasing ring where chroma blends into the subject is handled: majority-vote
transparency per output cell, each boundary cell represented by its least
chroma-contaminated source pixel, plus a one-ring spill erode pass that cannot eat
inward past the edge. If you still see colored fringe, the chroma color is wrong for
that subject — switch it (see prompt rules) instead of adding new cleanup passes.

## What AI generation is good and bad for

- **Good:** standalone set pieces — ruins, statues, props, large sprites, characters.
- **Bad:** connector/glue tiles (wang terrain pieces, hedge end caps) that need
  pixel-exact edge continuity with existing tiles. Compose those programmatically from
  existing tile art instead (see the map-authoring skill).
- New art is NOT in the game until it is appended to `public/kuesuto-tilemap.png` and
  `src/data/tilesets/ks-forrest-tileset.json` (tilecount/rows) — coordinate with the user
  before growing the tileset.
