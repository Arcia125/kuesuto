import { PlayerEntity } from "./entities/playerEntity";
import { EVENTS } from './events';
import { GameEntity, GameState, Rect } from './models';
import { worldToCamera } from './position';
import { getBoundingRect } from './rectangle';
import { drawSprite, getSpriteScale } from './sprites';


const resetContext = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, background: CanvasFillStrokeStyles['fillStyle']) => {
  ctx.beginPath();
  ctx.fillStyle = background;
  ctx.rect(0, 0, canvas.width, canvas.height);
  ctx.fill();
  ctx.closePath();
};

const drawStartMenu = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, _gameState: GameState) => {
  resetContext(ctx, canvas, "#265c42");
  const title = "Kuesuto";
  const text = "Press space to start";
  const textMetrics = ctx.measureText(title);
  const textWidth = Math.abs(textMetrics.width);
  const textX = (canvas.width - textWidth) / 2;
  const textY = canvas.height / 2 - 24;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "164px 'Press Start 2P'";
  ctx.fillStyle = "#fff";
  ctx.fillText(title, textX, textY);
  ctx.font = "32px 'Press Start 2P'";
  ctx.fillText(text, textX, textY + 100);
};

const drawGrid = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, padding: number, strokeStyle: CanvasFillStrokeStyles['strokeStyle'], gameState: GameState) => {
  const gridWidth = canvas.width;
  const gridHeight = canvas.height;
  const gridCellSize = Math.ceil(getSpriteScale());
  const cameraBox = getBoundingRect(gameState.camera, 'center');
  const cameraOffsetX = Math.max(cameraBox.left, 0);
  const cameraOffsetY = Math.max(cameraBox.top, 0);
  ctx.lineWidth = 5;
  for (let x = 0; x <= gridWidth; x += gridCellSize) {
    ctx.moveTo(0.5 + x + padding - cameraOffsetX % gridCellSize, padding);
    ctx.lineTo(0.5 + x + padding - cameraOffsetX % gridCellSize, gridHeight + padding);
  }

  for (let y = 0; y <= gridHeight; y += gridCellSize) {
    ctx.moveTo(padding, 0.5 + y + padding - cameraOffsetY % gridCellSize);
    ctx.lineTo(gridWidth + padding, 0.5 + y + padding - cameraOffsetY % gridCellSize);
  }
  ctx.strokeStyle = strokeStyle;
  ctx.stroke();
};

const getLines = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
  const words = text.split(" ");
  const lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + " " + word).width;
    if (width < maxWidth) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
}


const drawBar = (
  ctx: CanvasRenderingContext2D,
  _canvas: HTMLCanvasElement,
  _gameState: GameState,
  values: { min: number, max: number },
  rect: Rect,
  fillStyle: string,
  strokeStyle: string,
  circleRad: number = 30,
  textFillStyle: string = '#fff'
) => {

  ctx.beginPath();
  ctx.arc(rect.x, rect.y + rect.h / 2, circleRad, Math.PI * .2, Math.PI * 1.8);
  ctx.lineTo(rect.w, rect.y);
  ctx.lineTo(rect.w, rect.y + rect.h);
  ctx.closePath();
  ctx.strokeStyle = strokeStyle;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(rect.x, rect.y + rect.h / 2, circleRad, Math.PI * .2, Math.PI * 1.8);
  ctx.lineTo(rect.w * (Math.max(values.min, (circleRad) * .75) / values.max), rect.y);
  ctx.lineTo(rect.w * (Math.max(values.min, (circleRad) * .75) / values.max), rect.y + rect.h);
  ctx.closePath();

  ctx.fillStyle = fillStyle;
  ctx.fill();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = textFillStyle;
  ctx.font = '24px "Press Start 2P"';
  ctx.fillText(`${values.min}/${values.max}`, rect.x + rect.w / 2, rect.y + rect.h / 2);
};

