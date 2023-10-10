import { GameState } from './models';

const keyMappings = {
  up: ['ArrowUp', 'w'],
  down: ['ArrowDown', 's'],
  left: ['ArrowLeft', 'a',],
  right: ['ArrowRight', 'd'],
};

export const createKeyDownHandler = (gameState: GameState) => (event: KeyboardEvent) => {
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
};

export const createKeyUpHandler = (gameState: GameState) => (event: KeyboardEvent) => {
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
};
