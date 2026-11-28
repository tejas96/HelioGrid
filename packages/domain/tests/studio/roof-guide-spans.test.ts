import { describe, expect, it } from 'vitest';
import type { GroundPoint } from '../../src/studio/ground';
import { fullSpanOf, guideSpansOf } from '../../src/studio/roof-guide-spans';
import { penCrossOf } from '../../src/studio/roof-pen-cross';
import { snapTargetsOf } from '../../src/studio/roof-snap';
import { draftSpot } from '../../src/studio/roof-snap-spot';
import { drawing } from '../../src/studio/roof-step-draw';
import type { RoofStepState } from '../../src/studio/roof-step-state';
import { box, roofOf } from './roof-meet-support';

/**
 * Guides as drawn (`T-M05-002`, part e): each a straight line right across the map; only the
 * nearest faint line shows; and the pen's cross drops an arm a held guide already draws.
 */

const at = (east: number, north: number): GroundPoint => ({ east, north });
const near = (a: GroundPoint, b: GroundPoint) => {
  expect(a.east).toBeCloseTo(b.east, 6);
  expect(a.north).toBeCloseTo(b.north, 6);
};

describe('a guide is a straight line right across the map', () => {
  it('runs 400 m each way through its point', () => {
    const span = fullSpanOf({ through: at(0, 0), way: at(0, 1) });
    near(span.from, at(0, -400));
    near(span.to, at(0, 400));
  });

  it('while drawing: every guide of the spot crosses the map', () => {
    const corners = [at(0, 0), at(8, 0), at(8, 3), at(4, 3), at(4, 6)];
    const state = drawing(true, corners);
    if (state.kind !== 'drawing') throw new Error('not drawing');
    const spot = draftSpot(corners, at(0.1, 6.05), snapTargetsOf([]), true);
    const spans = guideSpansOf({ ...state, pointer: at(0.1, 6.05), spot, reach: 0.5 });
    expect(spans).toHaveLength(spot.guides.length);
    for (const { from, to } of spans) {
      expect(Math.hypot(to.east - from.east, to.north - from.north)).toBeCloseTo(800, 6);
    }
  });
});

describe('only the nearest faint line', () => {
  it('two walls a little out of reach: one faint line', () => {
    const roofs = [roofOf('a', box(0, 0, 8, 6)), roofOf('b', box(0, 6.6, 8, 4))];
    const spot = draftSpot([], at(4, 6.3), snapTargetsOf(roofs), true, 0.2);
    expect(spot.guides.filter((guide) => guide.soft === true)).toHaveLength(1);
  });
});

describe('the pen’s cross drops an arm a held guide draws', () => {
  const corners = [at(0, 0), at(10, 0)];
  const base = drawing(true, corners);
  if (base.kind !== 'drawing') throw new Error('not drawing');
  const withGuide = (way: GroundPoint): RoofStepState => ({
    ...base,
    pointer: at(10, 4),
    spot: { point: at(10, 4), snap: { kind: 'square' }, guides: [{ through: at(10, 0), way }] },
  });

  it.each([
    ['a guide along an arm: that arm goes', at(0, 1), 1],
    ['a guide 10° off an arm: that arm goes', at(Math.sin(0.1745), Math.cos(0.1745)), 1],
    ['a guide 20° off both arms: both stay', at(Math.sin(0.349), Math.cos(0.349)), 2],
  ] as const)('%s', (_why, way, arms) => {
    expect(penCrossOf(withGuide(way))).toHaveLength(arms);
  });
});
