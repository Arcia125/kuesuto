import { WeaponEntity } from '../entities/weaponEntity';
import { EventEmitter, EVENTS, EVENT_MAPPING } from '../events';
import { Damage, GameEntity, IDamageSystem } from '../models';

export class DamageSystem implements IDamageSystem {

  public static getDamages(entity: GameEntity): Damage[] {
    // console.warn('getDamage not implemented');
    const weapon = entity.children?.find(child => child instanceof WeaponEntity) as WeaponEntity | undefined;
    if (!weapon) {
      console.error(`getDamages: cannot find weapon on entity ${entity}`);
      return [];
    }
    const damages = weapon.stats.damages;
    return damages;
  }

  public constructor(private emitter: EventEmitter) {
    emitter.on(EVENTS.ATTACK, (_eventName, payload) => this.handleAttack(payload))
  }

  public handleAttack = ({ attacker, target }: EVENT_MAPPING[typeof EVENTS.ATTACK]) => {
    const damages = DamageSystem.getDamages(attacker);
    this.dealDamage(attacker, damages, target);
  };

  public dealDamage = (attacker: GameEntity, damages: Damage[], target: GameEntity) => {
    damages.forEach(damage => {
      target.status.health -= damage.power;
    });
    this.emitter.emit(EVENTS.DAMAGE, { attacker, target, damages });
  }
}
