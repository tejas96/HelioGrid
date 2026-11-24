import { describe, expect, it } from 'vitest';
import { holeFitOf, holeMeets } from '../../src/studio/roof-hole-fit';
import { ringAreaM2 } from '../../src/studio/roof-polygons';
import { box, p, TERRACE } from './roof-meet-support';

/**
 * How a hole fits the roof it is cut in (`T-M05-002`, part e, E015): clear inside it is a hole;
 * along the edge it is a notch in the roof's outline; at a corner alone it moves clear.
 */
describe('how a hole meets its roof’s edge', () => {
  it.each([
    ['clear inside', box(4, 3, 1, 1), 'inside'],
    ['along the edge: it changes the outline', box(4, 0, 1, 1), 'on_edge'],
    ['0.2 m from the edge: along it', box(4, 0.2, 1, 1), 'on_edge'],
    ['at a corner alone: it is moved clear', [p(10, 8), p(9, 7.5), p(9.5, 7)], 'corner_only'],
  ] as const)('%s', (_why, hole, meets) => {
    expect(holeMeets(TERRACE.corners, hole)).toBe(meets);
  });
});

describe('how a hole fits its roof', () => {
  const clearOfEdge = (corners: readonly { east: number; north: number }[]) =>
    Math.min(...corners.map((c) => Math.min(c.east, c.north, 10 - c.east, 8 - c.north)));

  it.each([
    ['clear inside: it stays a hole', box(4, 3, 1, 1), 'inside', null],
    ['along the edge: the outline takes the notch', box(4, 0, 1, 1), 'notch', 79],
    ['just short of the edge: the notch reaches the edge', box(4, 0.2, 1, 1), 'notch', 78.8],
    [
      'across the whole roof: it would part the roof, so it stays a hole',
      box(4, 0, 1, 8),
      'inside',
      null,
    ],
  ] as const)('%s', (_why, hole, kind, area) => {
    const fit = holeFitOf(TERRACE.corners, hole);
    expect(fit.kind).toBe(kind);
    if (fit.kind === 'notch') expect(ringAreaM2(fit.outline)).toBeCloseTo(area ?? 0, 6);
  });

  it('touching at a corner alone: it moves clear inside, its shape kept', () => {
    const hole = [p(10, 8), p(9, 7.5), p(9.5, 7)];
    const fit = holeFitOf(TERRACE.corners, hole);
    expect(fit.kind).toBe('moved');
    const corners = fit.kind === 'moved' ? fit.corners : [];
    expect(clearOfEdge(corners)).toBeGreaterThanOrEqual(0.35 - 1e-9);
    expect(clearOfEdge(corners)).toBeLessThan(0.45);
    expect(ringAreaM2(corners)).toBeCloseTo(ringAreaM2(hole), 6);
  });

  it('a hole too big to move clear stays as it is', () => {
    expect(holeFitOf(TERRACE.corners, [p(0, 0), p(10, 4), p(5, 8)]).kind).toBe('inside');
  });
});
