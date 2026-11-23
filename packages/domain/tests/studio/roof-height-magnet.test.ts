import { describe, expect, it } from 'vitest';
import type { Roof } from '../../src/studio/document';
import { heightPullOf } from '../../src/studio/roof-height-magnet';
import { box, designOf, FACTS, roofOf, SHED, stairOn, TERRACE } from './roof-meet-support';

/**
 * The magnet for a roof's height (`T-M05-002`, part e): within reach of what exists, the height
 * pulls to it — a roof's top, its parapet's top, a whole floor, a round value — and never past it.
 */
const HOUSE = designOf(TERRACE, stairOn(box(0, 0, 3, 3)), SHED);
const SHED_AT = 2;

describe('a roof’s height, dragged', () => {
  it.each([
    ['level with the terrace’s top, 3.0 m', 3.06, 3, 'roof_top'],
    ['level with the terrace’s parapet top, 4.0 m', 3.93, 4, 'parapet_top'],
    ['0.1 m off pulls', 4.1, 4, 'parapet_top'],
    ['level with the stair room’s top, 6.0 m', 6.08, 6, 'roof_top'],
    ['a round value where no roof and no floor is near', 4.46, 4.5, 'round'],
    ['a whole floor above every roof: 9.0 m is G+2', 9.07, 9, 'floor'],
  ] as const)('%s', (_why, dragged, metres, kind) => {
    const pull = heightPullOf(HOUSE, SHED_AT, FACTS, dragged);
    expect(pull?.metres).toBeCloseTo(metres, 9);
    expect(pull?.levelM).toBeCloseTo(metres, 9);
    expect(pull?.to.kind).toBe(kind);
  });

  it.each([
    ['0.115 m off pulls to nothing', 4.115],
    ['between two round values', 5.25],
  ])('%s', (_why, dragged) => {
    expect(heightPullOf(HOUSE, SHED_AT, FACTS, dragged)).toBeNull();
  });

  it('a roof’s top goes before a floor at the same height, and the pull names the roof', () => {
    expect(heightPullOf(HOUSE, SHED_AT, FACTS, 3.02)?.to).toEqual({
      kind: 'roof_top',
      roof: 0,
      name: { kind: 'roof', number: 1 },
    });
  });

  it('a wider reach pulls from farther: the view zoomed out', () => {
    expect(heightPullOf(HOUSE, SHED_AT, FACTS, 3.75)).toBeNull();
    expect(heightPullOf(HOUSE, SHED_AT, FACTS, 3.75, 0.3)?.metres).toBeCloseTo(4, 9);
  });

  it('the level line runs along the side of the roof it pulled to that faces the dragged roof, then along the dragged roof’s side', () => {
    const line = heightPullOf(HOUSE, SHED_AT, FACTS, 3.93)?.line ?? [];
    // The terrace's east side, at east 10, and the shed's west side, on it.
    expect(line).toHaveLength(4);
    expect(line.every((at) => at.east === 10)).toBe(true);
  });

  it('a roof’s own top never pulls it, nor what stands on it', () => {
    // The terrace dragged to 6 m: its stair room's top would be there, and is not a level for it.
    const alone = designOf(TERRACE, stairOn(box(0, 0, 3, 3)));
    expect(heightPullOf(alone, 0, FACTS, 6.05)?.to.kind).toBe('floor');
  });

  it('a roof far across the site does not pull', () => {
    const far = designOf(
      TERRACE,
      roofOf('far', box(60, 0, 5, 5), {
        height: { metres: 4.3, setBy: 'person' },
      } as Partial<Roof>),
    );
    expect(heightPullOf(far, 0, FACTS, 4.33)).toBeNull();
  });

  it('a stair room’s height counts from the roof it stands on: its floors are storeys above it', () => {
    const pull = heightPullOf(HOUSE, 1, FACTS, 2.95);
    expect(pull).toMatchObject({ metres: 3, levelM: 6, to: { kind: 'floor', floors: 0 } });
  });

  it('a hole’s levels pull nothing, and a roof that is not there has no pull', () => {
    expect(heightPullOf(HOUSE, 9, FACTS, 3)).toBeNull();
  });
});
