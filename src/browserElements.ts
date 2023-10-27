import { Elements, GameState } from './models';

export class BrowserElements implements Elements {
  public mainCanvas: HTMLCanvasElement;
  public mainCanvasContext: CanvasRenderingContext2D;
  public gameStateContainer: HTMLPreElement;
  public mainGameFpsContainer: HTMLParagraphElement;
  public constructor(
    canvasId: string = '#main-game-canvas',
    gameStateContainerId: string = '#game-state',
    mainFpsContainerId: string = '#main-game-fps'
  ) {

    const mainCanvas = document.querySelector<HTMLCanvasElement>(canvasId);

    if (!mainCanvas) {
      throw new Error('Main canvas not found');
    }

    this.mainCanvas = mainCanvas;

    const mainCanvasContext = mainCanvas?.getContext('2d');
    if (!mainCanvasContext) {
      throw new Error('Main canvas context not found');
    }

    this.mainCanvasContext = mainCanvasContext;

    const gameStateContainer = document.querySelector<HTMLPreElement>(gameStateContainerId);
    if (!gameStateContainer) {
      throw new Error('Game State Container not found');
    }

    this.gameStateContainer = gameStateContainer;

    const mainGameFpsContainer = document.querySelector<HTMLParagraphElement>(mainFpsContainerId);
    if (!mainGameFpsContainer) {
      throw new Error('Main Game Fps Container not found');
    }

    this.mainGameFpsContainer = mainGameFpsContainer;
  }

  public resize = (gameState: GameState) => {
    gameState.elements.mainCanvas.width = gameState.camera.w;
    gameState.elements.mainCanvas.height = gameState.camera.h;

    gameState.camera.canvasWidth = window.innerWidth;
    gameState.camera.canvasHeight = window.innerHeight;

    if (gameState.camera.canvasHeight < gameState.camera.canvasWidth / gameState.camera.aspectRatio) {
      // gameState.elements.mainCanvas.style.setProperty('width', `${window.innerHeight * gameState.camera.aspectRatio}px`);
      // gameState.elements.mainCanvas.style.setProperty('height', `${window.innerHeight}px`);
      gameState.camera.canvasWidth = gameState.camera.canvasHeight * gameState.camera.aspectRatio;
    } else {
      gameState.camera.canvasHeight = gameState.camera.canvasWidth / gameState.camera.aspectRatio;
    }
    gameState.elements.mainCanvas.style.setProperty('width', `${gameState.camera.canvasWidth}px`);
    gameState.elements.mainCanvas.style.setProperty('height', `${gameState.camera.canvasHeight}px`);
    (gameState.elements.mainCanvasContext as any).msImageSmoothingEnabled = false;
    (gameState.elements.mainCanvasContext as any).mozImageSmoothingEnabled = false;
    gameState.elements.mainCanvasContext.imageSmoothingEnabled = false;
  }
}

