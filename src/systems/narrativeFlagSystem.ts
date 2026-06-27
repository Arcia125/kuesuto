import { INarrativeFlagSystem, GameState, NarrativeFlagValue } from '../models';
import { EventEmitter, EVENTS } from '../events';
import { CorruptedSlimeEntity } from '../entities/corruptedSlimeEntity';

// Number of corrupted slimes the player must defeat (after meeting Morghal) for the
// investigation quest beat to complete.
const CORRUPTED_KILLS_REQUIRED = 3;

export class NarrativeFlagSystem implements INarrativeFlagSystem {
  private flags = new Map<string, NarrativeFlagValue>();
  private corruptedKills = 0;

  public constructor(private emitter: EventEmitter) {
    emitter.on(EVENTS.DEATH, (_eventName, payload) => {
      if (payload.entity.name !== CorruptedSlimeEntity.NAME) return;
      // Only count once the player has been tasked by Morghal, and stop once done.
      if (!this.hasFlag('morghal_intro_complete')) return;
      if (this.hasFlag('corruption_investigated')) return;
      this.corruptedKills++;
      if (this.corruptedKills >= CORRUPTED_KILLS_REQUIRED) {
        this.setFlag('corruption_investigated', true);
      }
    });
  }

  public getFlag(key: string): NarrativeFlagValue | undefined {
    return this.flags.get(key);
  }

  public setFlag(key: string, value: NarrativeFlagValue): void {
    const previousValue = this.flags.get(key);
    this.flags.set(key, value);
    this.emitter.emit(EVENTS.NARRATIVE_FLAG_SET, { key, value, previousValue });
  }

  public hasFlag(key: string): boolean {
    return !!this.flags.get(key);
  }

  public update(_gameState: GameState, _timeStamp: number): void {}
}
