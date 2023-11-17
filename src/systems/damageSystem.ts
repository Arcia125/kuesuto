import { WeaponEntity } from '../entities/weaponEntity';
import { EventEmitter, EVENTS, EVENT_MAPPING } from '../events';
import { Damage, GameEntity, GameState, IDamageSystem } from '../models';

export class DamageSystem implements IDamageSystem {
  private damageAnimations: { duration: number; entity: GameEntity; }[] = [];

  public static getDamages(entity: GameEntity): Damage[] {
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
    if (target.status.immortal) {
      return;
    }
    damages.forEach(damage => {
      target.status.health -= damage.power;
    });
    target.state.flashing = true;
    this.damageAnimations.push({ duration: 1000, entity: target });
    this.emitter.emit(EVENTS.DAMAGE, { attacker, target, damages });
  }

  public update = (gameState: GameState, _timestamp: number) => {
    for (let i = 0; i < this.damageAnimations.length; i++) {
      const damagedAnimation = this.damageAnimations[i];
      damagedAnimation.duration -= gameState.time.delta;
      if (damagedAnimation.duration <= 0) {
        damagedAnimation.entity.state.flashing = false;
        this.damageAnimations.splice(i, 1);
      }
    }
  };
}
