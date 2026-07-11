import { EventEmitter } from '../events';
import { Frame, GameEntity, GameEntityState, GameState, SpriteJSON } from '../models';
import { NPCEntity } from './npcEntity';
import { Entity } from './entities';
import darkWizardSpriteJSONRaw from '../data/spriteJSON/ks-dark-wizard.json';
import { Collision } from '../capabilities/collision';
import { Interactable } from '../capabilities/interactable';
import { Movement } from '../capabilities/movement';
import { Aggro } from '../capabilities/aggro';
import { PlayerEntity } from './playerEntity';
import { getSpriteScale } from '../sprites';

export class DarkWizardEntity extends NPCEntity {
  public static NAME = 'Dark Wizard';
  public static DISPLAY_NAME = 'Morghal';
  public movementCapability = new Movement(this);
  public collisionCapability = new Collision(this, this.movementCapability);
  // Used only for its pathfinding (moveTowards); the wizard never attacks.
  private chaseCapability = new Aggro(this, 0);
  public interactableCapability = new Interactable(this, [
    // After investigation - points to ruins (and to where Fern went)
    {
      type: 'CHAT',
      condition: (gameState: GameState) => gameState.systems.narrativeFlags.hasFlag('corruption_investigated'),
      phrases: [
        `${DarkWizardEntity.DISPLAY_NAME}: You have seen it with your own eyes now. The creatures deeper in the forest... they are not what they once were.`,
        `${DarkWizardEntity.DISPLAY_NAME}: This is no sickness. It spreads from the east — as if something old were remembering itself back into the world. I do not know what. After all my years here, I do not know what.`,
        `${DarkWizardEntity.DISPLAY_NAME}: There are ruins beyond the tree line. Ancient stones, older than this forest. The rot thickens toward them — and that is the way Fern went. Nothing has come back out since.`,
        `${DarkWizardEntity.DISPLAY_NAME}: Be careful, ${PlayerEntity.DISPLAY_NAME}. Whatever waits in those ruins has had a long time to grow strong. If Fern is anywhere, he is there.`,
      ],
      onComplete: (gameState: GameState) => {
        gameState.systems.narrativeFlags.setFlag('chapter1_complete', true);
      }
    },
    // After intro, before investigation
    {
      type: 'CHAT',
      condition: (gameState: GameState) => gameState.systems.narrativeFlags.hasFlag('morghal_intro_complete'),
      phrases: [
        `${DarkWizardEntity.DISPLAY_NAME}: The corrupted creatures are deeper in the forest, to the north. You will know them by their color - dark, unnatural.`,
        `${DarkWizardEntity.DISPLAY_NAME}: Defeat a few and return to me. Every one is a mark on the map of how far this has spread — and Fern's trail runs straight through it.`,
      ],
    },
    // First meeting
    {
      type: 'CHAT',
      phrases: [
        `${DarkWizardEntity.DISPLAY_NAME}: Hmm. A traveler — and this far past Thornwick's gate. They will have told you about me, then. The hermit. The dark wizard in the deep glade.`,
        `The hooded figure makes no move toward you. His eyes are tired, and entirely human.`,
        `${DarkWizardEntity.DISPLAY_NAME}: Whatever name they gave me, I am ${DarkWizardEntity.DISPLAY_NAME}. I have watched this forest longer than I care to remember. Lately, it needs the watching.`,
        `${DarkWizardEntity.DISPLAY_NAME}: And if the keeper opened his road, you have come about Fern. The waymarker passed through my glade six weeks ago, heading east toward the old stones. I could not turn him.`,
        `${DarkWizardEntity.DISPLAY_NAME}: Something is wrong here, ${PlayerEntity.DISPLAY_NAME}. The creatures of the glade are changing — a corruption twists them into something darker. Fern walked straight into the thick of it.`,
        `${DarkWizardEntity.DISPLAY_NAME}: If you mean to find him, help me first. Go deeper in and look at the corrupted creatures — learn what we are dealing with. His trail and this rot run the same way.`,
      ],
      onComplete: (gameState: GameState) => {
        gameState.systems.narrativeFlags.setFlag('morghal_intro_complete', true);
      }
    },
  ]);

  public constructor(public state: GameEntityState, public children: GameEntity[], public emitter: EventEmitter) {
    super(state, DarkWizardEntity.NAME, [], emitter, darkWizardSpriteJSONRaw as unknown as SpriteJSON, './ks-dark-wizard.png');
    this.status.immortal = true;
    this.status.health = 99999;
    // Spawn default is 0.8x player speed; he must be able to catch a fleeing player.
    this.state.speedX *= 1.5;
    this.state.speedY *= 1.5;
  }

  // The wizard's sheet only has down-facing idle animations (Bounce/Blink Down);
  // any other movement/direction state matches zero frames and he turns invisible.
  // Always render him as idle-down — he glides while chasing.
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

