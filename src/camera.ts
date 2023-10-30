import { Camera, GameEntity, GameState } from './models';

export class GameCamera implements Camera {
  public x: number = 0;
  public y: number = 0;
  public aspectRatio: number = 16 / 9;
  public canvasWidth: number = 0;
  public canvasHeight: number = 0;
  public following?: GameEntity | undefined;
  public constructor(public w: number, public h: number) {
    this.aspectRatio = w / h;
  }

  public follow(entity: GameEntity) {
    this.following = entity;
  }

  public update = (_gameState: GameState, _timeStamp: number) => {
    if (!this.following) {
      return;
    }
    // this.x = Math.max(this.following.state.x, 0 + this.w);
    // this.y = Math.max(this.following.state.y, 0 + this.y);
    // this.x = Math.max(this.following.state.x - (getSpriteScale(_gameState.elements.mainCanvas)) / 2, 0);
    // this.y = Math.max(this.following.state.y - (getSpriteScale(_gameState.elements.mainCanvas)) / 2, 0);
    // this.x = Math.max(this.following.state.x + (getSpriteScale(_gameState.elements.mainCanvas)) / 2, 0);
    // this.y = Math.max(this.following.state.y + (getSpriteScale(_gameState.elements.mainCanvas)) / 2, 0);
    this.x = Math.max(this.following.state.x, 0);
    this.y = Math.max(this.following.state.y, 0);
  }
}
