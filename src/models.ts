import { EventEmitter } from './events';


export type Direction = "up" | "down" | "left" | "right";

export interface Position {
  x: number;
  y: number;
};

export interface ShortDimensions {
  w: number;
  h: number;
};

export interface Dimensions {
  width: number;
  height: number;
}

export type Rect = Position & ShortDimensions;

export interface GameEntityState extends Position {
  xDir: number;
  yDir: number;
  speedX: number;
  speedY: number;
  scaleX: number;
  scaleY: number;
  visible: boolean;
  moving: boolean;
  attacking: boolean;
  currentAnimationName: string;
  lastAnimationName: string;
  animationToEnd: boolean;
  animationFrameX: number;
  animationFrameXStart: number;
};

export interface Renderable {
  render: (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, gameState: GameState) => void;
}

export interface Updateable {
  update: (gameState: GameState, timeStamp: number) => void;
}

export interface Parentable<T> {
  parent?: T;
  setParent: (parent: T) => void;
}

export interface Parent<T> {
  children?: T[];
  setChild: (child: T) => void;
}

export interface ParentableParent<T> extends Parentable<T>, Parent<T> {}

export type Frame = {
  frame: Rect;
  rotated: boolean;
  trimmed: boolean;
  spriteSourceSize: Rect;
  sourceSize: ShortDimensions;
  duration: number;
};

export type AnimationFrame = {
  frames: Frame[];
  data: {
    direction: Direction;
    blink: boolean;
    movement: boolean;
    attack: boolean;
  };
};

export interface GameSprite {
  spriteFrames: Record<string, AnimationFrame>;
  spriteSheet: HTMLImageElement;
  spriteJSON: SpriteJSON;
}

export interface BaseEntity {
  id: number;
  name: string;
}

export interface GameEntity extends BaseEntity, Updateable, ParentableParent<GameEntity> {
  state: GameEntityState;
  sprite?: GameSprite;
  children?: GameEntity[];
  getDirection: () => Direction;
  getSpritePos: (gameState: GameState) => Frame;
}

export interface GameMapState {
  scaleX: number;
  scaleY: number;
};

export interface GameMap extends Renderable {
  tileMaps: Record<string, TileMap>;
  state: GameMapState;
  emitter: EventEmitter;
};

export type Controls = {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  attack: boolean;
};

export type World = {
  running: boolean;
  started: boolean;
};

export type Time = {
  lastFrameTimeMs: number;
  fps: number;
  maxFPS: number;
  delta: number;
  timeStep: number;
  framesThisSecond: number;
  lastFpsUpdate: number;
  stepID: number;
  frameID: number;
  resetDeltaCount: number;
};

export type Settings = {
  debugGameState: boolean;
  debugPlayerSpriteSheet: boolean;
  showFps: boolean;
  showGrid: boolean;
};

export interface Camera extends ShortDimensions {
  canvasWidth: number;
  canvasHeight: number;
  aspectRatio: number;
}

export type Elements = {
  mainCanvas: HTMLCanvasElement;
  mainCanvasContext: CanvasRenderingContext2D;
  gameStateContainer: HTMLPreElement;
  mainGameFpsContainer: HTMLParagraphElement;
  resize: (gameState: GameState) => void;
};

export type GameState = {
  entities: GameEntity[];
  map: GameMap;
  controls: Controls;
  camera: Camera;
  world: World;
  time: Time;
  settings: Settings;
  elements: Elements;
  emitter: EventEmitter;
};

type FrameTag = {
  name: string;
  from: number;
  direction: "forward";
  color: "#000000ff";
  data: string;
};

export type SpriteJSONMeta = {
  app: string;
  version: string;
  image: string;
  format: string;
  size: ShortDimensions;
  scale: string;
  frameTags?: FrameTag[];
};

export type SpriteJSON = {
  frames: Record<string, Frame>;
  meta: SpriteJSONMeta;
};

export type TileMapFrame = Frame & {
  filename: string;
}

export type TileMapJSON = {
  frames: TileMapFrame[];
  meta: SpriteJSONMeta & { layers: never[], slices: never[] };
}

export type TileLayer = {
  data: number[];
  height: number;
  width: number;
  id: number;
  name: string;
  opacity: number;
  type: 'tilelayer';
  visible: boolean;
  x: number;
  y: number;
};

export type ObjectGroupLayer = Position & {
  drawOrder: 'topdown';
  id: number;
  name: string;
  objects: (Dimensions & Position & {
    id: number;
    name: string;
    point: boolean;
    rotation: number;
    type: string;
    visible: boolean;
  })[];
  opacity: number;
  type: 'objectlayer';
  visible: true;
};

export type WorldMap = Dimensions & {
  compressionlevel: number;
  infinite: boolean;
  layers: (TileLayer | ObjectGroupLayer)[]
  nextlayerid: number;
  nextobjectid: number;
  orientation: 'orthogonal';
  renderorder: 'right-down';
  tiledversion: string;
  tileheight: number;
  tilesets: {
    firstgid: number;
    source: string;
  }[];
  tilewidth: number;
  type: 'map';
  version: string;
  width: number;
};

export interface TileMap {
  tileMapJSON: TileMapJSON;
  tileSets: Record<string, HTMLImageElement>;
  worldMaps: Record<string, WorldMap>;
  sourceMap: Record<string, TileMapJSON>;
}
