import { getSpriteScale } from './../sprites';
import { EventEmitter } from '../events';
import { GameEntity, GameEntityState, GameState, SpriteJSON } from '../models';
import { NPCEntity } from './npcEntity';
import darkWizardSpriteJSONRaw from '../data/spriteJSON/ks-dark-wizard.json';
import { Collision } from '../capabilities/collision';
import { Movement } from '../capabilities/movement';
import { Aggro } from '../capabilities/aggro';

export class EnemyEntity extends NPCEntity {
  public static NAME = 'enemy';
  public movementCapability = new Movement(this);
  public collisionCapability = new Collision(this, this.movementCapability);
  public aggroCapability = new Aggro(this, 5 * getSpriteScale());

  public constructor(public state: GameEntityState, public children: GameEntity[], public emitter: EventEmitter, public npcSpriteJSONRaw: SpriteJSON, public spriteSheetPath: string,public name: string) {
    super(state, name || EnemyEntity.NAME, children || [], emitter, npcSpriteJSONRaw || (darkWizardSpriteJSONRaw as unknown as SpriteJSON), spriteSheetPath);
  }

  public update(gameState: GameState, _timeStamp: number) {
    this.aggroCapability.update(gameState, _timeStamp);
    this.movementCapability.update(gameState, _timeStamp);
    this.collisionCapability.update(gameState, _timeStamp);
  }
}
