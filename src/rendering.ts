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

  for (var y = 0; y <= gridHeight; y += gridCellSize) {
    ctx.moveTo(padding, 0.5 + y + padding - cameraOffsetY % gridCellSize);
    ctx.lineTo(gridWidth + padding, 0.5 + y + padding - cameraOffsetY % gridCellSize);
  }
  ctx.strokeStyle = strokeStyle;
  ctx.stroke();
};


const drawEntity = (
  entity: GameEntity,
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  gameState: GameState
) => {
  if (!entity.sprite) {
    return;
  }

  if (!entity.state.visible) {
    return;
  }

  const entityState = entity.state;
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
};

export const render = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, gameState: GameState) => {
  gameState.emitter.emit(EVENTS.RENDER_START, null);

  resetContext(ctx, canvas, "#fff");
  gameState.map.render(ctx, canvas, gameState);
  if (gameState.debugSettings.showGrid) {
    drawGrid(ctx, canvas, 0, "teal", gameState);
  }

  const entities = gameState.entities;
  const entityCount = entities.length;
  for (let i = 0; i < entityCount; i++) {
    drawEntity(entities[i], ctx, canvas, gameState);
    for (let j = 0; j < (entities[i]?.children?.length || 0); j++) {
      drawEntity(entities[i]!.children![j], ctx, canvas, gameState);
    }
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

