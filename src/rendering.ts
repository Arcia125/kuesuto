import { PlayerEntity } from "./entities/playerEntity";
import { DarkWizardEntity } from "./entities/darkWizardEntity";
import { SlimeEntity } from "./entities/slimeEntity";
import { CorruptedSlimeEntity } from "./entities/corruptedSlimeEntity";
import { FastSlimeEntity } from "./entities/fastSlimeEntity";
import { VillagerEntity } from "./entities/villagerEntity";
import { TransitionTriggerEntity } from "./entities/transitionTriggerEntity";
import { HeartPickupEntity } from "./entities/heartPickupEntity";
import { EVENTS } from './events';
import { CORRUPTED_KILLS_REQUIRED } from './systems/narrativeFlagSystem';
import { GameEntity, GameState, Rect, Vector2, WorldMap } from './models';
import { worldToCamera, positionToTileCoord, distanceTo } from './position';
import { drawWoodPanel, drawWoodChip, uiPanelScale, UI_CREAM } from './uiPanel';
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
  if (gameState.systems.save.hasSave()) {
    ctx.fillStyle = "#ffd54a";
    ctx.fillText("Press C to continue", textX, textY + 170);
  }
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
const QUEST_TITLE = 'Chapter 1: The Glade Corruption';

/**
 * A small persistent tab hinting that the quest log can be opened, so the player
 * discovers the keybind without an always-on objective banner cluttering the screen.
 */
const drawQuestLogHint = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
  const label = '[J] Quests';
  ctx.save();
  ctx.font = '22px "Press Start 2P"';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const w = Math.abs(ctx.measureText(label).width) + 44;
  const h = 52;
  const x = (canvas.width - w) / 2;
  const y = 18;
  drawWoodChip(ctx, x, y, w, h);
  ctx.fillStyle = UI_CREAM;
  ctx.fillText(label, canvas.width / 2, y + h / 2);
  ctx.restore();
};

/**
 * The quest log panel, shown only while toggled open (J). Lists the current quest and
 * its active objective derived from the shared objective source.
 */
