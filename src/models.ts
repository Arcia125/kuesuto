import { EventEmitter } from './events';


export type Direction = "up" | "down" | "left" | "right";

export interface Position {
  x: number;
  y: number;
};

export interface Dimensions {
  w: number;
  h: number;
};

export type Rect = Position & Dimensions;

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
  sourceSize: Dimensions;
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

export interface GameMap extends Renderable{
  tiles: GameSprite;
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

export interface Camera extends Dimensions {
  canvasWidth: number;
  canvasHeight: number;
  aspectRatio: number;
}

export type Elements = {
  mainCanvas: HTMLCanvasElement;
  mainCanvasContext: CanvasRenderingContext2D;
  gameStateContainer: HTMLPreElement;
  mainGameFpsContainer: HTMLParagraphElement;
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
  size: Dimensions;
  scale: string;
  frameTags?: FrameTag[];
};

export type SpriteJSON = {
  frames: Record<string, Frame>;
  meta: SpriteJSONMeta;
};
