import { getSpriteScale } from './sprites';
import { getBoundingRect } from './rectangle';
import { Camera, Vector2 } from './models';

export const worldToCamera = (position: Vector2, camera: Camera) => {
  const cameraBox = getBoundingRect(camera, 'center');
  return {
    x: position.x - Math.max(cameraBox.left, 0),
    y: position.y - Math.max(cameraBox.top, 0),
  };
};

export const cameraToWorld = (position: Vector2, camera: Camera) => {
  const cameraBox = getBoundingRect(camera, 'center');
  return {
    x: position.x + Math.max(cameraBox.left, 0),
    y: position.y + Math.max(cameraBox.top, 0),
  };
};

export const toTileCoord = (component: number) => component / getSpriteScale();

export const positionToTileCoord = (position: Vector2) => ({
  x: toTileCoord(position.x),
  y: toTileCoord(position.y),
});

export const fromTileCoord = (tileCoord: number) => tileCoord * getSpriteScale();

export const positionFromTileCoord = (tilePosition: Vector2) => ({
  x: fromTileCoord(tilePosition.x),
  y: fromTileCoord(tilePosition.y),
});

export const distanceTo = (positionA: Vector2, positionB: Vector2) => Math.abs(positionA.x - positionB.x) + Math.abs(positionA.y - positionB.y);

export const tileDistanceTo = (positionA: Vector2, positionB: Vector2) => toTileCoord(distanceTo(positionA, positionB));

export const directionVectorBetween = (positionA: Vector2, positionB: Vector2) => ({
  x: positionB.x - positionA.x,
  y: positionB.y - positionA.y
});
