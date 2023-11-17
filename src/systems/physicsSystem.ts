import { Collision } from '../capabilities/collision';
import { WeaponEntity } from '../entities/weaponEntity';
import { EventEmitter, EVENTS, EVENT_MAPPING } from '../events';
import { Damage, Force, ForceEntry, GameEntity, GameState, IPhysicsSystem } from '../models';
import { directionVectorBetween } from '../position';
import { getSpriteScale } from '../sprites';


export class PhysicsSystem implements IPhysicsSystem {
  private forceEntries: ForceEntry[] = [];

  // public static getDamages(entity: GameEntity): Damage[] {
  //   // console.warn('getDamage not implemented');
  //   const weapon = entity.children?.find(child => child instanceof WeaponEntity) as WeaponEntity | undefined;
  //   if (!weapon) {
  //     console.error(`getDamages: cannot find weapon on entity ${entity}`);
  //     return [];
  //   }
  //   const damages = weapon.stats.damages;
  //   return damages;
  // }

  public constructor(private emitter: EventEmitter) {
    emitter.on(EVENTS.ATTACK, (_eventName, payload) => this.handleAttack(payload))
  }

  private handleAttack = ({ attacker, target }: EVENT_MAPPING[typeof EVENTS.ATTACK]) => {
    // const damages = DamageSystem.getDamages(attacker);
    // this.dealDamage(attacker, damages, target);
    this.applyForce(target, {
      direction: directionVectorBetween(attacker.state, target.state),
      magnitude: 1000
    });
  };


  private registerForce = (forceEntry: ForceEntry) => this.forceEntries.push(forceEntry);

  public applyForce = (entity: GameEntity, force: Force) => {
    if (entity.status.immortal) {
      return;
    }

    this.registerForce({ entity, force });


    // this.applyForce


    // damages.forEach(damage => {
    //   entity.status.health -= damage.power;
    // });

    // this.emitter.emit(EVENTS.DAMAGE, { attacker, entity, damages });
  }

  public update = (gameState: GameState, timestamp: number) => {
    for (let i = 0; i < this.forceEntries.length; i++) {
      const forceEntry = this.forceEntries[i];
      const { entity, force } = forceEntry;
      let angle = Math.atan2(force.direction.y / getSpriteScale(), force.direction.x / getSpriteScale());
      let xForce = Math.cos(angle) * ((force.magnitude * 0.01) / entity.state.mass) * gameState.time.delta;
      let yForce = Math.sin(angle) * ((force.magnitude * 0.01) / entity.state.mass) * gameState.time.delta;

      let newX = entity.state.x + xForce;
      let newY = entity.state.y + yForce;
      if (Collision.checkCollision(gameState, {
        ...entity,
        state: {
          ...entity.state,
          x: newX,
          y: newY,
        }
      }).collidedCorners.length) {
        xForce *= -1;
        yForce *= -1;
        newX = entity.state.x + xForce;
        newY = entity.state.y + yForce;
        force.direction.x *= -1;
        force.direction.y *= -1;
      }
      entity.state.x = newX;
      entity.state.y = newY;
      console.log({ xForce, yForce, angle, force });
      force.magnitude -= Math.abs(xForce) + Math.abs(yForce);
      if (force.magnitude <= 10) {
        this.forceEntries.splice(i, 1);
      }
    }
  }
}

// import { WeaponEntity } from '../entities/weaponEntity';
// import { EventEmitter, EVENTS, EVENT_MAPPING } from '../events';
// import { Damage, GameEntity, IDamageSystem } from '../models';

// export class DamageSystem implements IDamageSystem {

//   public static getDamages(entity: GameEntity): Damage[] {
//     // console.warn('getDamage not implemented');
//     const weapon = entity.children?.find(child => child instanceof WeaponEntity) as WeaponEntity | undefined;
//     if (!weapon) {
//       console.error(`getDamages: cannot find weapon on entity ${entity}`);
//       return [];
//     }
//     const damages = weapon.stats.damages;
//     return damages;
//   }

//   public constructor(private emitter: EventEmitter) {
//     emitter.on(EVENTS.ATTACK, (_eventName, payload) => this.handleAttack(payload))
//   }

//   public handleAttack = ({ attacker, target }: EVENT_MAPPING[typeof EVENTS.ATTACK]) => {
//     const damages = DamageSystem.getDamages(attacker);
//     this.dealDamage(attacker, damages, target);
//   };

//   public dealDamage = (attacker: GameEntity, damages: Damage[], target: GameEntity) => {
//     if (target.status.immortal) {
//       return;
//     }
//     damages.forEach(damage => {
//       target.status.health -= damage.power;
//     });

//     this.emitter.emit(EVENTS.DAMAGE, { attacker, target, damages });
//   }
// }
