import { getBoundingRect } from './rectangle';
import { Camera, Position } from './models';

export const worldToCamera = (position: Position, camera: Camera) => {
  const cameraBox = getBoundingRect(camera,'center');
  return {
    x: position.x - Math.max(cameraBox.left, 0),
    y: position.y - Math.max(cameraBox.top, 0),
  };
};

export const cameraToWorld = (position: Position, camera: Camera) => {
  const cameraBox = getBoundingRect(camera, 'center');
  return {
    x: position.x + Math.max(cameraBox.left, 0),
    y: position.y + Math.max(cameraBox.top, 0),
  };
};
