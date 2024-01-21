import { EVENTS } from '../events';
import { WeaponEntity } from '../entities/weaponEntity';
import { Capability, GameEntity, GameState } from '../models';
import { Collision } from './collision';

export class Attack implements Capability {
  public targetsHit: Set<GameEntity> = new Set();
  public constructor(public entity: GameEntity) {

  }

  public update = (gameState: GameState, _timeStamp: number) => {
    if (this.entity.state.attacking) {
      const weapon = this.entity.children?.find(child => child instanceof WeaponEntity) as WeaponEntity | undefined;
      if (!weapon) {
        console.error("A weapon is required to attack");
        return;
      }

      console.log('weapon', weapon);
      const collisions = Collision.checkEntityCollision(gameState, weapon);
      if (collisions.collidedCorners) {
        collisions.entities.forEach(entity => {
          if (this.targetsHit.has(entity)) {
            return;
          }
          if (entity.status.dead) {
            return;
          }
          if (entity.id === weapon.parent!.id) {
            return;
          }
          console.log('attack');
          this.targetsHit.add(entity);
          gameState.emitter.emit(EVENTS.ATTACK, {
            attacker: this.entity,
            target: entity,
          });
        });
      }
    } else if (this.targetsHit.size) {
      this.targetsHit.clear();
    }
  };
}
