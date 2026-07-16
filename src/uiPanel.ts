import { getImage } from './images';

// Carved-wood nine-slice panel (public/ks-ui-panel.png) — the shared skin for the
// game's UI surfaces (chat box, quest log, HUD backing, minimap frame) so they all
// speak the area-title banner's language. Corners draw 1:1 at an integer scale,
// edges tile along their run, and the interior is a flat fill of the art's own
// center color so text sits on a calm surface.
//
// The corner blocks are 16 art-px; a panel needs w/h >= 32*scale to make sense.
// For smaller elements (hint chips) use the matching flat colors below instead.

const PANEL_PATH = './ks-ui-panel.png';
const CORNER = 16;

export const UI_WOOD_FILL = 'rgb(115, 62, 57)';   // the panel art's flat center
export const UI_WOOD_EDGE = 'rgb(62, 39, 49)';    // carved shadow line
export const UI_GOLD = '#feae34';
export const UI_CREAM = '#ead4aa';

let panelImage: HTMLImageElement | undefined;
const getPanel = () => {
  if (!panelImage) panelImage = getImage(() => { }, PANEL_PATH);
  return panelImage;
};

/**
 * Picks the pixel scale panels should use for this canvas, matching the area
 * banner's density so all wood UI reads as one family.
 */
export const uiPanelScale = (canvas: HTMLCanvasElement) =>
  Math.min(6, Math.max(2, Math.round(canvas.width / 560)));

export const drawWoodPanel = (
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  scale: number,
) => {
  // Shrink the scale if the panel is too small for two corner blocks per axis.
  const s = Math.max(1, Math.min(scale, Math.floor(Math.min(w, h) / (CORNER * 2))));
  const img = getPanel();
  const c = CORNER * s;

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  // Interior first; the frame draws over its rim.
  ctx.fillStyle = UI_WOOD_FILL;
  ctx.fillRect(x + c / 2, y + c / 2, w - c, h - c);

  if (img.complete && img.naturalWidth) {
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const runW = iw - CORNER * 2; // tileable edge length in art px
    const runH = ih - CORNER * 2;

    // Corners.
    ctx.drawImage(img, 0, 0, CORNER, CORNER, x, y, c, c);
    ctx.drawImage(img, iw - CORNER, 0, CORNER, CORNER, x + w - c, y, c, c);
    ctx.drawImage(img, 0, ih - CORNER, CORNER, CORNER, x, y + h - c, c, c);
    ctx.drawImage(img, iw - CORNER, ih - CORNER, CORNER, CORNER, x + w - c, y + h - c, c, c);

    // Horizontal edges, tiled.
    for (let dx = c; dx < w - c; dx += runW * s) {
      const chunk = Math.min(runW * s, w - c - dx);
      const srcW = chunk / s;
      ctx.drawImage(img, CORNER, 0, srcW, CORNER, x + dx, y, chunk, c);
      ctx.drawImage(img, CORNER, ih - CORNER, srcW, CORNER, x + dx, y + h - c, chunk, c);
    }
    // Vertical edges, tiled.
    for (let dy = c; dy < h - c; dy += runH * s) {
      const chunk = Math.min(runH * s, h - c - dy);
      const srcH = chunk / s;
      ctx.drawImage(img, 0, CORNER, CORNER, srcH, x, y + dy, c, chunk);
      ctx.drawImage(img, iw - CORNER, CORNER, CORNER, srcH, x + w - c, y + dy, c, chunk);
    }
  } else {
    // Image still loading: a plain frame in the same colors, one frame of humility.
    ctx.strokeStyle = UI_WOOD_EDGE;
    ctx.lineWidth = 6;
    ctx.strokeRect(x + 3, y + 3, w - 6, h - 6);
  }
  ctx.restore();
};

/**
 * Small flat plaque for elements too small to carry the carved frame (hint chips).
 * Same wood + gold family, no nine-slice.
 */
export const drawWoodChip = (
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
) => {
  ctx.save();
  ctx.fillStyle = UI_WOOD_FILL;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = UI_WOOD_EDGE;
  ctx.lineWidth = 6;
  ctx.strokeRect(x + 3, y + 3, w - 6, h - 6);
  ctx.strokeStyle = UI_GOLD;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 7, y + 7, w - 14, h - 14);
  ctx.restore();
};
