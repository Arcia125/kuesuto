import { EventEmitter, EVENTS } from '../events';
import { GameState, IChatSystem } from '../models';

export class ChatSystem implements IChatSystem {
  public skipUpdate = ['init' as const, 'start' as const, 'paused' as const, 'menu' as const];

  public isOpen = false;
  public phraseIndex = 0;
  public phrases = [] as string[];
  // Pagination state for the current phrase. pageCount is (re)computed by the
  // renderer, which is the only place that knows the font metrics and panel
  // height needed to work out how many wrapped lines fit on a page.
  public pageIndex = 0;
  public pageCount = 1;
  private triggerUsed: boolean = false;

  public constructor(private emitter: EventEmitter) {
  }

  public get phrase () {
    return this.phrases[this.phraseIndex];
  }

  public get hasNextPhrase() {
    return this.phraseIndex + 1 < this.phrases.length;
  }

  // Is there anything left to advance to — another page of this phrase, or
  // another phrase after it? Drives the "▼ press space" chevron.
  public get hasMore() {
    return this.pageIndex + 1 < this.pageCount || this.hasNextPhrase;
  }

  // Called by the renderer once it has wrapped the current phrase and knows how
  // many pages it spans. Clamps pageIndex so it never points past the last page.
  setPageCount = (count: number) => {
    this.pageCount = Math.max(1, count);
    if (this.pageIndex > this.pageCount - 1) {
      this.pageIndex = this.pageCount - 1;
    }
  };

  startChat(phrases: string[]) {
    const phraseIndex = 0;
    this.phraseIndex = phraseIndex;
    this.pageIndex = 0;
    this.pageCount = 1;
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
    // Page through the current phrase before moving on to the next one.
    if (this.pageIndex + 1 < this.pageCount) {
      this.pageIndex += 1;
      this.emitter.emit(EVENTS.CHAT_NEXT, { phraseIndex: this.phraseIndex, pageIndex: this.pageIndex });
      return;
    }
    const phraseIndex = this.phraseIndex + 1;
    if (phraseIndex < this.phrases.length) {
      this.phraseIndex = phraseIndex;
      this.pageIndex = 0;
      this.pageCount = 1; // recomputed by the renderer for the new phrase
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
