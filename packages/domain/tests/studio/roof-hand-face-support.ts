import type { Roof } from '../../src/studio/document';
import type { GroundPoint } from '../../src/studio/ground';
import type { HandFaceSet } from '../../src/studio/roof-parts';
import { box, p, roofOf } from './roof-meet-support';

/** Any shape's faces drawn by hand (`T-M05-002`, part e, E082): the roofs and faces the tests share. */

/** North of the equator: a face with no side along the outline slopes down to the south. */
export const NORTH = 18.5;
export const SOUTH = -33.9;

const SHEET = { type: 'trapezoidal_sheet', setBy: 'system', confirmed: false } as const;
export const anyRoof = (corners: readonly GroundPoint[], faces?: readonly HandFaceSet[]): Roof =>
  roofOf('any', corners, {
    material: SHEET,
    shape: { is: 'any', setBy: 'person', ...(faces === undefined ? {} : { faces }) },
  });
export const faceOf = (
  corners: GroundPoint[],
  degrees = 20,
  setBy: 'system' | 'person' = 'system',
) => ({
  corners,
  slope: { degrees, setBy },
  lowSide: 0,
});

/** An 8 × 4 m roof, its south and north halves: a gable drawn by hand. */
export const ROOF = box(0, 0, 8, 4);
export const SOUTH_HALF = [p(0, 0), p(8, 0), p(8, 2), p(0, 2)];
export const NORTH_HALF = [p(0, 2), p(8, 2), p(8, 4), p(0, 4)];
