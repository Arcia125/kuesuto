import { EventEmitter } from '../events';
import { Frame, GameEntity, GameEntityState, GameState, Interaction, SpriteJSON } from '../models';
import { NPCEntity } from './npcEntity';
import { Entity } from './entities';
import { Collision } from '../capabilities/collision';
import { Interactable } from '../capabilities/interactable';
import { Movement } from '../capabilities/movement';
import { PlayerEntity } from './playerEntity';
import { getSpriteScale } from '../sprites';
import keeperSpriteJSONRaw from '../data/spriteJSON/ks-keeper.json';
import childSpriteJSONRaw from '../data/spriteJSON/ks-child.json';
import hunterSpriteJSONRaw from '../data/spriteJSON/ks-hunter.json';
import carterSpriteJSONRaw from '../data/spriteJSON/ks-carter.json';

// The Thornwick Waystation cast (see DESIGN.md). Each villager is a stationary,
// immortal, bump-to-talk NPC in the Morghal pattern: idle-down rendering only (the
// sheets have no walk frames), ordered Interactions where the FIRST passing condition
// wins, plus optional ambient overhead bubbles and a one-time hail.
//
// The rumor rule (DESIGN.md): every telling of the "dark wizard" story contradicts
// the others. Tam blames a spreading quiet and scoffs at the wizard; Marla is certain
// it IS the wizard; Wren just counts what the forest gives her; Bram believes none of
// it and only wants his brother found.

type VillagerDefinition = {
  displayName: string;
  spriteJSON: SpriteJSON;
  spriteSheetPath: string;
  interactions: Interaction[];
  /** Overhead flavor lines, cycled while the player is nearby and no chat is open. */
  ambient?: string[];
  /** One-time overhead greeting when the player first comes within hailRadius tiles. */
  hail?: { text: string; radiusTiles: number };
};

export class VillagerEntity extends NPCEntity {
  public movementCapability = new Movement(this);
  public collisionCapability = new Collision(this, this.movementCapability);
  public interactableCapability: Interactable;

  private hailed = false;
  private ambientIndex = 0;
  private nextAmbientAt = 0;

  public constructor(
    public state: GameEntityState,
    name: string,
    protected definition: VillagerDefinition,
    public children: GameEntity[],
    public emitter: EventEmitter,
  ) {
    super(state, name, [], emitter, definition.spriteJSON, definition.spriteSheetPath);
    this.status.immortal = true;
    this.status.health = 99999;
    // Villagers are set pieces at their posts: heavy enough that the player cannot
    // shove them around the yard.
    this.state.mass = 200;
    this.interactableCapability = new Interactable(this, definition.interactions);
  }

  // The villager sheets (like the wizard's) only have down-facing idle animations;
  // any other movement/direction state matches zero frames and the sprite vanishes.
  public getDirection(): 'down' {
    return 'down';
  }

  public getSpritePos = (gameState: GameState): Frame => {
    const wasMoving = this.state.moving;
    this.state.moving = false;
    try {
      return Entity.getSpritePos(gameState, 'down', this);
    } finally {
      this.state.moving = wasMoving;
    }
  }

  public update(gameState: GameState, timeStamp: number) {
    this.behave(gameState, timeStamp);
    this.movementCapability.update(gameState, timeStamp);
    this.collisionCapability.update(gameState, timeStamp);
    this.interactableCapability.update(gameState, timeStamp);
    this.chatter(gameState, timeStamp);
  }

  // Stationary by default; subclasses with posture changes (the keeper stepping off
  // the gate) override this. Re-derive posture from narrative flags every frame so
  // save-load restores it for free.
  protected behave(_gameState: GameState, _timeStamp: number) {
    this.stop();
  }

  protected stop() {
    this.state.moving = false;
    this.state.xDir = 0;
    this.state.yDir = 0;
  }

