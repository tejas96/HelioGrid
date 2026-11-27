import { describe, expect, it } from 'vitest';
import type { RoofEdgeTrust } from '../../src/studio/document';
import {
  CORNER_TOUCH_PX,
  LABEL_END_ROOM_PX,
  LABEL_GAP_PX,
  type LabelAsk,
  labelLayoutOf,
  levelClearOf,
  type RoofLabelAsk,
  type ScreenPoint,
  tagPlaceOf,
} from '../../src/studio/label-layout';

const HEIGHT = 20;
const xy = (x: number, y: number): ScreenPoint => ({ x, y });
/** A label's middle stands this far off its edge: the gap, then half its height. */
const OFF = LABEL_GAP_PX + HEIGHT / 2;

/** A roof on the screen with every edge labelled, `width` wide unless one is given. */
function roofOf(
  corners: ScreenPoint[],
  options: { width?: number; trusts?: RoofEdgeTrust[]; pinned?: number; level?: number } = {},
): RoofLabelAsk {
  const labels: LabelAsk[] = corners.map((from, i) => ({
    from,
    to: corners[(i + 1) % corners.length] as ScreenPoint,
    trust: options.trusts?.[i] ?? 'traced',
    width: options.width ?? 60,
    height: HEIGHT,
    pinned: options.pinned === i,
    level: options.level === i,
  }));
  return { corners, labels };
}

const SQUARE = [xy(0, 0), xy(100, 0), xy(100, 100), xy(0, 100)];

describe('a label lies along its edge, outside the roof, never upside down', () => {
  it.each([
    // edge → middle, turn
    ['the top edge, drawn left to right', 0, xy(50, -OFF), 0],
    ['the right edge, drawn downwards', 1, xy(100 + OFF, 50), 90],
    ['the bottom edge, drawn right to left: read left to right', 2, xy(50, 100 + OFF), 0],
    ['the left edge, drawn upwards', 3, xy(-OFF, 50), 90],
  ])('%s', (_why, edge, at, degrees) => {
    const place = labelLayoutOf([roofOf(SQUARE)])[0]?.[edge];
    expect(place?.at.x).toBeCloseTo(at.x, 6);
    expect(place?.at.y).toBeCloseTo(at.y, 6);
    expect(place?.degrees).toBeCloseTo(degrees, 6);
  });

  it('a roof drawn the other way round still puts its labels outside', () => {
    const place = labelLayoutOf([roofOf([...SQUARE].reverse())])[0]?.[0];
    // Edge 0 now runs (0,100) → (100,100): the bottom edge.
    expect(place?.at.y).toBeCloseTo(100 + OFF, 6);
  });
});

describe('a short edge sends its label out past its corners', () => {
  it.each([
    // label width → sent out
    [100 - 2 * LABEL_END_ROOM_PX, false],
    [100 - 2 * LABEL_END_ROOM_PX + 1, true],
    [10, false],
  ])('a %s px label on a 100 px edge: out %s', (width, out) => {
    const place = labelLayoutOf([roofOf(SQUARE, { width })])[0]?.[0];
    if (out) expect(place?.at.y).toBeLessThan(-OFF);
    else expect(place?.at.y).toBeCloseTo(-OFF, 6);
  });
});

