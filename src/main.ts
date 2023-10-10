import { GameState } from './models';
import './style.css'
import { render } from './rendering';


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


  const gameState: GameState = {
    player: {
      x: 0,
      y: 0,
      speedX: 10,
      speedY: 10,
    },
    controls: {
      up: false,
      down: false,
      left: false,
      right: false,
    },
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

const keyMappings = {
  up: ['ArrowUp'],
  down: ['ArrowDown'],
  left: ['ArrowLeft'],
  right: ['ArrowRight'],
};




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
  if (keyMappings.up.includes(event.key)) {
    gameState.controls.up = true;
  }
  if (keyMappings.down.includes(event.key)) {
    gameState.controls.down = true;
  }
  if (keyMappings.left.includes(event.key)) {
    gameState.controls.left = true;
  }
  if (keyMappings.right.includes(event.key)) {
    gameState.controls.right = true;
  }
});

document.addEventListener("keyup", (event) => {
  if (keyMappings.up.includes(event.key)) {
    gameState.controls.up = false;
  }
  if (keyMappings.down.includes(event.key)) {
    gameState.controls.down = false;
  }
  if (keyMappings.left.includes(event.key)) {
    gameState.controls.left = false;
  }
  if (keyMappings.right.includes(event.key)) {
    gameState.controls.right = false;
  }
});

setInterval(() => {
  if (gameState.controls.up) {
    gameState.player.y -= gameState.player.speedY;
  }
  if (gameState.controls.down) {
    gameState.player.y += gameState.player.speedY;
  }
  if (gameState.controls.left) {
    gameState.player.x -= gameState.player.speedX;
  }
  if (gameState.controls.right) {
    gameState.player.x += gameState.player.speedX;
  }
}, 16);

const start = () => {
  console.log(mainCanvas)


  if (mainCanvasContext && mainCanvas && gameState) {
    render(mainCanvasContext, mainCanvas, gameState);
  }
};

start();

