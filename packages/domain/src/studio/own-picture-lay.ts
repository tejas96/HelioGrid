import { gridAt, type LatLon, type MapSystem, projected } from './map-systems';

/**
 * Where a picture of the company's own first lies (`T-M05-002d`), worked out from what the file
 * says: a drone map in its true place round the pin, a photo at an assumed size on the pin, and the
 * pieces each is kept in. Every box is in true metres east and north of the picture's origin, so a
 * laid picture's `metresPerUnit` is 1 for a drone map; a photo's boxes are in its pixels.
 */

/** How far round the pin a drone map is kept, in metres: the site and its neighbours (ruling 2). */
export const DRONE_REACH_M = 100;
/** A piece of picture is at most this many pixels a side: a JPEG of one stays well under 2 MB. */
export const PIECE_PX = 1024;
/** Our guess at a photo from above: its long side spans this many metres, a house and its plot. */
export const PHOTO_ASSUMED_SPAN_M = 30;
/**
 * A drone map's window wider than this many pixels is read at a coarser step, whole pixels of it to
 * one: 200 m at 2 cm is still 10,000 pixels, and a picture keeps at most 120 parts.
 */
export const DRONE_WINDOW_MAX_PX = 10_240;

/** A window of an image, in its pixels: x right, y down; `x1`, `y1` past the last. */
export interface PixelWindow {
  readonly x0: number;
  readonly y0: number;
  readonly x1: number;
  readonly y1: number;
}

/** A box in the picture's own units about its origin, y up. */
export interface PictureBox {
  readonly west: number;
  readonly south: number;
  readonly east: number;
  readonly north: number;
}

/** One piece to cut and keep: its pixels, and the box it covers. */
export interface PictureCut {
  readonly window: PixelWindow;
  readonly box: PictureBox;
}

/** A map as its file describes it: its size, where its top-left pixel corner lies, and a pixel's size. */
export interface MapGrid {
  readonly width: number;
  readonly height: number;
  /** The top-left corner of the top-left pixel, in the system's units. */
  readonly originX: number;
  readonly originY: number;
  /** A pixel's size in the system's units: x to the right, y down (a north-up map's is negative). */
  readonly pixelX: number;
  readonly pixelY: number;
}

export type DroneLay =
  | {
      readonly kind: 'laid';
      /** The pixels round the pin to keep. */
      readonly window: PixelWindow;
      /** A pixel's true size on the ground, in metres: the map's sharpness. */
      readonly metresPerPixel: number;
      /** The turn that brings the map's up to true north, clockwise, in degrees. */
      readonly turnDeg: number;
      /** The map's pixels read as one: 1, or more for a window past `DRONE_WINDOW_MAX_PX`. */
      readonly step: number;
      readonly cuts: readonly PictureCut[];
    }
  /** The map does not cover the pin: how far its nearest edge is, in metres. */
  | { readonly kind: 'elsewhere'; readonly distanceM: number };

/** A window cut into pieces of at most `PIECE_PX` a side, each with its box about `origin`, y up. */
export function cutsOf(
  window: PixelWindow,
  origin: { readonly x: number; readonly y: number },
  unitsPerPixel: { readonly x: number; readonly y: number },
  /** The source pixels one piece covers a side: `PIECE_PX` times the step it is read at. */
  piecePx = PIECE_PX,
): PictureCut[] {
  const cuts: PictureCut[] = [];
  for (let y0 = window.y0; y0 < window.y1; y0 += piecePx) {
    for (let x0 = window.x0; x0 < window.x1; x0 += piecePx) {
      const piece = {
        x0,
        y0,
        x1: Math.min(x0 + piecePx, window.x1),
        y1: Math.min(y0 + piecePx, window.y1),
      };
      cuts.push({
        window: piece,
        box: {
          west: (piece.x0 - origin.x) * unitsPerPixel.x,
          east: (piece.x1 - origin.x) * unitsPerPixel.x,
          north: (origin.y - piece.y0) * unitsPerPixel.y,
          south: (origin.y - piece.y1) * unitsPerPixel.y,
        },
      });
    }
  }
  return cuts;
}

