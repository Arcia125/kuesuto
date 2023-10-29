import { GameEntityState, GameEntity, SpriteJSON } from '../models';
import { EventEmitter } from '../events';
import { SpriteEntity } from "./spriteEntity";


export class WeaponEntity extends SpriteEntity {
  public constructor(public state: GameEntityState, public name: string, public children: GameEntity[], emitter: EventEmitter, spriteJSONRAW: SpriteJSON, spritePath: string) {
    super(state, name, children, emitter, spriteJSONRAW as SpriteJSON, spritePath);
  }
}
