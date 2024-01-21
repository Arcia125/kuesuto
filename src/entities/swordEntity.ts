import { DAMAGE_TYPES } from './../damage';
import { GameEntityState, GameEntity, SpriteJSON } from '../models';
import swordSpriteJSONRAW from '../data/spriteJSON/kuesuto-sword.json';
import { EventEmitter } from '../events';
import { WeaponEntity } from './weaponEntity';


export class SwordEntity extends WeaponEntity {
  public static NAME = 'sword';
  public constructor(public state: GameEntityState, public children: GameEntity[], public emitter: EventEmitter) {
    super(state, SwordEntity.NAME, children, emitter, {
      damages: [
        {
          type: DAMAGE_TYPES.PHYSICAL,
          power: 10
        }
      ]
    }, swordSpriteJSONRAW as SpriteJSON, './kuesuto-sword.png');
  }
}
