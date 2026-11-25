import { describe, expect, it } from 'vitest';
import type { Roof } from '../../src/studio/document';
import type { GroundPoint } from '../../src/studio/ground';
import { draftClose, draftClosesAt, draftGhost, draftTap } from '../../src/studio/roof-draw';
import { magnetOf, NO_SNAP_TARGETS, snapTargetsOf } from '../../src/studio/roof-snap';
import { draftSpot } from '../../src/studio/roof-snap-spot';

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
  height: null,
};

describe('the magnet: one switch, gentle, measured against the long side (T-M05-002, part b)', () => {
  const tilt = (degrees: number) => {
    const r = (degrees * Math.PI) / 180;
    // The third corner of a wall `degrees` off square to the first, 6 m long.
    return p(8 + 6 * Math.sin(r), 6 * Math.cos(r));
  };
  const L_SHAPE = [p(0, 0), p(8, 0), p(8, 3), p(4, 3), p(4, 6)];

  it.each([
    // magnet, the spot, the corners → the snap
    ['on, 1° off square: square', true, tilt(1), [p(0, 0), p(8, 0)], 'square'],
    ['on, 1.99° off square: square', true, tilt(1.99), [p(0, 0), p(8, 0)], 'square'],
    ['on, 2.01° off square: as tapped', true, tilt(2.01), [p(0, 0), p(8, 0)], null],
    ['on, 3° off (a wall truly 87°): as tapped', true, tilt(3), [p(0, 0), p(8, 0)], null],
    ['off, 1° off square: as tapped', false, tilt(1), [p(0, 0), p(8, 0)], null],
    ['on: parallel to the long side, level with corner 1', true, p(0.3, 6.1), L_SHAPE, 'lines_up'],
    ['off: the L’s last corner as tapped', false, p(0.3, 6.1), L_SHAPE, null],
  ] as const)('%s', (_why, magnet, at, corners, snap) => {
    const spot = draftSpot(corners, at, NO_SNAP_TARGETS, magnet);
    expect(spot.snap?.kind ?? null).toBe(snap);
    if (snap === null) {
      expect(spot.point).toEqual(at);
      expect(spot.guides).toEqual([]);
    }
  });

  it('a free spot never lines up with the corner before last: no straight-through corner', () => {
    // 5.7° off square, so nothing holds it; level with A along the last side would make C straight.
    const spot = draftSpot([p(0, 0), p(10, 0), p(10, 5)], p(10.3, 8), NO_SNAP_TARGETS, true);
    expect(spot.point).toEqual(p(10.3, 8));
    expect(spot.snap).toBeNull();
  });

  it.each([
    ['on: onto the other roof’s corner', true, 'corner_of'],
    ['off: where it was tapped', false, null],
  ] as const)('%s', (_why, magnet, snap) => {
    const spot = draftSpot([], p(8.2, 6.3), snapTargetsOf([ROOF_1]), magnet);
    expect(spot.snap?.kind ?? null).toBe(snap);
  });

  it('a square spot comes with its guide: through the last corner, running the new side', () => {
    const spot = draftSpot([p(0, 0), p(8, 0)], tilt(1), NO_SNAP_TARGETS, true);
    near(spot.point, p(8, 6 * Math.cos((1 * Math.PI) / 180)));
    expect(spot.guides).toHaveLength(1);
    near(spot.guides[0]?.through as GroundPoint, p(8, 0));
    near(spot.guides[0]?.way as GroundPoint, p(0, 1));
  });

  it('a side a little off does not bend the next: it is held to the long side', () => {
    // The second side leans 1.9° and is kept as tapped; the third runs back parallel to the first.
    const corners = [p(0, 0), p(10, 0), p(10.1, 3)];
    const spot = draftSpot(corners, p(2, 3.2), NO_SNAP_TARGETS, true);
    expect(spot.snap).toEqual({ kind: 'parallel' });
    near(spot.point, p(2, 3));
  });

  it.each([
    // a side 1.5° off, its length → held, or as tapped once the hold would move it past SNAP_M
    ['10 m: moved 0.26 m, held', 10, 'square'],
    ['19 m: moved 0.497 m, held', 19, 'square'],
    ['20 m: moved 0.52 m, as tapped', 20, null],
  ] as const)('%s', (_why, metres, snap) => {
    const r = (1.5 * Math.PI) / 180;
    const at = p(8 + metres * Math.sin(r), metres * Math.cos(r));
    expect(draftSpot([p(0, 0), p(8, 0)], at, NO_SNAP_TARGETS, true).snap?.kind ?? null).toBe(snap);
  });

  it.each([
    ['nothing turned off, no Alt: on', [], false, true],
    ['Alt held: off for the move', [], true, false],
    ['any helper turned off once: off', ['square'], false, false],
  ] as const)('%s', (_why, off, free, on) => {
    expect(magnetOf(off, free)).toBe(on);
  });
});