  private chatter(gameState: GameState, timeStamp: number) {
    // Overhead bubbles stay quiet while a real conversation is on screen.
    if (gameState.systems.controlState.state === 'chat') return;
    const player = gameState.entities.find(e => e.name === PlayerEntity.NAME);
    if (!player) return;
    const tileSize = getSpriteScale();
    const distance = Math.abs(player.state.x - this.state.x) + Math.abs(player.state.y - this.state.y);

    const hail = this.definition.hail;
    if (hail && !this.hailed && distance < hail.radiusTiles * tileSize) {
      this.hailed = true;
      gameState.systems.speech.say(this, hail.text, 4000);
      this.nextAmbientAt = timeStamp + 16000;
      return;
    }

    const lines = this.definition.ambient;
    if (!lines?.length) return;
    // Mutterings are for passers-by, not for the whole map.
    if (distance > 6 * tileSize) return;
    if (!this.nextAmbientAt) {
      this.nextAmbientAt = timeStamp + 4000 + Math.random() * 4000;
      return;
    }
    if (timeStamp >= this.nextAmbientAt) {
      gameState.systems.speech.say(this, lines[this.ambientIndex % lines.length], 4500);
      this.ambientIndex++;
      this.nextAmbientAt = timeStamp + 16000 + Math.random() * 10000;
    }
  }
}

const flag = (name: string) => (gameState: GameState) => gameState.systems.narrativeFlags.hasFlag(name);

// --- Bram, the keeper. Fern's brother, Wren's father. Holds the north gate. ---
const KEEPER: VillagerDefinition = {
  displayName: 'Bram',
  spriteJSON: keeperSpriteJSONRaw as unknown as SpriteJSON,
  spriteSheetPath: './ks-keeper.png',
  hail: { text: 'Hold there, traveler.', radiusTiles: 8 },
  interactions: [
    // Road open — reminders of the real ask.
    {
      type: 'CHAT',
      condition: flag('prologue_complete'),
      phrases: [
        `Bram: Road's open. It stays open for you.`,
        `Bram: If you find where my brother's trail goes cold — that's all I ask. Someone should know.`,
      ],
    },
    // Errand done — thanks, then the Fern ask, then the gate.
    {
      type: 'CHAT',
      condition: flag('prologue_errand_done'),
      phrases: [
        `Bram: Wren's on her way up. You have my thanks — one small worry off a long list.`,
        `Bram: Now. You came for the north road. I bar it for everyone, and I will open it for you — on one condition.`,
        `Bram: My brother Fern kept the waymarks on the glade trail. Six weeks back he walked north to recut them. He has not come home.`,
        `Bram: Ask anyone here what took him and you'll get a different story each time. A twisting in the woods. Birds gone silent. A dark wizard in the deep glade.`,
        `Bram: Every telling is different, and not one of the tellers has set foot past my gate.`,
        `Bram: I don't need a monster named. I need my brother found — or word of him, good or hard.`,
        `Bram: Look for Fern. That's the toll. The gate is yours, ${PlayerEntity.DISPLAY_NAME}.`,
      ],
      onComplete: (gameState: GameState) => {
        gameState.systems.narrativeFlags.setFlag('prologue_complete', true);
      },
    },
    // Errand running — reminder.
    {
      type: 'CHAT',
      condition: flag('prologue_errand_started'),
      phrases: [
        `Bram: Wren's down by the well — small, loud, hair like straw in the sun. Send her up to the fire, would you?`,
      ],
    },
    // First words — the hook.
    {
      type: 'CHAT',
      phrases: [
        `Bram: Easy, traveler. The gate's barred. Glade road is closed — has been for weeks.`,
        `Bram: Whatever business you have north of here, it waits. Though... hm. You wear that sword like it's part of the arm.`,
        `Bram: Do a small thing for me and we can talk about the road. My girl, Wren, has wandered down to the well again. Send her back up to the fire.`,
      ],
      onComplete: (gameState: GameState) => {
        gameState.systems.narrativeFlags.setFlag('prologue_errand_started', true);
      },
    },
  ],
};

