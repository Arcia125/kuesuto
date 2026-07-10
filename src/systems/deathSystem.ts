import { IDeathSystem, GameEntity, GameState } from '../models';
import { EventEmitter, EVENTS } from '../events';
import { RENDERING_SCALE } from '../constants';

export class DeathSystem implements IDeathSystem {
  public skipUpdate = ['init' as const, 'start' as const, 'paused' as const, 'menu' as const];
  private deaths: { duration: number; entity: GameEntity; }[] = [];
  // After the player dies, a short beat before the game-over screen so the death reads.
  private gameOverCountdown: number | null = null;

  public constructor(private emitter: EventEmitter) {
    emitter.on(EVENTS.DAMAGE, (_eventName, payload) => {
      if (this.checkDeath(payload.target)) {
        this.kill(payload.target, payload.attacker);
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
    if (entity.name === 'player') {
      // The player is never spliced out of gameState.entities (the camera and every
      // PlayerEntity.find depend on it) — they go to the game-over screen instead.
      // Red tint sells the corpse (the player sheet has no death animation).
      entity.state.tint = { r: 190, g: 30, b: 30, a: 0.55 };
      this.gameOverCountdown = 1500;
    } else {
      this.deaths.push({ duration: 4500, entity });
    }
  };

  public checkDeath = (entity: GameEntity) => {
    if (entity.status.immortal) return false;
    return entity.status.health <= 0;
  };

  // Bring the player back at the map's start location with full health, world and
  // narrative flags untouched. Called from the game-over screen.
  public respawnPlayer = (gameState: GameState) => {
    const player = gameState.entities.find(e => e.name === 'player');
    if (!player) return;
    player.status.dead = false;
    player.status.health = player.status.maxHealth;
    player.state.flashing = false;
    player.state.tint = undefined;
    const start = gameState.map.getObjectStartLocation('Player Start Location');
    if (start) {
      player.state.x = start.x * RENDERING_SCALE;
      player.state.y = start.y * RENDERING_SCALE;
    }
    gameState.systems.gameState.running();
  };

  public update = (gameState: GameState, _timeStamp: number) => {
    if (this.gameOverCountdown !== null) {
      this.gameOverCountdown -= gameState.time.delta;
      if (this.gameOverCountdown <= 0) {
        this.gameOverCountdown = null;
        gameState.systems.gameState.gameOver();
      }
    }
    for (let i = this.deaths.length - 1; i >= 0; i--) {
      const death = this.deaths[i];
      death.duration -= gameState.time.delta;
      if (death.duration <= 0) {
        const entityIndex = gameState.entities.findIndex(entity => entity.id === death.entity.id);
        if (entityIndex >= 0) gameState.entities.splice(entityIndex, 1);
        this.deaths.splice(i, 1);
      }
    }
  }
}