const drawHUD = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, gameState: GameState) => {

  const gridWidth = canvas.width;
  const gridHeight = canvas.height;

  const player = gameState.entities.find(entity => entity.name === PlayerEntity.NAME);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // // Healthbar
  // ctx.fillStyle ='#a22633';
  // const xOffset = 20;
  // const yOffset = 20;
  // ctx.fillRect(xOffset, yOffset, (player!.status.health / player!.status.maxHealth) * (gridWidth / 5), (gridHeight / 20));
  // ctx.strokeStyle = '#000'
  // ctx.lineWidth = 6;
  // ctx.strokeRect(xOffset, yOffset, gridWidth / 5, gridHeight / 20);
  // ctx.fillStyle = '#fff';
  // ctx.font = '32px "Press Start 2P"';
  // ctx.fillText(`${player!.status.health} / ${player!.status.maxHealth}`, xOffset + gridWidth / 5 / 2, yOffset + gridHeight / 20 / 2);

  const yOffset = 20;

  const barRect = {
    x: 50,
    y: yOffset,
    w: gridWidth / 8,
    h: 35
  };
  drawBar(
    ctx,
    canvas,
    gameState,
    {
      min: player!.status.health,
      max: player!.status.maxHealth
    },
    barRect,
    '#a22633',
    '#000',
  );

  ctx.fillText(`${player?.status.level}`, barRect.x, barRect.y + barRect.h / 2);
  // drawBar(
  //   ctx,
  //   canvas,
  //   gameState,
  //   {
  //     min: player!.status.experience,
  //     max: (gameState.systems.leveling.calculateXPToNextLevel(player!) + player!.status.experience)
  //   },
  //   {
  //     x: 50,
  //     y: 100,
  //     w: gridWidth / 8,
  //     h: 25
  //   },
  //   '#2ce8f5',
  //   '#000',
  //   20
  // );

  // XP Bar
  ctx.fillStyle ='#68386c';
  const xOffset2 = 86;
  const yOffset2 = yOffset + 48;
  ctx.fillRect(xOffset2, yOffset2, (player!.status.experience / (gameState.systems.leveling.calculateXPToNextLevel(player!) + player!.status.experience)) * (gridWidth / 12), (gridHeight / 48));
  ctx.strokeStyle = '#000'
  ctx.lineWidth = 3;
  ctx.strokeRect(xOffset2, yOffset2, gridWidth / 12, gridHeight / 48);
  ctx.fillStyle = '#fff';
  ctx.font = '16px "Press Start 2P"';
  ctx.textAlign = "center";
  ctx. textBaseline = "middle";
  ctx.fillText(`${player!.status.experience} / ${Math.floor((gameState.systems.leveling.calculateXPToNextLevel(player!) + player!.status.experience)) }`, xOffset2 + gridWidth / 12 / 2, yOffset2 + gridHeight / 48 / 2);

  // // Level
  // ctx.fillStyle = '#fff';
  // ctx.font = '32px "Press Start 2P"';
  // ctx.lineWidth = 3;
  // ctx.fillText(`Level ${player!.status.level}`, xOffset2 + gridWidth / 6 / 2, yOffset2 + gridHeight / 24 / 2 + 40);
  // ctx.strokeStyle = '#000';
  // ctx.strokeText(`Level ${player!.status.level}`, xOffset2 + gridWidth / 6 / 2, yOffset2 + gridHeight / 24 / 2 + 40);
};

/**
 * Draws the chat UI on the canvas.
 * @param ctx - The canvas rendering context.
 * @param canvas - The canvas element.
 * @param gameState - The current game state.
 */
