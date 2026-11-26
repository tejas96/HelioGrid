import { describe, expect, it } from 'vitest';
import { gridToWire } from '../../src/studio/site-grid';
import { roofDataReadsOf, siteGridsOf } from '../../src/studio/site-roof-reads';
import { boxOf, gridOf, inBox } from './site-support';

/**
 * Each drawn roof read on the site data in the studio's Web Worker (`T-M05-002`, part g): the
 * grid that holds it, its building's ground, and the person's line-up moving the map, never the
 * roof.
 */

const HOUSE = boxOf(-6, -5, 6, 5);
/** A house on a hill: its ground 2 m above the datum, its deck 9.1 m above its ground. */
const grid = gridOf(60, 0.5, (p) => (inBox(-6, -5, 6, 5)(p) ? 11.1 : 2));
const site = siteGridsOf(
  [{ grid: gridToWire(grid), surround: gridToWire(grid) }],
  [{ outline: HOUSE, groundM: 2, heightM: null, floorsAbove: null }],
);
const roof = (id: string, corners = HOUSE) => ({ id, corners });

describe('each roof read on the site data', () => {
  it('a roof on its building stands its deck above that building’s ground', () => {
    expect(roofDataReadsOf([roof('a')], site).a).toMatchObject({ kind: 'roof', heightM: 9.1 });
  });

  it('a lift of the map raises the roof; a move drags the map under it', () => {
    expect(roofDataReadsOf([roof('a')], site, { east: 0, north: 0, lift: 0.4 }).a).toMatchObject({
      heightM: 9.5,
    });
    const moved = roofDataReadsOf([roof('a', boxOf(4, -5, 16, 5))], site, {
      east: 10,
      north: 0,
      lift: 0,
    });
    expect(moved.a).toMatchObject({ kind: 'roof', heightM: 9.1 });
  });

  it('a roof off the map reads nothing; one on open ground reads no building', () => {
    const reads = roofDataReadsOf(
      [roof('far', boxOf(100, 100, 108, 108)), roof('yard', boxOf(10, 10, 18, 18))],
      site,
    );
    expect(reads.far).toBeUndefined();
    expect(reads.yard).toEqual({ kind: 'no_building' });
  });

  it('grids whose bytes do not fill their cells are left out', () => {
    const broken = { ...gridToWire(grid), cols: 3 };
    expect(siteGridsOf([{ grid: broken, surround: broken }], []).areas).toEqual([]);
  });
});
