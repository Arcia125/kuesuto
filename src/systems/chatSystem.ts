import { EventEmitter, EVENTS } from '../events';
import { GameState, IChatSystem } from '../models';

export class ChatSystem implements IChatSystem {
  public skipUpdate = ['init' as const, 'start' as const, 'paused' as const, 'menu' as const];

  public isOpen = false;
  public phraseIndex = 0;
  public phrases = [] as string[];
  private triggerUsed: boolean = false;

  public constructor(private emitter: EventEmitter) {
  }

  public get phrase () {
    return this.phrases[this.phraseIndex];
  }

  public get hasNextPhrase() {
    return this.phraseIndex + 1 < this.phrases.length;
  }

  startChat(phrases: string[]) {
    const phraseIndex = 0;
    this.phraseIndex = phraseIndex;
    const message = phrases[phraseIndex];
    this.emitter.emit(EVENTS.CHAT, {
      message,
    });
    this.phrases = phrases;
    if (!this.isOpen) {
      this.emitter.emit(EVENTS.OPEN_CHAT, {});
      this.isOpen = true;
    }
  };

  next = () => {
    const phraseIndex = this.phraseIndex + 1;
    if (phraseIndex < this.phrases.length) {
      this.phraseIndex = phraseIndex;
      this.emitter.emit(EVENTS.CHAT_NEXT, { phraseIndex });
    } else {
      this.emitter.emit(EVENTS.CLOSE_CHAT, {});
      this.isOpen = false;
    }
  };

  update = (gameState: GameState, _timeStamp: number) => {

    if (gameState.controls.chatNext || gameState.mobileControls.state.chatNext) {
      if (!this.triggerUsed) {

        this.triggerUsed = true;
        this.next();
        gameState.controls.chatNext = false;
        gameState.mobileControls.state.chatNext = false;
      }

    } else {
      this.triggerUsed = false;
    }
  };
}
