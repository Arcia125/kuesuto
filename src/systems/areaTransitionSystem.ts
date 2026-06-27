import { IAreaTransitionSystem, GameState } from '../models';
import { EventEmitter, EVENTS } from '../events';
import { RENDERING_SCALE } from '../constants';
import { PlayerEntity } from '../entities/playerEntity';

// Handles moving the player between maps. AREA_TRANSITION_START arrives from a
// transition trigger; the actual swap is deferred to update() because it needs the
// live gameState (entities + map) that the event payload doesn't carry.
export class AreaTransitionSystem implements IAreaTransitionSystem {
  private pending: { targetMap: string; entryPoint: string } | null = null;

  public constructor(private emitter: EventEmitter) {
    emitter.on(EVENTS.AREA_TRANSITION_START, (_eventName, payload) => {
      this.pending = { targetMap: payload.targetMap, entryPoint: payload.entryPoint };
    });
  }

  public update(gameState: GameState, _timeStamp: number): void {
    if (!this.pending) return;
    const { targetMap, entryPoint } = this.pending;
    this.pending = null;

    gameState.map.setActiveMap(targetMap);

    // Clear everything except the player (and its children, which live on the player,
    // not in this top-level list). Splice in place so the game loop's array reference
    // stays valid.
    for (let i = gameState.entities.length - 1; i >= 0; i--) {
      if (gameState.entities[i].name !== PlayerEntity.NAME) {
        gameState.entities.splice(i, 1);
      }
    }

    // Drop the player at the destination's entry point.
    const player = gameState.entities.find(e => e.name === PlayerEntity.NAME);
    if (player) {
      const entry = gameState.map.getObjectStartLocation(entryPoint);
      player.state.x = entry.x * RENDERING_SCALE;
      player.state.y = entry.y * RENDERING_SCALE;
    }

    // SpawnSystem listens for this and repopulates the new map next frame.
    this.emitter.emit(EVENTS.AREA_TRANSITION_COMPLETE, { mapName: targetMap });
  }
}
