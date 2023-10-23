import { ANIMATION_SPEED_MULTIPLIER } from './constants';
import { PlayerEntity } from './entities';
import { GameEntity, GameState } from './models';
import { frameMatchesEntity, getSpriteScale } from './sprites';


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
  const gridCellSize = getSpriteScale(canvas);
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
  _canvas: HTMLCanvasElement,
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

const getSpritePos = (gameState: GameState, direction: 'up' | 'down' | 'left' | 'right', entity: GameEntity) => {
  if (!entity.sprite) throw new Error("No sprite on entity");

  const entityState = entity.state;

  let spriteFrameEntries;

  spriteFrameEntries = Object.entries(entity.sprite?.spriteFrames).filter(frameMatchesEntity(entityState, direction));

  const [spriteFrameName, spriteFrameValue] = spriteFrameEntries.find(([name, value]) => {
    if (!name) {
      throw new Error('Failed to load sprite sheet');
    }

    let found = null;
    if (entityState.currentAnimationName === name && entityState.animationToEnd && entityState.animationFrameX === 0) {
      entityState.lastAnimationName = name;
      gameState.emitter.emit(`animationEnd`, { entity, name });
      entityState.animationToEnd = false;
      found = false;
    }
    if (entityState.lastAnimationName === name && spriteFrameEntries.length > 1) {
      found = false;
    }
    if (entityState.animationFrameX >= (value.frames.length - 1)) {
      entityState.animationToEnd = true;
      if (found !== false) {
        found = true;
      }
    } else {
      if (found !== false) {
        found = true;
      }
    }

    if (found) {
      const timeSinceLastFrame = gameState.time.lastFrameTimeMs - entityState.animationFrameXStart;

      if (entityState.animationFrameX >= value.frames.length) {
        entityState.animationFrameX = 0;
      }
      if (timeSinceLastFrame > value.frames[entityState.animationFrameX]?.duration * ANIMATION_SPEED_MULTIPLIER) {
        entityState.animationFrameXStart = gameState.time.lastFrameTimeMs;
        entityState.animationFrameX++;

        if (entityState.animationFrameX >= value.frames.length) {
          entityState.animationFrameX = 0;
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

  entityState.currentAnimationName = spriteFrameName;

  return spriteFrameValue.frames[entityState.animationFrameX];
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
  const direction = entity.getDirection();
  const spriteFrame = getSpritePos(gameState, direction, entity);

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

  gameState.emitter.emit('renderSprite', { spriteData, entity });

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
  gameState.emitter.emit('renderStart');

  resetContext(ctx, canvas, "#fff");
  drawGrid(ctx, canvas, 0, "#000");

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
  gameState.emitter.emit('renderEnd');
}

