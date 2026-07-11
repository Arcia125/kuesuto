import { EVENTS } from '../events';
import { Capability, GameEntity, GameState, Interaction } from '../models';

export class Interactable implements Capability {
  public interaction: Interaction | null = null;
  public interacting = false;
  private isListening = false;
  private pendingOnComplete: ((gameState: GameState) => void) | null = null;
  // After a chat closes, don't re-trigger until the player has actually left the
  // trigger area — otherwise standing inside a lore zone reopens the chat every
  // frame and the player is stuck in a close/reopen loop.
  private rearmOnExit = false;
  private lastTouchStep = -1;
  public constructor(public entity: GameEntity, public interactions: Interaction[]) {

  }

  private getAvailableInteraction(gameState: GameState): Interaction | undefined {
    return this.interactions.find(i => !i.condition || i.condition(gameState));
  }

  public update = (gameState: GameState, _timeStamp: number) => {
    if (!this.isListening) {
      this.isListening = true;
      gameState.emitter.on(EVENTS.COLLISION, (_eventName, payload) => {
        if (payload.entities.includes(this.entity) && payload.entity.name === 'player') {
          this.lastTouchStep = gameState.time.stepID;
          if (!this.rearmOnExit) {
            this.interacting = true;
          }
        }
      });
      gameState.emitter.on(EVENTS.CLOSE_CHAT, () => {
        if (this.pendingOnComplete) {
          this.pendingOnComplete(gameState);
          this.pendingOnComplete = null;
        }
        if (this.interaction) {
          // This capability's chat just closed while the player may still be inside
          // the trigger: hold fire until they step out.
          this.rearmOnExit = true;
        }
        this.interaction = null;
        this.interacting = false;
      });
    }

    // Player has stopped touching the trigger (no collision for a few steps): rearm.
    if (this.rearmOnExit && gameState.time.stepID - this.lastTouchStep > 10) {
      this.rearmOnExit = false;
    }

    if (this.interacting) {
      if (this.interaction) {
      } else {
        const available = this.getAvailableInteraction(gameState);

        if (available && available.type === 'CHAT') {
          this.interaction = available;
          this.pendingOnComplete = available.onComplete || null;
          gameState.systems.chat.startChat(available.phrases);
        }
      }
    }
  }
};
