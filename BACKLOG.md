# Kuesuto backlog

Opportunities spotted while working. Roughly ordered by impact-per-effort within each
section. Strike items when done (leave them listed as a record).

## Polish (in progress this pass)

- [ ] Player i-frames during the damage flash window
- [ ] Player death → game over screen → respawn loop (death currently goes nowhere)
- [ ] WebAudio SFX: swish/hit/death/level-up/chat blip (game has zero audio)
- [ ] Hit-pause + screen shake on hits
- [ ] Heart drops from slimes (no way to recover health)
- [ ] localStorage save/continue (refresh loses everything)
- [ ] Camera lerp smoothing

## Bugs / engine debt

- [ ] `DeathSystem` splices the PLAYER entity out of `gameState.entities` 4.5s after
      death — camera loses target, `PlayerEntity.find` breaks. Player must be exempt
      from corpse cleanup.
- [ ] `DeathSystem.update` / `DamageSystem.update` mutate their arrays with
      `splice(i, 1)` inside forward loops — skips the next entry for a frame
      (same bug fixed in PhysicsSystem).
- [ ] `Collision.checkEntityCollision` skips entities with the same NAME (`entities[i].name === entity.name`)
      — two slimes never collide with each other; should compare `id`, not `name`.
- [ ] `Aggro.update` runs `findPath` every frame per aggroed enemy — fine now, will
      spike with many enemies. Cache path for a few steps or stagger repath.
- [ ] `EnemyEntity` constructor params `npcSpriteJSONRaw || darkWizard fallback` —
      dead fallback code; slime weapon 'tackle' hits are range-based, not sprite-based.
- [ ] Chat freezes ALL Movement (every entity) via controlState check inside
      `Movement.update` — fine today, but enemies also freeze mid-hop, looks odd
      during Morghal chats with slimes on screen.

## Game feel / UX

- [ ] Start menu: show controls (arrows/WASD, Space attack, J quest log, T teleport)
- [ ] Chat UI: "▼ next" indicator + name portrait/label for the speaker
- [ ] Corrupted slime: brief wind-up telegraph before its lunge
- [ ] Attack animation: sword swing has no cooldown indicator; button-mash feels mushy
- [ ] Minimap: fog-of-war (only show explored tiles) would restore exploration mystery
- [ ] Animated water tiles (LTTP shimmer) — swap gids on a timer at render time

## Content

- [ ] Shadowthorn Heart region (chapter 1 finale beyond ruins-approach)
- [ ] Ruins-approach needs its own enemy mix + lore zones (sparse right now)
- [ ] Corruption/thorn decor tiles for corrupted pocket (tileset-extension skill)
- [ ] Morghal walk cycle sprites via ai-sprites pipeline (currently glides in idle pose)
- [ ] More weapon/loot variety (only sword + tackle exist)

## Audio (after first SFX pass)

- [ ] Simple looping forest ambience / music track
- [ ] Per-map ambience (ruins = wind, glade = birds until corruption zone)
