import { GameEntityState, GameEntity, SpriteJSON } from '../models';
import { Sprite } from '../sprites';
import { EventEmitter } from '../events';
import { Entity } from './entities';


export class SpriteEntity extends Entity {
  public constructor(public state: GameEntityState, public name: string, public children: GameEntity[], public emitter: EventEmitter, spriteJSON: SpriteJSON, imagePath: string) {
    super(state, name, children, emitter);
    this.sprite = new Sprite(spriteJSON, imagePath, emitter);
  }
}
