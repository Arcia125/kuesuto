import { ChatSystem } from './systems/chatSystem';
import { ExperienceSystem } from './systems/experienceSystem';
import { DamageSystem } from './systems/damageSystem';
import { cameraToWorld } from './position';
import { createKeyDownHandler, createKeyUpHandler } from './controls';
import { GameState } from './models';
import './style.css'
import { gameLoop } from "./gameLoop";
import { EventEmitter, EVENTS } from './events';
import { RenderableMap } from './map';
import { GameCamera } from './camera';
import { BrowserElements } from './browserElements';
import { DeathSystem } from './systems/deathSystem';
import { LevelingSystem } from './systems/levelingSystem';
import { PhysicsSystem } from './systems/physicsSystem';
import { MobileControls } from './mobileControls';
import { ControlStateSystem } from './systems/controlStateSystem';
import { GameStateSystem } from './systems/gameStateSystem';
import { StartMenuSystem } from './systems/startMenuSystem';
import { SpawnSystem } from './systems/spawnSystem';
import { NarrativeFlagSystem } from './systems/narrativeFlagSystem';
import { AreaTransitionSystem } from './systems/areaTransitionSystem';
import { SpeechSystem } from './systems/speechSystem';
import { getMinimapGeometry } from './rendering';
import { positionFromTileCoord } from './position';
import { Collision } from './capabilities/collision';
import { PlayerEntity } from './entities/playerEntity';


let mainCanvas: HTMLCanvasElement;
let mainCanvasContext: CanvasRenderingContext2D;
let gameState: GameState;


const resize = () => {
  gameState.elements.resize(gameState);
};

