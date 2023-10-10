import { GameState } from './models';
import { render } from './rendering';

const updatePlayerPosition = (gameState: GameState, timestamp: number) => {
  let moving = false;
  let yDir = gameState.player.yDir;
  let xDir = gameState.player.xDir;
  let movedX = false;
  let movedY = false;
  if (gameState.controls.up) {
    gameState.player.y -= (gameState.player.speedY * gameState.time.delta);
    yDir = -1;
    moving = true;
    movedY = true;
  }
  if (gameState.controls.down) {
    gameState.player.y += (gameState.player.speedY * gameState.time.delta);
    yDir = 1;
    moving = true;
    movedY = true;
  }
  if (gameState.controls.left) {
    gameState.player.x -= (gameState.player.speedX * gameState.time.delta);
    xDir = 1;
    moving = true;
    movedX = true;
  }
  if (gameState.controls.right) {
    gameState.player.x += (gameState.player.speedX * gameState.time.delta);
    xDir = -1;
    moving = true;
    movedX = true;
  }
  gameState.player.moving = moving;

  if (movedX && !movedY) {
    yDir = 0;
  } else if (movedY && !movedX) {
    xDir = 0;
  }
  gameState.player.yDir = yDir;
  gameState.player.xDir = xDir;
};

const update = (gameState: GameState, timestamp: number) => {
  updatePlayerPosition(gameState, timestamp);
};

const resetDelta = (gameState: GameState) => {
  gameState.time.resetDeltaCount++;
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
        resetDelta(gameState);
        break;
      }
    }



    render(ctx, canvas, gameState);



    // mainCanvasContext.beginPath();
    // mainCanvasContext.fillStyle = '#ff0';
    // mainCanvasContext.rect(cursX - 10, cursY - 10, 20, 20);
    // mainCanvasContext.fill();
    // mainCanvasContext.closePath();
    gameState.time.frameID = window.requestAnimationFrame(__gameLoop);

  };


  __gameLoop(1);
};
