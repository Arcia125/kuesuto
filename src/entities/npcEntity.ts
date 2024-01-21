import { EventEmitter } from '../events';
import { GameEntity } from '../models';
import { GameEntityState, SpriteJSON } from '../models';
import { Sprite } from '../sprites';
import { Entity } from './entities';

export class NPCEntity extends Entity {
  public static NAME = 'npc';

  public constructor(public state: GameEntityState, public name: string, public children: GameEntity[], public emitter: EventEmitter, public npcSpriteJSONRaw: SpriteJSON, public spriteSheetPath: string) {
    super(state, name || NPCEntity.NAME, children, emitter);
    this.sprite = new Sprite(npcSpriteJSONRaw, spriteSheetPath, emitter);
  }
}
