import { Camera } from './models';

export class GameCamera implements Camera {
  public aspectRatio: number = 16 / 9;
  public canvasWidth: number = 0;
  public canvasHeight: number = 0;
  public constructor(public w: number, public h: number) {
    this.aspectRatio = w / h;
  }
}
