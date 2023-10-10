export type Player = {
  x: number;
  y: number;
  xDir: number;
  yDir: number;
  speedX: number;
  speedY: number;
  moving: boolean;
};

export type Controls = {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
};

export type World = {
  // frames: number;
  // time: number;
  // deltaTime: number;
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
  frameID: number;
};

export type Elements = {
  mainCanvas: HTMLCanvasElement;
  mainCanvasContext: CanvasRenderingContext2D;
  gameStateContainer: HTMLPreElement;
};

export type GameState = {
  player: Player,
  controls: Controls,
  world: World,
  time: Time,
  elements: Elements,
};
