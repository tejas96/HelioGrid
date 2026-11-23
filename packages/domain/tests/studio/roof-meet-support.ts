import { IN_FORMATS } from '../../src/format/pack';
import { EMPTY_STUDIO_DOCUMENT, type Roof, type StudioDocument } from '../../src/studio/document';
import type { GroundPoint } from '../../src/studio/ground';
import type { RoofFacts } from '../../src/studio/roof-levels';

/** The Sharma house of part e's boards: a terrace, what stands on it, and the shed beside it. */

export const FACTS: RoofFacts = { ...IN_FORMATS.roof, storeyHeightM: IN_FORMATS.storeyHeightM };
export const p = (east: number, north: number): GroundPoint => ({ east, north });
export const box = (west: number, south: number, wide: number, deep: number): GroundPoint[] => [
  p(west, south),
  p(west + wide, south),
  p(west + wide, south + deep),
  p(west, south + deep),
];
export const roofOf = (
  id: string,
  corners: readonly GroundPoint[],
  more: Partial<Roof> = {},
): Roof => ({
  id,
  corners,
  edges: corners.map(() => 'traced'),
  tracedOn: 'sky',
  height: null,
  ...more,
});
export const designOf = (...roofs: Roof[]): StudioDocument => ({ ...EMPTY_STUDIO_DOCUMENT, roofs });

const SYSTEM = { setBy: 'system' } as const;
/** A flat concrete terrace, 10 × 8 m. */
export const TERRACE = roofOf('terrace', box(0, 0, 10, 8));
/** A metal sheet roof beside the terrace, sloped as its material starts. */
export const SHED = roofOf('shed', box(10, 0, 4, 8), {
  material: { type: 'trapezoidal_sheet', ...SYSTEM, confirmed: false },
});
export const stairOn = (corners: readonly GroundPoint[], on = 'terrace') =>
  roofOf('stair', corners, { kind: { is: 'stair_room', ...SYSTEM }, on });
export const kindOf = (
  id: string,
  is: string,
  corners: readonly GroundPoint[],
  more: Partial<Roof> = {},
) => roofOf(id, corners, { kind: { is, ...SYSTEM }, ...more });
