import { describe, expect, it } from 'vitest';
import { mainGroupOf, roofFitOf } from '../../src/studio/site-roof-fit';
import { boxOf, gridOf, inBox } from './site-support';

/**
 * An outline drawn over parts at different heights (`T-M05-002`, part g): a tower and its annex,
 * a roof under trees. The map is read on its main part alone, never as one plane over all of it —
 * that reads a tower and its annex as a 40° slope.
 */

const RADIANS = Math.PI / 180;
const HOUSE = boxOf(-6, -5, 6, 5);
const inHouse = inBox(-6, -5, 6, 5);

/** Heights running on from `from` to `to`, a cell each 0.1 m: a slope's. */
const runOf = (from: number, to: number) =>
  Array.from(
    { length: Math.round((to - from) * 10) + 1 },
    (_, i) => Math.round((from + i * 0.1) * 10) / 10,
  );
/** `count` tens of cells at `heightM`. */
const many = (count: number, heightM: number) => Array.from({ length: count * 10 }, () => heightM);
/** Each height ten times: a part as many cells hold it, beside a wall's few. */
const dense = (heights: readonly number[]) =>
  heights.flatMap((h) => Array.from({ length: 10 }, () => h));

describe('the main part of an outline over parts at different heights', () => {
  it.each([
    [
      'a storey’s step between two fair shares: the larger part',
      [...many(6, 21.9), ...many(4, 8)],
      [21.9, 21.9],
    ],
    ['the step just short of 1.5 m: one roof', [...many(6, 9.49), ...many(4, 8)], null],
    ['the step at 1.5 m: two parts', [...many(6, 9.5), ...many(4, 8)], [9.5, 9.5]],
    ['a tank on a tenth of it: the deck', [...many(9, 6), ...many(1, 8)], [6, 6]],
    ['three parts: the fullest', [...many(3, 20), ...many(4, 12), ...many(3, 4)], [12, 12]],
    ['heights that run on, a slope: one roof', runOf(4, 7.6), null],
    ['a slope under trees: the slope', [...runOf(4, 7.6), ...runOf(11, 14).slice(0, 12)], [4, 7.6]],
    [
      'a tower over its annex, walls between: the tower',
      [
        ...dense(runOf(20, 22.9)),
        ...dense(runOf(20, 22.9)),
        ...dense(runOf(3, 8)),
        ...[9, 11, 13, 15, 17, 19],
      ],
      [20, 22.9],
    ],
  ] as const)('%s', (_, heights, range) => {
    const found = mainGroupOf(heights);
    expect(found === null ? null : [found.low, found.high]).toEqual(range);
  });

  it('a slope under trees reads as the slope, its trees left out', () => {
    const rise = Math.tan(20 * RADIANS);
    const grid = gridOf(60, 0.25, (p) => {
      if (!inHouse(p)) return 0;
      // Trees 5 m over the roof's south-west corner, a fifth of it.
      if (p.east < -2 && p.north < -2) return 8 - rise * (p.north + 5) + 5;
      return 8 - rise * (p.north + 5);
    });
    const fit = roofFitOf(grid, HOUSE, 0);
    expect(fit).toMatchObject({ kind: 'roof', facingDeg: 0 });
    if (fit?.kind === 'roof') expect(fit.slopeDeg).toBeCloseTo(20, 0);
  });

  it('a tower whose top is two decks, over its annex: flat, on the tower', () => {
    const grid = gridOf(60, 0.25, (p) => {
      if (!inHouse(p)) return 0;
      if (p.north > 2) return 6;
      return p.east > 0 ? 22.3 : 20.2;
    });
    const fit = roofFitOf(grid, HOUSE, 0);
    expect(fit).toMatchObject({ kind: 'roof', slopeDeg: 0, clear: false });
    if (fit?.kind === 'roof') expect(fit.heightM).toBeGreaterThan(20);
  });
});
