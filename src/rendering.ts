import { ANIMATION_SPEED_MULTIPLIER } from './constants';
import { PlayerEntity } from './entities';
import { EVENTS } from './events';
import { GameEntity, GameState } from './models';
import { drawSprite, getSpriteScale } from './sprites';


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
  const gridCellSize = Math.ceil(getSpriteScale(canvas));
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
  // const direction = entity.getDirection();

  // const spriteFrame = getSpritePos(gameState, direction, entity);

  const spriteFrameWidth = spriteFrame.spriteSourceSize.w;
  const spriteFrameHeight = spriteFrame.spriteSourceSize.h;
  const spriteX = spriteFrame.frame.x;
  const spriteY = spriteFrame.frame.y;


  const canvasX = entityState.x;
  const canvasY = entityState.y;

  const spriteData = {
    canvasX,
    canvasY,
    canvasWidth: getSpriteScale(canvas) * entityState.scaleX,
    canvasHeight: getSpriteScale(canvas) * entityState.scaleY,
    spriteX: spriteX,
    spriteY: spriteY,
    spriteWidth: spriteFrameWidth,
    spriteHeight: spriteFrameHeight,
  };

  gameState.emitter.emit(EVENTS.RENDER_SPRITE, { spriteData, entity });

  const spriteSheet = entity.sprite.spriteSheet;
  drawSprite(ctx, canvas, spriteSheet, spriteData);


  if (gameState.settings.debugPlayerSpriteSheet && entity.name === PlayerEntity.NAME) {
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
  if (gameState.settings.showGrid) {
    drawGrid(ctx, canvas, 0, "teal");
  }

  const entities = gameState.entities;
  const entityCount = entities.length;
  for (let i = 0; i < entityCount; i++) {
    drawEntity(entities[i], ctx, canvas, gameState);
    for (let j = 0; j < (entities[i]?.children?.length || 0); j++) {
      drawEntity(entities[i]!.children![j], ctx, canvas, gameState);
    }
  }

  if (gameState.settings.debugGameState && gameState.elements.gameStateContainer) {
    gameState.elements.gameStateContainer.innerHTML = JSON.stringify({
      controls: gameState.controls,
      camera: gameState.camera,
      emitter: gameState.emitter,
      entities: gameState.entities.map(entity => ({
        id: entity.id,
        name: entity.name,
        state: entity.state,
      })),
      settings: gameState.settings,
      time: gameState.time,
      world: gameState.world,
    }, null, 2);
  }
  gameState.emitter.emit(EVENTS.RENDER_END, null);
}

