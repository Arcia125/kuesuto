import { EventEmitter } from '../events';
import { GameEntity, GameEntityState, GameState, Interaction, SpriteJSON } from '../models';
import { NPCEntity } from './npcEntity';
import darkWizardSpriteJSONRaw from '../data/spriteJSON/ks-dark-wizard.json';
import { Collision } from '../capabilities/collision';
import { Interactable } from '../capabilities/interactable';

// An invisible lore trigger: when the player walks into it, it starts a chat with
// the given phrases. Reuses the same Collision + Interactable pattern as NPCs; the
// chat fires off the player's COLLISION event, so the zone never has to move.
export class InteractableZoneEntity extends NPCEntity {
  public static NAME = 'interactableZone';
  public collisionCapability = new Collision(this);
  public interactableCapability: Interactable;

  public constructor(public state: GameEntityState, public children: GameEntity[], public emitter: EventEmitter, phrases: string[]) {
    super(state, InteractableZoneEntity.NAME, children, emitter, darkWizardSpriteJSONRaw as unknown as SpriteJSON, './ks-dark-wizard.png');
    const interactions: Interaction[] = [{ type: 'CHAT', phrases }];
    this.interactableCapability = new Interactable(this, interactions);
    // Never drawn and never killable (the sword can otherwise overlap it).
    this.status.immortal = true;
  }

  public update(gameState: GameState, timeStamp: number) {
    this.collisionCapability.update(gameState, timeStamp);
    this.interactableCapability.update(gameState, timeStamp);
  }
}
