import { describe, expect, it } from 'vitest';
import type { GroundPoint } from '../../src/studio/ground';
import {
  gridCoarsened,
  gridCut,
  gridFromWire,
  gridToWire,
  heightAt,
} from '../../src/studio/site-grid';
import { roofGroupsOf } from '../../src/studio/site-groups';
import { buildingOutlinesOf, squaredRing } from '../../src/studio/site-outline';
import {
  type PictureGrid,
  pictureFromWire,
  pictureShiftOf,
  pictureToWire,
} from '../../src/studio/site-shift';
import { gridOf, inBox, maskOf } from './site-support';

/**
 * What the site data is made of (`T-M05-002`, part g): building outlines traced and squared, the
 * grids as they travel, the picture lined up by its edges, and one call per group of roofs.
 */

const RADIANS = Math.PI / 180;

describe('building outlines off the building mask', () => {
  it('a turned house is traced as its four corners', () => {
    const turn = 25 * RADIANS;
    const grid = gridOf(60, 0.25, () => 0);
    const mask = maskOf(grid, (p) => {
      const x = p.east * Math.cos(turn) + p.north * Math.sin(turn);
      const y = -p.east * Math.sin(turn) + p.north * Math.cos(turn);
      return Math.abs(x) <= 8 && Math.abs(y) <= 5;
    });
    const [outline] = buildingOutlinesOf(mask);
    expect(outline).toHaveLength(4);
    const side = Math.hypot(
      (outline?.[1]?.east ?? 0) - (outline?.[0]?.east ?? 0),
      (outline?.[1]?.north ?? 0) - (outline?.[0]?.north ?? 0),
    );
    expect([10, 16].some((length) => Math.abs(side - length) < 0.6)).toBe(true);
  });

  it('an L-shaped house keeps its six corners', () => {
    const grid = gridOf(60, 0.25, () => 0);
    const mask = maskOf(grid, (p) => inBox(-8, -6, 8, 0)(p) || inBox(-8, 0, 0, 6)(p));
    expect(buildingOutlinesOf(mask)[0]).toHaveLength(6);
  });

  it.each([
    ['11.4 m² is a car or a tank: no outline', 3.25, 3.5, 0],
    ['12.25 m² is a shed', 3.5, 3.5, 1],
  ])('%s', (_, east, north, count) => {
    const grid = gridOf(30, 0.25, () => 0);
    expect(buildingOutlinesOf(maskOf(grid, inBox(0, 0, east - 0.01, north - 0.01)))).toHaveLength(
      count,
    );
  });

  it('two houses touching only at a corner are two outlines, biggest first', () => {
    const grid = gridOf(60, 0.25, () => 0);
    const mask = maskOf(grid, (p) => inBox(-10, -10, -0.01, -0.01)(p) || inBox(0, 0, 6, 6)(p));
    const outlines = buildingOutlinesOf(mask);
    expect(outlines).toHaveLength(2);
  });

  it('a ring too short to square is kept as it is', () => {
    const triangle = [
      { east: 0, north: 0 },
      { east: 4, north: 0 },
      { east: 0, north: 3 },
    ];
    expect(squaredRing(triangle)).toEqual(triangle);
  });
});

describe('grids as they travel', () => {
  it('heights round-trip to the centimetre; no data stays no data', () => {
    const grid = gridOf(2, 0.5, (p) => (p.east > 0 ? 9.137 : Number.NaN));
    const back = gridFromWire(gridToWire(grid));
    expect(back?.cols).toBe(4);
    expect(heightAt(back ?? grid, { east: 0.75, north: 0.25 })).toBeCloseTo(9.14, 5);
    expect(heightAt(back ?? grid, { east: -0.75, north: 0.25 })).toBeNaN();
  });

  it.each([
    ['327.68 m clamps to two bytes', 400, 327.67],
    ['−327.67 m is the lowest kept', -400, -327.67],
  ])('%s', (_, height, kept) => {
    const back = gridFromWire(gridToWire(gridOf(1, 1, () => height)));
    expect(back?.heights[0]).toBeCloseTo(kept, 2);
  });

  it('bytes that do not fill the cells read as nothing', () => {
    expect(gridFromWire({ ...gridToWire(gridOf(2, 1, () => 1)), cols: 3 })).toBeNull();
    const picture: PictureGrid = {
      west: 0,
      south: 0,
      stepM: 1,
      cols: 2,
      rows: 1,
      values: new Float32Array([0, 1]),
    };
    expect(pictureFromWire({ ...pictureToWire(picture), rows: 2 })).toBeNull();
    expect(Array.from(pictureFromWire(pictureToWire(picture))?.values ?? [])).toEqual([0, 1]);
  });

  it('a cut keeps whole cells inside the box; a box off the grid cuts nothing', () => {
    const grid = gridOf(20, 0.5, () => 1);
    expect(gridCut(grid, { west: -2, east: 2, south: -1, north: 1 })?.cols).toBe(8);
    expect(gridCut(grid, { west: 50, east: 60, south: 50, north: 60 })).toBeNull();
  });

  it('a coarser grid keeps the highest height under each cell', () => {
    const grid = gridOf(2, 0.5, (p) => (p.east > 0.5 && p.north > 0.5 ? 12 : 3));
    const coarse = gridCoarsened(grid, 2);
    expect(Array.from(coarse.heights)).toEqual([3, 3, 3, 12]);
  });
});

