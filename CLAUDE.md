# Kuesuto — agent notes

Top-down TypeScript + Vite browser game. `npm run dev` (serves at `/kuesuto/`),
`npm run build` (tsc + vite → `docs/`, which is the deployed site — commit it).

- **Design canon:** `DESIGN.md` (story/tone/world constraints — follow it).
- **Maps:** never hand-edit tile arrays. Use the `map-authoring` skill
  (`.claude/skills/map-authoring/`) — generator, offline PNG renderer for visual review,
  hard terrain constraints, `?map=<name>&freecam` in-game viewer.
- **AI art:** use the `ai-sprites` skill (`.claude/skills/ai-sprites/`) — nano-banana +
  pixelize pipeline, chroma-key rules.
- **Git:** work on a feature branch with frequent, descriptive checkpoint commits (the
  user reviews via git history). NEVER add Co-Authored-By / Claude trailers to commits.
- Architecture: entities + capabilities + systems, event-driven via `EventEmitter`
  (`src/events.ts`). Collision is a dedicated tile layer (id 170), not sprite shapes.
- Scale model: 16px tiles × `RENDERING_SCALE=10`; entity world coords = tile coords × 160
  (`getSpriteScale()`); map object coords are ×16 pixels, multiplied by 10 at spawn.
