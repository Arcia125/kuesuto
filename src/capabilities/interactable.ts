import { EVENTS } from '../events';
import { Capability, GameEntity, GameState, Interaction } from '../models';

export class Interactable implements Capability {
  public interaction: Interaction | null = null;
  public interacting = false;
  private isListening = false;
  public constructor(public entity: GameEntity, public interactions: Interaction[]) {

  }

  public update = (gameState: GameState, _timeStamp: number) => {
    if (!this.isListening) {
      gameState.emitter.on(EVENTS.COLLISION, (_eventName, payload) => {
        if (payload.entities.includes(this.entity) && payload.entity.name === 'player') {
          this.interacting = true;
        }
      });
    }

    if (this.interacting) {
      if (this.interaction) {
      } else {
        this.interaction = this.interactions[0];

        if (this.interaction && this.interaction.type === 'CHAT') {
          gameState.systems.chat.startChat(this.interaction.phrases);
        }
      }
    }
  }
};
