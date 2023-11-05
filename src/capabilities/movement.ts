import { Action } from '../action';
import { GameState, GameEntity, Capability } from './../models';


export class Movement implements Capability {
  public action?: Action;
  public constructor(public entity: GameEntity) { }

  public update = (gameState: GameState, _timeStamp: number) => {
    if (this.entity.status.dead) {
      return;
    }
    const initialStateX = this.entity.state.x;
    const initialStateY = this.entity.state.y;
    this.action = new Action(() => {
      if (this.entity.state.moving) {
        const angle = Math.atan2(this.entity.state.yDir, this.entity.state.xDir);
        this.entity.state.x += (Math.cos(angle) * this.entity.state.speedX * gameState.time.delta);
        this.entity.state.y += (Math.sin(angle) * this.entity.state.speedY * gameState.time.delta);
      }
    }, () => {
      this.entity.state.x = initialStateX;
      this.entity.state.y = initialStateY;
    });

  }
}
