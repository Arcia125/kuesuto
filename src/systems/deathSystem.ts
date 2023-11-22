import { IDeathSystem, GameEntity, GameState } from '../models';
import { EventEmitter, EVENTS } from '../events';

export class DeathSystem implements IDeathSystem {
  private deaths: { duration: number; entity: GameEntity; }[] = [];
  public constructor(private emitter: EventEmitter) {
    emitter.on(EVENTS.DAMAGE, (_eventName, payload) => {
      if (this.checkDeath(payload.target)) {
        this.kill(payload.target, payload.attacker);
        // emitter.emit(EVENTS.DEATH, {
        //   entity: payload.target,
        //   killer: payload.attacker,
        // })
      }
    });
  }

  public kill = (entity: GameEntity, killer: GameEntity | undefined) => {
    if (entity.status.immortal) {
      console.warn('You cannot kill an immortal');
      return;
    }
    if (entity.status.dead) {
      console.warn("Dead men can't die");
      return;
    }
    entity.status.health = 0;
    entity.status.dead = true;
    this.emitter.emit(EVENTS.DEATH, { entity, killer });
    this.deaths.push({ duration: 4500, entity });
    // const deadIndex = this.gameState.entities.findIndex(ent => ent.id === entity.id);
    // const killed = this.gameState.entities.splice(deadIndex, 1);
    // this.deadEntities.add(killed[0]);
  };

  public checkDeath = (entity: GameEntity) => {
    if (entity.status.immortal) return false;
    return entity.status.health <= 0;
  };

  public update = (gameState: GameState, _timeStamp: number) => {
    this.deaths.forEach((death, index) => {
      death.duration -= gameState.time.delta;
      if (death.duration <= 0) {
        const entityIndex = gameState.entities.findIndex(entity => entity.id === death.entity.id);
        gameState.entities.splice(entityIndex, 1);
        this.deaths.splice(index, 1);
      }
    });
  }
}
