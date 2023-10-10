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
  }: {
    /** x position on the canvas */
    canvasX: number,
    /** y Position on the canvas */
    canvasY: number,
    canvasWidth: number,
    canvasHeight: number,
    /** x Position on the spritesheet */
    spriteX: number,
    /** y Position on the spritesheet */
    spriteY: number,
    /** width of the sprite on the spritesheet */
    spriteWidth: number,
    /** height of the sprite on the spritesheet */
    spriteHeight: number
  }) => {
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(spriteSheet, spriteX, spriteY, spriteWidth, spriteHeight, canvasX, canvasY, canvasWidth, canvasHeight);
};

const getSpriteXFromLastFrameTimeMS = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  gameState: GameState,
  spriteFrameSize: number
) => {
  const animationSpeed = .005;
  const animationBasis = gameState.time.lastFrameTimeMs;
  const movingMultiplier = 2;
  const playerSpriteX = 0 + Math.floor((animationBasis * (animationSpeed * (gameState.player.moving ? movingMultiplier : 1))) % 4) * spriteFrameSize;
  return playerSpriteX;
};

const getSpriteXFromDelta = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  gameState: GameState,
  spriteFrameSize: number
) => {
  const animationSpeed = 5;
  const animationBasis = gameState.time.delta;
  const movingMultiplier = 4;
  const playerSpriteX = 0 + Math.floor((animationBasis * (animationSpeed * (gameState.player.moving ? movingMultiplier : 1))) % 4) * spriteFrameSize;
  return playerSpriteX;
};

const getSpriteXFromFrameId = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  gameState: GameState,
  spriteFrameSize: number
) => {
  const animationSpeed = .1;
  const animationBasis = gameState.time.frameID;
  const movingMultiplier = 3;
  const playerSpriteX = 0 + Math.floor((animationBasis * (animationSpeed * (gameState.player.moving ? movingMultiplier : 1))) % 4) * spriteFrameSize;
  return playerSpriteX;
};

let lastAnimationTime = performance.now();
const getSpriteXFromFrameIdSimple = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  gameState: GameState,
  spriteFrameSize: number
) => {
  const staggerFrames = 15;
  const position = Math.floor(gameState.time.frameID / staggerFrames) % 3;
  const prevAnimationTime = lastAnimationTime;
  lastAnimationTime = performance.now()
  console.log(prevAnimationTime - lastAnimationTime);
  const frameX = spriteFrameSize * position;
  return frameX;
};

const drawPlayerSprite = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  gameState: GameState
) => {
  const spriteFrameSize = 32;


  // const playerSpriteX = getSpriteXFromLastFrameTimeMS(ctx, canvas, gameState, spriteFrameSize);
  // const playerSpriteX = getSpriteXFromDelta(ctx, canvas, gameState, spriteFrameSize);
  // const playerSpriteX = getSpriteXFromFrameId(ctx, canvas, gameState, spriteFrameSize);
  const playerSpriteX = getSpriteXFromFrameIdSimple(ctx, canvas, gameState, spriteFrameSize);


  const spriteMovingOffsetY = ((4 * +gameState.player.moving) * spriteFrameSize);
  const facingUp = gameState.player.yDir < 0;
  const facingDown = gameState.player.yDir > 0;
  const facingSide = gameState.player.xDir !== 0;
  const spriteDirOffsetY = 0 + (facingDown ?
    0 : (facingUp ?
      spriteFrameSize * 3 : facingSide ?
        gameState.player.xDir > 0 ?
          spriteFrameSize * 2 : spriteFrameSize : 0));
  const playerSpriteY = 0 + spriteMovingOffsetY + spriteDirOffsetY;

  const canvasX = gameState.player.x;
  const canvasY = gameState.player.y;

  drawSprite(ctx, canvas, playerSpritesheet, {
    canvasX,
    canvasY,
    canvasWidth: (canvas.width / 50) * 4,
    canvasHeight: (canvas.width / 50) * 4,
    spriteX: playerSpriteX,
    spriteY: playerSpriteY,
    spriteWidth: spriteFrameSize,
    spriteHeight: spriteFrameSize,
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


