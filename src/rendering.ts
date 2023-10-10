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

const drawPlayerSprite = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  gameState: GameState
) => {
  const size = 32;
  const animationSpeed = 5;
  const playerSpriteX = 0 + Math.floor((gameState.time.delta * animationSpeed) % 4) * size;
  const spriteMovingOffsetY = ((4 * +gameState.player.moving) * size);
  const facingUp = gameState.player.yDir < 0;
  const facingDown = gameState.player.yDir > 0;
  const facingSide = gameState.player.xDir !== 0;
  const spriteDirOffsetY = 0 + (facingDown ? 0 : (facingUp ? size * 3 : facingSide ? gameState.player.xDir > 0 ? size * 2 : size : 0));
  const playerSpriteY = 0 + spriteMovingOffsetY + spriteDirOffsetY;

  const canvasX = gameState.player.x;
  const canvasY = gameState.player.y;

  drawSprite(ctx, canvas, playerSpritesheet, {
    canvasX,
    canvasY,
    canvasWidth: size * 4,
    canvasHeight: size * 4,
    spriteX: playerSpriteX,
    spriteY: playerSpriteY,
    spriteWidth: size,
    spriteHeight: size,
  });
};

export const render = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, gameState: GameState) => {
  resetContext(ctx, canvas, "#fff");
  drawGrid(ctx, canvas, 0, "#000");

  drawPlayerSprite(ctx, canvas, gameState);

  // const gameStateContainer = document.querySelector("#game-state");
  if (gameState.elements.gameStateContainer) {
    gameState.elements.gameStateContainer.innerHTML = JSON.stringify(gameState, null, 2);
  }
}


