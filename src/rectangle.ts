import { BoundingRect, Origin, Rect } from './models';


const origins = ['top-left', 'center'];

/**
 *
 * @param rect
 * @param origin
 * @example
 * const rect = { x: 20, y: 30, h: 30, w: 40 };
 * console.log(getBoudningRect(rect)) // {
 * //  "x": 20,
 * //  "y": 30,
 * //  "h": 30,
 * //  "w": 40,
 * //  "top": 20,
 * //  "right": 60,
 * //  "bottom": 45,
 * //  "left": 30
 * // }
 * console.log(getBoudningRect(rect, 'center')) // {
 * //  "x": 20,
 * //  "y": 30,
 * //  "h": 30,
 * //  "w": 40,
 * //  "top": 15,
 * //  "right": 40,
 * //  "bottom": 45,
 * //  "left": 0
 * // }
 */
export const getBoundingRect = (rect: Rect, origin: Origin = 'top-left'): BoundingRect => {
  if (!origins.includes(origin)) {
    throw new TypeError(`Invalid origin: ${origin}. Must be one of ${origins}`);
  }
  if (origin === 'center') {
    return {
      x: rect.x,
      y: rect.y,
      h: rect.h,
      w: rect.w,
      top: rect.y - rect.h / 2,
      right: rect.x + rect.w / 2,
      bottom: rect.y + rect.h / 2,
      left: rect.x - rect.w / 2,
    }
  }
  return {
    x: rect.x,
    y: rect.y,
    h: rect.h,
    w: rect.w,
    top: rect.y,
    right: rect.x + rect.w,
    bottom: rect.y + rect.h,
    left: rect.x,
  };
};
