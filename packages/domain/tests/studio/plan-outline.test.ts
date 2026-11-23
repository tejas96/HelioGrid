import { describe, expect, it } from 'vitest';
import { EMPTY_STUDIO_DOCUMENT } from '../../src/studio/document';
import {
  planOutlineCorners,
  planSnapAt,
  planTapAt,
  roofFromPlanOutline,
} from '../../src/studio/plan-outline';
import { planOf, withPlan } from './laid-plan';

/** A roof made from a plan's outline: its corners, a tap on it, and a snap to its lines (`T-M05-002d`). */

describe('planOutlineCorners', () => {
  const plan = planOf({ scaleFrom: 'file', metresPerUnit: 0.001 });
  const limits = { gap: 0.3, min: 3, max: 100 };

  it('drops a corner on a straight run and a repeat, and lays the rest on the ground in metres', () => {
    const points = [0, 0, 6000, 0, 12000, 0, 12000, 8500, 12000, 8500, 0, 8500];
    expect(planOutlineCorners(plan, points, limits)).toEqual([
      { east: 0, north: 0 },
      { east: 12, north: 0 },
      { east: 12, north: 8.5 },
      { east: 0, north: 8.5 },
    ]);
  });

  it('is no roof when fewer than three corners are left, or more than a roof may have', () => {
    expect(planOutlineCorners(plan, [0, 0, 6000, 0, 12000, 0], limits)).toBeNull();
    const ring = Array.from({ length: 120 }, (_, i) => [
      Math.cos(i / 19) * 9000,
      Math.sin(i / 19) * 9000,
    ]).flat();
    expect(planOutlineCorners(plan, ring, limits)).toBeNull();
  });
});

describe('roofFromPlanOutline', () => {
  const OUTLINE = [0, 0, 12000, 0, 12000, 8500, 0, 8500];
  const made = {
    id: 'roof-1',
    tracedOn: 'sky' as const,
    stamp: { source: 'Google', takenOn: null },
  };

  it('makes the roof with the plan’s exact lengths, and stamps the first roof’s picture', () => {
    const design = withPlan({ scaleFrom: 'file', metresPerUnit: 0.001 });
    const result = roofFromPlanOutline(design, OUTLINE, made);
    if (result.kind !== 'made') throw new Error(result.refusal);
    expect(result.document.roofs[0]).toMatchObject({
      id: 'roof-1',
      corners: [
        { east: 0, north: 0 },
        { east: 12, north: 0 },
        { east: 12, north: 8.5 },
        { east: 0, north: 8.5 },
      ],
      edges: ['plan', 'plan', 'plan', 'plan'],
      tracedOn: 'sky',
    });
    expect(result.document.drawnOn).toEqual(made.stamp);
  });

  it('makes no second roof on an outline that has its roof, and none with no plan laid', () => {
    const design = withPlan({ scaleFrom: 'file', metresPerUnit: 0.001 });
    const once = roofFromPlanOutline(design, OUTLINE, made);
    if (once.kind !== 'made') throw new Error('first');
    expect(roofFromPlanOutline(once.document, OUTLINE, { ...made, id: 'roof-2' })).toEqual({
      kind: 'refused',
      refusal: 'no_outline',
    });
    expect(roofFromPlanOutline(EMPTY_STUDIO_DOCUMENT, OUTLINE, made)).toEqual({
      kind: 'refused',
      refusal: 'no_outline',
    });
  });
});

describe('planTapAt', () => {
  // A 12 × 8.5 m house with a 3 × 2.5 m stair room in its corner, in mm, laid on the pin.
  const plan = planOf({ scaleFrom: 'file', metresPerUnit: 0.001 });
  const lines = {
    extent: { west: 0, south: 0, east: 12000, north: 8500 },
    lines: [
      { points: [0, 0, 12000, 0, 12000, 8500, 0, 8500], closed: true },
      { points: [9000, 6000, 12000, 6000, 12000, 8500, 9000, 8500], closed: true },
      { points: [5000, 0, 5000, 8500], closed: false },
    ],
  };
  const at = (east: number, north: number) => ({ east, north });

  it.each([
    ['inside the house, the house', false, at(2, 2), { kind: 'outline', line: 0 }],
    ['inside the stair room, the smaller room', false, at(10, 7), { kind: 'outline', line: 1 }],
    ['off the plan, nothing', false, at(20, 20), { kind: 'none' }],
    ['picked, off the plan: put down', true, at(20, 20), { kind: 'put_down' }],
    ['picked, on the plan: nothing, its handles take it', true, at(2, 2), { kind: 'none' }],
  ] as const)('a tap %s', (_, picked, spot, tap) => {
    expect(planTapAt(plan, lines, picked, spot)).toEqual(tap);
  });

  it('picks the plan from a spot on it inside no outline', () => {
    const open = { ...lines, lines: [lines.lines[2] as (typeof lines.lines)[number]] };
    expect(planTapAt(plan, open, false, at(2, 2))).toEqual({ kind: 'pick' });
  });

  it('lets every tap through a locked or hidden plan', () => {
    expect(planTapAt({ ...plan, locked: true }, lines, false, at(2, 2))).toEqual({ kind: 'none' });
    expect(planTapAt({ ...plan, hidden: true }, lines, true, at(20, 20))).toEqual({ kind: 'none' });
  });
});

describe('planSnapAt', () => {
  const plan = planOf({ scaleFrom: 'file', metresPerUnit: 0.001 });
  const lines = [{ points: [0, 0, 12000, 0, 12000, 8500, 0, 8500], closed: true }];

  it.each([
    [
      'near a corner, onto the corner',
      { east: 11.8, north: 0.3 },
      { point: { east: 12, north: 0 }, on: 'corner' },
    ],
    [
      'near a wall, onto the wall',
      { east: 6, north: 0.3 },
      { point: { east: 6, north: 0 }, on: 'line' },
    ],
    [
      'near the closing wall of a ring, onto it',
      { east: 0.3, north: 4 },
      { point: { east: 0, north: 4 }, on: 'line' },
    ],
    ['far from every line, nowhere', { east: 6, north: 4 }, null],
  ] as const)('a spot %s', (_, spot, snapped) => {
    expect(planSnapAt(plan, lines, spot, 0.5)).toEqual(snapped);
  });

  it('a hidden plan takes no spot', () => {
    expect(planSnapAt({ ...plan, hidden: true }, lines, { east: 12, north: 0 }, 0.5)).toBeNull();
  });
});
