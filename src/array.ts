import { Position } from './models';

/**
 * @example
 * let array = [1,2,3,4,1,2,3,4,1,2,3,4];
 * console.log(positionIndexFromArray(array.length, 4, { x: 3, y: 2 })); // 11
 * console.log(positionIndexFromArray(array.length, 4, { x: 3, y: 4 })); // -1
 */
export const positionIndexFromArray = (arrayLength: number, rowLength: number, pos: Position) => {
  if (pos.x > rowLength) return -1;
  const index = pos.x + (pos.y * rowLength);
  return index > arrayLength ? -1 : index;
};
