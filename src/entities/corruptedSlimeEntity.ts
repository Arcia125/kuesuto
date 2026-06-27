import { GameEntity, GameEntityState } from '../models';
import { EventEmitter } from '../events';
import { SlimeEntity } from './slimeEntity';

// A slime twisted by the forest's corruption. Visually marked by a dark tint;
// killing a few of these is what advances Morghal's quest (see NarrativeFlagSystem).
export class CorruptedSlimeEntity extends SlimeEntity {
  public static NAME = 'corrupted_slime';
  public constructor(public state: GameEntityState, public children: GameEntity[], public emitter: EventEmitter) {
    super(state, children, emitter);
    // SlimeEntity hardcodes the 'slime' name into the base entity; override it so
    // the spawn registry and death-tracking can identify this variant.
    this.name = CorruptedSlimeEntity.NAME;
    this.state.tint = { r: 130, g: 0, b: 160, a: 0.45 };
  }
}
