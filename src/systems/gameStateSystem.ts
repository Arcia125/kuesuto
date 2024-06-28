import { EventEmitter, EVENTS } from '../events';
import { GameState, IGameStateSystem } from '../models';


export class GameStateSystem implements IGameStateSystem {

  private openChatListener: null | (() => void) = null;
  private closeChatListener: null | (() => void) = null;
  public state = 'init' as IGameStateSystem['state'];

  public constructor(private emitter: EventEmitter) {
    this.init();
  }

  update(_gameState: GameState, _timeStamp: number) {
    console.log(this.state);
    if (this.state === 'init') {
      this.normal();
    }

    if (!this.openChatListener) {
      const listener = () => {
        this.chat();
      };

      this.emitter.on(EVENTS.OPEN_CHAT, listener);
      this.openChatListener = listener;
    }

    if (!this.closeChatListener) {
      const listener = () => {
        this.normal();
      };
      this.emitter.on(EVENTS.CLOSE_CHAT, listener);
      this.closeChatListener = listener;
    }
  }

  private changeState(state: IGameStateSystem['state']) {
    this.state = state;
    this.emitter.emit(EVENTS.GAMESTATE, { state });
  }

  init() {
    this.changeState('init');
  }

  chat() {
    this.changeState('chat');
  }

  normal() {
    this.changeState('normal');
  }

}
