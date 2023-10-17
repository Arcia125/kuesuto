import { EventEmitter } from './events';

export type GameEntityState = {
  x: number;
  y: number;
  xDir: number;
  yDir: number;
  speedX: number;
  speedY: number;
  moving: boolean;
  spriteSize: number;
  currentAnimationName: string;
  lastAnimationName: string;
  animationToEnd: boolean;
  animationFrameX: number;
  animationFrameXStart: number;
};

export interface GameSprite {
  spriteFrames: Record<string, AnimationFrame>;
  spriteSheet: HTMLImageElement;
  spriteJSON: SpriteJSON;
}

export interface GameEntity {
  id: number;
  name: string;
  state: GameEntityState;
  sprite?: GameSprite;
  update: (gameState: GameState, timeStamp: number) => void;
}

export type Controls = {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
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
};

export type Elements = {
  mainCanvas: HTMLCanvasElement;
  mainCanvasContext: CanvasRenderingContext2D;
  gameStateContainer: HTMLPreElement;
};

export type GameState = {
  // player: {
  //   id: number;
  //   state: GameEntityState
  //   update: (gameState: GameState, timeStamp: number) => void;
  // };
  entities: GameEntity[];
  controls: Controls;
  world: World;
  time: Time;
  settings: Settings;
  elements: Elements;
  emitter: EventEmitter;
};

export type Position = {
  x: number;
  y: number;
};

export type Dimensions = {
  w: number;
  h: number;
};

export type Rect = Position & Dimensions;

export type Frame = {
  frame: Rect;
  rotated: boolean;
  trimmed: boolean;
  spriteSourceSize: Rect;
  sourceSize: Dimensions;
  duration: number;
};

type FrameTag = {
  name: string;
  from: number;
  direction: "forward";
  color: "#000000ff";
  data: string;
};

export type Meta = {
  app: string;
  version: string;
  image: string;
  format: string;
  size: Dimensions;
  scale: string;
  frameTags: FrameTag[];
};

export type AnimationFrame = {
  frames: Frame[];
  data: {
    direction: "up" | "down" | "left" | "right";
    blink: boolean;
    movement: boolean;
  };
};

export type SpriteJSON = {
  frames: Record<string, Frame>;
  meta: Meta;
};