// --- Wren, the keeper's daughter. Counts the morning birdsong; Fern taught her. ---
const CHILD: VillagerDefinition = {
  displayName: 'Wren',
  spriteJSON: childSpriteJSONRaw as unknown as SpriteJSON,
  spriteSheetPath: './ks-child.png',
  ambient: [
    '...five? No. Four.',
    'The well echoes if you shout down it.',
  ],
  interactions: [
    {
      type: 'CHAT',
      condition: flag('prologue_errand_done'),
      phrases: [
        `Wren: I'm GOING. I'm going the long way.`,
        `Wren: Uncle Fern says the long way is how you see things.`,
      ],
    },
    {
      type: 'CHAT',
      condition: flag('prologue_errand_started'),
      phrases: [
        `Wren: Papa wants me back at the fire? He always wants me back at the fire.`,
        `Wren: I was counting the birds. Uncle Fern taught me — you count the morning songs, and the number tells you the forest's mood.`,
        `Wren: It used to be twelve. Today I got four. The forest is in a bad mood.`,
        `Wren: Fine, I'm coming. Tell Papa I'll count on the way.`,
      ],
      onComplete: (gameState: GameState) => {
        gameState.systems.narrativeFlags.setFlag('prologue_errand_done', true);
      },
    },
    {
      type: 'CHAT',
      phrases: [
        `Wren: Shhh. I'm counting.`,
        `Wren: ...four. It's four again. It's never been four before.`,
      ],
    },
  ],
};

// --- Tam, the hunter. Works the treeline; won't go past it anymore. ---
const HUNTER: VillagerDefinition = {
  displayName: 'Tam',
  spriteJSON: hunterSpriteJSONRaw as unknown as SpriteJSON,
  spriteSheetPath: './ks-hunter.png',
  ambient: [
    'Quiet again.',
    'Even the crows moved on.',
  ],
  interactions: [
    {
      type: 'CHAT',
      phrases: [
        `Tam: New face. You'll be wanting the gate — that's Bram's to open. I just mind the treeline.`,
        `Tam: I hunted the glade twenty years. Deer, fox, dove. I don't go past the line now.`,
        `Tam: It's not the wizard, whatever Marla tells you. Wizards don't hush birds. Something in there has gone quiet, and the quiet is spreading.`,
        `Tam: You'll hear it too, once you know to listen. Mornings used to be loud.`,
      ],
    },
  ],
};

// --- Marla, the carter. Freight, road news, and total certainty. ---
const CARTER: VillagerDefinition = {
  displayName: 'Marla',
  spriteJSON: carterSpriteJSONRaw as unknown as SpriteJSON,
  spriteSheetPath: './ks-carter.png',
  ambient: [
    'Four days round the ridge. FOUR.',
    'Crates don\'t haul themselves.',
  ],
  interactions: [
    {
      type: 'CHAT',
      phrases: [
        `Marla: If you're waiting on the north road, get comfortable. Nothing has moved through that gate in six weeks.`,
        `Marla: I haul for three villages off this road. With the glade closed it's the long way round the ridge — four days instead of one. My margins died before any monster showed up.`,
        `Marla: And it IS the dark wizard, mark me. Hooded thing in the deep glade. My cousin's man saw him — standing still as a post, just watching the road.`,
        `Marla: Tam will tell you wizards don't hush birds. Tam talks to trees. It's the wizard.`,
      ],
    },
  ],
};

// SpawnSystem's registry instantiates entity classes with a uniform
// (state, children, emitter) signature, so each villager gets a thin subclass
// binding its definition rather than one parameterized class.

export class VillagerKeeperEntity extends VillagerEntity {
  public static NAME = 'villager_keeper';
  public constructor(state: GameEntityState, children: GameEntity[], emitter: EventEmitter) {
    super(state, VillagerKeeperEntity.NAME, KEEPER, children, emitter);
  }
}

export class VillagerChildEntity extends VillagerEntity {
  public static NAME = 'villager_child';
  public constructor(state: GameEntityState, children: GameEntity[], emitter: EventEmitter) {
    super(state, VillagerChildEntity.NAME, CHILD, children, emitter);
  }
}

export class VillagerHunterEntity extends VillagerEntity {
  public static NAME = 'villager_hunter';
  public constructor(state: GameEntityState, children: GameEntity[], emitter: EventEmitter) {
    super(state, VillagerHunterEntity.NAME, HUNTER, children, emitter);
  }
}

export class VillagerCarterEntity extends VillagerEntity {
  public static NAME = 'villager_carter';
  public constructor(state: GameEntityState, children: GameEntity[], emitter: EventEmitter) {
    super(state, VillagerCarterEntity.NAME, CARTER, children, emitter);
  }
}
