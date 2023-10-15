import { GameState } from './models';
import playerSpriteJSON from './player.json';

const getImage = (callback: () => void, src: string) => {
  const image = new Image();
  image.onload = callback;

  image.src = src;
  return image;
};


const playerSpritesheet = getImage(() => console.log('loaded player'), './player.png');

const parseFrameData = (rawData: any) => {
  const dataItems = rawData.split(' ');
  const data = dataItems.reduce((dataAcc: Record<string, any>, dataItem: string) => {
    const [dataKey, dataValue] = dataItem.split('=');
    if (['true', 'false'].includes(dataValue)) {
      dataAcc[dataKey] = dataValue === 'true';
    } else {
      dataAcc[dataKey] = dataValue;
    }
    return dataAcc;
  }, {} as Record<string, any>);
  return data;
};

const playerSpriteFrames = Object.entries(playerSpriteJSON.frames).reduce((acc, [frameName, frameValue], frameIndex) =>  {
  const [animationName, animationFrame] = frameName.split('--');

  if (acc[animationName]) {
    acc[animationName].frames.push(frameValue);
  } else {
    const rawData = playerSpriteJSON.meta.frameTags.find(({ name }: { name: string }) => animationName === name).data;

    const data = parseFrameData(rawData);


    acc[animationName] = {
      frames: [frameValue],
      data
    };
  }
  return acc;
}, {} as Record<string, any>);

console.log(playerSpriteFrames);

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

// const getSpriteXFromLastFrameTimeMS = (
//   ctx: CanvasRenderingContext2D,
//   canvas: HTMLCanvasElement,
//   gameState: GameState,
//   spriteFrameSize: number
// ) => {
//   const animationSpeed = .005;
//   const animationBasis = gameState.time.lastFrameTimeMs;
//   const movingMultiplier = 2;
//   const playerSpriteX = 0 + Math.floor((animationBasis * (animationSpeed * (gameState.player.moving ? movingMultiplier : 1))) % 4) * spriteFrameSize;
//   return playerSpriteX;
// };

// const getSpriteXFromDelta = (
//   ctx: CanvasRenderingContext2D,
//   canvas: HTMLCanvasElement,
//   gameState: GameState,
//   spriteFrameSize: number
// ) => {
//   const animationSpeed = 5;
//   const animationBasis = gameState.time.delta;
//   const movingMultiplier = 4;
//   const playerSpriteX = 0 + Math.floor((animationBasis * (animationSpeed * (gameState.player.moving ? movingMultiplier : 1))) % 4) * spriteFrameSize;
//   return playerSpriteX;
// };

// const getSpriteXFromFrameId = (
//   ctx: CanvasRenderingContext2D,
//   canvas: HTMLCanvasElement,
//   gameState: GameState,
//   spriteFrameSize: number
// ) => {
//   const animationSpeed = .1;
//   const animationBasis = gameState.time.frameID;
//   const movingMultiplier = 3;
//   const playerSpriteX = 0 + Math.floor((animationBasis * (animationSpeed * (gameState.player.moving ? movingMultiplier : 1))) % 4) * spriteFrameSize;
//   return playerSpriteX;
// };

const getSpriteColumnOld = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  gameState: GameState,
) => {
  const staggerFrames = 15;
  const column = Math.floor(gameState.time.frameID / staggerFrames) % 5;
  return column;
};

const getSpriteRowOld = (gameState: GameState) => {

  // const spriteMovingOffsetY = ((4 * +gameState.player.moving) * spriteFrameSize);
  const facingUp = gameState.player.yDir < 0;
  const facingDown = gameState.player.yDir > 0;
  const facingRight = gameState.player.xDir < 0;
  const facingLeft = gameState.player.xDir > 0;
  const downRowMultiple = 0;
  const leftRowMultiple = 1;
  const rightRowMultiple = 2;
  const upRowMultiple = 3;
  const movingRowMultiple = 4;
  let row;
  switch (true) {
    case facingUp:
      row = upRowMultiple;
      break
    case facingDown:
      row = downRowMultiple;
      break
    case facingLeft:
      row = leftRowMultiple;
      break
    case facingRight:
      row = rightRowMultiple;
      break
    default:
      row = 0;
      break;
  }
  if (gameState.player.moving) {
    row += movingRowMultiple
  }
  // const spriteDirOffsetY =
  //   facingDown ? downRowMultiple :
  //     facingUp ? spriteFrameSize * upRowMultiple :
  //       facingSide && facingRight ? spriteFrameSize * rightRowMultiple :
  //         facingSide ? spriteFrameSize : 0;
  return row;
};

// const getSpriteColumn = (
//   ctx: CanvasRenderingContext2D,
//   canvas: HTMLCanvasElement,
//   gameState: GameState,
// ) => {
//   const staggerFrames = 5;
//   const column = Math.floor(gameState.time.frameID / staggerFrames) % 5;
//   return column;
// };

