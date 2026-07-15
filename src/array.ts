import { Vector2 } from './models';

/**
 * @example
 * let array = [1,2,3,4,1,2,3,4,1,2,3,4];
 * console.log(positionIndexFromArray(array.length, 4, { x: 3, y: 2 })); // 11
 * console.log(positionIndexFromArray(array.length, 4, { x: 3, y: 4 })); // -1
 */
export const positionIndexFromArray = (arrayLength: number, rowLength: number, pos: Vector2) => {
  const x = Math.round(pos.x);
  const y = Math.round(pos.y);
  // x === rowLength used to slip through and wrap onto the next row; negative
  // coords indexed backwards from the end. Both must be out-of-bounds (-1).
  if (x < 0 || x >= rowLength || y < 0) return -1;
  const index = x + (y * rowLength);
  return index >= arrayLength ? -1 : index;
};
