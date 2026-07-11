# Kuesuto: Chronicles of the Elven Blade — Design Canon

This is the source of truth for Kuesuto's world, tone, and systems. When story or
content decisions conflict with older text (early README drafts, previous versions of
this file), this document wins.

## Premise

The forests of Verdelight are falling to a slow **corruption**. Creatures that once
belonged to the woods are turning — darker, twisted, wrong. **Arcia**, an elf sellsword
passing through on the north road, takes a small favor at a waystation and walks into
the middle of it.

## Story spine: "The Named Monster"

People under slow, creeping fear give it a name and a face, because a named monster
feels smaller than a nameless one. They are almost always wrong about the face.

- Thornwick Waystation fears the glade to the north and has pinned that fear on "the
  dark wizard" — a hermit nobody at the waystation has actually met.
- The player enters Verdelight primed by those rumors, then meets **Morghal**: tired,
  courteous, watchful — a warden, not a monster. Dramatic irony does the work that
  exposition would otherwise do. *Fear names the wrong monsters.*
- The real wrongness — the corruption — has no face and no name yet. That's the point.

## Tone pillar: the corruption is a mystery

The single most important creative rule: **the source of the corruption is unknown, and
stays unknown for a long time.** There is *no* "ancient artifact to destroy," no tidy
explanation handed to the player up front. Discovery is the game. Dialogue and lore pose
questions and offer fragments, never the whole answer.

What fragments may say (and no more): the corruption spreads from the direction of the
ruins, and it behaves less like a plague than like **something old remembering itself
back into the world**. What that something is, whether it thinks, what it wants — unknown,
including to Morghal.

Avoid the words and beats of generic high fantasy:

- **No prophecy. No chosen one. No destiny.** Arcia is not "the one foretold." He is a
  skilled person who chooses to act. His arc is **grounded** — competence and resolve,
  not fate.
- The world reacts to corruption as something genuinely not understood, including by
  those who have lived in it for ages.

## Characters

- **Arcia** (player; engine name `player`, display name `Arcia`): a **male** elf
  sellsword — silver-haired, sword-first. Long-lived and dry about it; he travels
  because staying anywhere means watching people age. He pays his debts, keeps his
  word, and does small kindnesses without ceremony. **Characterize him by action,
  almost never by self-talk** — other people talk; Arcia does.
- **Morghal** (engine class `DarkWizardEntity`, display name `Morghal`): a robed figure
  who has watched the forest "longer than he cares to remember." A guide, not an oracle —
  he gives direction and unsettled questions, not prophecy. "The dark wizard" is
  Thornwick's name for him, spoken by people who have never met him; the epithet is a
  rumor artifact, never a statement that he is the villain. He knew Fern by name and
  saw him pass north.
- **Fern**: the keeper's brother; the waymarker who kept the glade's trail-signs.
  Walked north weeks before the game opens and hasn't come back. Never yet seen on
  screen — he is a hole in other people's lives, and his trail is the player's thread
  through the regions. His trail leads toward the ruins.
- **The Thornwick cast** (prologue; engine classes under `villagerEntity.ts`):
  - **Keeper** — runs the waystation, holds the north gate. Fern's sibling; the only
    one whose fear is specific rather than superstitious. Opens the gate only for
    someone willing to look for Fern.
  - **Child** — plays by the well; counts the morning birdsong as a game. The count
    keeps coming up short. Nobody else has noticed yet.
  - **Hunter** — works the treeline; won't go past it anymore. "The birds have gone
    quiet." (Deliberate pre-echo of Morghal's escort line — the two people closest to
    the woods noticed the same true thing.)
  - **Carter** — hauls goods up the road; all road-news and freight economics. The one
    who spits "dark wizard" with total confidence and zero firsthand knowledge.
- **Elaria** and **Sylas** (later phases): allies introduced as the ring opens up.

## The rumor rule

NPCs repeating the Morghal rumor must **contradict each other** in the particulars
(what he did, what he looks like, why he does it). No two tellings agree. The player
should be able to notice this before ever meeting him. Rumors are characterization of
the teller, not information about the subject.

## World: a ring of five regions (plus the waystation)

The overworld is a **ring** — five regions connected so the player can travel around and
back. Each region has its own identity (palette, enemies, a puzzle flavor). The
waystation sits outside the ring as the game's doorstep.

0. **Thornwick Waystation** *(established — `prologue` map)* — a hut, a tent, a well,
   a campfire on the forest road. The gate to the glade is barred by fear. One-way exit
   north (story gate; no return trigger — the road behind fills with reasons to move
   forward).
1. **Verdelight Glade** *(established — `forrest` map)* — the green starting woods;
   where Arcia meets Morghal and first sees the corruption.
