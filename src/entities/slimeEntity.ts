import { SpriteJSON, GameEntity, GameState } from './../models';
import { EventEmitter } from '../events';
import { GameEntityState } from '../models';
import { EnemyEntity } from './enemyEntity';

import slimeJSONRAW from '../data/spriteJSON/ks-slime2.json';
import { WeaponEntity } from './weaponEntity';
import { DAMAGE_TYPES } from '../damage';

export class SlimeEntity extends EnemyEntity {
  public static NAME = 'slime';
  public constructor(public state: GameEntityState, public children: GameEntity[], public emitter: EventEmitter) {
    children.push(new WeaponEntity(state, 'tackle', [], emitter, {
      damages: [
        {
          type: DAMAGE_TYPES.PHYSICAL,
          power: 5
        }
      ]
    }));
    super(state, children, emitter, slimeJSONRAW as SpriteJSON, './ks-slime2.png', SlimeEntity.NAME);
    this.status.health = 30;
  }
}
