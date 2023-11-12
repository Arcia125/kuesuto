import { ExperienceSystem } from './systems/experienceSystem';
import { DamageSystem } from './systems/damageSystem';
import { cameraToWorld } from './position';
import { createKeyDownHandler, createKeyUpHandler } from './controls';
import { GameState, GameEntity } from './models';
import './style.css'
import { gameLoop } from "./gameLoop";
import { EventEmitter, EVENTS } from './events';
import { SwordEntity } from "./entities/swordEntity";
import { PlayerEntity } from "./entities/playerEntity";
import { INIT_PLAYER_SPEED_X, INIT_PLAYER_SPEED_Y, RENDERING_SCALE } from './constants';
import { RenderableMap } from './map';
import { GameCamera } from './camera';
import { BrowserElements } from './browserElements';
import { DarkWizardEntity } from './entities/darkWizardEntity';
import { DeathSystem } from './systems/deathSystem';
import { SlimeEntity } from './entities/slimeEntity';
import { LevelingSystem } from './systems/levelingSystem';


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
      new PlayerEntity({
        x: 0,
        y: 0,
        xDir: 0,
        yDir: 0,
        speedX: INIT_PLAYER_SPEED_X,
        speedY: INIT_PLAYER_SPEED_Y,
        scaleX: 1,
        scaleY: 1,
        visible: true,
        moving: false,
        attacking: false,
        currentAnimationName: '',
        lastAnimationName: '',
        animationToEnd: false,
        animationFrameX: 0,
        animationFrameXStart: 0,
      }, [
        new SwordEntity({
          x: 0,
          y: 0,
          xDir: 0,
          yDir: 0,
          speedX: INIT_PLAYER_SPEED_X,
          speedY: INIT_PLAYER_SPEED_Y,
          scaleX: 1,
          scaleY: 1,
          visible: false,
          moving: false,
          attacking: false,
          currentAnimationName: '',
          lastAnimationName: '',
          animationToEnd: false,
          animationFrameX: 0,
          animationFrameXStart: 0,
        }, [], emitter)
      ], emitter),
      new DarkWizardEntity({
        x: 0,
        y: 0,
        xDir: 0,
        yDir: 0,
        speedX: INIT_PLAYER_SPEED_X,
        speedY: INIT_PLAYER_SPEED_Y,
        scaleX: 1,
        scaleY: 1,
        visible: true,
        moving: false,
        attacking: false,
        currentAnimationName: '',
        lastAnimationName: '',
        animationToEnd: false,
        animationFrameX: 0,
        animationFrameXStart: 0,
      }, [], emitter),
      new SlimeEntity({
        x: 0,
        y: 0,
        xDir: 0,
        yDir: 0,
        speedX: INIT_PLAYER_SPEED_X * 0.8,
        speedY: INIT_PLAYER_SPEED_Y * 0.8,
        scaleX: 1,
        scaleY: 1,
        visible: true,
        moving: false,
        attacking: false,
        currentAnimationName: '',
        lastAnimationName: '',
        animationToEnd: false,
        animationFrameX: 0,
        animationFrameXStart: 0,
      }, emitter),
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
    },
    camera: new GameCamera(2560, 1307),
    world: {
      running: false,
      started: false,
    },
    debugSettings: {
      debugGameState: false,
      debugPlayerSpriteSheet: false,
      showFps: true,
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
    }
  };


  mainCanvas = gameState.elements.mainCanvas;
  mainCanvasContext = gameState.elements.mainCanvasContext;

  emitter.emit(EVENTS.INIT, {
    mainCanvas,
    mainCanvasContext
  });

  emitter.on(EVENTS.FPS, (_, msg) => {
    console.log(msg);
    if (gameState.debugSettings.showFps && msg?.fps) {
      gameState.elements.mainGameFpsContainer.innerHTML = Math.round(msg.fps).toString();
    }
  });
  // gameState.emitter.on('player.animationEnd', console.log);
  // gameState.emitter.on('renderSprite', console.log);
  gameState.emitter.on(EVENTS.COLLISION, console.log);
  gameState.emitter.on(EVENTS.ATTACK, console.log);

  gameState.emitter.on('imageLoaded', console.log);

  gameState.camera.follow(gameState.entities.find(entity => entity.name === PlayerEntity.NAME) as GameEntity);

  const playerStartLocationObject = gameState.map.getObjectStartLocation('Player Start Location');

  const playerEntity = gameState.entities.find(entity => entity.name === PlayerEntity.NAME);
  if (!playerEntity) {
    throw new TypeError('Missing player entity');
  }
  playerEntity.state.x = playerStartLocationObject.x * RENDERING_SCALE;
  playerEntity.state.y = playerStartLocationObject.y * RENDERING_SCALE;



  const darkWizardStartLocationObject = gameState.map.getObjectStartLocation('Dark Wizard');

  const darkWizardEntity = gameState.entities.find(entity => entity.name === DarkWizardEntity.NAME);
  if (!darkWizardEntity) {
    throw new TypeError('Missing dark wizard entity');
  }
  darkWizardEntity.state.x = darkWizardStartLocationObject.x * RENDERING_SCALE;
  darkWizardEntity.state.y = darkWizardStartLocationObject.y * RENDERING_SCALE;


  const enemyStartLocationObject = gameState.map.getObjectStartLocation('Enemy');

  const slimeEntity = gameState.entities.find(entity => entity.name === SlimeEntity.NAME);
  if (!slimeEntity) {
    throw new TypeError('Missing enemy entity');
  }
  slimeEntity.state.x = enemyStartLocationObject.x * RENDERING_SCALE;
  slimeEntity.state.y = enemyStartLocationObject.y * RENDERING_SCALE;


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
