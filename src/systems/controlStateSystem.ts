import { EventEmitter, EVENTS } from '../events';
import { GameState, IControlStateSystem } from '../models';


export class ControlStateSystem implements IControlStateSystem {

  private openChatListener: null | (() => void) = null;
  private closeChatListener: null | (() => void) = null;
  public state = 'init' as IControlStateSystem['state'];

  public constructor(private emitter: EventEmitter) {
    this.init();
    emitter.on(EVENTS.GAME_STATE, (_eventName, payload) => {
      switch (payload.state) {
        case 'init':
          this.init();
          break;
        case 'start':
        case 'menu':
          this.menu();
          break;
        default:
          this.normal();
          break;
      }
    });
  }

  update(_gameState: GameState, _timeStamp: number) {

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

  private changeState(state: IControlStateSystem['state']) {
    this.state = state;
    this.emitter.emit(EVENTS.CONTROL_STATE, { state });
  }

  init() {
    this.changeState('init');
  }

  menu() {
    this.changeState('menu');
  }

  chat() {
    this.changeState('chat');
  }

  normal() {
    this.changeState('normal');
  }

}
