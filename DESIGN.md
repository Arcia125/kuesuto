# Kuesuto: Chronicles of the Elven Blade — Design Canon

This is the source of truth for Kuesuto's world, tone, and systems. When story or
content decisions conflict with older text (e.g. early README drafts), this document wins.

## Premise

The forests of Verdelight are falling to a slow **corruption**. Creatures that once belonged to
the woods are turning — darker, twisted, wrong. **Arcia**, a silver-haired elf and a capable
swordfighter, walks into the middle of it and is drawn into finding out why.

## Tone pillar: the corruption is a mystery

The single most important creative rule: **the source of the corruption is unknown, and stays
unknown for a long time.** There is *no* "ancient artifact to destroy," no tidy explanation handed
to the player up front. Discovery is the game. Dialogue and lore should pose questions and offer
fragments, never the whole answer. Avoid the words and beats of generic high fantasy:

- **No prophecy. No chosen one. No destiny.** Arcia is not "the one foretold." She is a skilled
  person who chooses to act. Her arc is **grounded** — competence and resolve, not fate.
- The world reacts to corruption as something genuinely not understood, including by those who have
  lived in it for ages.

## Characters

- **Arcia** (player; engine name `player`, display name `Arcia`): silver-haired elf, sword-first
  fighter. Grounded, curious, decisive.
- **Morghal** (engine class `DarkWizardEntity`, display name `Morghal`): a robed figure who has
  watched the forest "longer than he cares to remember." A guide, not an oracle — he gives
  direction and unsettled questions, not prophecy. "Dark Wizard" persists only as an in-world
  epithet, not a statement that he is the villain.
- **Elaria** and **Sylas** (later phases): allies introduced as the ring opens up.

## World: a ring of five regions

The overworld is a **ring** — five regions connected so the player can travel around and back.
Each region has its own identity (palette, enemies, a puzzle flavor). Two are established; the
remaining are provisional until authored.

1. **Verdelight Glade** *(established — `forrest` map)* — the green starting woods; where Arcia
   meets Morghal and first sees the corruption.
2. **Ancient Ruins** *(threshold established — `ruins-approach` map)* — old stone older than the
   forest, east past the tree line; the corruption seems to thicken here.
3. **Shadowthorn Heart** *(provisional)* — the densest growth of the corrupting thorn.
4. **Region IV** *(provisional)* — a grove/wetland identity, TBD.
5. **Region V** *(provisional)* — TBD.

Each non-terminal region ultimately needs **two** transitions (one per ring neighbor), with
connection-specific entry-point names (e.g. "From Ruins", "From Grove").

## Combat

- **Sword-first.** Real-time, close-range. Leveling grants experience and stat growth.
- **Magic = gradual sword-technique upgrades.** There is no separate spell economy. Power grows as
  the blade itself gains techniques (range, sweep, charged strikes, elemental edges) — earned and
  incremental, in keeping with the grounded tone.

## Puzzles

Light, per-region environmental puzzles that lean on the region's identity (gates, paths, simple
sequencing). Detailed later, per region.

## Hard constraints (engine reality)

- **No Tiled in the loop.** The Tiled `.tsx`/`.tmx` sources are not in the repo. Maps are produced
  by the in-repo **map generator** (`tools/generate-map.mjs` + a per-region definition) which emits
  **Tiled-compatible JSON** so a map can still be opened/polished in Tiled later.
- **Reuse existing art.** Generated maps draw from the existing `kuesuto-tilemap.png` /
  `kuesuto-tilemap.json` tileset. Corruption is conveyed by **runtime sprite tinting** of enemy
  variants, not new art.
- **Map JSON shape** the loader expects: tile layers `Ground`, `Things`, `Collision` plus an
  object layer `Positions`; tilesets `ks-forrest-tileset.tsx` (firstgid 1) and `Collision.tsx`
  (firstgid 170); 16×16 tiles, orthogonal, non-infinite.

## Dialogue & content format

- NPC dialogue is an ordered list of `Interaction`s; each is `{ type: 'CHAT', phrases: string[] }`
  with optional `condition(gameState)` and `onComplete(gameState)`. The **first** interaction whose
  condition passes is shown, so list the most-specific (latest-story) branch first.
- Story progression is tracked with the **narrative flags** system (string keys → values), e.g.
  `morghal_intro_complete`, `corruption_investigated`, `chapter1_complete`.
- **InteractableZone** lore triggers carry their lines in a single `phrases` string property,
  multiple lines joined with `|`.

## Chapter 1 (the current playable slice)

Meet Morghal in Verdelight Glade → he asks Arcia to investigate the corrupted creatures → defeat a
few corrupted slimes (`corruption_investigated`) → Morghal points east to the Ancient Ruins
(`chapter1_complete`) → walk through the gate into the **Ancient Ruins approach** → and back.
