import { GameEntityState, GameEntity, SpriteJSON, ItemStats, GameState } from '../models';
import { EventEmitter, EventListener, EVENTS } from '../events';
import { Entity } from './entities';
import { getSpriteScale, Sprite } from '../sprites';

export class WeaponEntity extends Entity {
  // public stats: ItemStats = {
  //   damages: [
  //     {
  //       type: DAMAGE_TYPES.PHYSICAL,
  //       power: 0
  //     }
  //   ]
  // };

  private attackListener: EventListener<any> | null = null;

  public constructor(public state: GameEntityState, public name: string, public children: GameEntity[], emitter: EventEmitter, public stats: ItemStats, spriteJSONRAW?: SpriteJSON, spritePath?: string) {
    super(state, name, children, emitter);
    if (spriteJSONRAW && spritePath) {
      this.sprite = new Sprite(spriteJSONRAW as SpriteJSON, spritePath, emitter);
    }
    this.status.immortal = true;
  }

  public update = (gameState: GameState, _timeStamp: number) => {
    super.update(gameState, _timeStamp);
    if (this.parent) {
      this.state.xDir = this.parent.state.xDir;
      this.state.yDir = this.parent.state.yDir;
      const dir = this.parent.getDirection();
      switch (dir) {
        case 'up': {
          this.state.x = this.parent.state.x;
          this.state.y = this.parent.state.y - (getSpriteScale() * this.parent.state.scaleY);
          break;
        }
        case 'down': {
          this.state.x = this.parent.state.x;

          this.state.y = this.parent.state.y + (getSpriteScale() * this.parent.state.scaleY);
          break;
        }
        case 'right': {
          this.state.x = this.parent.state.x + (getSpriteScale() * this.parent.state.scaleX);
          this.state.y = this.parent.state.y;
          break;
        }
        case 'left': {
          this.state.x = this.parent.state.x - (getSpriteScale() * this.parent.state.scaleX);
          this.state.y = this.parent.state.y;
          break;
        }
      }
    }
    if (!this.attackListener) {
      const animationListener: EventListener<typeof EVENTS.ANIMATION_END> = (_name, payload) => {
        if (payload.entity === this) {
          gameState.controls.attack = false;
          this.state.attacking = false;
          this.state.visible = false;
        }
      };
      this.emitter.on(EVENTS.ANIMATION_END, animationListener);
      this.attackListener = animationListener;
    }
    if ((gameState.controls.attack || gameState.mobileControls.state.attack) && !this.state.attacking && gameState.systems.controlState.state === 'normal') {
      this.state.attacking = true;
      this.state.visible = true;
    }
  };
}
