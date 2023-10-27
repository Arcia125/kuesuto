import { RENDERING_SCALE } from './constants';
import { EventEmitter, EVENTS } from './events';
import { getImage } from './images';
import { AnimationFrame, SpriteJSON, GameSprite, GameEntityState } from './models';

const parseFrameData = (rawData: any) => {
  const dataItems = rawData.split(' ');
  const data = dataItems.reduce((dataAcc: Record<string, any>, dataItem: string) => {
    const [dataKey, dataValue] = dataItem.split('=');
    if (['true', 'false'].includes(dataValue)) {
      dataAcc[dataKey] = dataValue === 'true';
    } else {
      dataAcc[dataKey] = dataValue;
    }
    return dataAcc;
  }, {} as Record<string, any>);
  return data;
};

export const getSpriteFrames = (json: SpriteJSON) => Object.entries(json.frames).reduce((acc, [frameName, frameValue], _frameIndex) => {
  const [animationName, _animationFrame] = frameName.split('--');

  if (acc[animationName]) {
    acc[animationName].frames.push(frameValue);
  } else if (json.meta.frameTags) {
    const rawData = json.meta.frameTags.find(({ name }: { name: string }) => animationName === name)?.data || "";

    const data = parseFrameData(rawData);

    acc[animationName] = {
      frames: [frameValue],
      data
    };
  }
  return acc;
}, {} as Record<string, AnimationFrame>);


export class Sprite implements GameSprite {

  public spriteSheet: HTMLImageElement;
  public spriteFrames: Record<string, AnimationFrame>;

  public constructor(public spriteJSON: SpriteJSON, imagePath: string, private emitter: EventEmitter, private onLoad?: () => void) {
    this.spriteSheet = getImage(() => {
      this.onLoad?.();
      this.emitter.emit(EVENTS.IMAGE_LOADED, { imagePath })
    }, imagePath);
    this.spriteJSON = spriteJSON;
    this.spriteFrames = getSpriteFrames(this.spriteJSON);
  }
}

export function frameMatchesEntity(entityState: GameEntityState, direction: string): (value: [string, AnimationFrame], index: number, array: [string, AnimationFrame][]) => unknown {
  return ([_frameName, frameValue]) => {
    return frameValue.data.direction === direction && (!!frameValue.data.movement === !!entityState.moving || entityState.attacking) && !!entityState.attacking === !!frameValue.data.attack;
  };
}

export const getSpriteScale = (_mainCanvas: HTMLCanvasElement) => {
  // return mainCanvas.width / 20;
  return 16 * RENDERING_SCALE;
};

export const drawSprite = (
  ctx: CanvasRenderingContext2D,
  _canvas: HTMLCanvasElement,
  spriteSheet: HTMLImageElement,
  {
    canvasX,
    canvasY,
    canvasWidth,
    canvasHeight,
    spriteX,
    spriteY,
    spriteWidth,
    spriteHeight,
  }: {
    /** x position on the canvas */
    canvasX: number,
    /** y Position on the canvas */
    canvasY: number,
    canvasWidth: number,
    canvasHeight: number,
    /** x Position on the spritesheet */
    spriteX: number,
    /** y Position on the spritesheet */
    spriteY: number,
    /** width of the sprite on the spritesheet */
    spriteWidth: number,
    /** height of the sprite on the spritesheet */
    spriteHeight: number
  }) => {
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(spriteSheet, spriteX, spriteY, spriteWidth, spriteHeight, canvasX, canvasY, canvasWidth, canvasHeight);
};
