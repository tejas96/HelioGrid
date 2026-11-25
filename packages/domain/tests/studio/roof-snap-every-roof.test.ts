import { describe, expect, it } from 'vitest';
import { EMPTY_STUDIO_DOCUMENT, type Roof, type StudioDocument } from '../../src/studio/document';
import type { GroundPoint } from '../../src/studio/ground';
import { draftGhost } from '../../src/studio/roof-draw';
import { cornerDragged } from '../../src/studio/roof-edit';
import { followAlong } from '../../src/studio/roof-follow';
import { roofMoved } from '../../src/studio/roof-move';
import {
  NO_SNAP_TARGETS,
  SNAP_M,
  SNAP_REACH_MAX_M,
  snapReachM,
  snapTargetsOf,
} from '../../src/studio/roof-snap';
import { draftSpot } from '../../src/studio/roof-snap-spot';
import { roofStepAfter } from '../../src/studio/roof-step';
import type { RoofStepState } from '../../src/studio/roof-step-state';
import { heldCircleOf } from '../../src/studio/roof-step-view';

const p = (east: number, north: number): GroundPoint => ({ east, north });
const near = (a: GroundPoint | undefined, b: GroundPoint) => {
  expect(a?.east).toBeCloseTo(b.east, 6);
  expect(a?.north).toBeCloseTo(b.north, 6);
};
const roof = (id: string, corners: GroundPoint[]): Roof => ({
  id,
  corners,
  edges: corners.map(() => 'traced'),
  tracedOn: 'sky',
  height: null,
});
/** The upper terrace: 8 × 6 m. Its south wall runs along north = 0, its east wall along east = 8. */
const UPPER = roof('upper', [p(0, 0), p(8, 0), p(8, 6), p(0, 6)]);
const ON_UPPER = snapTargetsOf([UPPER]);
const WALL_LINE = { kind: 'wall_line', owner: { kind: 'roof', roof: 0 } } as const;
const doc = (roofs: Roof[]): StudioDocument => ({ roofs }) as unknown as StudioDocument;

