import { GameEntity, GameState, ISpeechSystem, SpeechBubble } from '../models';

// Non-blocking dialogue: short lines that pop up over an entity's head and fade on
// their own. Unlike the chat system, these never freeze the player — they're for
// ambient commentary and flavor, not quest-critical text.
export class SpeechSystem implements ISpeechSystem {
  public bubbles: SpeechBubble[] = [];

  public say = (entity: GameEntity, text: string, durationMs = 4500) => {
    // One bubble per speaker: a new line replaces the previous one.
    this.bubbles = this.bubbles.filter(b => b.entity !== entity);
    this.bubbles.push({ entity, text, expiresAt: performance.now() + durationMs });
  };

  public update = (_gameState: GameState, timeStamp: number) => {
    this.bubbles = this.bubbles.filter(b => b.expiresAt > timeStamp && !b.entity.status.dead);
  };
}
