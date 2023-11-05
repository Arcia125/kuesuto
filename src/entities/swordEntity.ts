import { DAMAGE_TYPES } from './../damage';
import { GameEntityState, GameState, GameEntity, SpriteJSON } from '../models';
import { getSpriteScale } from '../sprites';
import swordSpriteJSONRAW from '../data/spriteJSON/kuesuto-sword.json';
import { EventEmitter, EventListener, EVENTS } from '../events';
import { WeaponEntity } from './weaponEntity';


export class SwordEntity extends WeaponEntity {
  public static NAME = 'sword';
  private attackListener: EventListener<any> | null = null;
  public stats = {
    damages: [
      {
        type: DAMAGE_TYPES.PHYSICAL,
        power: 10
      }
    ]
  }
  public constructor(public state: GameEntityState, public children: GameEntity[], public emitter: EventEmitter) {
    super(state, SwordEntity.NAME, children, emitter, swordSpriteJSONRAW as SpriteJSON, './kuesuto-sword.png');
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
          this.state.y = this.parent.state.y - (getSpriteScale(gameState.elements.mainCanvas) * this.parent.state.scaleY);
          break;
        }
        case 'down': {
          this.state.x = this.parent.state.x;

          this.state.y = this.parent.state.y + (getSpriteScale(gameState.elements.mainCanvas) * this.parent.state.scaleY);
          break;
        }
        case 'right': {
          this.state.x = this.parent.state.x + (getSpriteScale(gameState.elements.mainCanvas) * this.parent.state.scaleX);
          this.state.y = this.parent.state.y;
          break;
        }
        case 'left': {
          this.state.x = this.parent.state.x - (getSpriteScale(gameState.elements.mainCanvas) * this.parent.state.scaleX);
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
    if (gameState.controls.attack && !this.state.attacking) {
      this.state.attacking = true;
      this.state.visible = true;
    }
  };
}
