import { EventEmitter, EVENTS } from '../events';
import { GameState, IStartMenuSystem } from '../models';

export class StartMenuSystem implements IStartMenuSystem {
  public skipUpdate = ['init' as const, 'paused' as const, 'menu' as const, 'gameOver' as const];
  public constructor(emitter: EventEmitter) {
    emitter.emit(EVENTS.START_MENU_OPEN, {});
  }

  public update(gameState: GameState, _timeStamp: number) {
    if (gameState.systems.gameState.state === 'start') {
      if (gameState.controls.attack || gameState.mobileControls.state.attack) {
        gameState.systems.gameState.running();
      }
    }
  }
}
