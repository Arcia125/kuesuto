import { getSpriteScale, Sprite, drawSprite } from './sprites';
import tileJSONRaw from './spriteJSON/kuesuto-tiles.json';
import { EventEmitter } from './events';
import { GameMap, GameMapState, GameState } from './models';

export class RenderableMap implements GameMap {
  public tiles;
  public constructor(public state: GameMapState, public emitter: EventEmitter) {
    this.tiles = new Sprite(tileJSONRaw, './kuesuto-tiles.png', emitter);
  }

  public render = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, _gameState: GameState) => {
    const gridWidth = canvas.width;
    const gridHeight = canvas.height;
    const gridCellSize = getSpriteScale(canvas);
    const grassFrame = tileJSONRaw.frames['Grass'];

    // for (let x = 0; x <= gridWidth; x += (gridCellSize * 0.9)) {
    //   for (let y = 0; y <= gridHeight; y += (gridCellSize * 0.9)) {
    for (let x = 0; x <= gridWidth; x += gridCellSize) {
      for (let y = 0; y <= gridHeight; y += gridCellSize) {
        drawSprite(
          ctx,
          canvas,
          this.tiles.spriteSheet,
          {
            spriteX: grassFrame.frame.x,
            spriteY: grassFrame.frame.y,
            spriteWidth: grassFrame.frame.w,
            spriteHeight: grassFrame.frame.h,
            canvasX: x,
            canvasY: y,
            canvasWidth: getSpriteScale(canvas) * this.state.scaleX,
            canvasHeight: getSpriteScale(canvas) * this.state.scaleY,
          }
        );
      }
    }
  };
}
