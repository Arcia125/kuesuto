import { EventEmitter } from './events';
import { MobileControls } from './mobileControls';
import { GameStateSystem } from './systems/gameStateSystem';


export type Direction = "up" | "down" | "left" | "right";

export interface Vector2 {
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

export type Rect = Vector2 & ShortDimensions;

export type Origin = 'top-left' | 'center';

export type BoundingRect = Rect & {
  top: number;
  left: number;
  right: number;
  bottom: number;
  origin: Origin;
};

export type Corners = [
  Vector2 & {
    type: 'top-left';
  },
  Vector2 & {
    type: 'top-right'
  },
  Vector2 & {
    type: 'bottom-right'
  },
  Vector2 & {
    type: 'bottom-left'
  }
];

export interface Force {
  direction: Vector2;
  magnitude: number;
}

export type ForceEntry = { entity: GameEntity; force: Force };

export interface Status {
  health: number;
  maxHealth: number;
  immortal?: boolean;
  dead?: boolean;
  experience: number;
  level: number;
}

export interface GameEntityState extends Vector2 {
  xDir: number;
  yDir: number;
  speedX: number;
  speedY: number;
  scaleX: number;
  scaleY: number;
  mass: number;
  visible: boolean;
  moving: boolean;
  attacking: boolean;
  currentAnimationName: string;
  lastAnimationName: string;
  animationToEnd: boolean;
  animationFrameX: number;
  animationFrameXStart: number;
  flashing?: boolean;
};

export interface Renderable {
  render: (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, gameState: GameState) => void;
}

export interface Updateable {
  update: (gameState: GameState, timeStamp: number) => void;
  skipUpdate?: GameStateSystem['state'][];
}

export interface Parentable<T> {
  parent?: T;
  setParent: (parent: T) => void;
}

export interface Parent<T> {
  children?: T[];
  setChild: (child: T) => void;
}

export interface ParentableParent<T> extends Parentable<T>, Parent<T> { }

export interface Capability extends Updateable {
  entity: GameEntity;
}

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
    dead: boolean;
    levelup?: boolean;
  }
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
  status: Status;
  sprite?: GameSprite;
  children?: GameEntity[];
  getDirection: () => Direction;
  getSpritePos: (gameState: GameState) => Frame;
}

export interface Follower extends Vector2 {
  following?: GameEntity;
  follow: (gameEntity: GameEntity) => void;
}

export interface GameMapState {
  scaleX: number;
  scaleY: number;
};

export interface GameMap extends Renderable {
  tileMaps: Record<string, TileMap>;
  activeMap: {
    name: string;
    tileMap: TileMap;
    worldMap: WorldMap;
  };
  state: GameMapState;
  emitter: EventEmitter;
  getTilesAt: (position: Vector2) => {
    layer: TileLayer;
    tile: number;
  }[];
  // getCollisionShapesAt: (position: Position) => {

  // };
  isTileOutOfBounds: (position: Vector2) => boolean;
  getObjectStartLocation: (objectName: string) => ObjectGroupLayer['objects'][0];
  getObjectStartLocations: (objectName: string) => ObjectGroupLayer['objects'];
};

