import { EventEmitter, EVENTS } from '../events';
import { GameEntityState, GameState } from '../models';
import { Entity } from './entities';
import { getSpriteScale } from '../sprites';
import { PlayerEntity } from './playerEntity';

const HEAL_AMOUNT = 20;
const LIFETIME_MS = 12000;

/**
 * A heart dropped by a slain enemy: bobs in place, heals the player on touch.
 * Has no sprite sheet — rendering.ts draws it procedurally as a pixel heart
 * (drawEntity skips sprite-less entities). Fades out after LIFETIME_MS.
 */
export class HeartPickupEntity extends Entity {
  public static NAME = 'heartPickup';
  public spawnedAt = performance.now();

  public constructor(public state: GameEntityState, public emitter: EventEmitter) {
    super(state, HeartPickupEntity.NAME, [], emitter);
    this.status.immortal = true;
    this.status.nonBlocking = true;
  }

  public expired() {
    return performance.now() - this.spawnedAt > LIFETIME_MS;
  }

  public update(gameState: GameState, _timeStamp: number) {
    const remove = () => {
      const i = gameState.entities.indexOf(this);
      if (i >= 0) gameState.entities.splice(i, 1);
    };
    if (this.expired()) {
      remove();
      return;
    }
    const player = PlayerEntity.find(gameState);
    if (!player || player.status.dead) return;
    const reach = getSpriteScale() * 0.8;
    if (Math.abs(player.state.x - this.state.x) < reach && Math.abs(player.state.y - this.state.y) < reach) {
      if (player.status.health < player.status.maxHealth) {
        player.status.health = Math.min(player.status.maxHealth, player.status.health + HEAL_AMOUNT);
        this.emitter.emit(EVENTS.HEAL, { entity: player, amount: HEAL_AMOUNT });
        remove();
      }
      // At full health the heart stays on the ground for later.
    }
  }
}