describe('the magnet knows every roof: wall lines past their ends (T-M05-002, part e)', () => {
  // The lower terrace, drawn from the upper's east wall: (8, 4) → (15, 4), then down to its south wall line.
  const LOWER = [p(8, 4), p(15, 4)];

  it.each([
    // the spot → where it lands, what holds it
    [
      'square and 0.3 m off the wall line: the corner where the two cross',
      p(15.05, 0.3),
      p(15, 0),
      { kind: 'cross', first: { kind: 'square' }, second: WALL_LINE },
    ],
    ['not square, 0.3 m off the wall line: onto the line', p(16.5, 0.3), p(16.5, 0), WALL_LINE],
    ['square, 0.7 m off: square only', p(15.05, 0.7), p(15, 0.7), { kind: 'square' }],
  ] as const)('%s', (_why, at, point, snap) => {
    const spot = draftSpot(LOWER, at, ON_UPPER, true);
    near(spot.point, point);
    expect(spot.snap).toEqual(snap);
  });

  it('a roof drawn 1° off: the wall line holds, not a line through its corner', () => {
    const tilted = [p(8, 4), p(15, 4 + 7 * Math.tan((1 * Math.PI) / 180))];
    const spot = draftSpot(tilted, p(16.5, 0.3), ON_UPPER, true);
    expect(spot.snap).toEqual(WALL_LINE);
    near(spot.point, p(16.5, 0));
  });

  it('two lines held: both drawn, the wall line across the map', () => {
    const spot = draftSpot(LOWER, p(15.05, 0.3), ON_UPPER, true);
    expect(spot.guides.filter((guide) => guide.soft !== true)).toHaveLength(2);
    expect(spot.guides.some((guide) => guide.way.north === 0)).toBe(true);
  });

  it.each([
    ['within 1.5 reach: the line shows faint and pulls nothing', p(15.05, 0.7), true],
    ['past 1.5 reach: nothing shows', p(15.05, 0.8), false],
  ] as const)('%s', (_why, at, soft) => {
    const spot = draftSpot(LOWER, at, ON_UPPER, true);
    expect(spot.guides.some((guide) => guide.soft === true)).toBe(soft);
  });

  it.each([
    ['reach 0.5 m: 0.7 m off is too far', 0.5, p(15, 0.7)],
    ['reach 1 m: 0.7 m off is held', 1, p(15, 0)],
  ] as const)('%s', (_why, reach, point) => {
    near(draftSpot(LOWER, p(15.05, 0.7), ON_UPPER, true, reach).point, point);
  });

  it('magnet off: as tapped, no line', () => {
    expect(draftSpot(LOWER, p(15.05, 0.3), ON_UPPER, false)).toEqual({
      point: p(15.05, 0.3),
      snap: null,
      guides: [],
    });
  });

  it.each([
    ['the middle of a wall pulls like a corner', p(4.2, 6.3), p(4, 6), 'middle_of'],
    ['a roof’s corner wins over a middle', p(8.2, 6.2), p(8, 6), 'corner_of'],
    ['off the middle, onto the wall', p(8.4, 1.8), p(8, 1.8), 'edge_of'],
  ] as const)('%s', (_why, at, point, kind) => {
    const spot = draftSpot([], at, ON_UPPER, true);
    near(spot.point, point);
    expect(spot.snap?.kind).toBe(kind);
  });

  it.each([
    ['1.6° off square to the roof beside it: held square', p(15, 4.2), p(15, 4), 'square'],
    ['1.6° off parallel to it: held parallel', p(8.2, 11), p(8, 11), 'parallel'],
    ['3° off: as tapped', p(15, 4.37), p(15, 4.37), null],
  ] as const)('the first side: %s', (_why, at, point, along) => {
    const spot = draftSpot([p(8, 4)], at, ON_UPPER, true);
    near(spot.point, point);
    expect(spot.snap).toEqual(
      along === null ? null : { kind: 'frame', along, owner: { kind: 'roof', roof: 0 } },
    );
  });
});

describe('two holds together never move a corner further than the reach', () => {
  it.each([
    // square (0.35 m sideways) and level with corner 1 (0.4 m along): 0.53 m in all
    ['both would move it 0.53 m: square alone', p(20.35, 10.6), p(20, 10.6), 'square'],
    ['both move it 0.36 m: square and level', p(20.2, 10.7), p(20, 11), 'lines_up'],
  ] as const)('%s', (_why, at, point, kind) => {
    const spot = draftSpot([p(0, 11), p(0, 0), p(20, 0)], at, NO_SNAP_TARGETS, true);
    near(spot.point, point);
    expect(spot.snap?.kind).toBe(kind);
  });
});

describe('the reach is on the screen, capped on the ground', () => {
  it.each([
    // metres a pixel, a finger → the reach
    ['a finger zoomed in', 0.02, true, 0.4],
    ['a mouse zoomed in', 0.02, false, 0.24],
    ['a finger zoomed out: capped', 0.27, true, SNAP_REACH_MAX_M],
    ['a mouse at the cap exactly', SNAP_REACH_MAX_M / 12, false, SNAP_REACH_MAX_M],
  ] as const)('%s', (_why, metresPerPixel, touch, reach) => {
    expect(snapReachM(metresPerPixel, touch)).toBeCloseTo(reach, 9);
  });

  it('with no reach told, the magnet keeps its old half metre', () => {
    expect(SNAP_M).toBe(0.5);
  });
});

