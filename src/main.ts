import { createKeyDownHandler, createKeyUpHandler } from './controls';
import { GameState } from './models';
import './style.css'
import { gameLoop } from "./gameLoop";


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

  const gameStateContainer = document.querySelector<HTMLPreElement>("#game-state");
  if (!gameStateContainer) {
    throw new Error('Game State Container not found');
  }


  const gameState: GameState = {
    player: {
      x: 0,
      y: 0,
      xDir: 0,
      yDir: 0,
      speedX: .25,
      speedY: .25,
      moving: false,
    },
    controls: {
      up: false,
      down: false,
      left: false,
      right: false,
    },
    world: {
      running: false,
      started: false,
    },
    time: {
      delta: 0,
      fps: 60,
      framesThisSecond: 0,
      lastFpsUpdate: 0,
      lastFrameTimeMs: 0,
      maxFPS: 60,
      timeStep: 1000 / 60,
      frameID: 0,
    },
    elements: {
      mainCanvas,
      mainCanvasContext,
      gameStateContainer
    }
  };



  mainCanvasContext?.rect(0, 0, mainCanvas.width, mainCanvas.height);
  mainCanvasContext?.fill();

  // let cursX: number, cursY: number;

  // document.addEventListener("mousemove", (event) => {
  //   cursX = event.clientX;
  //   cursY = event.clientY;
  // });
  return {
    mainCanvas,
    mainCanvasContext,
    gameState,
  }
}

try {
  const initilization = init();
  // ({ mainCanvas, mainCanvasContext, gameState } = init());
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

window.addEventListener("resize", (event) => {
  gameState.elements.mainCanvas.width = window.innerWidth;
  gameState.elements.mainCanvas.height = window.innerHeight;
});

// setInterval(() => {
//   handleControlsUpdate(gameState);
//   gameState.world.time = performance.now();
//   console.log(gameState.world.time);
// }, 16);

const start = () => {
  if (mainCanvasContext && mainCanvas && gameState) {
    gameState.world.started = true;
    gameState.world.running = true;
    gameLoop(mainCanvasContext, mainCanvas, gameState);
  }
};

start();
