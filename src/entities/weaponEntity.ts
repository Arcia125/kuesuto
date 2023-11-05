import { DAMAGE_TYPES } from './../damage';
import { GameEntityState, GameEntity, SpriteJSON, ItemStats } from '../models';
import { EventEmitter } from '../events';
import { SpriteEntity } from "./spriteEntity";

export class WeaponEntity extends SpriteEntity {
  public stats: ItemStats = {
    damages: [
      {
        type: DAMAGE_TYPES.PHYSICAL,
        power: 0
      }
    ]
  };

  public constructor(public state: GameEntityState, public name: string, public children: GameEntity[], emitter: EventEmitter, spriteJSONRAW: SpriteJSON, spritePath: string) {
    super(state, name, children, emitter, spriteJSONRAW as SpriteJSON, spritePath);
    this.status.immortal = true;
  }
}