describe('a label keeps out of every corner’s touch target', () => {
  // A U: the notch's floor runs (20,0) → (80,0), and its label, outward, rises into the notch
  // towards the two corners at its top.
  const U = [
    xy(0, -60),
    xy(20, -60),
    xy(20, 0),
    xy(80, 0),
    xy(80, -60),
    xy(100, -60),
    xy(100, 100),
    xy(0, 100),
  ];
  const FLOOR = 2;
  const touchOf = (c: ScreenPoint) => ({
    left: c.x - CORNER_TOUCH_PX / 2,
    right: c.x + CORNER_TOUCH_PX / 2,
    top: c.y - CORNER_TOUCH_PX / 2,
    bottom: c.y + CORNER_TOUCH_PX / 2,
  });
  /** The label's box, upright: the floor's label lies level. */
  const clear = (at: ScreenPoint, width: number) =>
    U.every((c) => {
      const t = touchOf(c);
      return (
        at.x + width / 2 <= t.left ||
        at.x - width / 2 >= t.right ||
        at.y + HEIGHT / 2 <= t.top ||
        at.y - HEIGHT / 2 >= t.bottom
      );
    });

  it('a label that would sit in a corner’s touch target moves out past it', () => {
    const place = labelLayoutOf([roofOf(U, { width: 40 })])[0]?.[FLOOR];
    expect(place && clear(place.at, 40)).toBe(true);
    expect(place?.at.x).toBeCloseTo(50, 6);
  });

  /** The top edge's label of `roof`, laid beside `other`, and whether it clears `other`'s corners. */
  const besideOther = (other: ScreenPoint[]) => {
    const place = labelLayoutOf([roofOf(SQUARE), roofOf(other)])[0]?.[0];
    const clearOf = other.every((c) => {
      const half = CORNER_TOUCH_PX / 2;
      return (
        place !== undefined &&
        (place.at.x + 30 <= c.x - half ||
          place.at.x - 30 >= c.x + half ||
          place.at.y + HEIGHT / 2 <= c.y - half ||
          place.at.y - HEIGHT / 2 >= c.y + half)
      );
    });
    return { place, clearOf };
  };

  it('a label keeps out of another roof’s corners too', () => {
    const { place, clearOf } = besideOther([xy(40, -40), xy(60, -40), xy(50, -30)]);
    expect(clearOf).toBe(true);
    expect(place?.at.y).toBeLessThan(-OFF);
  });

  it('where no step within reach is clear, the label stays where it lay', () => {
    // A column of another roof's corners rises from just over the top edge, past every step.
    const column = [
      xy(40, -30),
      xy(60, -30),
      xy(60, -60),
      xy(60, -90),
      xy(60, -120),
      xy(40, -120),
      xy(40, -90),
      xy(40, -60),
    ];
    expect(besideOther(column).place?.at).toEqual(xy(50, -OFF));
  });

  it('a label already clear stays where it lies', () => {
    const place = labelLayoutOf([roofOf(SQUARE)])[0]?.[0];
    expect(place?.at).toEqual(xy(50, -OFF));
  });
});

describe('where labels touch, picture lengths give way', () => {
  // Roof A's bottom label and roof B's top label meet in the gap between the roofs: each stands
  // the label gap off its edge, so the two overlap by half a label's height.
  const GAP = 2 * LABEL_GAP_PX + HEIGHT / 2;
  const A = [xy(0, 0), xy(100, 0), xy(100, 50), xy(0, 50)];
  const B = [xy(0, 50 + GAP), xy(120, 50 + GAP), xy(120, 100 + GAP), xy(0, 100 + GAP)];
  const A_BOTTOM = 2;
  const B_TOP = 0;
  const shown = (a: RoofLabelAsk, b: RoofLabelAsk) => {
    const [first, second] = labelLayoutOf([a, b]);
    return [first?.[A_BOTTOM]?.shown, second?.[B_TOP]?.shown];
  };

  it.each([
    ['two picture lengths: the longer stays', roofOf(A), roofOf(B), [false, true]],
    [
      'a length a person typed always shows; the picture length gives way',
      roofOf(A, { trusts: ['traced', 'traced', 'typed', 'traced'] }),
      roofOf(B),
      [true, false],
    ],
    [
      'a measured length always shows',
      roofOf(A),
      roofOf(B, { trusts: ['measured', 'traced', 'traced', 'traced'] }),
      [false, true],
    ],
    [
      'the market’s start size gives way, as a picture length does',
      roofOf(A, { trusts: ['traced', 'traced', 'assumed', 'traced'] }),
      roofOf(B),
      [false, true],
    ],
    [
      'two set lengths both show, even touching',
      roofOf(A, { trusts: ['traced', 'traced', 'typed', 'traced'] }),
      roofOf(B, { trusts: ['measured', 'traced', 'traced', 'traced'] }),
      [true, true],
    ],
    [
      'the length being set, or one tapped to see, always shows',
      roofOf(A, { pinned: A_BOTTOM }),
      roofOf(B),
      [true, false],
    ],
  ])('%s', (_why, a, b, expected) => {
    expect(shown(a, b)).toEqual(expected);
  });

  it('labels with room between them both show', () => {
    const far = roofOf(B.map((p) => xy(p.x, p.y + 100)));
    expect(shown(roofOf(A), far)).toEqual([true, true]);
  });
});

