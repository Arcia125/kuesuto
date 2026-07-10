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

  private shakeUntil = 0;
  private shakeMagnitude = 0;

  public follow(entity: GameEntity) {
    this.following = entity;
  }

  // Screen shake: random camera offset that decays linearly until durationMs is up.
  public shake = (magnitude: number, durationMs: number) => {
    this.shakeUntil = performance.now() + durationMs;
    this.shakeMagnitude = magnitude;
  };

  public update = (gameState: GameState, _timeStamp: number) => {
    if (!this.following) {
      return;
    }
    const targetX = Math.max(this.following.state.x, 0);
    const targetY = Math.max(this.following.state.y, 0);
    // Ease toward the player (frame-rate independent). Big jumps (map transition,
    // teleport, respawn) snap instantly instead of gliding across the world.
    const snapDistance = this.w / 2;
    if (Math.abs(targetX - this.x) > snapDistance || Math.abs(targetY - this.y) > snapDistance) {
      this.x = targetX;
      this.y = targetY;
    } else {
      const alpha = 1 - Math.exp(-12 * (gameState.time.delta / 1000));
      this.x += (targetX - this.x) * alpha;
      this.y += (targetY - this.y) * alpha;
    }

    const now = performance.now();
    if (now < this.shakeUntil) {
      const falloff = (this.shakeUntil - now) / 200;
      const mag = this.shakeMagnitude * Math.min(1, falloff);
      this.x += (Math.random() * 2 - 1) * mag;
      this.y += (Math.random() * 2 - 1) * mag;
    }
  }
}
