import { EVENTS } from '../events';
import { Capability, GameEntity, GameState, Interaction } from '../models';

export class Interactable implements Capability {
  public interaction: Interaction | null = null;
  public interacting = false;
  private isListening = false;
  private pendingOnComplete: ((gameState: GameState) => void) | null = null;
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
          this.interacting = true;
        }
      });
      gameState.emitter.on(EVENTS.CLOSE_CHAT, () => {
        if (this.pendingOnComplete) {
          this.pendingOnComplete(gameState);
          this.pendingOnComplete = null;
        }
        this.interaction = null;
        this.interacting = false;
      });
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
