# HANDOFF — session state for re-acclimation

Read this after a context compaction or when starting a fresh session on branch
`feature/prologue-thornwick`. Companion docs: `CLAUDE.md` (rules), `DESIGN.md` (story
canon), `BACKLOG.md` (opportunity list), `.claude/skills/` (map-authoring, ai-sprites,
tileset-extension — read before touching maps/art/tiles).

## Where things stand (2026-07-15)

Branch `feature/prologue-thornwick`, 15 commits ahead of master (9 unpushed locally, all
from today's session — minimap overhaul through the UI skin, see below), no PR yet.
Everything builds (`npm run build`) and the game is playable end-to-end: title/continue →
Thornwick Waystation prologue → Verdelight Glade → Morghal quest chain → ruins-approach
and back, with save/continue.

### Systems & features on this branch (all committed)

- **SpeechSystem** — overhead speech bubbles (`gameState.systems.speech.say(entity, text)`),
  non-blocking flavor dialogue. Used by Morghal.
- **SoundSystem** — synthesized WebAudio SFX (no assets): swing/hit/hurt/squish/death/
  level-up/chat-blip/heal-chime/whoosh. `M` mutes. Swish rate-limited 220ms.
- **MusicSystem** — chiptune sequencer, token-string tracks ("C5 - . " per eighth),
  lookahead scheduler. Active song: **'verdant-gloom'** (dark, Am, 104 BPM). Archived:
  **'safe-haven'** (bright; reuse for village/interior). Both in `SONGS` registry in
  `src/systems/musicSystem.ts`; swap via `ACTIVE_SONG`.
- **SaveSystem** — localStorage (`kuesuto-save-v1`): flags + player stats + map + position.
  Auto-saves on flag/level/transition/heal + 15s heartbeat. `C` on title = continue.
  Enemies respawn on load (known v1 limitation, in BACKLOG).
- **Death loop** — player death → red-tinted corpse → 1.5s → "YOU HAVE FALLEN" veil →
  Space respawns at map start, flags intact. Player is NEVER spliced from entities.
- **Game feel** — i-frames while flashing (player only); hit-pause 70ms on player hits;
  camera shake (small=deal, big=take); camera lerp-follow (snaps on big jumps);
  axis-separated collision (slide along walls, THE wall-stick fix).
- **Heart drops** — slimes 35% / corrupted 100% drop procedurally-drawn pixel hearts,
  +20 HP on touch, expire 12s (blink last 3s). Drawn in `drawHeartPickups` (no sprite).
- **Morghal AI** (`darkWizardEntity.ts`) — 4-stage: intercept (+"You there — traveler!"
  bubble) → escort to corrupted glade w/ ambient commentary bubbles (bump-chat suppressed)
  → runs to player when quest completes for the ruins debrief → farewell bubble, retires.
  Renders idle-down always (sheet has no walk frames — glides).
- **Area title cards** — `AreaTitleSystem` + `drawAreaTitle` (rendering.ts): AI-prerendered
  banner (`public/ks-area-banner.png`) + DESIGN.md area name, on AREA_TRANSITION_COMPLETE
  and the first running frame. Names live in `AREA_TITLES` (areaTitleSystem.ts) — add an
  entry when adding a map. Draws under speech bubbles.
- **Opening declutter** — Arcia's one-line arrival bubble (flag `prologue_opening_said`)
  is cut; title card + signpost already carried its content, and title + signpost + bubble
  all landing at once crowded the opening. The title card is now the arrival beat.
  DESIGN.md updated in both spots (prologue flow, flag table).
- **UI skin** — `src/uiPanel.ts`: carved-wood nine-slice (`public/ks-ui-panel.png`,
  16px corner studs, edges tile, flat `UI_WOOD_FILL` interior). `drawWoodPanel` for
  surfaces (chat, quest log, HUD plate, minimap frame — all in rendering.ts),
  `drawWoodChip` for elements too small for the frame (hint chips). New UI should use
  these + `uiPanelScale(canvas)` so everything stays in the banner's family.
- **Debug: teleport** — `T` toggles, click minimap to warp (nearest walkable tile).
  Minimap geometry shared via `getMinimapGeometry` (rendering.ts) with the click handler
  (main.ts). Minimap terrain classifies by gid: dirt trail (ground 74–86) tan, water
  (ground 170–182) blue, Things decor 109–116 stays grass, structures (≥196) brown,
  other Things art tree-green; collision paints wall-black only where nothing else
  claimed the tile. Villagers are gold dots.

### Hard-won bug knowledge (do not re-learn these)

- **Invisible entities = canvas state poisoning.** `drawEntity` sets `color-dodge` for
  flashing entities; any swallowed draw exception used to leave it stuck → every entity
  drawn later blended into the terrain. Fixed: catch resets composite; draw failures now
  `console.error` once per entity id (`logDrawFailure`). The chronic thrower was the idle
  sword (weapon sheets have attack frames only) — weapons now spawn `visible=false`.
- **Knockback** must decay over TIME (`×0.995^ms`, cutoff 70), never by distance travelled.
  Impulse magnitude 1500 (`physicsSystem.ts:19`).
- **Map invisible walls:** wall cells near water render as bare grass (canopy retreats
  3 tiles from shorelines). EVERY water circle needs a shore clearing ≥3 tiles wider —
  rule is in the map-authoring skill; verify with `render-map --collision`.
- **Trail forks:** grass slivers <2 tiles between diverging trails render as square
  notches; generator now closes them morphologically (dilate+erode in forest-gen.mjs).
- Chat freeze = no enemy attacks (guard in `attack.ts`); Interactable rearm-on-exit
  prevents chat reopen loops; trigger entities are `status.nonBlocking`.
- Hold-space attack relies on OS key auto-repeat reaching `controls.attack` — do NOT
  filter `event.repeat` in controls (SFX spam is rate-limited in SoundSystem instead).
- **Composed wang tiles need DENSE coverage, not one centered motif.** The 13 procedural
  canopy edge/corner tiles (`tools/canopy-tiles.mjs`) drew a single leaf-clump lobe
  centered mid-tile; an edge or corner tile only exposes a FRAGMENT of its canopy region,
  so most fragments landed in the lobe's empty gutter — flat dark voids that read as
  torn gaps in the treeline (not a map-layout bug, a texture-coverage bug). Fixed with a
  brick-offset lattice of lobes wrapped mod-16 (still seamless by construction). Rule for
  any future composed tile: cover the whole 16×16 densely, since a wang neighbor will
  crop away most of it.
- **Layered raster passes: don't let a "solid" pass unconditionally win.** The minimap
  painted collision black AFTER the terrain pass, but trees/buildings/water are ALSO
  collision, so it blanketed every set piece in wall-black regardless of what drew it.
  Fixed with a `claimed` flag — collision only paints where nothing narrower already
  explained the tile. Applies to any future minimap/terrain classification: order passes
  narrow-to-wide, or gate the wide one.

## Prologue arc — background (built 2026-07-11, extended since)

The opening question was answered with the **Thornwick Waystation prologue**: new opening map with
buildings/props (structure stamps + grass-bay dirt masking in forest-gen), four
villager NPCs (VillagerEntity, errand chain: `prologue_errand_started → _done →
prologue_complete`), a flag-locked one-way gate into forrest, per-map music
('safe-haven' at the waystation), Morghal re-skinned to the new "Named Monster" story
spine, and DESIGN.md rewritten (Arcia is male — he/him everywhere). New games start at
Thornwick; saves and `?map=` override. Engine fix along the way: exactly-axis-aligned
entities used to pass through each other (strict corner tests) — AABB overlap now
gates the corner checks in `Collision.checkEntityCollision`.

## Verification workflow

`npm run dev` → http://localhost:5173/kuesuto/ (`?map=<name>&freecam` for terrain review;
`T`+minimap-click teleport; `O` entity debug panel; `M` mute). Maps: `node tools/map-preview.mjs
<region>` then READ the PNG; `--collision` for walkability. Never hand-edit map JSON.
Commit style: descriptive, NO Co-Authored-By trailers, docs/ build output is committed.

For UI/timing work with no interactive browser available: `npm run build`, then
`npx vite preview --outDir docs --port 4181`, drive it headless with `puppeteer-core`
against installed Chrome, screenshot at specific delays (e.g. mid-fade, post-fade) and
Read the PNG. Full setup (Chrome/Firefox paths, save-seeding, GPU-accel caveat) is in
memory (`kuesuto-browser-debugging`) — check there before re-deriving it.

## Near-term options (user-priority order unknown — ask)

1. HUD is intentionally unfinished — health/xp bars are plain rects on the new wood
   backing plate, no heart pips or level badge yet. Natural next pass on `uiPanel.ts`.
2. Play-test feedback loop on this session's systems (knockback feel, music, SFX volumes).
3. Open the PR for this branch (it is getting very large).
4. BACKLOG.md top items: attack cooldown, save v2 (persist enemy deaths), mobile Continue
   button, corner-rounding for door-frame collisions, Shadowthorn Heart region.