  // Ambient escort commentary, shown as overhead speech bubbles while Morghal
  // follows the player to the corrupted glade.
  private static ESCORT_LINES = [
    'These trees were seedlings when I first came to the glade.',
    'Listen... even the birds have gone quiet out here.',
    'The corruption creeps a little further every season.',
    'I used to know every creature of this forest. Now I hardly recognize them.',
    'Stay near the path. The forest remembers those who respect it.',
  ];
  private escortLineIndex = 0;
  private nextLineAt = 0;
  private warnedAboutCorruption = false;
  private hailedPlayer = false;
  private saidFarewell = false;

  public update(gameState: GameState, timeStamp: number) {
    this.behave(gameState, timeStamp);
    this.movementCapability.update(gameState, timeStamp);
    this.collisionCapability.update(gameState, timeStamp);
    // While escorting, bumping into him must NOT open his reminder chat — his
    // overhead commentary does the talking. Clear the collision-set flag after
    // collisions fire but before the interactable capability acts on it.
    const flags = gameState.systems.narrativeFlags;
    const escorting = flags.hasFlag('morghal_intro_complete') && !flags.hasFlag('corruption_investigated');
    if (escorting) {
      this.interactableCapability.interacting = false;
    }
    this.interactableCapability.update(gameState, timeStamp);
  }

  // Morghal's life in chapter 1:
  //   1. Before the first meeting: intercepts a player who tries to slip past.
  //   2. Until the corruption is investigated: gently escorts them, trailing a couple
  //      of tiles behind, with occasional overhead commentary.
  //   3. Quest done: runs to the player to deliver the ruins briefing (contact chat).
  //   4. Chapter 1 complete: a short farewell bubble, then he stays put for good.
  private behave(gameState: GameState, timeStamp: number) {
    const flags = gameState.systems.narrativeFlags;
    const player = PlayerEntity.find(gameState);
    if (!player) return;
    const tileSize = getSpriteScale();
    const distance = Math.abs(player.state.x - this.state.x) + Math.abs(player.state.y - this.state.y);
    const stop = () => {
      this.state.moving = false;
      this.state.xDir = 0;
      this.state.yDir = 0;
    };

    if (flags.hasFlag('chapter1_complete')) {
      if (!this.saidFarewell) {
        this.saidFarewell = true;
        gameState.systems.speech.say(this, `Go well, ${PlayerEntity.DISPLAY_NAME}. This is as far as I follow.`, 6000);
      }
      stop();
      return;
    }

    if (flags.hasFlag('corruption_investigated')) {
      // Quest finished: he comes to the player wherever they are for the debrief.
      if (distance > 1.2 * tileSize) {
        this.chaseCapability.moveTowards(gameState, player.state);
      } else {
        stop();
      }
      return;
    }

    if (flags.hasFlag('morghal_intro_complete')) {
      // Escort: follow at a polite distance, never crowding the player.
      if (distance > 3.5 * tileSize) {
        this.chaseCapability.moveTowards(gameState, player.state);
      } else {
        stop();
      }
      this.commentate(gameState, timeStamp);
      return;
    }

    // First meeting: Manhattan distance, so 14 covers ~9 tiles diagonally — enough
    // to catch a player hugging the far edge of his clearing.
    if (distance < 14 * tileSize && distance > 1.2 * tileSize) {
      if (!this.hailedPlayer) {
        this.hailedPlayer = true;
        gameState.systems.speech.say(this, 'You there — traveler! A moment!', 4000);
      }
      this.chaseCapability.moveTowards(gameState, player.state);
    } else {
      stop();
    }
  }

  private commentate(gameState: GameState, timeStamp: number) {
    // Stay quiet while a real conversation is on screen.
    if (gameState.systems.controlState.state === 'chat') return;

    // One-time warning the first time a corrupted creature is close.
    if (!this.warnedAboutCorruption) {
      const tileSize = getSpriteScale();
      const nearCorrupted = gameState.entities.some(e =>
        e.name === 'corrupted_slime' && !e.status.dead &&
        Math.abs(e.state.x - this.state.x) + Math.abs(e.state.y - this.state.y) < 7 * tileSize);
      if (nearCorrupted) {
        this.warnedAboutCorruption = true;
        gameState.systems.speech.say(this, 'There — you see it? That color is not of this forest. Be on your guard.', 6000);
        this.nextLineAt = timeStamp + 20000;
        return;
      }
    }

    if (!this.nextLineAt) {
      // First ambient line lands shortly after the escort begins.
      this.nextLineAt = timeStamp + 6000;
      return;
    }
    if (timeStamp >= this.nextLineAt && this.escortLineIndex < DarkWizardEntity.ESCORT_LINES.length) {
      gameState.systems.speech.say(this, DarkWizardEntity.ESCORT_LINES[this.escortLineIndex], 5500);
      this.escortLineIndex++;
      this.nextLineAt = timeStamp + 18000 + Math.random() * 8000;
    }
  }
}