const drawChat = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  gameState: GameState
) => {

  const gridWidth = canvas.width;
  const gridHeight = canvas.height;

  ctx.beginPath();

  // Set the fill style for the chat background.
  ctx.fillStyle = '#193c3e';
  const size = {
    height: 400,
    width: gridWidth,
  };
  // Draw the chat background rectangle.
  ctx.fillRect(0, gridHeight - size.height, size.width, size.height);
  // Set the stroke style for the chat border.
  ctx.strokeStyle = '#feae34';
  const paddingWidth = 10;
  ctx.lineWidth = paddingWidth;
  // Draw the chat border rectangle.
  ctx.strokeRect(
    paddingWidth / 2,
    gridHeight - size.height,
    size.width - paddingWidth,
    size.height
  );
  // Set the fill style for the chat text background.
  ctx.fillStyle = '#ead4aa';
  const fontSize = 54;
  ctx.font = `${fontSize}px "Press Start 2P"`;
  const offsetHeight = 24;
  const offsetWidth = 32;
  // Split the chat phrase into lines.
  const lines = getLines(
    ctx,
    gameState.systems.chat.phrase,
    size.width - paddingWidth * 2 - offsetWidth
  );
  const lineGap = 10;
  ctx.strokeStyle = '#181425';
  ctx.lineWidth = 4;
  const textY = gridHeight - size.height + offsetHeight;
  const textX = paddingWidth / 2 + offsetWidth;
  const textHeight = fontSize;
  const textGap = lineGap;
  // set text alignment
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  // Draw each line of chat text.
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const y = textY + i * (textHeight + textGap);
    ctx.fillText(line, textX, y);
    ctx.strokeText(line, textX, y);
  }

  // Draw the next phrase indicator if there is one.
  if (gameState.systems.chat.hasNextPhrase) {

    ctx.fillText(
      '▼',
      size.width -
      paddingWidth / 2 -
      offsetWidth -
      (paddingWidth * 2) -
      (fontSize / 2),
      gridHeight - offsetHeight - fontSize
    );
  }
  ctx.closePath();

};

const drawEntity = (
  entity: GameEntity,
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  gameState: GameState
) => {

  if (gameState.debugSettings.drawEntityHitboxes) {
    const entityState = entity.state;
    const canvasWidth = getSpriteScale() * entityState.scaleX;
    const canvasHeight = getSpriteScale() * entityState.scaleX;
    // const canvasX =  - Math.max(cameraBox.left, 0);
    // const canvasY =  - Math.max(cameraBox.top, 0);
    const canvasPos = worldToCamera({
      x: entityState.x - canvasWidth / 2,
      y: entityState.y - canvasHeight / 2
    }, gameState.camera);


    const spriteData = {
      canvasX: canvasPos.x,
      canvasY: canvasPos.y,
      canvasWidth,
      canvasHeight,
      // spriteX: spriteX,
      // spriteY: spriteY,
      spriteWidth: canvasWidth,
      spriteHeight: canvasHeight,
    };


    const entityBox = getBoundingRect({ x: canvasPos.x, y: canvasPos.y, h: spriteData.canvasHeight, w: spriteData.canvasWidth });
    ctx.beginPath();
    ctx.strokeStyle = 'teal';
    const tempLineWidth = ctx.lineWidth;
    ctx.lineWidth = 6;
    ctx.rect(entityBox.left, entityBox.top, spriteData.canvasWidth, spriteData.canvasHeight);
    ctx.stroke();
    ctx.lineWidth = tempLineWidth;
    ctx.closePath();
    // return;
  }

  if (!entity.sprite) {
    return;
  }

  if (!entity.state.visible) {
    return;
  }

  const entityState = entity.state;
  if (entity.state.flashing && gameState.time.frameID % 10 !== 0) {
    ctx.globalCompositeOperation = "color-dodge";
  }
  const spriteFrame = entity.getSpritePos(gameState);

  const spriteFrameWidth = spriteFrame.spriteSourceSize.w;
  const spriteFrameHeight = spriteFrame.spriteSourceSize.h;
  const spriteX = spriteFrame.frame.x;
  const spriteY = spriteFrame.frame.y;


  const canvasWidth = getSpriteScale() * entityState.scaleX;
  const canvasHeight = getSpriteScale() * entityState.scaleX;
  // const canvasX =  - Math.max(cameraBox.left, 0);
  // const canvasY =  - Math.max(cameraBox.top, 0);
  const canvasPos = worldToCamera({
    x: entityState.x - canvasWidth / 2,
    y: entityState.y - canvasHeight / 2
  }, gameState.camera);


  const spriteData = {
    canvasX: canvasPos.x,
    canvasY: canvasPos.y,
    canvasWidth,
    canvasHeight,
    spriteX: spriteX,
    spriteY: spriteY,
    spriteWidth: spriteFrameWidth,
    spriteHeight: spriteFrameHeight,
  };

  gameState.emitter.emit(EVENTS.RENDER_SPRITE, { spriteData, entity });

  const spriteSheet = entity.sprite.spriteSheet;
  drawSprite(ctx, canvas, spriteSheet, spriteData);


  const entityBox = getBoundingRect({ x: canvasPos.x, y: canvasPos.y, h: spriteData.canvasHeight, w: spriteData.canvasWidth });
  // console.log(entityBox);

  if (gameState.debugSettings.drawEntityHitboxes) {
    ctx.beginPath();
    ctx.strokeStyle = 'teal';
    const tempLineWidth = ctx.lineWidth;
    ctx.lineWidth = 6;
    ctx.rect(entityBox.left, entityBox.top, spriteData.canvasWidth, spriteData.canvasHeight);
    ctx.stroke();
    ctx.lineWidth = tempLineWidth;
    ctx.closePath();
  }

  if (gameState.debugSettings.debugPlayerSpriteSheet && entity.name === PlayerEntity.NAME) {
    const sheetScale = 4;
    const spriteOffset = 250;
    drawSprite(ctx, canvas, spriteSheet, {
      canvasX: spriteOffset,
      canvasY: spriteOffset,
      canvasWidth: spriteSheet.naturalWidth * sheetScale,
      canvasHeight: spriteSheet.naturalHeight * sheetScale,
      spriteX: 0,
      spriteY: 0,
      spriteWidth: spriteSheet.naturalWidth,
      spriteHeight: spriteSheet.naturalHeight,
    });

    ctx.beginPath();
    ctx.strokeStyle = 'teal';
    const tempLineWidth = ctx.lineWidth;
    ctx.lineWidth = 5;
    ctx.rect(spriteOffset + (spriteX * sheetScale), spriteOffset + (spriteY * sheetScale), spriteFrameWidth * sheetScale, spriteFrameHeight * sheetScale);
    ctx.stroke();
    ctx.lineWidth = tempLineWidth;
    ctx.closePath();
  }
  // ctx.globalAlpha = 1;

  ctx.globalCompositeOperation = "source-over";
};