export type Controls = {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  attack: boolean;
  chatNext: boolean;
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

export type DebugSettings = {
  debugGameState: boolean;
  debugPlayerSpriteSheet: boolean;
  showFps: boolean;
  showGrid: boolean;
  activateDebugger: boolean;
  drawEntityHitboxes: boolean;
};

export interface Camera extends ShortDimensions, Updateable, Follower {
  canvasWidth: number;
  canvasHeight: number;
  aspectRatio: number;
}

export type Elements = {
  mainCanvas: HTMLCanvasElement;
  mainCanvasContext: CanvasRenderingContext2D;
  gameStateContainer: HTMLPreElement;
  mainGameFpsContainer: HTMLParagraphElement;
  joystickContainer: HTMLDivElement;
  joystick: HTMLDivElement;
  attackButton: HTMLButtonElement;
  resize: (gameState: GameState) => void;
};


export interface IDamageSystem extends Updateable {
  handleAttack: (attack: { attacker: GameEntity; target: GameEntity }) => void;
  dealDamage: (attacker: GameEntity, damages: Damage[], target: GameEntity) => void;
}

export interface IChatSystem extends Updateable {
  startChat: (phrases: string[]) => void;
  next: () => void;
  phrase: string;
  hasNextPhrase: boolean;
}

export interface IControlStateSystem extends Updateable {
  state: 'init' | 'menu' | 'normal' | 'chat' | null;
  update: (gameState: GameState, timeStamp: number) => void;
  init: () => void;
  normal: () => void;
  menu: () => void;
  chat: () => void;
}


type GameStatus = 'init' | 'start' | 'running' | 'paused' | 'gameOver' | 'menu';

export interface IGameStateSystem extends Updateable {
  state: GameStatus;
  update: (gameState: GameState, timeStamp: number) => void;
  init: () => void;
  start: () => void;
  running: () => void;
  paused: () => void;
  gameOver: () => void;
  menu: () => void;
  inStates: (states: GameStatus[]) => boolean;
}

export interface IStartMenuSystem extends Updateable {
  update: (gameState: GameState, timeStamp: number) => void;
}

export interface ISpawnSystem extends Updateable {
}

export interface IDeathSystem extends Updateable {
  kill: (entity: GameEntity, killer: GameEntity) => void;
  checkDeath: (entity: GameEntity) => boolean;
}

export interface IExperienceSystem {
  grantExp: (entity: GameEntity, amount: number) => void;
}

export interface ILevelingSystem {
  x: number;
  y: number;
  levelUp: (entity: GameEntity) => void;
  calculateXPToNextLevel: (entity: GameEntity) => number;
}

export interface IPhysicsSystem extends Updateable {
  applyForce: (entity: GameEntity, force: Force) => void;
}

export type GameState = {
  entities: GameEntity[];
  map: GameMap;
  controls: Controls;
  camera: Camera;
  world: World;
  time: Time;
  debugSettings: DebugSettings;
  elements: Elements;
  emitter: EventEmitter;
  systems: {
    damage: IDamageSystem;
    death: IDeathSystem;
    experience: IExperienceSystem;
    leveling: ILevelingSystem;
    physics: IPhysicsSystem;
    chat: IChatSystem;
    controlState: IControlStateSystem;
    gameState: IGameStateSystem;
    startMenu: IStartMenuSystem;
    spawn: ISpawnSystem;
  };
  mobileControls: MobileControls;
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

export type TileSetJSON = {
  columns: number;
  image: string;
  imageheight: number;
  imagewidth: number;
  margin: number;
  name: string;
  spacing: number;
  tilecount: number;
  tiledversion: string;
  tileheight: number;
  tiles: {
    id: number;
    objectgroup?: {
      draworder: string;
      id: number;
      name: string;
      objects?: {
        height: number;
        id: number;
        name: string;
        rotation: number;
        type: string;
        visible: boolean;
        width: number;
        x: number;
        y: number;
      }[];
      opacity: number;
      type: string;
      visible: boolean;
      x: number;
      y: number;
    }[]
  }[]
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

export type ObjectGroupLayer = Vector2 & {
  drawOrder: 'topdown';
  id: number;
  name: string;
  objects: (Dimensions & Vector2 & {
    id: number;
    name: string;
    point: boolean;
    rotation: number;
    type: string;
    visible: boolean;
    properties: {
      name: string;
      type: string;
      value: any;
    }[];
  })[];
  opacity: number;
  type: 'objectgroup';
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
  sourceMap: Record<string, {
    tileMapJSON: TileMapJSON;
    tileSetJSON: TileSetJSON;
  }>;
  getTilesAt: (mapName: string, position: Vector2) => {
    layer: TileLayer;
    tile: number;
  }[];
}

export type DamageType = 'physical';

export interface Damage {
  power: number;
  type: DamageType;
}

export interface ItemStats {
  damages: Damage[];
}

export type Interaction = {
  type: 'CHAT';
  phrases: string[];
}
