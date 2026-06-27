// Tints a sprite sheet by overlaying a colour onto its opaque pixels, caching the
// result per cacheKey so the tinted canvas is only produced once per (entity, tint).

const tintCache = new Map<string, HTMLCanvasElement>();

export const getTintedSprite = (
  sheet: HTMLImageElement,
  tint: { r: number; g: number; b: number; a: number },
  cacheKey: string,
): CanvasImageSource => {
  const cached = tintCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // The sheet may not have decoded yet on the first frames it is referenced.
  // Fall back to the untinted sheet and don't cache, so we retry once it loads.
  if (!sheet.naturalWidth || !sheet.naturalHeight) {
    return sheet;
  }

  const canvas = document.createElement('canvas');
  canvas.width = sheet.naturalWidth;
  canvas.height = sheet.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return sheet;
  }

  ctx.drawImage(sheet, 0, 0);
  // 'source-atop' restricts the fill to the pixels already drawn (the sprite art),
  // leaving the transparent background untouched.
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = `rgba(${tint.r}, ${tint.g}, ${tint.b}, ${tint.a})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = 'source-over';

  tintCache.set(cacheKey, canvas);
  return canvas;
};