/**
 * A drone map laid round the pin: the pixels within `DRONE_REACH_M` of it, cut into pieces whose
 * boxes are true metres about the pin, and the turn from the map's grid to true north. A map that
 * does not reach the pin is never laid: it is how far away it is.
 */
export function droneLayOf(system: MapSystem, grid: MapGrid, pin: LatLon): DroneLay {
  const at = projected(system, pin);
  const { unitsPerMetreX, unitsPerMetreY, northTurnDeg } = gridAt(system, pin);
  const metresX = Math.abs(grid.pixelX) / unitsPerMetreX;
  const metresY = Math.abs(grid.pixelY) / unitsPerMetreY;
  const pinPx = { x: (at.x - grid.originX) / grid.pixelX, y: (at.y - grid.originY) / grid.pixelY };
  const outsideX = Math.max(0, -pinPx.x, pinPx.x - grid.width) * metresX;
  const outsideY = Math.max(0, -pinPx.y, pinPx.y - grid.height) * metresY;
  if (outsideX > 0 || outsideY > 0) {
    return { kind: 'elsewhere', distanceM: Math.hypot(outsideX, outsideY) };
  }
  const window = windowRound(pinPx, DRONE_REACH_M / metresX, DRONE_REACH_M / metresY, grid);
  const step = stepOf(window);
  return {
    kind: 'laid',
    window,
    metresPerPixel: Math.min(metresX, metresY),
    turnDeg: -northTurnDeg,
    step,
    cuts: cutsOf(window, pinPx, { x: metresX, y: metresY }, PIECE_PX * step),
  };
}

/** The map's pixels read as one, so the window is at most `DRONE_WINDOW_MAX_PX` a side. */
function stepOf(window: PixelWindow): number {
  const widest = Math.max(window.x1 - window.x0, window.y1 - window.y0);
  return Math.max(1, Math.ceil(widest / DRONE_WINDOW_MAX_PX));
}

/**
 * A map whose place is not read but whose unit is the metre: the window round its middle, its
 * pixels' size its scale. It lies on the pin and the North card opens, as for a photo.
 */
export function placelessLayOf(grid: MapGrid): {
  readonly window: PixelWindow;
  readonly metresPerPixel: number;
  readonly step: number;
  readonly cuts: readonly PictureCut[];
} {
  const middle = { x: grid.width / 2, y: grid.height / 2 };
  const metres = { x: Math.abs(grid.pixelX), y: Math.abs(grid.pixelY) };
  const window = windowRound(middle, DRONE_REACH_M / metres.x, DRONE_REACH_M / metres.y, grid);
  const step = stepOf(window);
  return {
    window,
    metresPerPixel: Math.min(metres.x, metres.y),
    step,
    cuts: cutsOf(window, middle, metres, PIECE_PX * step),
  };
}

/** The pixels within `reachX`, `reachY` of a point, inside the image, whole. */
function windowRound(
  point: { readonly x: number; readonly y: number },
  reachX: number,
  reachY: number,
  size: { readonly width: number; readonly height: number },
): PixelWindow {
  return {
    x0: Math.max(0, Math.floor(point.x - reachX)),
    y0: Math.max(0, Math.floor(point.y - reachY)),
    x1: Math.min(size.width, Math.ceil(point.x + reachX)),
    y1: Math.min(size.height, Math.ceil(point.y + reachY)),
  };
}

/**
 * A photo from above, laid on the pin: its middle on the pin, its long side guessed to span
 * `PHOTO_ASSUMED_SPAN_M` (assumed) until one length is set; its pieces' boxes in its pixels.
 */
export function photoLayOf(
  width: number,
  height: number,
): {
  readonly metresPerPixel: number;
  readonly cuts: readonly PictureCut[];
} {
  const middle = { x: width / 2, y: height / 2 };
  return {
    metresPerPixel: PHOTO_ASSUMED_SPAN_M / Math.max(width, height),
    cuts: cutsOf({ x0: 0, y0: 0, x1: width, y1: height }, middle, { x: 1, y: 1 }),
  };
}
