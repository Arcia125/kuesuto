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

export type Origin = 'top-left' | 'center';

export type BoundingRect = Rect & {
  top: number;
  left: number;
  right: number;
  bottom: number;
  origin: Origin;
};

export type Corners = [
  Position & {
    type: 'top-left';
  },
  Position & {
    type: 'top-right'
  },
  Position & {
    type: 'bottom-right'
  },
  Position & {
    type: 'bottom-left'
  }
]

export interface Status {
  health: number;
  immortal?: boolean;
  dead?: boolean;
  experience: number;
}

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
  status: Status;
  sprite?: GameSprite;
  children?: GameEntity[];
  getDirection: () => Direction;
  getSpritePos: (gameState: GameState) => Frame;
}

export interface Follower extends Position {
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
  getTilesAt: (position: Position) => {
    layer: TileLayer;
    tile: number;
  }[];
  // getCollisionShapesAt: (position: Position) => {

  // };
  isTileOutOfBounds: (position: Position) => boolean;
  getObjectStartLocation: (objectName: string) => ObjectGroupLayer['objects'][0];
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
  resize: (gameState: GameState) => void;
};


export interface IDamageSystem {
  handleAttack: (attack: { attacker: GameEntity; target: GameEntity }) => void;
  dealDamage: (attacker: GameEntity, damages: Damage[], target: GameEntity) => void;
}

export interface IDeathSystem {
  kill: (entity: GameEntity, killer: GameEntity) => void;
  checkDeath: (entity: GameEntity) => boolean;
}

export interface IExperienceSystem {
  grantExp: (entity: GameEntity, amount: number) => void;
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
  }
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
  getTilesAt: (mapName: string, position: Position) => {
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