export const render = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, gameState: GameState) => {
  gameState.emitter.emit(EVENTS.RENDER_START, null);

  resetContext(ctx, canvas, "#fff");
  if (gameState.systems.gameState.inStates(['running', 'paused', 'gameOver', 'menu'])) {


    gameState.map.render(ctx, canvas, gameState);
    if (gameState.debugSettings.showGrid) {
      drawGrid(ctx, canvas, 0, "teal", gameState);
    }

    const entities = gameState.entities;
    const entityCount = entities.length;
    for (let i = 0; i < entityCount; i++) {
      try {
        drawEntity(entities[i], ctx, canvas, gameState);
      }
      catch (err) {
        // console.error(err);
      }
      for (let j = 0; j < (entities[i]?.children?.length || 0); j++) {
        try {
          drawEntity(entities[i]!.children![j], ctx, canvas, gameState);
        }
        catch (err) {
          // console.log(err);
        }
      }
    }

    drawHUD(ctx, canvas, gameState);
    // Only draw the chat UI if the game is in the chat state.
    if (gameState.systems.controlState.state === 'chat') {
      drawChat(ctx, canvas, gameState);
    }
  }

  if (gameState.systems.gameState.inStates(['start'])) {
    drawStartMenu(ctx, canvas, gameState);
  }


  if (gameState.debugSettings.debugGameState && gameState.elements.gameStateContainer) {
    gameState.elements.gameStateContainer.innerHTML = JSON.stringify({
      controls: gameState.controls,
      camera: {
        ...gameState.camera,
        following: gameState.camera.following?.name
      },
      emitter: gameState.emitter,
      entities: gameState.entities.map(entity => ({
        id: entity.id,
        name: entity.name,
        state: entity.state,
        status: entity.status,
      })),
      settings: gameState.debugSettings,
      time: gameState.time,
      world: gameState.world,
    }, null, 2);
  }

  // window.defferedRender();
  gameState.emitter.emit(EVENTS.RENDER_END, null);
}