describe('drawing a roof: where a tap lands', () => {
  it('the first corner lands where it is tapped', () => {
    expect(draftSpot([], p(3.3, 4.4), NO_SNAP_TARGETS, true)).toEqual({
      point: p(3.3, 4.4),
      snap: null,
      guides: [],
    });
  });

  it('a corner parallel to the long side and level with an earlier corner lines up with it', () => {
    // An L: the fifth corner is tapped 0.3 m off level with corner 1.
    const corners = [p(0, 0), p(8, 0), p(8, 3), p(4, 3), p(4, 6)];
    const spot = draftSpot(corners, p(0.3, 6.1), NO_SNAP_TARGETS, true);
    near(spot.point, p(0, 6));
    expect(spot.snap).toEqual({ kind: 'lines_up', corner: 0, along: 'parallel' });
    expect(spot.guides).toHaveLength(2);
  });

  it.each([
    [
      '0.4 m from roof 1’s corner: snaps to it',
      p(8.3, 6.3),
      { kind: 'corner_of', owner: { kind: 'roof', roof: 0 } },
      p(8, 6),
    ],
    [
      '0.4 m off roof 1’s edge, off its middle: snaps onto it',
      p(8.4, 2),
      { kind: 'edge_of', owner: { kind: 'roof', roof: 0 } },
      p(8, 2),
    ],
    ['0.6 m off: free', p(8.6, 3), null, p(8.6, 3)],
  ] as const)('%s', (_name, at, snap, point) => {
    const spot = draftSpot([], at, snapTargetsOf([ROOF_1]), true);
    expect(spot.snap).toEqual(snap);
    near(spot.point, point);
  });

  it('a roof skips its own corners as snap targets', () => {
    expect(snapTargetsOf([ROOF_1], 0)).toEqual(NO_SNAP_TARGETS);
  });
});