const getSpritePos = (gameState: GameState, direction: 'up' | 'down' | 'left' | 'right') => {

  // const spriteMovingOffsetY = ((4 * +gameState.player.moving) * spriteFrameSize);

  // const downRowMultiple = 0;
  // const leftRowMultiple = 1;
  // const rightRowMultiple = 2;
  // const upRowMultiple = 3;
  // const movingRowMultiple = 4;

  // let row;
  // if (facingUp && gameState.player.moving) {
  //   if (gameState.player.moving) {
  //     row = playerSpriteFrames['Walk Up'][0].frame.y;
  //   } else {
  //     row = playerSpriteFrames['Bounce Up'][0].frame.y;
  //   }
  // } else if (facingUp) {
  //   row = playerSpriteFrames['Bounce Up'][0].frame.y;
  // } else if (facingRight && gameState.player.moving) {
  //   row = playerSpriteFrames['Walk Right'][0].frame.y;
  // } else if (facingRight) {

  // }

  const spriteFrameEntry = Object.entries(playerSpriteFrames).find(([frameName, frameValue]) => {
    return frameValue.data.movement === gameState.player.moving && frameValue.data.direction === direction;
  });
  if (!spriteFrameEntry) {
    throw new Error('Failed to load sprite sheet');
  }

  const [spriteFrameName, spriteFrameValue] = spriteFrameEntry;


  // const spriteFrameValue = spriteFrameEntry?.[1];
  let y = spriteFrameValue.frames[0].frame.y;

  const staggerFrames = 5;
  const frameXIndex = Math.floor(gameState.time.frameID / staggerFrames) % spriteFrameValue.frames.length;
  const x = spriteFrameValue.frames[frameXIndex]?.frame.x;

  if (frameXIndex === (spriteFrameValue.frames.length - 1)) {
    gameState.player.lastAnimationName = spriteFrameName;
    console.log({ lastAnim: gameState.player.lastAnimationName, frameXIndex, len: spriteFrameValue.frames.length });
  }



  if (frameXIndex === 0 && gameState.player.lastAnimationName === spriteFrameName) {
    // the animation just happened...
  }

  // gameState.player.


  // console.log(row, direction);


  // frameValue.frames[0].frame.y;

  // let row;
  // switch (true) {
  //   case facingUp:
  //     // row = upRowMultiple;
  //     break
  //   case facingDown:
  //     // row = downRowMultiple;
  //     break
  //   case facingLeft:
  //     // row = leftRowMultiple;
  //     break
  //   case facingRight:
  //     // row = rightRowMultiple;
  //     break
  //   default:
  //     row = 0;
  //     break;
  // }
  // if (gameState.player.moving) {
  //   // row += movingRowMultiple
  // }
  // const spriteDirOffsetY =
  //   facingDown ? downRowMultiple :
  //     facingUp ? spriteFrameSize * upRowMultiple :
  //       facingSide && facingRight ? spriteFrameSize * rightRowMultiple :
  //         facingSide ? spriteFrameSize : 0;
  return { x, y };
};


const drawPlayerSprite = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  gameState: GameState
) => {
  const spriteFrameSize = gameState.player.spriteSize;


  // const playerSpriteX = getSpriteXFromLastFrameTimeMS(ctx, canvas, gameState, spriteFrameSize);
  // const playerSpriteX = getSpriteXFromDelta(ctx, canvas, gameState, spriteFrameSize);
  // const playerSpriteX = getSpriteXFromFrameId(ctx, canvas, gameState, spriteFrameSize);
  // const playerSpriteX = getSpriteColumn(ctx, canvas, gameState) * spriteFrameSize;
  // const playerSpriteY = getSpriteRow(gameState) * spriteFrameSize;
  const facingUp = gameState.player.yDir < 0;
  const facingDown = gameState.player.yDir > 0;
  const facingRight = gameState.player.xDir > 0;
  const facingLeft = gameState.player.xDir < 0;

  const direction = facingUp ? 'up' :
    facingDown ? 'down' :
      facingRight ? 'right' :
        facingLeft ? 'left' : 'down';
  // const playerSpriteX = getSpriteColumn(ctx, canvas, gameState) * spriteFrameSize;
  const { x: playerSpriteX, y: playerSpriteY } = getSpritePos(gameState, direction);


  const canvasX = gameState.player.x;
  const canvasY = gameState.player.y;

  drawSprite(ctx, canvas, playerSpritesheet, {
    canvasX,
    canvasY,
    canvasWidth: (canvas.width / 50) * 2,
    canvasHeight: (canvas.width / 50) * 2,
    spriteX: playerSpriteX,
    spriteY: playerSpriteY,
    spriteWidth: spriteFrameSize,
    spriteHeight: spriteFrameSize,
  });


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
    ctx.rect(spriteOffset + (playerSpriteX * sheetScale), spriteOffset + (playerSpriteY * sheetScale), spriteFrameSize * sheetScale, spriteFrameSize * sheetScale);
    ctx.stroke();
    ctx.lineWidth = tempLineWidth;
    ctx.closePath();
  }
};

export const render = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, gameState: GameState) => {
  resetContext(ctx, canvas, "#fff");
  drawGrid(ctx, canvas, 0, "#000");

  drawPlayerSprite(ctx, canvas, gameState);

  // const gameStateContainer = document.querySelector("#game-state");
  if (gameState.settings.debugGameState && gameState.elements.gameStateContainer) {
    gameState.elements.gameStateContainer.innerHTML = JSON.stringify(gameState, null, 2);
  }
}


