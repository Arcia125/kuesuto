import { EVENTS } from './events';
import { GameState } from './models';

const keyMappings = {
  up: ['ArrowUp', 'w', 'W'],
  down: ['ArrowDown', 's', 'S'],
  left: ['ArrowLeft', 'a', 'A'],
  right: ['ArrowRight', 'd', 'D'],
  attack: [' '],
  toggleDebugGameState: ['O'],
  debugPlayerSpriteSheet: ['P'],
  showGrid: ['G'],
  activateDebugger: ['<']
};

const keyPressed = (key: keyof typeof keyMappings, eventOrKey: KeyboardEvent | KeyboardEvent['key']) => {
  const eventKey = typeof eventOrKey === 'string' ? eventOrKey : eventOrKey.key;
  return keyMappings[key].includes(eventKey);
}

export const createKeyDownHandler = (gameState: GameState) => (event: KeyboardEvent) => {
  if (keyPressed('attack', event)) {
    event.preventDefault();
    gameState.controls.attack = true;
    gameState.emitter.emit(EVENTS.ATTACK_COMMAND, null);
  }
  if (keyPressed('up', event)) {
    event.preventDefault();
    gameState.controls.up = true;
  }
  if (keyPressed('down', event)) {
    event.preventDefault();

    gameState.controls.down = true;
  }
  if (keyPressed('left', event)) {
    event.preventDefault();

    gameState.controls.left = true;
  }
  if (keyPressed('right', event)) {
    event.preventDefault();

    gameState.controls.right = true;
  }

  if (keyPressed('showGrid', event)) {
    event.preventDefault();

    gameState.settings.showGrid = !gameState.settings.showGrid;
  }
  if (keyPressed('toggleDebugGameState', event)) {
    event.preventDefault();
    gameState.settings.debugGameState = !gameState.settings.debugGameState;
    gameState.elements.gameStateContainer.style.display = gameState.settings.debugGameState ? 'block' : 'none';
  }
  if (keyPressed('debugPlayerSpriteSheet', event)) {
    event.preventDefault();
    gameState.settings.debugPlayerSpriteSheet = !gameState.settings.debugPlayerSpriteSheet;
  };
  if (keyPressed('activateDebugger', event)) {
    event.preventDefault();
    gameState.settings.activateDebugger = !gameState.settings.activateDebugger;
  }
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
