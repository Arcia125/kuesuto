import { EventEmitter, EVENTS } from '../events';
import { GameEntity, GameEntityState, GameState, SpriteJSON } from '../models';
import { NPCEntity } from './npcEntity';
import darkWizardSpriteJSONRaw from '../data/spriteJSON/ks-dark-wizard.json';
import { PlayerEntity } from './playerEntity';

// An invisible gate. When the player overlaps it, it emits AREA_TRANSITION_START so
// the AreaTransitionSystem swaps maps. Mirrors InteractableZoneEntity: it reacts to
// the player's COLLISION event rather than moving itself. One-shot, though the
// transition also clears it by wiping non-player entities.
//
// Optionally story-locked: with `requiredFlag` set, the gate only fires once that
// narrative flag is set; until then a touch shows `lockedText` as a speech bubble on
// the player. The COLLISION listener only RECORDS the touch — the flag check needs
// gameState, which the event payload doesn't carry, so the decision happens in
// update().
export class TransitionTriggerEntity extends NPCEntity {
  public static NAME = 'transitionTrigger';
  // Wide gates are tiled with one trigger entity per 16px cell (see SpawnSystem), so
  // a blocked attempt must show ONE refusal bubble, not one per tile: the cooldown is
  // shared across all instances.
  private static nextRefusalAt = 0;
  private isListening = false;
  private triggered = false;
  private touchingPlayer: GameEntity | null = null;

  public constructor(
    public state: GameEntityState,
    public children: GameEntity[],
    public emitter: EventEmitter,
    private targetMap: string,
    private entryPoint: string,
    private requiredFlag?: string,
    private lockedText?: string,
  ) {
    super(state, TransitionTriggerEntity.NAME, children, emitter, darkWizardSpriteJSONRaw as unknown as SpriteJSON, './ks-dark-wizard.png');
    this.status.immortal = true;
    // A gate trigger, not a wall: the player walks into it, never bounces off it.
    this.status.nonBlocking = true;
  }

  public update(gameState: GameState, timeStamp: number) {
    if (!this.isListening) {
      this.isListening = true;
      this.emitter.on(EVENTS.COLLISION, (_eventName, payload) => {
        if (payload.entity.name !== PlayerEntity.NAME) return;
        if (!payload.entities.includes(this)) return;
        this.touchingPlayer = payload.entity;
      });
    }

    const player = this.touchingPlayer;
    this.touchingPlayer = null;
    if (!player || this.triggered) return;

    if (this.requiredFlag && !gameState.systems.narrativeFlags.hasFlag(this.requiredFlag)) {
      if (this.lockedText && timeStamp >= TransitionTriggerEntity.nextRefusalAt) {
        TransitionTriggerEntity.nextRefusalAt = timeStamp + 4000;
        gameState.systems.speech.say(player, this.lockedText, 3500);
      }
      return;
    }

    this.triggered = true;
    this.emitter.emit(EVENTS.AREA_TRANSITION_START, {
      targetMap: this.targetMap,
      entryPoint: this.entryPoint,
    });
  }
}
