import { describe, expect, it } from 'vitest';
import type { RoofEdgeTrust } from '../../src/studio/document';
import {
  LABEL_END_ROOM_PX,
  LABEL_GAP_PX,
  type LabelAsk,
  labelLayoutOf,
  type RoofLabelAsk,
  type ScreenPoint,
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
    expect(place?.out).toBe(false);
  });

  it('a roof drawn the other way round still puts its labels outside', () => {
    const place = labelLayoutOf([roofOf([...SQUARE].reverse())])[0]?.[0];
    // Edge 0 now runs (0,100) → (100,100): the bottom edge.
    expect(place?.at.y).toBeCloseTo(100 + OFF, 6);
  });
});

describe('a short edge sends its label out, with a thin line back', () => {
  it.each([
    // label width → sent out
    [100 - 2 * LABEL_END_ROOM_PX, false],
    [100 - 2 * LABEL_END_ROOM_PX + 1, true],
    [10, false],
  ])('a %s px label on a 100 px edge: out %s', (width, out) => {
    const place = labelLayoutOf([roofOf(SQUARE, { width })])[0]?.[0];
    expect(place?.out).toBe(out);
    expect(place?.leaderFrom).toEqual(out ? xy(50, 0) : null);
    if (out) expect(place?.at.y).toBeLessThan(-OFF);
  });
});

describe('where labels touch, picture lengths give way', () => {
  // Roof A's bottom label and roof B's top label meet in the 30 px gap between the roofs.
  const A = [xy(0, 0), xy(100, 0), xy(100, 50), xy(0, 50)];
  const B = [xy(0, 80), xy(120, 80), xy(120, 130), xy(0, 130)];
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
