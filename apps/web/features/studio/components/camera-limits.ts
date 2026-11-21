'use client';
import type { GroundBox } from '@heliogrid/domain';
import { Box3, MathUtils, Vector3 } from 'three';

const RADIANS = MathUtils.DEG2RAD;
/** The field of view, kept narrow: a roof reads true, with little bend at the edges. */
const FOV_DEGREES = 30;
/** The camera's field of view, in degrees, which every reach below is worked out for. */
export function fieldOfView(): number {
  return FOV_DEGREES;
}

/**
 * How far the studio's camera may come and go over its picture (`T-M05-002a`): out until the
 * picture fills the room between the bars, in until it starts to blur, and only where the window
 * stays on the picture.
 */

/** The farthest the camera stands with no picture to keep it in. */
const DISTANCE_MAX = 600;
/** A floor under every other bound, so the camera never stands in the ground. */
const DISTANCE_MIN = 4;
/**
 * The closest the camera comes to a picture: one pixel of its real detail on at most this many
 * screen pixels — a roof then fills a phone. Nearer, the picture only blurs; the true size comes
 * from typed lengths, not from more zoom.
 */
const SCREEN_PX_PER_DETAIL_PX = 16;
/** The least ground the window's shorter side shows on the grid, with no picture to blur. */
const GRID_SHORT_SIDE_M = 5;

/** The ground the picture shows whole, in metres east and north of the pin. */
export type ClearGround = GroundBox;

/**
 * How much ground a camera straight down sees from one metre up, each way from its middle, in the
 * room between the bars — where the person works, and where `setViewOffset` puts the middle. Under
 * the glass bars the picture's faded edge may show; the room between them is always picture.
 */
export function seenPerMetre(
  size: { readonly width: number; readonly height: number },
  free: { readonly top: number; readonly bottom: number },
) {
  const down = Math.tan((FOV_DEGREES / 2) * RADIANS);
  const room = Math.max(1, size.height - free.top - free.bottom) / size.height;
  return { across: down * (size.width / size.height), along: down * room };
}

/** The farthest the camera stands with the picture still filling the room between the bars. */
function farthestOver(clear: ClearGround, seen: ReturnType<typeof seenPerMetre>): number {
  const across = (clear.east - clear.west) / 2 / seen.across;
  const along = (clear.north - clear.south) / 2 / seen.along;
  return Math.max(DISTANCE_MIN, Math.min(across, along));
}

/** The closest the camera comes: by the picture's sharpness, or on the grid by the ground shown. */
function closestOver(
  metresPerPixel: number | null,
  size: { readonly width: number; readonly height: number },
): number {
  const down = Math.tan((FOV_DEGREES / 2) * RADIANS);
  const closest =
    metresPerPixel === null
      ? GRID_SHORT_SIDE_M / 2 / (down * Math.min(1, size.width / size.height))
      : (metresPerPixel * size.height) / (2 * SCREEN_PX_PER_DETAIL_PX * down);
  return Math.max(DISTANCE_MIN, closest);
}

/**
 * Where the camera may look at from this far up: the picture less what the window sees round the
 * middle, so no edge of the picture comes into view. Scene x runs east and z south.
 */
export function lookRoom(
  clear: ClearGround,
  seen: ReturnType<typeof seenPerMetre>,
  distance: number,
): Box3 {
  const across = Math.min(seen.across * distance, (clear.east - clear.west) / 2);
  const along = Math.min(seen.along * distance, (clear.north - clear.south) / 2);
  return new Box3(
    new Vector3(clear.west + across, -1, -(clear.north - along)),
    new Vector3(clear.east - across, 1, -(clear.south + along)),
  );
}

/** How near and how far the camera may stand now, for the picture it shows and the window it fills. */
export function reachOf(
  clear: ClearGround | null,
  metresPerPixel: number | null,
  size: { readonly width: number; readonly height: number },
  free: { readonly top: number; readonly bottom: number },
): { readonly nearest: number; readonly farthest: number } {
  const farthest = clear === null ? DISTANCE_MAX : farthestOver(clear, seenPerMetre(size, free));
  return { nearest: Math.min(closestOver(metresPerPixel, size), farthest), farthest };
}

/** The ground one screen pixel covers, looking straight down from this far up. */
export function groundPerPixel(distance: number, height: number): number {
  return (2 * distance * Math.tan((FOV_DEGREES / 2) * RADIANS)) / height;
}

/** The most ground the window's shorter side shows as the studio opens: the house and its neighbours. */
const OPENING_SHORT_SIDE_M = 90;

/**
 * How far the camera stands as the studio opens: the picture at its own sharpness — one of its
 * finest tile's pixels on one of the screen's own pixels, so a 2× or 3× screen shows it crisp — but
 * the window's shorter side showing no more than the house and its neighbours: the roof a person
 * came for, never a street of them. With no picture, `null`: the view frames the ground round the
 * pin instead.
 */
export function openingDistance(
  tilePixelMetres: number | null,
  size: { readonly width: number; readonly height: number },
  screenPixelsPerCss: number,
): number | null {
  if (tilePixelMetres === null) return null;
  const shortSide = Math.min(size.width, size.height);
  const perCss = Math.min(tilePixelMetres * screenPixelsPerCss, OPENING_SHORT_SIDE_M / shortSide);
  return (perCss * size.height) / (2 * Math.tan((FOV_DEGREES / 2) * RADIANS));
}