const init = () => {

  const emitter = new EventEmitter();

  // emitter.on(EventEmitter.ALL, console.log);

  const gameState: GameState = {
    entities: [
    ],
    map: new RenderableMap({
      scaleX: 1,
      scaleY: 1,
    }, emitter),
    controls: {
      up: false,
      down: false,
      left: false,
      right: false,
      attack: false,
      chatNext: false,
    },
    camera: new GameCamera(2560, 1307),
    world: {
      running: false,
      started: false,
    },
    debugSettings: {
      debugGameState: false,
      debugPlayerSpriteSheet: false,
      showFps: false,
      showGrid: false,
      activateDebugger: false,
      drawEntityHitboxes: false,
      freecam: typeof location !== 'undefined' && new URLSearchParams(location.search).has('freecam'),
      teleport: false,
    },
    ui: {
      questLogOpen: false,
    },
    time: {
      delta: 0,
      fps: 60,
      framesThisSecond: 0,
      lastFpsUpdate: 0,
      lastFrameTimeMs: 0,
      maxFPS: 60,
      timeStep: 1000 / 60,
      stepID: 0,
      frameID: 0,
      resetDeltaCount: 0,
    },
    elements: new BrowserElements(),
    emitter,
    systems: {
      damage: new DamageSystem(emitter),
      death: new DeathSystem(emitter),
      experience: new ExperienceSystem(emitter),
      leveling: new LevelingSystem(emitter),
      physics: new PhysicsSystem(emitter),
      speech: new SpeechSystem(),
      chat: new ChatSystem(emitter),
      controlState: new ControlStateSystem(emitter),
      gameState: new GameStateSystem(emitter),
      startMenu: new StartMenuSystem(emitter),
      spawn: new SpawnSystem(emitter),
      narrativeFlags: new NarrativeFlagSystem(emitter),
      areaTransition: new AreaTransitionSystem(emitter),
    },
    mobileControls: new MobileControls(),
  };



  // Map-viewer affordance: ?map=<name> starts on any known map (pairs with &freecam
  // for flying around it — see debugSettings.freecam).
  if (typeof location !== 'undefined') {
    const mapParam = new URLSearchParams(location.search).get('map');
    if (mapParam && gameState.map.tileMaps[mapParam]) {
      gameState.map.setActiveMap(mapParam);
    } else if (mapParam) {
      console.warn(`Unknown ?map=${mapParam}; known maps: ${Object.keys(gameState.map.tileMaps).join(', ')}`);
    }
  }

  gameState.mobileControls.init(gameState.elements);

  // gameState.mobileControls.on('joystick', console.log)

  mainCanvas = gameState.elements.mainCanvas;
  mainCanvasContext = gameState.elements.mainCanvasContext;

  // Testing superpower: with teleport mode on ('T'), clicking the minimap warps the
  // player there. Uses the same geometry the minimap is drawn with, and lands on the
  // nearest non-colliding tile so you can never warp into a wall.
  mainCanvas.addEventListener('click', (event) => {
    if (!gameState.debugSettings.teleport) return;
    if (!gameState.systems.gameState.inStates(['running'])) return;
    const player = gameState.entities.find(e => e.name === PlayerEntity.NAME);
    const geo = getMinimapGeometry(mainCanvas, gameState);
    if (!player || !geo) return;

    // Browser click coords -> internal canvas coords (canvas is CSS-scaled).
    const bounds = mainCanvas.getBoundingClientRect();
    const cx = (event.clientX - bounds.left) * (mainCanvas.width / bounds.width);
    const cy = (event.clientY - bounds.top) * (mainCanvas.height / bounds.height);
    const { rect, viewX, viewY, viewTiles } = geo;
    if (cx < rect.x || cx > rect.x + rect.w || cy < rect.y || cy > rect.y + rect.h) return;

    const tileX = Math.floor(viewX + ((cx - rect.x) / rect.w) * viewTiles);
    const tileY = Math.floor(viewY + ((cy - rect.y) / rect.h) * viewTiles);
    const collidesAt = (tx: number, ty: number) => {
      const p = positionFromTileCoord({ x: tx, y: ty });
      return Collision.checkTileCollision(gameState, { x: p.x, y: p.y, w: 1, h: 1 }).length > 0;
    };
    // Spiral out to find the nearest walkable tile (radius 6 covers clicks on canopy).
    for (let r = 0; r <= 6; r++) {
      for (let oy = -r; oy <= r; oy++) for (let ox = -r; ox <= r; ox++) {
        if (Math.max(Math.abs(ox), Math.abs(oy)) !== r) continue;
        if (!collidesAt(tileX + ox, tileY + oy)) {
          const world = positionFromTileCoord({ x: tileX + ox, y: tileY + oy });
          player.state.x = world.x;
          player.state.y = world.y;
          return;
        }
      }
    }
  });

  emitter.emit(EVENTS.INIT, {
    mainCanvas,
    mainCanvasContext
  });

  emitter.on(EVENTS.FPS, (_, msg) => {
    if (gameState.debugSettings.showFps && msg?.fps) {
      gameState.elements.mainGameFpsContainer.innerHTML = Math.round(msg.fps).toString();
    }
  });
  // gameState.emitter.on('player.animationEnd', console.log);
  // gameState.emitter.on('renderSprite', console.log);
  // gameState.emitter.on('update', console.log);
  // gameState.emitter.on(EVENTS.COLLISION, console.log);
  // gameState.emitter.on(EVENTS.ATTACK, console.log);

  // gameState.emitter.on(EVENTS.ALL, (msg) => {
  //   console.log(msg);
  // });
  // gameState.emitter.on('imageLoaded', console.log);


  mainCanvasContext?.rect(0, 0, mainCanvas.width, mainCanvas.height);
  mainCanvasContext?.fill();

  return {
    mainCanvas,
    mainCanvasContext,
    gameState,
  }
}

try {
  const initilization = init();

  mainCanvas = initilization.mainCanvas;
  mainCanvasContext = initilization.mainCanvasContext;
  gameState = initilization.gameState;
  resize();

  // Debug affordance: with ?debug in the URL, expose the live gameState for
  // inspection/scripted testing from the console. No-op in normal play.
  if (typeof location !== 'undefined' && location.search.includes('debug')) {
    (window as unknown as { __kuesuto?: typeof gameState }).__kuesuto = gameState;
  }

} catch (error) {
  console.error('Failed to initialize' + error);
}

document.addEventListener("keydown", (event) => {
  createKeyDownHandler(gameState)(event);
});

document.addEventListener("keyup", (event) => {
  createKeyUpHandler(gameState)(event);
});

window.addEventListener("resize", () => {
  resize();
});

document.addEventListener("visibilitychange", () => {
  gameState.world.running = document.visibilityState === 'visible';
  console.log({ running: gameState.world.running });
});

document.addEventListener('mousedown', (event) => {
  // TODO find and highlight the tile at this position for debugging
  console.log(cameraToWorld({
    x: event.x,
    y: event.y
  }, gameState.camera));
});


const start = () => {
  if (mainCanvasContext && mainCanvas && gameState) {
    gameState.world.started = true;
    gameState.world.running = true;
    gameLoop(mainCanvasContext, mainCanvas, gameState);
  }
};

start();
