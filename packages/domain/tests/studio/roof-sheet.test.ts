import { describe, expect, it } from 'vitest';
import type { Roof, StudioDocument } from '../../src/studio/document';
import { EMPTY_STUDIO_DOCUMENT } from '../../src/studio/document';
import type { GroundPoint } from '../../src/studio/ground';
import { roofHeightKept, roofHeightStepped } from '../../src/studio/roof-height';
import { roofHitAt, roofSheetOf } from '../../src/studio/roof-sheet';
import { run } from './roof-step-run';

const p = (east: number, north: number): GroundPoint => ({ east, north });
const roofOf = (corners: GroundPoint[], height: Roof['height'] = null): Roof => ({
  id: `r${corners[0]?.east}`,
  corners,
  edges: corners.map(() => 'traced'),
  tracedOn: 'sky',
  height,
});
const LOW = roofOf([p(0, 0), p(8, 0), p(8, 6), p(0, 6)]);
const TALL = roofOf([p(10, 0), p(16, 0), p(16, 6), p(10, 6)], { metres: 9, setBy: 'person' });
const BLOCK = roofOf([p(20, 0), p(26, 0), p(26, 6), p(20, 6)], { metres: 30, setBy: 'person' });
const design: StudioDocument = { ...EMPTY_STUDIO_DOCUMENT, roofs: [LOW, TALL, BLOCK] };
const FLOORS = { plinthHeightM: 0.45, storeyHeightM: 3 };
const HOUSE = { min: 2, max: 20, step: 0.1 };

describe('a roof sheet shows its area and height (T-M05-002)', () => {
  it.each([
    // roof, in hand → metres, tier
    [0, null, 3, 'assumed'],
    [1, null, 9, 'estimated'],
    [0, 4.5, 4.5, 'estimated'],
  ] as const)('roof %s, %s in hand: %s m, %s', (roof, inHand, metres, tier) => {
    const sheet = roofSheetOf(design, roof, 3, inHand, FLOORS);
    expect(sheet?.height.metres).toBe(metres);
    expect(sheet?.height.tier).toBe(tier);
    expect(sheet?.systemMetres).toBe(3);
  });

  it('none for a roof that is gone', () => {
    expect(roofSheetOf(design, 3, 3, null, FLOORS)).toBeNull();
  });
});

describe('a 3D tap lands on the roof it meets, each at its own height (T-M05-002)', () => {
  // A ray that meets level h at (h + 2, 3): low levels land left, high ones right.
  const ray = (heightM: number) => p(heightM + 2, 3);
  it('meets the tall roof at its own height before the low one', () => {
    expect(roofHitAt(design, [3, 9], ray)).toBe(1);
  });
  it('the low roof when the tall one is missed; none off both', () => {
    expect(roofHitAt(design, [3, 9], (h) => (h === 3 ? p(4, 3) : p(40, 40)))).toBe(0);
    expect(roofHitAt(design, [3, 9], () => p(40, 40))).toBeNull();
    expect(roofHitAt(design, [3, 9], () => null)).toBeNull();
  });
  it.each(['hole', 'dormer'])(
    'a tap on a %s lands on the roof it is in: it has no height to set',
    (is) => {
      const part: Roof = {
        ...roofOf([p(2, 2), p(4, 2), p(4, 4), p(2, 4)]),
        id: 'part',
        kind: { is, setBy: 'system' },
        partOf: LOW.id,
      };
      const withPart: StudioDocument = { ...design, roofs: [LOW, TALL, part] };
      // Its own level stands above the roof's, so only being left out keeps it from the tap.
      expect(roofHitAt(withPart, [3, 9, 4], () => p(3, 3))).toBe(0);
    },
  );
});

describe('Edit outline in 2D picks the roof and says its height (T-M05-002)', () => {
  it('idle picks it; any other state ignores it', () => {
    const { state } = run([{ kind: 'pick_roof', roof: 1, metres: 9 }], design);
    expect(state).toEqual({
      kind: 'idle',
      roof: 1,
      picked: null,
      // The line names the roof: the second roof on the ground is Roof 2.
      said: { kind: 'roof_picked', roof: 1, metres: 9, name: { kind: 'roof', number: 2 } },
    });
  });
});

describe('a height kept: nothing, a change, or why not (T-M05-002)', () => {
  it.each([
    // in hand → kept as
    [null, null],
    [3.04, null],
    [3.05, 'done'],
    [0.2, 'refused'],
    [400, 'refused'],
  ] as const)('%s m in hand on a 3 m roof: %s', (inHand, kind) => {
    expect(roofHeightKept(design, 0, inHand, 3)?.kind ?? null).toBe(kind);
  });
});

describe('a step of the height stays on the slider’s track (T-M05-002)', () => {
  it.each([
    // from, by → to
    [3, 1, 3.1],
    [3, -1, 2.9],
    [2, -1, 2],
    [20, 1, 20],
    // A typed height past the track moves from where it is, never back onto the track.
    [25, -1, 24.9],
    [25, 1, 25.1],
  ] as const)('%s m, %s: %s m', (from, by, to) => {
    expect(roofHeightStepped(from, by, HOUSE)).toBeCloseTo(to, 6);
  });
});

describe('a 30 m roof gets a slider that reaches it (T-M05-002)', () => {
  it('its slider runs to the floor two above it, and its height is on the track', () => {
    const sheet = roofSheetOf(design, 2, 3, null, FLOORS);
    expect(sheet?.slide.max).toBe(36.5);
    expect(sheet?.outside).toBe(false);
  });

  it('a height in hand does not move the ends while it is slid', () => {
    expect(roofSheetOf(design, 0, 3, 19.9, FLOORS)?.slide.max).toBe(20);
  });
});

describe('a height past the slider’s ends is typed, and the switch says so (T-M05-002)', () => {
  it.each([
    // in hand → outside the slider
    [9, false],
    [20, false],
    [25, true],
    [1.5, true],
  ])('%s m: %s', (inHand, outside) => {
    expect(roofSheetOf(design, 0, 3, inHand, FLOORS)?.outside).toBe(outside);
  });
});
