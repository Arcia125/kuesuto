import { GameEntity, GameEntityState } from '../models';
import { EventEmitter } from '../events';
import { SlimeEntity } from './slimeEntity';

// A quicker, frailer slime variant. Lightly tinted so it reads as "off" without
// being mistaken for the corruption-quest target.
export class FastSlimeEntity extends SlimeEntity {
  public static NAME = 'fast_slime';
  public constructor(public state: GameEntityState, public children: GameEntity[], public emitter: EventEmitter) {
    super(state, children, emitter);
    this.name = FastSlimeEntity.NAME;
    this.state.tint = { r: 200, g: 80, b: 80, a: 0.35 };
    this.state.speedX *= 1.8;
    this.state.speedY *= 1.8;
    this.status.health = 20;
  }
}
