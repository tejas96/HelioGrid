import { describe, expect, it } from 'vitest';
import type { GroundPoint } from '../../src/studio/ground';
import { outlineCorners } from '../../src/studio/outline-corners';

/** A traced outline cut to its true corners (`T-M05-002`, part g). */

/** A wall traced a metre at a time, every other step 0.3 m inside it; its end left to the next. */
function wobbly(from: GroundPoint, to: GroundPoint): GroundPoint[] {
  const length = Math.hypot(to.east - from.east, to.north - from.north);
  const way = { east: (to.east - from.east) / length, north: (to.north - from.north) / length };
  return Array.from({ length }, (_, i) => {
    const inside = i % 2 === 0 ? 0 : 0.3;
    return {
      east: from.east + way.east * i - way.north * inside,
      north: from.north + way.north * i + way.east * inside,
    };
  });
}

describe('an outline cut to its corners', () => {
  it('a traced outline that steps along its walls is kept to the house’s four corners', () => {
    // A 12 m × 10 m house traced cell by cell: its walls wobble 0.3 m, a corner every metre.
    const steps = [
      ...wobbly({ east: 0, north: 0 }, { east: 12, north: 0 }),
      ...wobbly({ east: 12, north: 0 }, { east: 12, north: 10 }),
      ...wobbly({ east: 12, north: 10 }, { east: 0, north: 10 }),
      ...wobbly({ east: 0, north: 10 }, { east: 0, north: 0 }),
    ];
    // Steps within a parapet's width of the true line are dropped.
    expect(outlineCorners(steps, 0.6)).toHaveLength(4);
  });
});
