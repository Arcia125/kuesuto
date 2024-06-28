import { EventEmitter, EVENTS } from '../events';
import { GameState, IChatSystem } from '../models';

export class ChatSystem implements IChatSystem {

  public isOpen = false;
  public phraseIndex = 0;
  public phrases = [] as string[];
  private triggerUsed: boolean = false;

  public constructor(private emitter: EventEmitter) {
  }

  private setChat = (phraseIndex: number) => {

    console.log(this.phrases[phraseIndex]);
  };

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
    this.setChat(phraseIndex);
  };

  next = () => {
    const phraseIndex = this.phraseIndex + 1;
    if (phraseIndex < this.phrases.length) {
      this.phraseIndex = phraseIndex;
      this.emitter.emit(EVENTS.CHAT_NEXT, { phraseIndex });
      this.setChat(phraseIndex);
    } else {
      this.emitter.emit(EVENTS.CLOSE_CHAT, {});
      this.isOpen = false;
    }
  };

  update = (gameState: GameState, _timeStamp: number) => {

    if (gameState.controls.chatNext) {
      if (!this.triggerUsed) {

        this.triggerUsed = true;
        this.next();
      }

    } else {
      this.triggerUsed = false;
    }
  };
}
