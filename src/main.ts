import { createKeyDownHandler, createKeyUpHandler } from './controls';
import { GameState } from './models';
import './style.css'
import { gameLoop } from "./gameLoop";
import { EventEmitter, EVENTS } from './events';
import { PlayerEntity, SwordEntity } from './entities';
import { INIT_PLAYER_SPEED_X, INIT_PLAYER_SPEED_Y } from './constants';
import { RenderableMap } from './map';


// document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
//   <div>
//     <a href="https://vitejs.dev" target="_blank">
//       <img src="${viteLogo}" class="logo" alt="Vite logo" />
//     </a>
//     <a href="https://www.typescriptlang.org/" target="_blank">
//       <img src="${typescriptLogo}" class="logo vanilla" alt="TypeScript logo" />
//     </a>
//     <h1>Vite + TypeScript</h1>
//     <div class="card">
//       <button id="counter" type="button"></button>
//     </div>
//     <p class="read-the-docs">
//       Click on the Vite and TypeScript logos to learn more
//     </p>
//   </div>
// `

// setupCounter(document.querySelector<HTMLButtonElement>('#counter')!)


let mainCanvas: HTMLCanvasElement;
let mainCanvasContext: CanvasRenderingContext2D;
let gameState: GameState;


const init = () => {
  const emitter = new EventEmitter();

  // emitter.on(EventEmitter.ALL, console.log);


  const mainCanvas = document.querySelector<HTMLCanvasElement>('#main-game-canvas');

  if (!mainCanvas) {
    throw new Error('Main canvas not found');
  }


  mainCanvas.width = window.innerWidth;
  mainCanvas.height = window.innerHeight;
  const mainCanvasContext = mainCanvas?.getContext('2d');
  if (!mainCanvasContext) {
    throw new Error('Main canvas context not found');
  }

  emitter.emit(EVENTS.INIT, {
    mainCanvas,
    mainCanvasContext
  });

  const gameStateContainer = document.querySelector<HTMLPreElement>("#game-state");
  if (!gameStateContainer) {
    throw new Error('Game State Container not found');
  }

  const mainGameFpsContainer = document.querySelector<HTMLParagraphElement>("#main-game-fps");
  if (!mainGameFpsContainer) {
    throw new Error('Main Game Fps Container not found');
  }

  // emitter.on(EventEmitter.ALL, console.log);
  // emitter.on(EventEmitter.ALL, console.log);
  // emitter.on(EventEmitter.ALL, console.log);


  const gameState: GameState = {
    entities: [new PlayerEntity({
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
    }, [new SwordEntity({
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
    }, [], emitter)], emitter)],
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
    world: {
      running: false,
      started: false,
    },
    settings: {
      debugGameState: false,
      debugPlayerSpriteSheet: false,
      showFps: true,
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
    elements: {
      mainCanvas,
      mainCanvasContext,
      gameStateContainer,
      mainGameFpsContainer,
    },
    emitter,
  };

  emitter.on(EVENTS.FPS, (_, msg) => {
    console.log(msg);
    if (gameState.settings.showFps && msg?.fps) {
      gameState.elements.mainGameFpsContainer.innerHTML = Math.round(msg.fps).toString();
    }
  });
  // gameState.emitter.on('player.animationEnd', console.log);
  // gameState.emitter.on('renderSprite', console.log);
  // gameState.emitter.on(EventEmitter.ALL, console.log);


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
  gameState.elements.mainCanvas.width = window.innerWidth;
  gameState.elements.mainCanvas.height = window.innerHeight;
});

document.addEventListener("visibilitychange", () => {
  gameState.world.running = document.visibilityState === 'visible';
  console.log({ running: gameState.world.running });
});


const start = () => {
  if (mainCanvasContext && mainCanvas && gameState) {
    gameState.world.started = true;
    gameState.world.running = true;
    gameLoop(mainCanvasContext, mainCanvas, gameState);
  }
};

start();
