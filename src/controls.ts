import { EVENTS } from './events';
import { GameState } from './models';

const keyMappings = {
  up: ['ArrowUp', 'w'],
  down: ['ArrowDown', 's'],
  left: ['ArrowLeft', 'a',],
  right: ['ArrowRight', 'd'],
  attack: [' '],
  toggleDebugGameState: ['O'],
  debugPlayerSpriteSheet: ['P']
};

export const createKeyDownHandler = (gameState: GameState) => (event: KeyboardEvent) => {
  if (keyMappings.attack.includes(event.key)) {
    event.preventDefault();
    gameState.controls.attack = true;
    gameState.emitter.emit(EVENTS.ATTACK_COMMAND, null);
  }
  if (keyMappings.up.includes(event.key)) {
    event.preventDefault();
    gameState.controls.up = true;
  }
  if (keyMappings.down.includes(event.key)) {
    event.preventDefault();

    gameState.controls.down = true;
  }
  if (keyMappings.left.includes(event.key)) {
    event.preventDefault();

    gameState.controls.left = true;
  }
  if (keyMappings.right.includes(event.key)) {
    event.preventDefault();

    gameState.controls.right = true;
  }
  if (keyMappings.toggleDebugGameState.includes(event.key)) {
    event.preventDefault();
    gameState.settings.debugGameState = !gameState.settings.debugGameState;
    gameState.elements.gameStateContainer.style.display = gameState.settings.debugGameState ? 'block' : 'none';
  }
  if (keyMappings.debugPlayerSpriteSheet.includes(event.key)) {
    event.preventDefault();
    gameState.settings.debugPlayerSpriteSheet = !gameState.settings.debugPlayerSpriteSheet;
  };
};

export const createKeyUpHandler = (gameState: GameState) => (event: KeyboardEvent) => {
  if (keyMappings.up.includes(event.key)) {
    event.preventDefault();
    gameState.controls.up = false;
  }
  if (keyMappings.down.includes(event.key)) {
    event.preventDefault();
    gameState.controls.down = false;
  }
  if (keyMappings.left.includes(event.key)) {
    event.preventDefault();
    gameState.controls.left = false;
  }
  if (keyMappings.right.includes(event.key)) {
    event.preventDefault();
    gameState.controls.right = false;
  }
};
