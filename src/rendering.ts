import { PlayerEntity } from "./entities/playerEntity";
import { DarkWizardEntity } from "./entities/darkWizardEntity";
import { SlimeEntity } from "./entities/slimeEntity";
import { CorruptedSlimeEntity } from "./entities/corruptedSlimeEntity";
import { FastSlimeEntity } from "./entities/fastSlimeEntity";
import { TransitionTriggerEntity } from "./entities/transitionTriggerEntity";
import { EVENTS } from './events';
import { CORRUPTED_KILLS_REQUIRED } from './systems/narrativeFlagSystem';
import { GameEntity, GameState, Rect, Vector2, WorldMap } from './models';
import { worldToCamera, positionToTileCoord, distanceTo } from './position';
import { getBoundingRect } from './rectangle';
import { drawSprite, getSpriteScale } from './sprites';
import { getTintedSprite } from './spriteTinting';


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

type ObjectivePhase =
  | 'meetMorghal'
  | 'investigate'
  | 'returnToMorghal'
  | 'goToRuins'
  | 'exploreRuins';

/**
 * The single source of truth for the player's current goal, derived from the
 * narrative flag chain (see NarrativeFlagSystem). Both the objective text and the
 * minimap marker read from this so they can never disagree.
 */
const getObjectivePhase = (gameState: GameState): ObjectivePhase => {
  const flags = gameState.systems.narrativeFlags;
  if (flags.hasFlag('chapter1_complete')) {
    return gameState.map.activeMap.name === 'ruins-approach' ? 'exploreRuins' : 'goToRuins';
  }
  if (flags.hasFlag('corruption_investigated')) return 'returnToMorghal';
  if (flags.hasFlag('morghal_intro_complete')) return 'investigate';
  return 'meetMorghal';
};

const getObjectiveText = (gameState: GameState): string | null => {
  switch (getObjectivePhase(gameState)) {
    case 'exploreRuins':
      return 'Explore the ruins approach';
    case 'goToRuins':
      return 'Travel east, to the ancient ruins';
    case 'returnToMorghal':
      return 'Return to Morghal in the glade';
    case 'investigate': {
      const killsValue = gameState.systems.narrativeFlags.getFlag('corrupted_slimes_killed');
      const kills = Math.min(
        typeof killsValue === 'number' ? killsValue : 0,
        CORRUPTED_KILLS_REQUIRED
      );
      return `Defeat the corrupted (purple) slimes  ${kills}/${CORRUPTED_KILLS_REQUIRED}`;
    }
    case 'meetMorghal':
    default:
      return 'Speak with Morghal in the glade';
  }
};

/**
 * World-space position of the current objective, resolved from live entities so the
 * minimap can mark it. Returns null when there is nothing to point at yet.
 */
const getObjectiveTarget = (gameState: GameState): Vector2 | null => {
  const entities = gameState.entities;
  const positionOf = (e: GameEntity | undefined): Vector2 | null =>
    e ? { x: e.state.x, y: e.state.y } : null;
  const averageOf = (matches: GameEntity[]): Vector2 | null => {
    if (!matches.length) return null;
    const sum = matches.reduce((acc, e) => ({ x: acc.x + e.state.x, y: acc.y + e.state.y }), { x: 0, y: 0 });
    return { x: sum.x / matches.length, y: sum.y / matches.length };
  };

  switch (getObjectivePhase(gameState)) {
    case 'meetMorghal':
    case 'returnToMorghal':
      return positionOf(entities.find(e => e.name === DarkWizardEntity.NAME));
    case 'investigate': {
      const player = entities.find(e => e.name === PlayerEntity.NAME);
      const corrupted = entities.filter(e => e.name === CorruptedSlimeEntity.NAME && !e.status.dead);
      if (!corrupted.length) return null;
      if (!player) return positionOf(corrupted[0]);
      const nearest = corrupted.reduce((best, e) =>
        distanceTo(player.state, e.state) < distanceTo(player.state, best.state) ? e : best
      );
      return positionOf(nearest);
    }
    case 'goToRuins':
    case 'exploreRuins':
    default:
      // Point at the gate the player should cross next (triggers tile the gateway).
      return averageOf(entities.filter(e => e.name === TransitionTriggerEntity.NAME));
  }
};

