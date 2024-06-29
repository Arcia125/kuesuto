import { IExperienceSystem, GameEntity } from '../models';
import { EventEmitter, EVENTS } from '../events';

export class ExperienceSystem implements IExperienceSystem {
  public skipUpdate = ['init' as const, 'start' as const, 'paused' as const, 'menu' as const];
  public constructor(private emitter: EventEmitter) {
    emitter.on(EVENTS.DEATH, (_eventName, payload) => {
      if (payload.killer) {
        this.grantExpForKill(payload.killer, payload.entity);
      }
    });
  }

  private grantExpForKill = (killer: GameEntity, victim: GameEntity) => {
    const amount = this.calculateExpGain(killer, victim);
    this.grantExp(killer, amount);
  };

  /**
   * TODO: Calculate based on enemy killed
   */
  private calculateExpGain = (_killer: GameEntity, _victim: GameEntity) => {
    return 100;
  };

  public grantExp = (entity: GameEntity, experience: number) => {
    entity.status.experience += experience;
    this.emitter.emit(EVENTS.EXP_GAIN, {
      entity,
      experience: experience
    });
  };
}
