# HANDOFF — session state for re-acclimation

Read this after a context compaction or when starting a fresh session on branch
`feature/chapter1-legibility`. Companion docs: `CLAUDE.md` (rules), `DESIGN.md` (story
canon), `BACKLOG.md` (opportunity list), `.claude/skills/` (map-authoring, ai-sprites,
tileset-extension — read before touching maps/art/tiles).

## Where things stand (2026-07-10)

Branch `feature/chapter1-legibility`, ~40 commits ahead of master, NOT pushed, no PR yet.
Everything builds (`npm run build`) and the game is playable end-to-end: title → Verdelight
Glade → Morghal quest chain → ruins-approach and back, with save/continue.

### Systems added this session (all committed)

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
- **Debug: teleport** — `T` toggles, click minimap to warp (nearest walkable tile).
  Minimap geometry shared via `getMinimapGeometry` (rendering.ts) with the click handler
  (main.ts). Minimap draws water blue (ground gids 170–182 after the wall pass).

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

## In-flight conversation (answer this first)

User asked (verbatim intent): should the game OPEN with story/exposition — "starting
somewhere… before you just get dropped in with slimes" to make Arcia feel real — likely
needing a new map/environment. I had just re-read DESIGN.md to ground a proposal.
Canon constraints: **no prophecy/chosen-one; corruption stays a mystery; Arcia is a
grounded, capable outsider who walks INTO the corruption**. Natural options to propose:
(a) tiny prologue map (forest edge at dusk / roadside camp) with speech-bubble-driven
cold open, one-way transition into Verdelight — cheap via `new-region.mjs` + Entry/
Transition + a `prologue_complete` flag (skip on save-continue; skip with ?map= for dev);
(b) no new map: scripted opening beat on the existing start clearing (bubbles + slow-walk
before control unlocks); (c) title-screen text crawl (cheapest, weakest). The 'safe-haven'
archived song fits a prologue camp. User hasn't chosen — present options, recommend, build.

## Verification workflow

`npm run dev` → http://localhost:5173/kuesuto/ (`?map=<name>&freecam` for terrain review;
`T`+minimap-click teleport; `O` entity debug panel; `M` mute). Maps: `node tools/map-preview.mjs
<region>` then READ the PNG; `--collision` for walkability. Never hand-edit map JSON.
Commit style: descriptive, NO Co-Authored-By trailers, docs/ build output is committed.

## Near-term options (user-priority order unknown — ask)

1. The prologue/opening decision above (in-flight).
2. Play-test feedback loop on this session's systems (knockback feel, music, SFX volumes).
3. Open the PR for this branch (it is getting very large).
4. BACKLOG.md top items: attack cooldown, save v2 (persist enemy deaths), mobile Continue
   button, corner-rounding for door-frame collisions, Shadowthorn Heart region.