/**
 * Draws a small "OBJECTIVE" panel at the top-center of the screen so the current
 * quest goal and progress are always visible.
 */
const drawObjective = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, gameState: GameState) => {
  const text = getObjectiveText(gameState);
  if (!text) return;

  const label = 'OBJECTIVE';
  const labelFont = '28px "Press Start 2P"';
  const textFont = '40px "Press Start 2P"';

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = textFont;
  const textWidth = Math.abs(ctx.measureText(text).width);
  ctx.font = labelFont;
  const labelWidth = Math.abs(ctx.measureText(label).width);

  const padX = 48;
  const boxW = Math.max(textWidth, labelWidth) + padX * 2;
  const boxH = 132;
  const boxX = (canvas.width - boxW) / 2;
  const boxY = 24;
  const centerX = canvas.width / 2;

  ctx.fillStyle = 'rgba(25, 60, 62, 0.85)';
  ctx.fillRect(boxX, boxY, boxW, boxH);
  ctx.strokeStyle = '#feae34';
  ctx.lineWidth = 5;
  ctx.strokeRect(boxX, boxY, boxW, boxH);

  ctx.font = labelFont;
  ctx.fillStyle = '#feae34';
  ctx.fillText(label, centerX, boxY + 40);

  ctx.font = textFont;
  ctx.fillStyle = '#ead4aa';
  ctx.fillText(text, centerX, boxY + 90);

  ctx.restore();
};

// Cached pre-rendered terrain images, one per map (keyed by map name). The forest is
// 256x256 tiles, so we rasterize it once into a 1px-per-tile offscreen canvas and blit
// it scaled each frame rather than re-walking 65k tiles every render.
const minimapTerrainCache = new Map<string, HTMLCanvasElement>();

const getTileLayerData = (worldMap: WorldMap, name: string): number[] | undefined => {
  const layer = worldMap.layers.find(l => l.type === 'tilelayer' && l.name === name);
  return layer && layer.type === 'tilelayer' ? layer.data : undefined;
};

/**
 * Rasterizes a map's terrain to a 1px-per-tile offscreen canvas: collision tiles read
 * as walls, decorated Things tiles as forest, everything else as ground. Tile id 1 in
 * the Things layer is the blank filler and is treated as empty.
 */
const buildMinimapTerrain = (worldMap: WorldMap): HTMLCanvasElement => {
  const w = worldMap.width;
  const h = worldMap.height;
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  const octx = off.getContext('2d')!;
  const collision = getTileLayerData(worldMap, 'Collision');
  const things = getTileLayerData(worldMap, 'Things');
  const image = octx.createImageData(w, h);
  for (let i = 0; i < w * h; i++) {
    let r = 74, g = 140, b = 79; // ground #4a8c4f
    if (things && things[i] && things[i] !== 1) { r = 46; g = 90; b = 52; } // tree #2e5a34
    if (collision && collision[i]) { r = 28; g = 28; b = 34; } // wall #1c1c22
    const o = i * 4;
    image.data[o] = r;
    image.data[o + 1] = g;
    image.data[o + 2] = b;
    image.data[o + 3] = 255;
  }
  octx.putImageData(image, 0, 0);
  return off;
};

/**
 * Draws a minimap panel in the top-right corner: a scaled rasterization of the current
 * map plus live markers for the player, enemies, and the current objective. Shares its
 * objective target with the objective text via getObjectiveTarget so they agree.
 */
