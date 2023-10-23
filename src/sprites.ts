import { EventEmitter } from './events';
import { getImage } from './images';
import { AnimationFrame, SpriteJSON, GameSprite, GameEntityState, GameState } from './models';

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
  } else {
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
      this.emitter.emit('imageLoaded', { imagePath })
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

export const getSpriteScale = (mainCanvas: HTMLCanvasElement) => {
  return mainCanvas.width / 20;
};