describe('close square: the closing corner offered for any square shape', () => {
  it.each([
    ['three corners, square: the rectangle', [p(0, 0), p(8, 0), p(8, 6)], p(0, 6)],
    ['an L of five: the sixth', [p(0, 0), p(8, 0), p(8, 4), p(14, 4), p(14, 7)], p(0, 7)],
    ['a corner not square: none', [p(0, 0), p(8, 0), p(8.5, 4), p(14, 4), p(14, 7)], null],
    ['two corners: none', [p(0, 0), p(8, 0)], null],
    ['the last side runs along the first: none', [p(0, 0), p(8, 0), p(8, 4), p(2, 4)], null],
  ] as const)('%s', (_why, corners, ghost) => {
    const offered = draftGhost(corners);
    if (ghost === null) expect(offered).toBeNull();
    else near(offered ?? undefined, ghost);
  });
});

describe('Follow the wall: the corners of a shared wall, in one tap', () => {
  it.each([
    [
      'first and last on Roof 1, its corner between: that corner',
      [p(8, 4), p(15, 4), p(15, -2), p(4, -2), p(4, 0)],
      { owner: { kind: 'roof', roof: 0 }, corners: [p(8, 0)] },
    ],
    ['both on one wall: nothing to follow', [p(8, 4), p(15, 4), p(15, 1), p(8, 1)], null],
    ['the last corner off the roof: nothing', [p(8, 4), p(15, 4), p(15, -2), p(4, -2)], null],
    ['two corners: nothing', [p(8, 4), p(8, 0)], null],
    [
      'a lean-to drawn corner to corner along one wall: nothing',
      [p(8, 0), p(12, 0), p(12, 6), p(8, 6)],
      null,
    ],
  ] as const)('%s', (_why, corners, follow) => {
    expect(followAlong(corners, ON_UPPER)).toEqual(follow);
  });
});

describe('Follow is offered only when it can act', () => {
  // 100 corners already: first on Roof 1's east wall, round a wide arc, last on its south wall.
  const arc = Array.from({ length: 98 }, (_, i) => {
    const turn = 0.2 - (1.6 * i) / 97;
    return p(8 + 20 * Math.cos(turn), 20 * Math.sin(turn));
  });
  it.each([
    ['99 corners: room for one more, offered', [p(8, 4), ...arc.slice(1), p(4, 0)], true],
    ['100 corners: no room, not offered', [p(8, 4), ...arc, p(4, 0)], false],
  ] as const)('%s', (_why, corners, offered) => {
    expect(followAlong(corners, ON_UPPER) !== null).toBe(offered);
  });
});

describe('two roofs whose walls share a line', () => {
  it('a spot on the second roof’s wall is on its edge, named for it', () => {
    const shed = roof('shed', [p(12, 0), p(16, 0), p(16, -3), p(12, -3)]);
    const spot = draftSpot([], p(13, 0.2), snapTargetsOf([UPPER, shed]), true);
    expect(spot.snap).toEqual({ kind: 'edge_of', owner: { kind: 'roof', roof: 1 } });
  });
});

