import { getImage } from './images';
import { GameState, SpriteJSON } from './models';
import playerSpriteJSONRAW from './player.json';
import { getSpriteFrames } from './sprites';

const playerSpriteJSON = playerSpriteJSONRAW as SpriteJSON;

const playerSpritesheet = getImage(() => console.log('loaded player'), './player.png');

const playerSpriteFrames = getSpriteFrames(playerSpriteJSON);

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

const getSpritePos = (gameState: GameState, direction: 'up' | 'down' | 'left' | 'right') => {
  let spriteFrameEntries;

  spriteFrameEntries = Object.entries(playerSpriteFrames).filter(([frameName, frameValue]) => {
    return frameValue.data.movement === gameState.player.moving && frameValue.data.direction === direction;
  });

  const [spriteFrameName, spriteFrameValue] = spriteFrameEntries.find(([name, value], i) => {
    if (!name) {
      throw new Error('Failed to load sprite sheet');
    }

    let found = null;
    if (gameState.player.currentAnimationName === name && gameState.player.animationToEnd && gameState.player.animationFrameX === 0) {
      gameState.player.lastAnimationName = name;
      gameState.emitter.emit(`player.animationEnd`, { name });
      gameState.player.animationToEnd = false;
      found = false;
    }
    if (gameState.player.lastAnimationName === name && spriteFrameEntries.length > 1) {
      found = false;
    }
    if (gameState.player.animationFrameX >= (value.frames.length - 1)) {
      gameState.player.animationToEnd = true;
      if (found !== false) {
        found = true;
      }
    } else {
      if (found !== false) {
        found = true;
      }
    }

    if (found) {
      const timeSinceLastFrame = gameState.time.lastFrameTimeMs - gameState.player.animationFrameXStart;

      if (gameState.player.animationFrameX >= value.frames.length) {
        gameState.player.animationFrameX = 0;
      }
      if (timeSinceLastFrame > value.frames[gameState.player.animationFrameX]?.duration) {
        gameState.player.animationFrameXStart = gameState.time.lastFrameTimeMs;
        gameState.player.animationFrameX++;

        if (gameState.player.animationFrameX >= value.frames.length) {
          gameState.player.animationFrameX = 0;
        }

      }
    }
    return found;

  }) || spriteFrameEntries[0];
  if (spriteFrameName === '') {
    throw new Error('Sprite frame name not found');
  }

  if (!spriteFrameValue) {
    throw new Error('Sprite frame value not found');
  }

  gameState.player.currentAnimationName = spriteFrameName;

  return spriteFrameValue.frames[gameState.player.animationFrameX];
};

const drawPlayerSprite = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  gameState: GameState
) => {
  const facingUp = gameState.player.yDir < 0;
  const facingDown = gameState.player.yDir > 0;
  const facingRight = gameState.player.xDir > 0;
  const facingLeft = gameState.player.xDir < 0;

  const direction = facingUp ? 'up' :
    facingDown ? 'down' :
      facingRight ? 'right' :
        facingLeft ? 'left' : 'down';
  const playerSpriteFrame = getSpritePos(gameState, direction);

  const spriteFrameWidth = playerSpriteFrame.spriteSourceSize.w;
  const spriteFrameHeight = playerSpriteFrame.spriteSourceSize.h;
  const playerSpriteX = playerSpriteFrame.frame.x;
  const playerSpriteY = playerSpriteFrame.frame.y;


  const canvasX = gameState.player.x;
  const canvasY = gameState.player.y;

  const spriteData = {
    canvasX,
    canvasY,
    canvasWidth: (canvas.width / 50) * 4,
    canvasHeight: (canvas.width / 50) * 4,
    spriteX: playerSpriteX,
    spriteY: playerSpriteY,
    spriteWidth: spriteFrameWidth,
    spriteHeight: spriteFrameHeight,
  };

  gameState.emitter.emit('renderSprite', { name: 'player', spriteData });

  drawSprite(ctx, canvas, playerSpritesheet, spriteData);


  if (gameState.settings.debugPlayerSpriteSheet) {
    const sheetScale = 4;
    const spriteOffset = 250;
    drawSprite(ctx, canvas, playerSpritesheet, {
      canvasX: spriteOffset,
      canvasY: spriteOffset,
      canvasWidth: playerSpritesheet.naturalWidth * sheetScale,
      canvasHeight: playerSpritesheet.naturalHeight * sheetScale,
      spriteX: 0,
      spriteY: 0,
      spriteWidth: playerSpritesheet.naturalWidth,
      spriteHeight: playerSpritesheet.naturalHeight,
    });

    ctx.beginPath();
    ctx.strokeStyle = 'teal';
    const tempLineWidth = ctx.lineWidth;
    ctx.lineWidth = 5;
    ctx.rect(spriteOffset + (playerSpriteX * sheetScale), spriteOffset + (playerSpriteY * sheetScale), spriteFrameWidth * sheetScale, spriteFrameHeight * sheetScale);
    ctx.stroke();
    ctx.lineWidth = tempLineWidth;
    ctx.closePath();
  }
};

export const render = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, gameState: GameState) => {
  gameState.emitter.emit('renderStart');

  resetContext(ctx, canvas, "#fff");
  drawGrid(ctx, canvas, 0, "#000");

  drawPlayerSprite(ctx, canvas, gameState);

  // const gameStateContainer = document.querySelector("#game-state");
  if (gameState.settings.debugGameState && gameState.elements.gameStateContainer) {
    gameState.elements.gameStateContainer.innerHTML = JSON.stringify(gameState, null, 2);
  }
  gameState.emitter.emit('renderEnd');
}


