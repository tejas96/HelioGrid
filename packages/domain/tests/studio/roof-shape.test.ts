import { describe, expect, it } from 'vitest';
import type { GroundPoint } from '../../src/studio/ground';
import {
  cornerAngle,
  edgeLengths,
  edgesCross,
  pointInside,
  roofArea,
  roofHandles,
  roofMiddle,
  roofsBox,
  roofsOverlap,
} from '../../src/studio/roof-shape';

const p = (east: number, north: number): GroundPoint => ({ east, north });
/** An 8 m × 6 m rectangle, its south-west corner on the pin. */
const RECT = [p(0, 0), p(8, 0), p(8, 6), p(0, 6)];
/** An L: the rectangle with its north-east 4 m × 3 m cut away. */
const L_SHAPE = [p(0, 0), p(8, 0), p(8, 3), p(4, 3), p(4, 6), p(0, 6)];

describe('a roof’s shape', () => {
  it('the lengths of its edges, edge i from corner i to corner i + 1', () => {
    expect(edgeLengths(RECT)).toEqual([8, 6, 8, 6]);
  });

  it('its area, whichever way round its corners run', () => {
    expect(roofArea(RECT)).toBe(48);
    expect(roofArea([...RECT].reverse())).toBe(48);
    expect(roofArea(L_SHAPE)).toBe(36);
  });

  it('its middle is the middle of its area', () => {
    expect(roofMiddle(RECT)).toEqual(p(4, 3));
  });

  it('the angle at a corner', () => {
    expect(cornerAngle(RECT, 0)).toBeCloseTo(90);
    expect(cornerAngle([p(0, 0), p(4, 0), p(0, 4)], 1)).toBeCloseTo(45);
  });

  it.each([
    ['a rectangle', RECT, false],
    ['an L', L_SHAPE, false],
    ['a bow tie', [p(0, 0), p(8, 6), p(8, 0), p(0, 6)], true],
    ['a spike that folds back on its edge', [p(0, 0), p(8, 0), p(4, 0), p(4, 4)], true],
    ['an edge that touches another', [p(0, 0), p(8, 0), p(8, 6), p(4, 0), p(0, 6)], true],
  ])('%s: edges cross is %s', (_name, corners, cross) => {
    expect(edgesCross(corners)).toBe(cross);
  });

  it('a point inside, outside, or on the edge (the edge is not inside)', () => {
    expect(pointInside(p(4, 3), RECT)).toBe(true);
    expect(pointInside(p(6, 5), L_SHAPE)).toBe(false);
    expect(pointInside(p(9, 3), RECT)).toBe(false);
    expect(pointInside(p(8, 3), RECT)).toBe(false);
  });

  it.each([
    ['beside, sharing a wall', [p(8, 0), p(12, 0), p(12, 6), p(8, 6)], false],
    ['apart', [p(20, 0), p(24, 0), p(24, 6), p(20, 6)], false],
    ['crossing', [p(6, 2), p(12, 2), p(12, 4), p(6, 4)], true],
    ['inside', [p(2, 2), p(4, 2), p(4, 4), p(2, 4)], true],
    ['round it', [p(-2, -2), p(10, -2), p(10, 8), p(-2, 8)], true],
    ['the same roof', RECT, true],
  ])('two roofs %s: overlap is %s', (_name, other, overlap) => {
    expect(roofsOverlap(RECT, other)).toBe(overlap);
    expect(roofsOverlap(other, RECT)).toBe(overlap);
  });

  it('the handles: move in the middle, turn beside it, both inside a big roof', () => {
    const handles = roofHandles(RECT, 1.5);
    expect(handles.move).toEqual(p(4, 3));
    expect(handles.turnOutside).toBe(false);
    expect(pointInside(handles.turn, RECT)).toBe(true);
  });

  it('the handles of an L: the move handle is inside the roof, not in the cut-away corner', () => {
    const corners = [p(0, 0), p(8, 0), p(8, 1), p(1, 1), p(1, 8), p(0, 8)];
    expect(pointInside(roofHandles(corners, 0.3).move, corners)).toBe(true);
  });

  it('a small roof: the move handle stays inside, the turn handle steps outside past a corner', () => {
    const small = [p(0, 0), p(2, 0), p(2, 2), p(0, 2)];
    const handles = roofHandles(small, 1.5);
    expect(handles.move).toEqual(p(1, 1));
    expect(handles.turnOutside).toBe(true);
    expect(pointInside(handles.turn, small)).toBe(false);
  });
});

describe('the ground the roofs cover', () => {
  it.each([
    ['no roof', [], null],
    [
      'one roof',
      [{ corners: [p(0, 0), p(8, 0), p(8, 6)] }],
      { west: 0, east: 8, south: 0, north: 6 },
    ],
    [
      'two roofs, apart',
      [{ corners: [p(0, 0), p(8, 0), p(8, 6)] }, { corners: [p(-3, -2), p(-1, -2), p(-1, 1)] }],
      { west: -3, east: 8, south: -2, north: 6 },
    ],
  ])('%s', (_why, roofs, box) => {
    expect(roofsBox(roofs)).toEqual(box);
  });
});
