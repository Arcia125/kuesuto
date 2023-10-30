import { EventEmitter } from '../events';
import { GameEntity, GameEntityState, GameState, SpriteJSON } from '../models';
import { NPCEntity } from './npcEntity';
import darkWizardSpriteJSONRaw from '../data/spriteJSON/ks-dark-wizard.json';
import { Collision } from '../capabilities/collision';

export class DarkWizardEntity extends NPCEntity {
  public static NAME = 'dark wizard';
  public collisionCapability = new Collision(this);

  public constructor(public state: GameEntityState, public children: GameEntity[], public emitter: EventEmitter) {
    super(state, DarkWizardEntity.NAME, [], emitter, darkWizardSpriteJSONRaw as unknown as SpriteJSON, './ks-dark-wizard.png');
  }

  public update(gameState: GameState, _timeStamp: number) {
    this.collisionCapability.update(gameState, _timeStamp);
  }
}