const drawQuestLog = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, gameState: GameState) => {
  const objective = getObjectiveText(gameState) || 'No active objective.';

  const boxW = 1180;
  const boxH = 460;
  const boxX = (canvas.width - boxW) / 2;
  const boxY = 140;
  const logScale = uiPanelScale(canvas);
  const padX = Math.max(56, 14 * logScale + 24);

  ctx.save();
  drawWoodPanel(ctx, boxX, boxY, boxW, boxH, logScale);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  const padY = Math.max(40, 12 * logScale + 18);

  // Header.
  ctx.fillStyle = '#feae34';
  ctx.font = '34px "Press Start 2P"';
  ctx.fillText('QUEST LOG', boxX + padX, boxY + padY);

  // Divider.
  ctx.strokeStyle = 'rgba(254, 174, 52, 0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(boxX + padX, boxY + padY + 56);
  ctx.lineTo(boxX + boxW - padX, boxY + padY + 56);
  ctx.stroke();

  // Quest title.
  ctx.fillStyle = '#ffd54a';
  ctx.font = '26px "Press Start 2P"';
  ctx.fillText(QUEST_TITLE, boxX + padX, boxY + padY + 92);

  // Active objective.
  ctx.fillStyle = '#ead4aa';
  ctx.font = '24px "Press Start 2P"';
  const lines = getLines(ctx, '- ' + objective, boxW - padX * 2);
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i]!, boxX + padX, boxY + padY + 156 + i * 40);
  }

  // Footer hint.
  ctx.fillStyle = 'rgba(234, 212, 170, 0.7)';
  ctx.font = '20px "Press Start 2P"';
  ctx.fillText('[J] Close', boxX + padX, boxY + boxH - padY - 24);

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
 * Rasterizes a map's terrain to a 1px-per-tile offscreen canvas. Ground reads as grass
 * with the dirt trail and water wangsets picked out; decorated Things tiles split into
 * passable ambience decor (kept as grass), waystation structures (buildings, well —
 * warm brown), and tree/canopy art (dark green). Collision only paints as wall where
 * nothing above explained it — trees and buildings are solid too, and blackening them
 * turned every set piece into an unreadable blob.
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
  const ground = getTileLayerData(worldMap, 'Ground');
  // Ground gids 74-86 are the "Grass Forrest" dirt-trail wangset, 170-182 the
  // "Grass Water" wangset (tileset ids -1, firstgid 1).
  const isTrail = (gid: number) => gid >= 74 && gid <= 86;
  const isWater = (gid: number) => gid >= 170 && gid <= 182;
  // Things gid 1 is the blank filler; 109-116 are the passable single-tile ambience
  // decor (stamps.mjs DECOR_TILES); >= 196 are the waystation structure rows
  // (waystation-tiles.mjs pieces, gid = tile id + 1). Everything else decorated is
  // tree/canopy art.
  const isDecor = (gid: number) => gid >= 109 && gid <= 116;
  const image = octx.createImageData(w, h);
  for (let i = 0; i < w * h; i++) {
    let r = 74, g = 140, b = 79; // grass #4a8c4f
    let claimed = false;
    if (ground && isTrail(ground[i])) { r = 232; g = 183; b = 150; claimed = true; } // trail #e8b796
    const t = things ? things[i] : 0;
    if (t > 1 && !isDecor(t)) {
      if (t >= 196) { r = 172; g = 74; b = 58; } // structure #ac4a3a
      else { r = 22; g = 30; b = 24; } // tree — blackish with a green cast #161e18
      claimed = true;
    }
    if (ground && isWater(ground[i])) { r = 70; g = 130; b = 200; claimed = true; } // water #4682c8
    if (!claimed && collision && collision[i]) { r = 28; g = 28; b = 34; } // bare wall #1c1c22
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
 * Minimap panel geometry + viewport, shared by drawMinimap and the teleport click
 * handler (main.ts) so a click maps to exactly what is drawn. Returns null before
 * the player exists.
 */
export const getMinimapGeometry = (canvas: HTMLCanvasElement, gameState: GameState) => {
  const worldMap = gameState.map.activeMap.worldMap;
  const player = gameState.entities.find(e => e.name === PlayerEntity.NAME);
  if (!worldMap || !worldMap.layers || !player) return null;

  const size = 360;
  // Leave room for the carved-wood frame drawn around the map crop (drawMinimap).
  const margin = 20 + 12 * uiPanelScale(canvas);
  const rect = { x: canvas.width - size - margin, y: margin, w: size, h: size };

  // Zoomed, player-centered viewport: show viewTiles across, panning with the player
  // and clamped to the map edges (rather than fitting the whole map in the panel).
  // Maps smaller than the nominal zoom shrink the viewport to their short side —
  // otherwise drawImage clips the oversized source rect and squishes the map into
  // the panel's top-left corner instead of filling it.
  const viewTiles = Math.min(80, worldMap.width, worldMap.height);
  const playerTile = positionToTileCoord(player.state);
  const half = viewTiles / 2;
  const viewX = Math.max(0, Math.min(worldMap.width - viewTiles, playerTile.x - half));
  const viewY = Math.max(0, Math.min(worldMap.height - viewTiles, playerTile.y - half));
  return { rect, viewX, viewY, viewTiles };
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

  const { rect, viewX, viewY, viewTiles: VIEW_TILES } = getMinimapGeometry(canvas, gameState)!;

  ctx.save();
  // Carved-wood frame around the map crop (shared UI skin); the frame's border sits
  // outside rect so the crop and the teleport click geometry stay identical.
  const mapScale = uiPanelScale(canvas);
  const frame = 12 * mapScale;
  drawWoodPanel(ctx, rect.x - frame, rect.y - frame, rect.w + frame * 2, rect.h + frame * 2, mapScale);
  ctx.imageSmoothingEnabled = false;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.drawImage(terrain, viewX, viewY, VIEW_TILES, VIEW_TILES, rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
  // Teleport mode ('T'): cyan border + hint, click on the panel warps the player.
  if (gameState.debugSettings.teleport) {
    ctx.strokeStyle = '#4ae0e0';
    ctx.lineWidth = 5;
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = '#4ae0e0';
    ctx.font = '26px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('TELEPORT: CLICK MAP', rect.x + rect.w / 2, rect.y + rect.h + frame + 30);
  }

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
  // Villagers read as warm gold — people, not threats.
  for (const e of gameState.entities) {
    if (e.status.dead || !inView(e.state)) continue;
    if (e.name === CorruptedSlimeEntity.NAME) dot(e.state, '#c040c0', 5);
    else if (e.name === SlimeEntity.NAME || e.name === FastSlimeEntity.NAME) dot(e.state, 'rgba(200, 70, 70, 0.7)', 4);
    else if (e instanceof VillagerEntity) dot(e.state, '#ffd98c', 4);
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

  // Carved-wood backing plate behind the health/xp cluster (shared UI skin).
  // Fixed light scale: the cluster is small and the corner blocks are 16 art px.
  drawWoodPanel(ctx, 10, 8, gridWidth / 8 + 120, 160, 3);

  const yOffset = 52;

  const barRect = {
    x: 70,
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
  const xOffset2 = 106;
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

  const size = {
    height: 400,
    width: gridWidth,
  };
  // Carved-wood dialog panel (shared UI skin, see uiPanel.ts).
  const panelScale = uiPanelScale(canvas);
  drawWoodPanel(ctx, 0, gridHeight - size.height, size.width, size.height, panelScale);
  // Set the fill style for the chat text.
  ctx.fillStyle = UI_CREAM;
  const fontSize = 54;
  ctx.font = `${fontSize}px "Press Start 2P"`;
  const paddingWidth = 10;
  const offsetHeight = 14 * panelScale + 10;
  const offsetWidth = 14 * panelScale + 14;
  // Split the chat phrase into lines.
  const allLines = getLines(
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
  // Paginate: fit as many lines as the panel's height allows (symmetric top/
  // bottom inset), then let the advance control page through the rest before
  // moving to the next phrase. Keeps long phrases from spilling past the panel.
  const availableHeight = size.height - offsetHeight * 2;
  const linesPerPage = Math.max(
    1,
    Math.floor((availableHeight + textGap) / (textHeight + textGap))
  );
  gameState.systems.chat.setPageCount(Math.ceil(allLines.length / linesPerPage));
  const pageStart = gameState.systems.chat.pageIndex * linesPerPage;
  const lines = allLines.slice(pageStart, pageStart + linesPerPage);
  // set text alignment
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  // Draw each line of the current page.
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const y = textY + i * (textHeight + textGap);
    ctx.fillText(line, textX, y);
    ctx.strokeText(line, textX, y);
  }

  // Draw the advance indicator if there's more to come (another page or phrase).
  if (gameState.systems.chat.hasMore) {

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
    // Rounded like the map tiles: drawImage at sub-pixel destinations samples texels
    // just OUTSIDE the source rect, bleeding the neighboring sheet frame's edge into
    // this one (seen as a stray outline row above sprites whose sheet packs frames in
    // multiple rows). Integer coords + integer scale = exact texel mapping.
    canvasX: Math.round(canvasPos.x),
    canvasY: Math.round(canvasPos.y),
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

// Heart pickups have no sprite sheet; draw them as chunky pixel hearts that bob.
// Blink during the last seconds before they expire.
const HEART_ROWS = ['.XX.XX.', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'];
const drawHeartPickups = (ctx: CanvasRenderingContext2D, gameState: GameState) => {
  const now = performance.now();
  for (const e of gameState.entities) {
    if (!(e instanceof HeartPickupEntity)) continue;
    const age = now - e.spawnedAt;
    if (age > 9000 && Math.floor(now / 150) % 2 === 0) continue;
    const bob = Math.sin(now / 300 + e.id) * 6;
    const pos = worldToCamera({ x: e.state.x, y: e.state.y + bob }, gameState.camera);
    const cell = 12;
    ctx.fillStyle = '#e04848';
    HEART_ROWS.forEach((row, ry) => {
      for (let rx = 0; rx < row.length; rx++) {
        if (row[rx] === 'X') ctx.fillRect(pos.x + (rx - 3.5) * cell, pos.y + (ry - 3) * cell, cell, cell);
      }
    });
    ctx.fillStyle = '#ffb0b0';
    ctx.fillRect(pos.x - 2.5 * cell, pos.y - 2 * cell, cell, cell);
  }
};

// Overhead speech bubbles (SpeechSystem): small rounded panels floating above the
// speaker's head. Non-blocking flavor text, styled to match the HUD panels.
const drawSpeechBubbles = (ctx: CanvasRenderingContext2D, gameState: GameState) => {
  const bubbles = gameState.systems.speech.bubbles;
  if (!bubbles.length) return;

  const fontSize = 30;
  const padding = 16;
  const maxTextWidth = 620;
  ctx.font = `${fontSize}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  for (const bubble of bubbles) {
    const entity = bubble.entity;
    if (!entity.state.visible) continue;

    const size = getSpriteScale() * entity.state.scaleX;
    const anchor = worldToCamera({ x: entity.state.x, y: entity.state.y - size * 0.7 }, gameState.camera);

    // Word-wrap to maxTextWidth.
    const words = bubble.text.split(' ');
    const lines: string[] = [];
    let line = '';
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (ctx.measureText(candidate).width > maxTextWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    if (line) lines.push(line);

    const textWidth = Math.min(maxTextWidth, Math.max(...lines.map(l => ctx.measureText(l).width)));
    const boxWidth = textWidth + padding * 2;
    const boxHeight = lines.length * (fontSize + 6) + padding * 2 - 6;
    const boxX = anchor.x - boxWidth / 2;
    const boxY = anchor.y - boxHeight - 18;

    ctx.beginPath();
    ctx.fillStyle = 'rgba(25, 60, 62, 0.88)';
    ctx.strokeStyle = '#feae34';
    ctx.lineWidth = 3;
    ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 12);
    ctx.fill();
    ctx.stroke();
    // Tail pointing at the speaker.
    ctx.beginPath();
    ctx.moveTo(anchor.x - 12, boxY + boxHeight - 1);
    ctx.lineTo(anchor.x + 12, boxY + boxHeight - 1);
    ctx.lineTo(anchor.x, boxY + boxHeight + 16);
    ctx.closePath();
    ctx.fillStyle = 'rgba(25, 60, 62, 0.88)';
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    lines.forEach((l, i) => {
      ctx.fillText(l, anchor.x, boxY + padding + fontSize - 6 + i * (fontSize + 6));
    });
    ctx.closePath();
  }
};

// Game-over screen: the fallen world stays visible under a dark red-black veil.
const drawGameOver = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
  ctx.fillStyle = 'rgba(20, 4, 8, 0.78)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#c03030';
  ctx.font = 'bold 110px monospace';
  ctx.fillText('YOU HAVE FALLEN', canvas.width / 2, canvas.height / 2 - 40);
  ctx.fillStyle = '#e8d8b0';
  ctx.font = '40px monospace';
  const blink = Math.floor(Date.now() / 600) % 2 === 0;
  if (blink) {
    ctx.fillText('press SPACE to rise again', canvas.width / 2, canvas.height / 2 + 70);
  }
};

// Draw failures were silently swallowed for years, which made "entity is invisible"
// undebuggable. Log each failing entity once (per entity id) with its state so the
// console shows WHY, without spamming every frame.
const loggedDrawFailures = new Set<number>();
const logDrawFailure = (entity: GameEntity, err: unknown) => {
  if (loggedDrawFailures.has(entity.id)) return;
  loggedDrawFailures.add(entity.id);
  console.error(
    `drawEntity failed: name=${entity.name} id=${entity.id}`,
    {
      moving: entity.state.moving,
      attacking: entity.state.attacking,
      dead: entity.status.dead,
      xDir: entity.state.xDir,
      yDir: entity.state.yDir,
      currentAnimationName: entity.state.currentAnimationName,
      animationFrameX: entity.state.animationFrameX,
      visible: entity.state.visible,
    },
    err,
  );
};

// Area title card: the AI-prerendered banner with the area's name in the game font,
// fading in with a small downward drift, holding, then fading out. AreaTitleSystem
// decides when a card starts; this owns the envelope and layout.
const TITLE_FADE_IN = 450;
const TITLE_HOLD = 2400;
const TITLE_FADE_OUT = 800;
const drawAreaTitle = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, gameState: GameState) => {
  const { bannerImage, current } = gameState.systems.areaTitle;
  if (!current || !bannerImage.complete || !bannerImage.naturalWidth) return;
  const t = Date.now() - current.shownAtMs;
  if (t >= TITLE_FADE_IN + TITLE_HOLD + TITLE_FADE_OUT) return;
  const alpha = t < TITLE_FADE_IN
    ? t / TITLE_FADE_IN
    : t < TITLE_FADE_IN + TITLE_HOLD
      ? 1
      : 1 - (t - TITLE_FADE_IN - TITLE_HOLD) / TITLE_FADE_OUT;

  // Integer pixel scale keeps the banner art crisp at ~40% of the canvas width.
  const scale = Math.max(4, Math.round((canvas.width * 0.4) / bannerImage.naturalWidth));
  const w = bannerImage.naturalWidth * scale;
  const h = bannerImage.naturalHeight * scale;
  const x = (canvas.width - w) / 2;
  const drift = t < TITLE_FADE_IN ? (1 - t / TITLE_FADE_IN) * -h * 0.25 : 0;
  const y = canvas.height * 0.1 + drift;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(bannerImage, x, y, w, h);

  // Name centered in the banner's carved inner panel, sized to fit its width.
  // Press Start 2P is effectively monospace: advance = font size per character.
  const fontSize = Math.floor(Math.min((w * 0.66) / current.title.length, h * 0.3));
  ctx.font = `${fontSize}px "Press Start 2P"`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const cx = canvas.width / 2;
  const cy = y + h * 0.52;
  ctx.fillStyle = 'rgba(20, 12, 28, 0.9)';
  ctx.fillText(current.title, cx, cy + Math.max(3, fontSize * 0.12));
  ctx.fillStyle = '#feae34';
  ctx.fillText(current.title, cx, cy);
  ctx.restore();
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
      if (!entities[i]) continue;
      try {
        drawEntity(entities[i], ctx, canvas, gameState);
      }
      catch (err) {
        // A failed draw must not poison the canvas state for every entity after it
        // (e.g. the flashing color-dodge composite leaking onto the rest of the map).
        ctx.globalCompositeOperation = "source-over";
        logDrawFailure(entities[i], err);
      }
      for (let j = 0; j < (entities[i]?.children?.length || 0); j++) {
        try {
          drawEntity(entities[i]!.children![j], ctx, canvas, gameState);
        }
        catch (err) {
          ctx.globalCompositeOperation = "source-over";
          logDrawFailure(entities[i]!.children![j], err);
        }
      }
    }

    drawHeartPickups(ctx, gameState);
    // Title card sits under speech bubbles: dialogue must always stay readable.
    drawAreaTitle(ctx, canvas, gameState);
    drawSpeechBubbles(ctx, gameState);

    drawHUD(ctx, canvas, gameState);
    drawMinimap(ctx, canvas, gameState);
    if (gameState.ui.questLogOpen) {
      drawQuestLog(ctx, canvas, gameState);
    } else {
      drawQuestLogHint(ctx, canvas);
    }
    // Only draw the chat UI if the game is in the chat state.
    if (gameState.systems.controlState.state === 'chat') {
      drawChat(ctx, canvas, gameState);
    }

    if (gameState.systems.gameState.inStates(['gameOver'])) {
      drawGameOver(ctx, canvas);
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

