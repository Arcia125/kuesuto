import { SpriteJSON, GameEntity } from '../models';
import { EventEmitter } from '../events';
import { GameEntityState } from '../models';
import { EnemyEntity } from './enemyEntity';

import slimeJSONRAW from '../data/spriteJSON/ks-slime2.json';
import { WeaponEntity } from './weaponEntity';
import { DAMAGE_TYPES } from '../damage';

export class SlimeEntity extends EnemyEntity {
  public static NAME = 'slime';
  public static getDefaultChildren = (emitter: EventEmitter, ...params: any) => ([new WeaponEntity({
    ...params,
    x: 0,
    y: 0,
  }, 'tackle', [], emitter, {
    damages: [
      {
        type: DAMAGE_TYPES.PHYSICAL,
        power: 5
      }
    ]
  })]);
  public constructor(public state: GameEntityState, public children: GameEntity[], public emitter: EventEmitter) {
    super(state, children, emitter, slimeJSONRAW as SpriteJSON, './ks-slime2.png', SlimeEntity.NAME);
    this.status.health = 30;
  }
}
