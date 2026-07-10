import { EventEmitter, EVENTS } from '../events';
import { GameEntity, GameEntityState, GameState, SpriteJSON } from '../models';
import { NPCEntity } from './npcEntity';
import darkWizardSpriteJSONRaw from '../data/spriteJSON/ks-dark-wizard.json';
import { PlayerEntity } from './playerEntity';

// An invisible gate. When the player overlaps it, it emits AREA_TRANSITION_START so
// the AreaTransitionSystem swaps maps. Mirrors InteractableZoneEntity: it reacts to
// the player's COLLISION event rather than moving itself. One-shot, though the
// transition also clears it by wiping non-player entities.
export class TransitionTriggerEntity extends NPCEntity {
  public static NAME = 'transitionTrigger';
  private isListening = false;
  private triggered = false;

  public constructor(
    public state: GameEntityState,
    public children: GameEntity[],
    public emitter: EventEmitter,
    private targetMap: string,
    private entryPoint: string,
  ) {
    super(state, TransitionTriggerEntity.NAME, children, emitter, darkWizardSpriteJSONRaw as unknown as SpriteJSON, './ks-dark-wizard.png');
    this.status.immortal = true;
    // A gate trigger, not a wall: the player walks into it, never bounces off it.
    this.status.nonBlocking = true;
  }

  public update(_gameState: GameState, _timeStamp: number) {
    if (this.isListening) return;
    this.isListening = true;
    this.emitter.on(EVENTS.COLLISION, (_eventName, payload) => {
      if (this.triggered) return;
      if (payload.entity.name !== PlayerEntity.NAME) return;
      if (!payload.entities.includes(this)) return;
      this.triggered = true;
      this.emitter.emit(EVENTS.AREA_TRANSITION_START, {
        targetMap: this.targetMap,
        entryPoint: this.entryPoint,
      });
    });
  }
}