describe('the length in hand stays level, clear of its edge (T-M05-002)', () => {
  // Its − and + are pressed, so it never turns: on an upright edge it stands out by half its width.
  it.each([
    ['the right edge', 1, xy(100 + LABEL_GAP_PX + 50, 50)],
    ['the top edge', 0, xy(50, -OFF)],
  ])('%s', (_why, edge, at) => {
    const place = labelLayoutOf([
      roofOf(SQUARE, { width: 100, pinned: edge as number, level: edge as number }),
    ])[0]?.[edge as number];
    expect(place?.degrees).toBe(0);
    expect(place?.at.x).toBeCloseTo(at.x, 6);
    expect(place?.at.y).toBeCloseTo(at.y, 6);
  });
});

describe('labels keep off every handle (T-M05-002)', () => {
  it('a picture length under a handle gives way; a set length still shows', () => {
    // The top edge's label sits just above its middle: a handle there takes its place.
    const handle = { at: xy(50, -OFF), width: 32, height: 32 };
    const traced = labelLayoutOf([roofOf(SQUARE)], [handle])[0]?.[0];
    expect(traced?.shown).toBe(false);
    const set = labelLayoutOf(
      [roofOf(SQUARE, { trusts: ['typed', 'traced', 'traced', 'traced'] })],
      [handle],
    )[0]?.[0];
    expect(set?.shown).toBe(true);
    expect(labelLayoutOf([roofOf(SQUARE)])[0]?.[0]?.shown).toBe(true);
  });
});

describe('a level label steps out off a mark it would sit on (the first corner while drawing)', () => {
  // A 60 × 20 label whose middle is 32 px under its edge's middle, at (50, 32): it steps on down.
  const ask = { at: xy(50, 32), from: xy(50, 0), width: 60, height: HEIGHT };
  const mark = (x: number, y: number) => ({
    at: xy(x, y),
    width: CORNER_TOUCH_PX,
    height: CORNER_TOUCH_PX,
  });
  it.each([
    ['nothing to keep off: it stays', [], xy(50, 32)],
    ['a mark just clear of it: it stays', [mark(102, 32)], xy(50, 32)],
    ['a mark it touches: it steps out until clear', [mark(90, 32)], xy(50, 64)],
    [
      'a mark too far out to clear within reach: it stays',
      [mark(50, 40), mark(50, 90)],
      xy(50, 32),
    ],
  ])('%s', (_name, keepOff, at) => {
    expect(levelClearOf(ask, keepOff)).toEqual(at);
  });
});

describe('a tag beside a spot stays inside the room', () => {
  const room = { left: 8, right: 367, top: 8 };
  const place = (x: number, y: number, width = 100) =>
    tagPlaceOf({ spot: xy(x, y), width, height: 22, room, gap: 16, clear: 12 });

  it.each([
    // case → spot x, tag width, offset across
    ['room on the right: it stands right of the spot', 200, 100, 16],
    ['its far side just on the right edge: still right', 251, 100, 16],
    ['one pixel past the right edge: it turns to the left', 252, 100, -116],
    ['right at the map edge: left', 367, 100, -116],
    ['turned left, its far side just on the left edge', 324, 300, -316],
    ['no room either side: held against the right edge', 200, 300, -133],
    ['wider than the room: from its left edge', 200, 400, -192],
  ])('%s', (_case, x, width, across) => {
    expect(place(x, 100, width).x).toBe(across);
  });

  it.each([
    // case → spot y, offset up or down
    ['room above: it stands above the spot', 100, -34],
    ['its top just on the room top: still above', 42, -34],
    ['one pixel past the top: it drops below', 41, 12],
  ])('%s', (_case, y, down) => {
    expect(place(200, y).y).toBe(down);
  });
});
