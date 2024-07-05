import { ILevelingSystem, GameEntity } from '../models';
import { EventEmitter, EVENTS } from '../events';

export class LevelingSystem implements ILevelingSystem {
  public skipUpdate = ['init' as const, 'start' as const, 'paused' as const, 'menu' as const];
  /**
 * The amount of XP required to level up
 */
  public x = 0.07;
  /**
   * The rate at which the xp per level increases
   */
  public y = 2;

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

  private calculateLevel = (entity: GameEntity) => Math.max(this.x * Math.pow(entity.status.experience, 1 / this.y), 1);

  private calculateXPForLevel = (level: number) => Math.pow(level / this.x, this.y);

  public calculateXPToNextLevel = (entity: GameEntity) => {
    return this.calculateXPForLevel(entity.status.level) - (entity.status.experience - this.calculateXPForLevel(entity.status.level - 1));
  };

  public levelUp = (entity: GameEntity) => {
    entity.status.level += 1;
    this.emitter.emit(EVENTS.LEVEL_UP, {
      entity,
    });
  };
}
