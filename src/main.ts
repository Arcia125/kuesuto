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
      chat: new ChatSystem(emitter),
      controlState: new ControlStateSystem(emitter),
      gameState: new GameStateSystem(emitter),
      startMenu: new StartMenuSystem(emitter),
      spawn: new SpawnSystem(emitter),
    },
    mobileControls: new MobileControls(),
  };



  gameState.mobileControls.init(gameState.elements);

  // gameState.mobileControls.on('joystick', console.log)

  mainCanvas = gameState.elements.mainCanvas;
  mainCanvasContext = gameState.elements.mainCanvasContext;

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
