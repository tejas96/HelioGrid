import { describe, expect, it } from 'vitest';
import type { Roof } from '../../src/studio/document';
import type { GroundPoint } from '../../src/studio/ground';
import {
  draftClose,
  draftGhost,
  draftSpot,
  draftTap,
  NO_SNAP_TARGETS,
  snapTargetsOf,
} from '../../src/studio/roof-draw';

const p = (east: number, north: number): GroundPoint => ({ east, north });
const near = (a: GroundPoint, b: GroundPoint) => {
  expect(a.east).toBeCloseTo(b.east, 6);
  expect(a.north).toBeCloseTo(b.north, 6);
};
const ROOF_1: Roof = {
  id: 'one',
  corners: [p(0, 0), p(8, 0), p(8, 6), p(0, 6)],
  edges: ['traced', 'traced', 'traced', 'traced'],
  tracedOn: 'sky',
};

describe('drawing a roof: where a tap lands', () => {
  it('the first corner lands where it is tapped', () => {
    expect(draftSpot([], p(3.3, 4.4), NO_SNAP_TARGETS)).toEqual({ point: p(3.3, 4.4), snap: null });
  });

  it.each([
    ['5° off square: snaps square', 5, true],
    ['6° off square: snaps square', 5.99, true],
    ['7° off square: free', 7, false],
  ])('%s', (_name, degrees, snaps) => {
    const r = (degrees * Math.PI) / 180;
    // The last edge runs east; the new one runs north, `degrees` off square.
    const spot = draftSpot(
      [p(0, 0), p(8, 0)],
      p(8 + 5 * Math.sin(r), 5 * Math.cos(r)),
      NO_SNAP_TARGETS,
    );
    expect(spot.snap?.kind === 'square').toBe(snaps);
    if (snaps) expect(spot.point.east).toBeCloseTo(8, 6);
  });

  it('a corner square to the last edge and level with an earlier corner lines up with it', () => {
    // An L: the fifth corner is tapped 0.3 m off level with corner 1.
    const corners = [p(0, 0), p(8, 0), p(8, 3), p(4, 3), p(4, 6)];
    const spot = draftSpot(corners, p(0.3, 6.1), NO_SNAP_TARGETS);
    near(spot.point, p(0, 6));
    expect(spot.snap).toEqual({ kind: 'lines_up', corner: 0 });
  });

  it.each([
    [
      '0.4 m from roof 1’s corner: snaps to it',
      p(8.3, 6.3),
      { kind: 'corner_of', owner: { kind: 'roof', roof: 0 } },
      p(8, 6),
    ],
    [
      '0.4 m off roof 1’s edge: snaps onto it',
      p(8.4, 3),
      { kind: 'edge_of', owner: { kind: 'roof', roof: 0 } },
      p(8, 3),
    ],
    ['0.6 m off: free', p(8.6, 3), null, p(8.6, 3)],
  ] as const)('%s', (_name, at, snap, point) => {
    const spot = draftSpot([], at, snapTargetsOf([ROOF_1]));
    expect(spot.snap).toEqual(snap);
    near(spot.point, point);
  });

  it('a roof skips its own corners as snap targets', () => {
    expect(snapTargetsOf([ROOF_1], 0)).toEqual(NO_SNAP_TARGETS);
  });
});

describe('drawing a roof: taps', () => {
  it('a tap adds a corner', () => {
    expect(draftTap([p(0, 0)], p(8, 0), NO_SNAP_TARGETS, [])).toEqual({
      kind: 'added',
      corners: [p(0, 0), p(8, 0)],
      snap: null,
    });
  });

  it.each([
    ['0.19 m from the last corner adds nothing', p(0.19, 0), 'same'],
    ['0.21 m from it adds a corner', p(0.21, 0), 'added'],
  ])('%s', (_name, at, kind) => {
    expect(draftTap([p(0, 0)], at, NO_SNAP_TARGETS, []).kind).toBe(kind);
  });

  it('a tap whose edge would cross an earlier one is refused', () => {
    const corners = [p(0, 0), p(8, 0), p(8, 6)];
    expect(draftTap(corners, p(4, -3), NO_SNAP_TARGETS, [])).toEqual({
      kind: 'refused',
      refusal: 'would_cross',
    });
  });

  it.each([
    ['inside another roof', [p(10, 3)], p(4, 3)],
    ['an edge through another roof', [p(-3, 3)], p(11, 3)],
  ])('a tap %s is refused', (_name, corners, at) => {
    expect(draftTap(corners, at, NO_SNAP_TARGETS, [ROOF_1])).toEqual({
      kind: 'refused',
      refusal: 'would_overlap',
    });
  });

  it('a tap far past the picture is refused', () => {
    expect(draftTap([], p(2_001, 0), NO_SNAP_TARGETS, [])).toEqual({
      kind: 'refused',
      refusal: 'too_far',
    });
  });
});

describe('drawing a roof: the ghost corner and the close', () => {
  it('three corners with a square one: the fourth is offered', () => {
    expect(draftGhost([p(0, 0), p(8, 0), p(8, 6)])).toEqual(p(0, 6));
  });

  it.each([
    ['not square', [p(0, 0), p(8, 0), p(9, 6)]],
    ['two corners', [p(0, 0), p(8, 0)]],
    ['four corners', [p(0, 0), p(8, 0), p(8, 6), p(4, 7)]],
  ])('no ghost: %s', (_name, corners) => {
    expect(draftGhost(corners)).toBeNull();
  });

  it('a close with the ghost makes the rectangle: every edge traced, on the picture shown', () => {
    expect(draftClose([p(0, 0), p(8, 0), p(8, 6)], [], 'id', 'sky')).toEqual({
      kind: 'closed',
      roof: { ...ROOF_1, id: 'id' },
    });
  });

  it('a close with four corners keeps them as drawn', () => {
    const closed = draftClose([p(0, 0), p(8, 0), p(8, 6), p(1, 5)], [], 'id', 'none');
    expect(closed.kind === 'closed' && closed.roof.corners).toHaveLength(4);
    expect(closed.kind === 'closed' && closed.roof.tracedOn).toBe('none');
  });

  it.each([
    ['two corners', [p(0, 0), p(8, 0)], [], 'too_few_corners'],
    ['corners on one line', [p(0, 0), p(4, 0), p(8, 0)], [], 'would_cross'],
    ['a closing edge that crosses', [p(0, 0), p(8, 0), p(0, 6), p(8, 6)], [], 'would_cross'],
    ['over roof 1', [p(4, 3), p(12, 3), p(12, 9), p(4, 9)], [ROOF_1], 'would_overlap'],
  ])('a close is refused: %s', (_name, corners, roofs, refusal) => {
    expect(draftClose(corners, roofs, 'id', 'sky')).toEqual({ kind: 'refused', refusal });
  });

  it('a second roof beside the first closes', () => {
    const shed = [p(8, 0), p(12, 0), p(12, 6), p(8, 6)];
    expect(draftClose(shed, [ROOF_1], 'id', 'sky').kind).toBe('closed');
  });

  it('a design holds 50 roofs', () => {
    const roofs = Array.from({ length: 50 }, (_, i) => ({
      ...ROOF_1,
      corners: ROOF_1.corners.map((c) => p(c.east + i * 10, c.north)),
    }));
    expect(draftClose([p(0, 20), p(8, 20), p(8, 26)], roofs, 'id', 'sky')).toEqual({
      kind: 'refused',
      refusal: 'too_many_roofs',
    });
  });
});
