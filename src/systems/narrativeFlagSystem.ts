import { INarrativeFlagSystem, GameState, NarrativeFlagValue } from '../models';
import { EventEmitter, EVENTS } from '../events';
import { CorruptedSlimeEntity } from '../entities/corruptedSlimeEntity';

// Number of corrupted slimes the player must defeat (after meeting Morghal) for the
// investigation quest beat to complete.
export const CORRUPTED_KILLS_REQUIRED = 3;

export class NarrativeFlagSystem implements INarrativeFlagSystem {
  private flags = new Map<string, NarrativeFlagValue>();

  public constructor(private emitter: EventEmitter) {
    emitter.on(EVENTS.DEATH, (_eventName, payload) => {
      if (payload.entity.name !== CorruptedSlimeEntity.NAME) return;
      if (this.hasFlag('corruption_investigated')) return;
      // Count every corrupted-slime kill, even before Morghal tasks the player. There
      // are only a few corrupted slimes on the map and they do not respawn, so gating
      // the count on the intro flag used to soft-lock the quest for players who killed
      // them while exploring first. The kills now persist and the investigation beat
      // completes as soon as both conditions (kills + intro) are satisfied.
      const kills = this.getCorruptedKills() + 1;
      this.setFlag('corrupted_slimes_killed', kills);
      this.maybeCompleteInvestigation();
    });

    // If the player had already defeated enough corrupted slimes before meeting
    // Morghal, complete the investigation the moment the intro dialogue finishes.
    emitter.on(EVENTS.NARRATIVE_FLAG_SET, (_eventName, payload) => {
      if (payload.key === 'morghal_intro_complete') {
        this.maybeCompleteInvestigation();
      }
    });
  }

  private getCorruptedKills(): number {
    const value = this.flags.get('corrupted_slimes_killed');
    return typeof value === 'number' ? value : 0;
  }

  private maybeCompleteInvestigation(): void {
    if (this.hasFlag('corruption_investigated')) return;
    if (!this.hasFlag('morghal_intro_complete')) return;
    if (this.getCorruptedKills() >= CORRUPTED_KILLS_REQUIRED) {
      this.setFlag('corruption_investigated', true);
    }
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

  public getAllFlags(): Record<string, NarrativeFlagValue> {
    return Object.fromEntries(this.flags);
  }

  public update(_gameState: GameState, _timeStamp: number): void {}
}
