import { Updateable, GameEntity, GameState, Capability } from './../models';

export class Control implements Capability {
  public constructor(public entity: GameEntity) {}

  public update = (gameState: GameState, _timeStamp: number) => {
      let moving = false;
    let yDir = this.entity.state.yDir;
    let xDir = this.entity.state.xDir;
    let movedX = false;
    let movedY = false;
    if (gameState.controls.up) {
      yDir = -1;
      moving = true;
      movedY = true;
    }
    if (gameState.controls.down) {
      yDir = 1;
      moving = true;
      movedY = true;
    }
    if (gameState.controls.left) {
      xDir = -1;
      moving = true;
      movedX = true;
    }
    if (gameState.controls.right) {
      xDir = 1;
      moving = true;
      movedX = true;
    }

    this.entity.state.moving = moving;

    if (movedX && !movedY) {
      yDir = 0;
    } else if (movedY && !movedX) {
      xDir = 0;
    }
    this.entity.state.yDir = yDir;
    this.entity.state.xDir = xDir;
  }
}
