import type { PointerScale } from '@heliogrid/data/react';
import type { StudioDrive } from './components/StudioCameraRig';

/** How far apart two screen points are read to measure the ground under the pointer, in CSS pixels. */
const SPAN_PX = 10;

/**
 * What the pointer sees of the ground at a screen point: the metres a CSS pixel covers there, read
 * across a few pixels, and whether a finger holds it — from which the magnet's reach is the same on
 * the screen at any zoom. `undefined` off the map, where the magnet keeps the reach it has.
 */
export function pointerScaleAt(
  drive: StudioDrive | null,
  x: number,
  y: number,
  touch: boolean,
): PointerScale | undefined {
  const a = drive?.groundAt(x, y, 0) ?? null;
  const b = drive?.groundAt(x + SPAN_PX, y, 0) ?? null;
  if (a === null || b === null) return undefined;
  return { metresPerPixel: Math.hypot(b.east - a.east, b.north - a.north) / SPAN_PX, touch };
}
