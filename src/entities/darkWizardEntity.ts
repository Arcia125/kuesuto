import { EventEmitter } from '../events';
import { GameEntity, GameEntityState, GameState, SpriteJSON } from '../models';
import { NPCEntity } from './npcEntity';
import darkWizardSpriteJSONRaw from '../data/spriteJSON/ks-dark-wizard.json';
import { Collision } from '../capabilities/collision';
import { Interactable } from '../capabilities/interactable';
import { PlayerEntity } from './playerEntity';

export class DarkWizardEntity extends NPCEntity {
  public static NAME = 'Dark Wizard';
  public static DISPLAY_NAME = 'Morghal';
  public collisionCapability = new Collision(this);
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
  }

  public update(gameState: GameState, _timeStamp: number) {
    this.collisionCapability.update(gameState, _timeStamp);
    this.interactableCapability.update(gameState, _timeStamp);
  }
}
