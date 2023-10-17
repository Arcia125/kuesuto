import { AnimationFrame, SpriteJSON } from './models';

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

export const getSpriteFrames = (json: SpriteJSON) => Object.entries(json.frames).reduce((acc, [frameName, frameValue], frameIndex) => {
  const [animationName, animationFrame] = frameName.split('--');

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