2. **Ancient Ruins** *(threshold established — `ruins-approach` map)* — old stone older
   than the forest, east past the tree line; the corruption seems to thicken here.
   Fern's trail points here.
3. **Shadowthorn Heart** *(provisional)* — the densest growth of the corrupting thorn.
4. **Region IV** *(provisional)* — a grove/wetland identity, TBD.
5. **Region V** *(provisional)* — TBD.

Each non-terminal ring region ultimately needs **two** transitions (one per ring
neighbor), with connection-specific entry-point names (e.g. "From Ruins", "From Grove").

## Series engine (how chapters stay connected)

Every region visited adds, in some form:

1. **One more piece of Fern's trail** — a waymarker he cut, someone who fed him, a camp
   gone cold. Concrete, physical, small.
2. **One more contradicting story about Morghal** — the rumor mutates with distance.
3. **One notch worse in Thornwick's small news** — travelers' gossip about home; the
   child's birdsong count keeps coming up shorter. The doorstep quietly darkens behind
   the player.

## Narrative flags

Story progression is tracked with the **narrative flags** system (string keys → values);
every flag set auto-saves.

| Flag | Set when |
|---|---|
| `prologue_opening_said` | Arcia's one-line arrival bubble has played (never replays) |
| `prologue_errand_started` | Keeper asks Arcia to fetch the child from the well |
| `prologue_errand_done` | Child agrees to head back |
| `prologue_complete` | Keeper opens the north gate (the Fern ask) |
| `morghal_intro_complete` | First meeting with Morghal ends |
| `corruption_investigated` | Corrupted-slime quest done |
| `chapter1_complete` | Morghal's ruins debrief ends |

Prologue flags are **never read by forrest logic**; the chapter-1 chain is untouched.
A save made mid-prologue must restore correctly: NPC posture and gate state are
**re-derived from flags every frame**, never from transient entity state.

## Combat

- **Sword-first.** Real-time, close-range. Leveling grants experience and stat growth.
- **Magic = gradual sword-technique upgrades.** There is no separate spell economy.
  Power grows as the blade itself gains techniques (range, sweep, charged strikes,
  elemental edges) — earned and incremental, in keeping with the grounded tone.

## Puzzles

Light, per-region environmental puzzles that lean on the region's identity (gates,
paths, simple sequencing). Detailed later, per region.

## Hard constraints (engine reality)

- **No Tiled in the loop.** The Tiled `.tsx`/`.tmx` sources are not in the repo. Maps
  are produced by the in-repo **map generator** (`tools/forest-gen.mjs` + a per-region
  definition) which emits **Tiled-compatible JSON** so a map can still be opened/polished
  in Tiled later.
- **Art extends, never replaces.** Generated maps draw from `kuesuto-tilemap.png` /
  `kuesuto-tilemap.json`; new tiles are appended as complete rows (see the
  tileset-extension skill — three files change together). Corruption is conveyed by
  **runtime sprite tinting** of enemy variants, not new art.
- **Map JSON shape** the loader expects: tile layers `Ground`, `Things`, `Collision`
  plus an object layer `Positions`; tilesets `ks-forrest-tileset.tsx` (firstgid 1) and
  `Collision.tsx` (firstgid 170); 16×16 tiles, orthogonal, non-infinite.

## Dialogue & content format

- NPC dialogue is an ordered list of `Interaction`s; each is
  `{ type: 'CHAT', phrases: string[] }` with optional `condition(gameState)` and
  `onComplete(gameState)`. The **first** interaction whose condition passes is shown,
  so list the most-specific (latest-story) branch first.
- **InteractableZone** lore triggers carry their lines in a single `phrases` string
  property, multiple lines joined with `|`.
- Overhead speech bubbles (`gameState.systems.speech.say`) are for non-blocking flavor:
  hails, ambient lines, refusals. Chats are for content the player must read.

## Prologue (Thornwick Waystation)

Arrive on the south road → one dry arrival line → the yard: signpost, well, campfire,
hut, tent → NPCs seed the contradicting rumors and the Fern hole → keeper's errand
(the child at the well) → errand done → keeper asks Arcia to look for Fern and opens
the north gate (`prologue_complete`) → one-way transition into Verdelight Glade.
Minutes, not hours: **the errand is tiny on purpose** — it exists so the gate opening
is earned, and so the keeper's trust has a reason.

## Chapter 1 (Verdelight Glade)

Meet Morghal — who acknowledges the Thornwick rumors about him without resentment, knew
Fern, and saw him pass → he asks Arcia to investigate the corrupted creatures (the slime
quest doubles as gathering Fern's trail) → defeat corrupted slimes
(`corruption_investigated`) → Morghal points east: the corruption thickens toward the
Ancient Ruins, and that is also where Fern went (`chapter1_complete`) → the gate into
the **Ancient Ruins approach** → and back.