const drawMinimap = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, gameState: GameState) => {
  const worldMap = gameState.map.activeMap.worldMap;
  if (!worldMap || !worldMap.layers) return;
  const player = gameState.entities.find(e => e.name === PlayerEntity.NAME);
  if (!player) return;

  const mapName = gameState.map.activeMap.name;
  let terrain = minimapTerrainCache.get(mapName);
  if (!terrain) {
    terrain = buildMinimapTerrain(worldMap);
    minimapTerrainCache.set(mapName, terrain);
  }

  const size = 360;
  const margin = 28;
  const rect = { x: canvas.width - size - margin, y: margin, w: size, h: size };

  // Zoomed, player-centered viewport: show VIEW_TILES across, panning with the player
  // and clamped to the map edges (rather than fitting the whole map in the panel).
  const VIEW_TILES = 96;
  const playerTile = positionToTileCoord(player.state);
  const half = VIEW_TILES / 2;
  const viewX = Math.max(0, Math.min(worldMap.width - VIEW_TILES, playerTile.x - half));
  const viewY = Math.max(0, Math.min(worldMap.height - VIEW_TILES, playerTile.y - half));

  ctx.save();
  // Backing + terrain crop + border. Clip so the cropped terrain can't bleed past the panel.
  ctx.fillStyle = 'rgba(25, 60, 62, 0.85)';
  ctx.fillRect(rect.x - 6, rect.y - 6, rect.w + 12, rect.h + 12);
  ctx.imageSmoothingEnabled = false;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.drawImage(terrain, viewX, viewY, VIEW_TILES, VIEW_TILES, rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
  ctx.strokeStyle = '#feae34';
  ctx.lineWidth = 5;
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);

  const toMini = (pos: Vector2) => {
    const tile = positionToTileCoord(pos);
    return {
      x: rect.x + ((tile.x - viewX) / VIEW_TILES) * rect.w,
      y: rect.y + ((tile.y - viewY) / VIEW_TILES) * rect.h,
    };
  };
  const inView = (pos: Vector2) => {
    const tile = positionToTileCoord(pos);
    return tile.x >= viewX && tile.x <= viewX + VIEW_TILES && tile.y >= viewY && tile.y <= viewY + VIEW_TILES;
  };
  const dot = (pos: Vector2, color: string, radius: number) => {
    const p = toMini(pos);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
    ctx.fill();
  };

  // Enemies: corrupted targets stand out in purple, the rest are faded red.
  for (const e of gameState.entities) {
    if (e.status.dead || !inView(e.state)) continue;
    if (e.name === CorruptedSlimeEntity.NAME) dot(e.state, '#c040c0', 5);
    else if (e.name === SlimeEntity.NAME || e.name === FastSlimeEntity.NAME) dot(e.state, 'rgba(200, 70, 70, 0.7)', 4);
  }

  // Objective: a pulsing yellow ring at the current goal. If off the viewport, clamp it
  // to the panel edge as a direction hint so the player still knows which way to go.
  const target = getObjectiveTarget(gameState);
  if (target) {
    const pulse = 8 + Math.sin(Date.now() / 200) * 2;
    let p = toMini(target);
    const edge = 10;
    const clamped = !inView(target);
    p = {
      x: Math.max(rect.x + edge, Math.min(rect.x + rect.w - edge, p.x)),
      y: Math.max(rect.y + edge, Math.min(rect.y + rect.h - edge, p.y)),
    };
    ctx.strokeStyle = '#ffd54a';
    ctx.lineWidth = clamped ? 5 : 3;
    ctx.beginPath();
    ctx.arc(p.x, p.y, pulse, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Player on top, ringed for visibility (always centered-ish in the viewport).
  dot(player.state, '#ffffff', 6);
  const pp = toMini(player.state);
  ctx.strokeStyle = '#2ce8f5';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(pp.x, pp.y, 6, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#feae34';
  ctx.font = '22px "Press Start 2P"';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('MAP', rect.x + 8, rect.y + 8);
  ctx.restore();
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

  let spriteSource: CanvasImageSource = entity.sprite.spriteSheet;
  if (entity.state.tint) {
    const cacheKey = `${entity.name}_${entity.state.tint.r}_${entity.state.tint.g}_${entity.state.tint.b}_${entity.state.tint.a}`;
    spriteSource = getTintedSprite(entity.sprite.spriteSheet, entity.state.tint, cacheKey);
  }
  drawSprite(ctx, canvas, spriteSource, spriteData);


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
    drawSprite(ctx, canvas, entity.sprite.spriteSheet, {
      canvasX: spriteOffset,
      canvasY: spriteOffset,
      canvasWidth: entity.sprite.spriteSheet.naturalWidth * sheetScale,
      canvasHeight: entity.sprite.spriteSheet.naturalHeight * sheetScale,
      spriteX: 0,
      spriteY: 0,
      spriteWidth: entity.sprite.spriteSheet.naturalWidth,
      spriteHeight: entity.sprite.spriteSheet.naturalHeight,
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
    drawObjective(ctx, canvas, gameState);
    drawMinimap(ctx, canvas, gameState);
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

