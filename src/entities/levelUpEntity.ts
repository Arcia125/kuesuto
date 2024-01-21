import levelUpAnimationJSON from '../data/spriteJSON/ks-level-up-animation.json';
import { SpriteJSON, GameEntityState, GameState } from '../models';
import { EventEmitter, EVENTS } from '../events';
import { Sprite } from '../sprites';
import { Entity } from './entities';

export class LevelUpEntity extends Entity {
  public static NAME = 'levelUp';
  public listening = false;
  public constructor(state: GameEntityState, emitter: EventEmitter) {
    super(state, LevelUpEntity.NAME, [], emitter)
    this.sprite = new Sprite(levelUpAnimationJSON as SpriteJSON, './ks-level-up-animation.png', emitter);
    this.status.immortal = true;
  }

  public update = (_gameState: GameState) => {
    if (!this.parent) return;
    if (!this.listening) {
      this.emitter.on(EVENTS.LEVEL_UP, (_eventName, payload) => {
        if (payload.entity.id === this.parent?.id) {
          // TODO multiple animations when leveling up?
          this.state.visible = true;
        }
      });
      this.emitter.on(EVENTS.ANIMATION_END, (_eventName, payload) => {
        if (payload.entity.id === this.id) {
          if (this.state.visible) {
            this.state.visible = false;
          }
        }
      });
      this.listening = true;
    }
    this.state.x = this.parent.state.x;
    this.state.y = this.parent.state.y;
  };
}
