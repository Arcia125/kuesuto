import { SpriteJSON } from './../models';
import { EventEmitter } from '../events';
import { GameEntityState } from '../models';
import { EnemyEntity } from './enemyEntity';

import slimeJSONRAW from '../data/spriteJSON/ks-slime2.json';

export class SlimeEntity extends EnemyEntity {
  public static NAME = 'slime';
  public constructor(public state: GameEntityState, public emitter: EventEmitter) {
    super(state, [], emitter, slimeJSONRAW as SpriteJSON, './ks-slime2.png', SlimeEntity.NAME);
    this.status.health = 30;
  }
}
