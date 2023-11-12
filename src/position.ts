import { getSpriteScale } from './sprites';
import { getBoundingRect } from './rectangle';
import { Camera, Position } from './models';

export const worldToCamera = (position: Position, camera: Camera) => {
  const cameraBox = getBoundingRect(camera, 'center');
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

export const toTileCoord = (component: number) => component / getSpriteScale();

export const positionToTileCoord = (position: Position) => ({
  x: toTileCoord(position.x),
  y: toTileCoord(position.y),
});

export const fromTileCoord = (tileCoord: number) => tileCoord * getSpriteScale();

export const positionFromTileCoord = (tilePosition: Position) => ({
  x: fromTileCoord(tilePosition.x),
  y: fromTileCoord(tilePosition.y),
});

export const distanceTo = (positionA: Position, positionB: Position) => Math.abs(positionA.x - positionB.x) + Math.abs(positionA.y - positionB.y);

export const tileDistanceTo = (positionA: Position, positionB: Position) => toTileCoord(distanceTo(positionA, positionB));
