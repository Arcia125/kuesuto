import { GameState } from './models';
import { render } from './rendering';

const updatePlayerPosition = (gameState: GameState, timestamp: number) => {

  if (gameState.controls.up) {
    gameState.player.y -= (gameState.player.speedY * gameState.time.delta);
    gameState.player.yDir = -1;
  }
  if (gameState.controls.down) {
    gameState.player.y += (gameState.player.speedY * gameState.time.delta);
    gameState.player.yDir = 1;
  }
  if (gameState.controls.left) {
    gameState.player.x -= (gameState.player.speedX * gameState.time.delta);
    gameState.player.xDir = 1;
  }
  if (gameState.controls.right) {
    gameState.player.x += (gameState.player.speedX * gameState.time.delta);
    gameState.player.xDir = -1;
  }
};

const update = (gameState: GameState, timestamp: number) => {
  // gameState.world.frames++;
  // let gameTime = timestamp;
  // gameTime *= 0.001;
  // const deltaTime = gameTime - gameState.world.time;
  // gameState.world.deltaTime = deltaTime;
  // gameState.world.time = gameTime;

  updatePlayerPosition(gameState, timestamp);
};

const panic = (gameState: GameState) => {
  gameState.time.delta = 0;
};

export const gameLoop = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, gameState: GameState) => {
  if (!ctx) {
    throw new Error('Missing canvas context');
  }

  const __gameLoop = (timestamp: number) => {

    if (timestamp < gameState.time.lastFrameTimeMs + (1000 / gameState.time.maxFPS)) {
      gameState.time.frameID = window.requestAnimationFrame(__gameLoop);
      return;
    }

    gameState.time.delta += timestamp - gameState.time.lastFrameTimeMs;
    gameState.time.lastFrameTimeMs = timestamp;

    if (timestamp > gameState.time.lastFpsUpdate + 1000) {
      gameState.time.fps = 0.25 * gameState.time.framesThisSecond + 0.75 * gameState.time.fps;

      gameState.time.lastFpsUpdate = timestamp;
      gameState.time.framesThisSecond = 0;
    }

    gameState.time.framesThisSecond++;

    let numUpdateSteps = 0;

    while (gameState.time.delta >= gameState.time.timeStep) {
      update(gameState, timestamp);
      gameState.time.delta -= gameState.time.timeStep;

      if (++numUpdateSteps >= 240) {
        panic(gameState);
        break;
      }
    }



    render(ctx, canvas, gameState);



    // mainCanvasContext.beginPath();
    // mainCanvasContext.fillStyle = '#ff0';
    // mainCanvasContext.rect(cursX - 10, cursY - 10, 20, 20);
    // mainCanvasContext.fill();
    // mainCanvasContext.closePath();
    window.requestAnimationFrame(__gameLoop);

  };


  __gameLoop(1);
};
