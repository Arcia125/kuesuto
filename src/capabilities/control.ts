import { GameEntity, GameState, Capability } from './../models';

export class Control implements Capability {
  public constructor(public entity: GameEntity) { }

  public update = (gameState: GameState, _timeStamp: number) => {
    let moving = false;
    let yDir = this.entity.state.yDir;
    let xDir = this.entity.state.xDir;
    let movedX = false;
    let movedY = false;

    if (gameState.systems.controlState.state === 'normal') {

      if (gameState.controls.up || gameState.mobileControls.state.yMove < -10) {
        yDir = -1;
        moving = true;
        movedY = true;
      }
      if (gameState.controls.down || gameState.mobileControls.state.yMove > 10) {
        yDir = 1;
        moving = true;
        movedY = true;
      }
      if (gameState.controls.left || gameState.mobileControls.state.xMove < -10) {
        xDir = -1;
        moving = true;
        movedX = true;
      }
      if (gameState.controls.right || gameState.mobileControls.state.xMove > 10) {
        xDir = 1;
        moving = true;
        movedX = true;
      }

      this.entity.state.attacking = gameState.controls.attack || gameState.mobileControls.state.attack;

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
