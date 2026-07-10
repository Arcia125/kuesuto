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
    // After investigation - points to ruins
    {
      type: 'CHAT',
      condition: (gameState: GameState) => gameState.systems.narrativeFlags.hasFlag('corruption_investigated'),
      phrases: [
        `${DarkWizardEntity.DISPLAY_NAME}: You have seen the corruption with your own eyes now. The creatures deeper in the forest... they are not what they once were.`,
        `${DarkWizardEntity.DISPLAY_NAME}: Something is feeding this darkness. It is not natural. The corruption spreads from somewhere to the east.`,
        `${DarkWizardEntity.DISPLAY_NAME}: There are ruins beyond the tree line. Ancient stones, older than this forest. I believe the source lies there.`,
        `${DarkWizardEntity.DISPLAY_NAME}: Be careful, ${PlayerEntity.DISPLAY_NAME}. Whatever waits in those ruins has had a long time to grow strong.`,
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
        `${DarkWizardEntity.DISPLAY_NAME}: Defeat a few and return to me. I need to understand how far the corruption has spread.`,
      ],
    },
    // First meeting
    {
      type: 'CHAT',
      phrases: [
        `${DarkWizardEntity.DISPLAY_NAME}: Hmm. A traveler. It has been some time since anyone wandered into Verdelight Glade.`,
        `The wizard studies you with calm, steady eyes.`,
        `${DarkWizardEntity.DISPLAY_NAME}: I am ${DarkWizardEntity.DISPLAY_NAME}. I have been watching the forest for... longer than I care to remember.`,
        `${DarkWizardEntity.DISPLAY_NAME}: Something is wrong here, ${PlayerEntity.DISPLAY_NAME}. The creatures of the glade are changing. A corruption is taking hold, twisting them into something darker.`,
        `${DarkWizardEntity.DISPLAY_NAME}: I could use your help. Head deeper into the forest and investigate the corrupted creatures. See what you can learn.`,
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

  public update(gameState: GameState, _timeStamp: number) {
    this.chase(gameState);
    this.movementCapability.update(gameState, _timeStamp);
    this.collisionCapability.update(gameState, _timeStamp);
    this.interactableCapability.update(gameState, _timeStamp);
  }

  // Before the first meeting, Morghal won't let the player slip past: if they get
  // near, he runs over to them so the intro chat triggers on contact.
  private chase(gameState: GameState) {
    if (gameState.systems.narrativeFlags.hasFlag('morghal_intro_complete')) {
      this.state.moving = false;
      return;
    }
    const player = PlayerEntity.find(gameState);
    if (!player) return;
    const tileSize = getSpriteScale();
    const distance = Math.abs(player.state.x - this.state.x) + Math.abs(player.state.y - this.state.y);
    // Manhattan distance, so 14 covers ~9 tiles diagonally — enough to catch a
    // player hugging the far edge of his clearing.
    if (distance < 14 * tileSize && distance > 1.2 * tileSize) {
      this.chaseCapability.moveTowards(gameState, player.state);
    } else {
      this.state.moving = false;
      this.state.xDir = 0;
      this.state.yDir = 0;
    }
  }
}
