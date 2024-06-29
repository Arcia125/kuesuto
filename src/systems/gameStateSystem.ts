import { IGameStateSystem, GameState } from '../models';
import { EventEmitter, EVENTS } from '../events';

export class GameStateSystem implements IGameStateSystem {
  public state = 'init' as IGameStateSystem['state'];
  public constructor(private emitter: EventEmitter) { }

  public update(_gameState: GameState, _timeStamp: number) {
    if (this.state === 'init') {
      this.start();
    }
  }

  public changeState(state: IGameStateSystem['state']) {
    this.state = state;
    this.emitter.emit(EVENTS.GAME_STATE, { state });
  }

  public init() {
    this.changeState('init');
  }

  public start() {
    this.changeState('start');
  }

  public running() {
    this.changeState('running');
  }


  public paused() {
    this.changeState('paused');
  }

  public gameOver() {
    this.changeState('gameOver');
  }

  public menu() {
    this.changeState('menu');
  }

  public inStates(states: IGameStateSystem['state'][]) {
    return states.includes(this.state);
  }
}
