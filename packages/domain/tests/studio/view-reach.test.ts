import { describe, expect, it } from 'vitest';
import { edgeDepthAhead, groundReachPerMetre } from '../../src/studio/view-reach';

/**
 * How far a tilted camera sees over the ground (`T-M05-002a`): the 3D view's far limit and the room
 * it may look in come from the frame's corners on the ground, never from a camera straight down.
 */

const DEG = Math.PI / 180;
/** A phone upright: 30° frame, the room between the bars 60 % of the height. */
const PHONE = { across: Math.tan(15 * DEG) * (390 / 844), along: Math.tan(15 * DEG) * 0.6 };
const DESKTOP = { across: Math.tan(15 * DEG) * (1536 / 900), along: Math.tan(15 * DEG) * 0.8 };
const CLEAR = 1.3;
/* The reaches below were worked apart from the code: each frame corner's ray cast onto the ground
   in 3D with numpy, the haze cut at `CLEAR` camera distances. */

describe('the ground a view shows, per metre the camera stands off (T-M05-002a)', () => {
  it.each([
    // why, tilt, frame → reach per metre
    [
      'straight down: the frame’s corner, as the top view',
      0,
      PHONE,
      Math.hypot(PHONE.across, PHONE.along),
    ],
    ['the 3D view on a phone reaches past its top-view frame', 46 * DEG, PHONE, 0.3149],
    ['the 3D view on a desktop', 46 * DEG, DESKTOP, 0.7091],
    [
      'a side view looks over the horizon: cut where the haze takes the ground',
      78 * DEG,
      DESKTOP,
      0.6906,
    ],
  ] as const)('%s', (_why, tilt, frame, reach) => {
    expect(groundReachPerMetre(tilt, frame, CLEAR)).toBeCloseTo(reach, 3);
  });

  it.each([
    ['straight down', 0],
    ['just tilted', 1 * DEG],
    ['the 3D view', 46 * DEG],
    ['the side views', 78 * DEG],
    ['the lowest tilt', 85 * DEG],
  ] as const)('%s reaches at least as far as straight down', (_why, tilt) => {
    expect(groundReachPerMetre(tilt, PHONE, CLEAR)).toBeGreaterThanOrEqual(
      Math.hypot(PHONE.across, PHONE.along) - 1e-9,
    );
  });

  it.each([
    ['a deeper haze leaves more ground in view', 2.4, true],
    ['a haze as near as the first corner cuts it', 0.5, false],
  ] as const)('%s', (_why, clear, further) => {
    const at = groundReachPerMetre(78 * DEG, DESKTOP, clear);
    expect(at > groundReachPerMetre(78 * DEG, DESKTOP, CLEAR)).toBe(further);
  });
});

describe('how deep the picture’s edge lies ahead of the camera (T-M05-002a)', () => {
  const box = { west: -80, east: 80, south: -80, north: 80 };
  const north = { east: 0, north: 1 };
  it.each([
    // why, camera, heading, tilt → depth
    ['straight down: nothing lies ahead', { east: 0, north: 0, up: 50 }, north, 0, null],
    [
      'looking north from the pin, tilted 45°',
      { east: 0, north: 0, up: 50 },
      north,
      45 * DEG,
      (80 + 50) * Math.SQRT1_2,
    ],
    [
      'nearer the edge, the edge is nearer',
      { east: 0, north: 60, up: 50 },
      north,
      45 * DEG,
      (20 + 50) * Math.SQRT1_2,
    ],
    [
      'standing past the edge, looking out: the camera’s own height alone',
      { east: 0, north: 90, up: 50 },
      north,
      45 * DEG,
      50 * Math.SQRT1_2,
    ],
    ['looking along an edge it stands on', { east: 80, north: 0, up: 10 }, north, 90 * DEG, 80],
    [
      'looking along a line outside the box: it never crosses',
      { east: 90, north: 0, up: 10 },
      north,
      90 * DEG,
      0,
    ],
  ] as const)('%s', (_why, camera, heading, tilt, depth) => {
    const found = edgeDepthAhead(camera, heading, tilt, box);
    if (depth === null) expect(found).toBeNull();
    else expect(found).toBeCloseTo(depth, 6);
  });
});
