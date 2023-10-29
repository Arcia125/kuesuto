import { GameState, GameEntity, Capability } from './../models';


export class Movement implements Capability {
  public constructor(public entity: GameEntity) { }

  public update = (gameState: GameState, _timeStamp: number) => {
    if (this.entity.state.moving) {
      const angle = Math.atan2(this.entity.state.yDir, this.entity.state.xDir);
      this.entity.state.x += (Math.cos(angle) * this.entity.state.speedX * gameState.time.delta);
      this.entity.state.y += (Math.sin(angle) * this.entity.state.speedY * gameState.time.delta);
    }
  }
}