describe('the picture lined up with the height map', () => {
  /** A picture of roofs with clear edges, moved by `by`. */
  const pictureOf = (by: GroundPoint): PictureGrid => {
    const grid = gridOf(60, 0.5, (p) => {
      const q = { east: p.east - by.east, north: p.north - by.north };
      return inBox(-6, -5, 6, 5)(q) || inBox(10, 8, 18, 14)(q) || inBox(-20, 12, -12, 20)(q)
        ? 1
        : 0.2;
    });
    const { heights, ...rest } = grid;
    return { ...rest, values: heights };
  };

  it.each([[{ east: 0, north: 0 }], [{ east: 1.5, north: -0.75 }], [{ east: -2.75, north: 2.5 }]])(
    'a picture moved %o is found',
    (by) => {
      const shift = pictureShiftOf(pictureOf(by), pictureOf({ east: 0, north: 0 }));
      expect(shift?.east).toBeCloseTo(by.east, 5);
      expect(shift?.north).toBeCloseTo(by.north, 5);
    },
  );

  it('a picture with nothing to match says nothing', () => {
    const flat: PictureGrid = {
      ...pictureOf({ east: 0, north: 0 }),
      values: new Float32Array(120 * 120).fill(0.5),
    };
    expect(pictureShiftOf(flat, pictureOf({ east: 0, north: 0 }))).toBeNull();
  });

  it('a picture of stripes that match a metre apart is a guess, and says nothing', () => {
    const stripes = (by: number): PictureGrid => {
      const grid = gridOf(40, 0.5, (p) => (Math.floor((p.east - by) / 1) % 2 === 0 ? 1 : 0));
      const { heights, ...rest } = grid;
      return { ...rest, values: heights };
    };
    expect(pictureShiftOf(stripes(0), stripes(0))).toBeNull();
  });
});

describe('the calls a site’s height map takes', () => {
  it('a house is one call round the pin, 50 m out; a roof drawn near it never moves the call', () => {
    expect(roofGroupsOf([])).toEqual([{ middle: { east: 0, north: 0 }, members: [], radiusM: 50 }]);
    expect(roofGroupsOf([{ east: 3, north: 2 }])).toEqual([
      { middle: { east: 0, north: 0 }, members: [0], radiusM: 50 },
    ]);
  });

  it.each([
    ['a roof 70 m from the pin joins its call', 70, 1],
    ['a roof 70.1 m from it gets a call of its own', 70.1, 2],
  ])('%s', (_, east, count) => {
    expect(roofGroupsOf([{ east, north: 0 }])).toHaveLength(count);
  });

  it('each roof is in the one group it joined, whichever middle lies nearer', () => {
    // 65 m from the pin it joins the pin's group, though the second group's middle lies nearer.
    const groups = roofGroupsOf([
      { east: 140, north: 0 },
      { east: 65, north: 0 },
    ]);
    expect(groups.map((group) => group.members)).toEqual([[1], [0]]);
  });

  it('a campus call never asks past 100 m', () => {
    const spread = Array.from({ length: 8 }, (_, i) => ({
      east: 300 + (i % 2) * 65,
      north: 300 + i * 9,
    }));
    for (const group of roofGroupsOf(spread)) expect(group.radiusM).toBeLessThanOrEqual(100);
  });
});
