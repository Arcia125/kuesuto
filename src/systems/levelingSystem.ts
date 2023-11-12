import { ILevelingSystem, GameEntity } from '../models';
import { EventEmitter, EVENTS } from '../events';

export class LevelingSystem implements ILevelingSystem {
  public constructor(private emitter: EventEmitter) {
    emitter.on(EVENTS.EXP_GAIN, (_eventName, payload) => {
      const initialLevel = payload.entity.status.level;
      const newLevel = this.calculateLevel(payload.entity);
      const levelsGained = newLevel - initialLevel;
      console.log(levelsGained);
      if (levelsGained > 0) {
        for (let i = 0; i < levelsGained; i++) {
          this.levelUp(payload.entity);
        }
      }
    });
  }

  private calculateLevel = (entity: GameEntity) => (entity.status.experience / 100) + 1;

  public levelUp = (entity: GameEntity) => {
    entity.status.level += 1;
    this.emitter.emit(EVENTS.LEVEL_UP, {
      entity,
    });
  };
}