describe('drawing a roof: taps', () => {
  it('a tap adds a corner', () => {
    expect(draftTap([p(0, 0)], p(8, 0), NO_SNAP_TARGETS, true)).toEqual({
      kind: 'added',
      corners: [p(0, 0), p(8, 0)],
      snap: null,
    });
  });

  it.each([
    // corners placed, the tap → what it does: no two corners nearer than 0.3 m
    ['0.29 m from the last corner adds nothing', [p(0, 0)], p(0.29, 0), 'same'],
    ['0.3 m from it adds a corner', [p(0, 0)], p(0.3, 0), 'added'],
    [
      '0.29 m from an earlier corner is refused',
      [p(0, 0), p(8, 0), p(8, 6)],
      p(0.29, 0),
      'refused',
    ],
    ['0.3 m from it is placed', [p(0, 0), p(8, 0), p(8, 6)], p(0, 0.3), 'added'],
  ])('%s', (_name, corners, at, kind) => {
    // Free, so no snap moves the tap: the gap alone decides.
    expect(draftTap(corners, at, NO_SNAP_TARGETS, false).kind).toBe(kind);
  });

  it('a tap whose edge would cross an earlier one is refused', () => {
    const corners = [p(0, 0), p(8, 0), p(8, 6)];
    expect(draftTap(corners, p(4, -3), NO_SNAP_TARGETS, true)).toEqual({
      kind: 'refused',
      refusal: 'would_cross',
    });
  });

  it.each([
    ['inside another roof', [p(10, 3)], p(4, 3)],
    ['whose edge runs through another roof', [p(-3, 3)], p(11, 3)],
  ])(
    'a tap %s places its corner: no roof is refused for lying over another',
    (_name, corners, at) => {
      expect(draftTap(corners, at, NO_SNAP_TARGETS, false)).toMatchObject({ kind: 'added' });
    },
  );

  it('a tap far past the picture is refused', () => {
    expect(draftTap([], p(2_001, 0), NO_SNAP_TARGETS, true)).toEqual({
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
    expect(draftClose([p(0, 0), p(8, 0), p(8, 6)], [], 'id', 'sky', true)).toEqual({
      kind: 'closed',
      roof: { ...ROOF_1, id: 'id' },
    });
  });

  it('a close with four corners keeps them as drawn', () => {
    const closed = draftClose([p(0, 0), p(8, 0), p(8, 6), p(1, 5)], [], 'id', 'none', true);
    expect(closed.kind === 'closed' && closed.roof.corners).toHaveLength(4);
    expect(closed.kind === 'closed' && closed.roof.tracedOn).toBe('none');
  });

  it.each([
    ['two corners', [p(0, 0), p(8, 0)], [], 'too_few_corners'],
    ['corners on one line', [p(0, 0), p(4, 0), p(8, 0)], [], 'would_cross'],
    ['a closing edge that crosses', [p(0, 0), p(8, 0), p(0, 6), p(8, 6)], [], 'would_cross'],
  ])('a close is refused: %s', (_name, corners, roofs, refusal) => {
    expect(draftClose(corners, roofs, 'id', 'sky', true)).toEqual({ kind: 'refused', refusal });
  });

  it('a roof drawn over another closes: how it meets it says what it is', () => {
    const over = [p(4, 3), p(12, 3), p(12, 9), p(4, 9)];
    expect(draftClose(over, [ROOF_1], 'id', 'sky', true)).toMatchObject({ kind: 'closed' });
  });

  it('a second roof beside the first closes', () => {
    const shed = [p(8, 0), p(12, 0), p(12, 6), p(8, 6)];
    expect(draftClose(shed, [ROOF_1], 'id', 'sky', true).kind).toBe('closed');
  });

  it.each([
    ['the 200th roof closes', 199, 'closed'],
    ['a design holds 200 roofs: the next is refused', 200, 'refused'],
  ])('%s', (_why, standing, kind) => {
    const roofs = Array.from({ length: standing }, (_, i) => ({
      ...ROOF_1,
      corners: ROOF_1.corners.map((c) => p(c.east + i * 10, c.north)),
    }));
    const close = draftClose([p(0, 20), p(8, 20), p(8, 26)], roofs, 'id', 'sky', true);
    expect(close.kind).toBe(kind);
    if (close.kind === 'refused') expect(close.refusal).toBe('too_many_roofs');
  });
});

describe('a tap on the first corner closes the shape', () => {
  const SQUARE = [p(0, 0), p(8, 0), p(8, 6)];
  const BENT = [p(0, 0), p(8, 0), p(9, 6)];
  it.each([
    ['three square corners, on corner 1', SQUARE, p(0.2, 0.2), true],
    ['three square corners, at the snap’s reach', SQUARE, p(0.5, 0), true],
    ['three square corners, just past it', SQUARE, p(0.51, 0), false],
    ['three bent corners, no ghost: closes from three', BENT, p(0.1, 0), true],
    ['two corners: too few to close', [p(0, 0), p(8, 0)], p(0.1, 0), false],
    ['no corner', [], p(0, 0), false],
  ])('%s', (_why, corners, at, closes) => {
    expect(draftClosesAt(corners, at)).toBe(closes);
  });
});