describe('a corner dragged and a roof moved get the same lines', () => {
  it('a corner dragged near the wall line takes the cross with its square side', () => {
    const lower = roof('lower', [p(8, 4), p(15, 4), p(15.05, 1), p(10, 0)]);
    const drag = cornerDragged(doc([UPPER, lower]), 1, 2, p(15.05, 0.3), true);
    near(drag.document.roofs[1]?.corners[2], p(15, 0));
    expect(drag.snap?.kind).toBe('cross');
  });

  it.each([
    // the reach → where the corner on a typed 4.21 m side stops
    [
      'reach 0.5 m: the wall line crossing is 0.76 m away, it stays on its circle',
      0.5,
      p(17, 0.3),
      'held',
    ],
    ['reach 1 m: it stops where its circle crosses the wall line', 1, p(16.3, 0), 'cross'],
  ] as const)('a typed length dragged near a wall line, %s', (_why, reach, point, kind) => {
    const lower: Roof = {
      ...roof('lower', [p(8, 4), p(15, 4), p(17, 0.3), p(10, 0)]),
      edges: ['traced', 'typed', 'traced', 'traced'],
    };
    const drag = cornerDragged(doc([UPPER, lower]), 1, 2, p(17, 0.3), true, reach);
    near(drag.document.roofs[1]?.corners[2], point);
    expect(drag.snap?.kind).toBe(kind);
  });

  it('the typed length’s circle stays drawn while the corner rests on a wall line', () => {
    const lower: Roof = {
      ...roof('lower', [p(8, 4), p(15, 4), p(17, 0.3), p(10, 0)]),
      edges: ['traced', 'typed', 'traced', 'traced'],
    };
    const drag = cornerDragged(doc([UPPER, lower]), 1, 2, p(17, 0.3), true, 1);
    const state = { kind: 'dragging', drag } as unknown as RoofStepState;
    expect(heldCircleOf(state)?.centre).toEqual(p(15, 4));
  });

  it('a corner dragged a little out of reach of a wall line shows it faint', () => {
    const lower = roof('lower', [p(8, 4), p(15, 4), p(15.05, 1), p(10, 0)]);
    const drag = cornerDragged(doc([UPPER, lower]), 1, 2, p(15.6, 0.7), true);
    expect(drag.guides.some((guide) => guide.soft === true)).toBe(true);
  });

  it('a roof moved a little out of reach of a wall line shows it faint', () => {
    const shed = roof('shed', [p(9, 6), p(12, 6), p(12, 8), p(9, 8)]);
    const moved = roofMoved(doc([UPPER, shed]), 1, p(5, 0.7), []);
    expect(moved.guides.some((guide) => guide.soft === true)).toBe(true);
  });

  it('a moved roof is held by a wall line on each side at once', () => {
    const lower = roof('lower', [p(12, 0), p(15, 0), p(15, 4), p(12, 4)]);
    const shed = roof('shed', [p(9, 6), p(12, 6), p(12, 8), p(9, 8)]);
    const moved = roofMoved(doc([UPPER, lower, shed]), 2, p(0.3, 0.3), []);
    near(moved.document.roofs[2]?.corners[0], p(9, 6));
    expect(moved.snap).toEqual({
      kind: 'cross',
      first: WALL_LINE,
      second: { kind: 'wall_line', owner: { kind: 'roof', roof: 1 } },
    });
    expect(moved.guides).toHaveLength(2);
  });
});

describe('the roof step carries the reach and Follow', () => {
  const design = { ...EMPTY_STUDIO_DOCUMENT, roofs: [UPPER] };
  const drawn = (corners: GroundPoint[]): RoofStepState => ({
    kind: 'drawing',
    corners,
    pointer: null,
    spot: null,
    refused: null,
    magnet: true,
    wiped: null,
  });

  it.each([
    ['no reach told: the half metre, 0.7 m off is too far', undefined, p(15, 0.7)],
    ['a reach of 1 m told on the pointer: held on the wall line', 1, p(15, 0)],
  ] as const)('%s', (_why, reach, point) => {
    const { state } = roofStepAfter(
      drawn([p(8, 4), p(15, 4)]),
      { kind: 'hover', at: p(15.05, 0.7), ...(reach === undefined ? {} : { reach }) },
      design,
    );
    near(state.kind === 'drawing' ? state.spot?.point : undefined, point);
  });

  it.each([
    ['offered: the shared corner is added', [p(8, 4), p(15, 4), p(15, -2), p(4, -2), p(4, 0)], 6],
    ['not offered: nothing changes', [p(8, 4), p(15, 4), p(15, -2), p(4, -2)], 4],
  ] as const)('Follow %s', (_why, corners, count) => {
    const { state, commit } = roofStepAfter(drawn([...corners]), { kind: 'follow' }, design);
    expect(state.kind === 'drawing' ? state.corners.length : null).toBe(count);
    expect(commit).toBeNull();
  });
});
