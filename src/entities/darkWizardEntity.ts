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
    {type:'CHAT', phrases: [
      `${DarkWizardEntity.DISPLAY_NAME}: Ah, so you are the one foretold by the ancient prophecies. How curious that a mere elf stands at the crossroads of destiny.`,
      `The ${DarkWizardEntity.DISPLAY_NAME} steps forward, his eyes glowing with an enigmatic power.`,
      `${DarkWizardEntity.DISPLAY_NAME}: Allow me to introduce myself. I am ${DarkWizardEntity.DISPLAY_NAME}, a seeker of ancient truths. The Forest of Verdelight is facing a dire threat, and the Shadowthorn spreads with purpose. Your presence here is no coincidence.`,
      `Morghal's voice carries a calm and wise tone as he surveys the surroundings.`,
      `${DarkWizardEntity.DISPLAY_NAME}: The balance of nature is delicate. The Shadowthorn's corruption stems from an ancient artifact, hidden deep within these woods. This dark magic has disrupted the natural order.`,
      `He raises his staff, drawing power from the hidden energies around him.`,
      `${DarkWizardEntity.DISPLAY_NAME}: I am here to guide you, ${PlayerEntity.DISPLAY_NAME}. Together, we must uncover the source of this corruption and find a way to eliminate it. The path ahead is shrouded in mystery, but with wisdom and courage, we will find our way.`,
      `With a reassuring look, Morghal fades into the shadows, leaving the player with a sense of purpose and guidance.`
    ]},
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
