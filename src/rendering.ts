import { GameState } from './models';

const getImage = (callback: () => void, src: string) => {
  const image = new Image();
  image.onload = callback;

  image.src = src;
  return image;
};

const playerSpritesheet = getImage(() => console.log('loaded player'), './player.png');

const resetContext = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, background: CanvasFillStrokeStyles['fillStyle']) => {
  ctx.beginPath();
  ctx.fillStyle = background;
  ctx.rect(0, 0, canvas.width, canvas.height);
  ctx.fill();
  ctx.closePath();
};

const drawGrid = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, padding: number, strokeStyle: CanvasFillStrokeStyles['strokeStyle']) => {
  const gridWidth = canvas.width;
  const gridHeight = canvas.height;
  const gridCellSize = gridWidth / 50;
  for (let x = 0; x <= gridWidth; x += gridCellSize) {
    ctx.moveTo(0.5 + x + padding, padding);
    ctx.lineTo(0.5 + x + padding, gridHeight + padding);
  }

  for (var x = 0; x <= gridHeight; x += gridCellSize) {
    ctx.moveTo(padding, 0.5 + x + padding);
    ctx.lineTo(gridWidth + padding, 0.5 + x + padding);
  }
  ctx.strokeStyle = strokeStyle;
  ctx.stroke();
};

const drawSprite = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  spriteSheet: HTMLImageElement,
  {
    canvasX,
    canvasY,
    canvasWidth,
    canvasHeight,
    spriteX,
    spriteY,
    spriteWidth,
    spriteHeight,
  }: { canvasX: number, canvasY: number, canvasWidth: number, canvasHeight: number, spriteX: number, spriteY: number, spriteWidth: number, spriteHeight: number }) => {
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(spriteSheet, spriteX, spriteY, spriteWidth, spriteHeight, canvasX, canvasY, canvasWidth, canvasHeight);
};

export const render = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, gameState: GameState) => {
  if (!ctx) {
    throw new Error('Missing canvas context');
  }

  const __render = () => {

    resetContext(ctx, canvas, "#fff");
    drawGrid(ctx, canvas, 0, "#000");

    drawSprite(ctx, canvas, playerSpritesheet, {
      canvasX: gameState.player.x,
      canvasY: gameState.player.y,
      canvasWidth: 24 * 4,
      canvasHeight: 24 * 4,
      spriteX: 0,
      spriteY: 0,
      spriteWidth: 24,
      spriteHeight: 24,
    })



    // mainCanvasContext.beginPath();
    // mainCanvasContext.fillStyle = '#ff0';
    // mainCanvasContext.rect(cursX - 10, cursY - 10, 20, 20);
    // mainCanvasContext.fill();
    // mainCanvasContext.closePath();
    window.requestAnimationFrame(__render)

  }


  __render();
};
