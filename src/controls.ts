import { EVENTS } from './events';
import { GameState } from './models';

const keyMappings = {
  up: {
    bindings: ['ArrowUp', 'w', 'W']
  },
  down: { bindings: ['ArrowDown', 's', 'S'] },
  left: { bindings: ['ArrowLeft', 'a', 'A'] },
  right: { bindings: ['ArrowRight', 'd', 'D'] },
  attack: { bindings: [' ']} ,
  chatNext: { bindings: [' '], toggle: false } ,
  toggleDebugGameState: { bindings: ['O']} ,
  debugPlayerSpriteSheet: { bindings: ['P']} ,
  showGrid: { bindings: ['G']} ,
  activateDebugger: { bindings: ['<' ] }
};

const keyPressed = (key: keyof typeof keyMappings, eventOrKey: KeyboardEvent | KeyboardEvent['key']) => {
  const eventKey = typeof eventOrKey === 'string' ? eventOrKey : eventOrKey.key;
  return keyMappings[key].bindings.includes(eventKey);
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

  if (keyPressed('chatNext', event)) {
    event.preventDefault();

    gameState.controls.chatNext = true;
  }

  if (keyPressed('showGrid', event)) {
    event.preventDefault();

    gameState.debugSettings.showGrid = !gameState.debugSettings.showGrid;
  }
  if (keyPressed('toggleDebugGameState', event)) {
    event.preventDefault();
    gameState.debugSettings.debugGameState = !gameState.debugSettings.debugGameState;
    gameState.elements.gameStateContainer.style.display = gameState.debugSettings.debugGameState ? 'block' : 'none';
  }
  if (keyPressed('debugPlayerSpriteSheet', event)) {
    event.preventDefault();
    gameState.debugSettings.debugPlayerSpriteSheet = !gameState.debugSettings.debugPlayerSpriteSheet;
  };
  if (keyPressed('activateDebugger', event)) {
    event.preventDefault();
    gameState.debugSettings.activateDebugger = !gameState.debugSettings.activateDebugger;
  }
};

export const createKeyUpHandler = (gameState: GameState) => (event: KeyboardEvent) => {
  if (keyMappings.up.bindings.includes(event.key)) {
    event.preventDefault();
    gameState.controls.up = false;
  }
  if (keyMappings.down.bindings.includes(event.key)) {
    event.preventDefault();
    gameState.controls.down = false;
  }
  if (keyMappings.left.bindings.includes(event.key)) {
    event.preventDefault();
    gameState.controls.left = false;
  }
  if (keyMappings.right.bindings.includes(event.key)) {
    event.preventDefault();
    gameState.controls.right = false;
  }
  if (keyMappings.chatNext.bindings.includes(event.key)) {
    event.preventDefault();
    gameState.controls.chatNext = false;
  }
};
