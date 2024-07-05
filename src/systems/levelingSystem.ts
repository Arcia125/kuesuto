import { ILevelingSystem, GameEntity } from '../models';
import { EventEmitter, EVENTS } from '../events';

export class LevelingSystem implements ILevelingSystem {
  public skipUpdate = ['init' as const, 'start' as const, 'paused' as const, 'menu' as const];
  public constructor(private emitter: EventEmitter) {
    emitter.on(EVENTS.EXP_GAIN, (_eventName, payload) => {
      const initialLevel = payload.entity.status.level;
      const newLevel = this.calculateLevel(payload.entity);
      const levelsGained = newLevel - initialLevel;
      if (levelsGained > 0) {
        for (let i = 0; i < levelsGained; i++) {
          this.levelUp(payload.entity);
        }
      }
    });
  }

  // private calculateLevel = (entity: GameEntity) => Math.max(Math.floor(entity.status.experience / (100 * entity.status.level)), 1);

  // public calculateXPToNextLevel = (entity: GameEntity) => {
  //   return ((100 * (entity.status.level)) - entity.status.experience);
  // };

  private calculateLevel = (entity: GameEntity) => Math.max(0.07 * Math.sqrt(entity.status.experience), 1);

  private calculateXPForLevel = (level: number) => Math.pow(level / 0.07, 2);

  public calculateXPToNextLevel = (entity: GameEntity) => {
    // return ((100 * (entity.status.level)) - entity.status.experience);
    return this.calculateXPForLevel(entity.status.level) - (entity.status.experience - this.calculateXPForLevel(entity.status.level - 1));
  };

  public levelUp = (entity: GameEntity) => {
    entity.status.level += 1;
    this.emitter.emit(EVENTS.LEVEL_UP, {
      entity,
    });
  };
}
