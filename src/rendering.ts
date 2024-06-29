import { PlayerEntity } from "./entities/playerEntity";
import { EVENTS } from './events';
import { GameEntity, GameState } from './models';
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

const drawStartMenu = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, gameState: GameState) => {
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
  // Only draw the chat UI if the game is in the chat state.
  if (gameState.systems.controlState.state === 'chat') {
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
  }
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

    drawChat(ctx, canvas, gameState);
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

