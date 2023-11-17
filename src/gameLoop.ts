import { EVENTS } from './events';
import { GameState } from './models';
import { render } from './rendering';

const update = (gameState: GameState, timestamp: number) => {
  const entities = gameState.entities;
  const entityCount = entities.length;
  for (let i = 0; i < entityCount; i++) {
    entities[i].update(gameState, timestamp);
  }

  gameState.systems.physics.update(gameState, timestamp);
  gameState.systems.damage.update(gameState, timestamp);

  gameState.camera.update(gameState, timestamp);
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
      gameState.time.stepID = window.requestAnimationFrame(__gameLoop);
      return;
    }

    if (gameState.world.running) {



      gameState.time.delta += timestamp - gameState.time.lastFrameTimeMs;
      gameState.time.lastFrameTimeMs = timestamp;

      if (timestamp > gameState.time.lastFpsUpdate + 1000) {
        gameState.time.fps = 0.25 * gameState.time.framesThisSecond + 0.75 * gameState.time.fps;

        gameState.time.lastFpsUpdate = timestamp;
        gameState.time.framesThisSecond = 0;
        gameState.emitter.emit(EVENTS.FPS, { fps: gameState.time.fps });
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
    }


    gameState.time.frameID++;
    render(ctx, canvas, gameState);

    gameState.time.stepID = window.requestAnimationFrame(__gameLoop);

  };


  __gameLoop(1);
};
