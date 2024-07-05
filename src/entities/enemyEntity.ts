import { getSpriteScale } from '../sprites';
import { EventEmitter } from '../events';
import { GameEntity, GameEntityState, GameState, SpriteJSON } from '../models';
import { NPCEntity } from './npcEntity';
import darkWizardSpriteJSONRaw from '../data/spriteJSON/ks-dark-wizard.json';
import { Collision } from '../capabilities/collision';
import { Movement } from '../capabilities/movement';
import { Aggro } from '../capabilities/aggro';
import { Attack } from '../capabilities/attack';

export class EnemyEntity extends NPCEntity {
  public static NAME = 'enemy';
  public movementCapability = new Movement(this);
  public collisionCapability = new Collision(this, this.movementCapability);
  public aggroCapability = new Aggro(this, 5 * getSpriteScale());
  public attackCapability = new Attack(this);

  public constructor(public state: GameEntityState, public children: GameEntity[], public emitter: EventEmitter, public npcSpriteJSONRaw: SpriteJSON, public spriteSheetPath: string,public name: string) {
    super(state, name || EnemyEntity.NAME, children || [], emitter, npcSpriteJSONRaw || (darkWizardSpriteJSONRaw as unknown as SpriteJSON), spriteSheetPath);
  }

  public update = (gameState: GameState, timeStamp: number) => {
    // debugger;

    // todo: fix update method. seems to be calling itself recursively somehow. It seems to do more than one update on the entity
    // Update: seems to be fixed. May cause problems if weapon is created inside of entity contructor?
    super.update(gameState, timeStamp);
    this.aggroCapability.update(gameState, timeStamp);
    this.movementCapability.update(gameState, timeStamp);
    this.collisionCapability.update(gameState, timeStamp);
    this.attackCapability.update(gameState, timeStamp);

    // if (!this.children?.length) {
    //   return;
    // }

    // for (let i = 0; i < this.children.length; i++) {
    //   this.children[i].update(gameState, timeStamp);
    // }
  }
}
