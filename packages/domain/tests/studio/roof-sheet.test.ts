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
const design: StudioDocument = { ...EMPTY_STUDIO_DOCUMENT, roofs: [LOW, TALL] };

describe('a roof sheet shows its area and height (T-M05-002)', () => {
  it.each([
    // roof, in hand → metres, tier
    [0, null, 3, 'assumed'],
    [1, null, 9, 'estimated'],
    [0, 4.5, 4.5, 'estimated'],
  ] as const)('roof %s, %s in hand: %s m, %s', (roof, inHand, metres, tier) => {
    const sheet = roofSheetOf(design, roof, 3, inHand);
    expect(sheet?.height.metres).toBe(metres);
    expect(sheet?.height.tier).toBe(tier);
    expect(sheet?.systemMetres).toBe(3);
  });

  it('none for a roof that is gone', () => {
    expect(roofSheetOf(design, 2, 3, null)).toBeNull();
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
});

describe('Edit outline in 2D picks the roof and says its height (T-M05-002)', () => {
  it('idle picks it; any other state ignores it', () => {
    const { state } = run([{ kind: 'pick_roof', roof: 1, metres: 9 }], design);
    expect(state).toEqual({
      kind: 'idle',
      roof: 1,
      picked: null,
      said: { kind: 'roof_picked', roof: 1, metres: 9 },
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
    [25, -1, 20],
  ] as const)('%s m, %s: %s m', (from, by, to) => {
    expect(roofHeightStepped(from, by)).toBeCloseTo(to, 6);
  });
});
