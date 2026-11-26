import { describe, expect, it } from 'vitest';
import type { GroundPoint } from '../../src/studio/ground';
import { eavesOf } from '../../src/studio/site-eaves';
import { cellsInside } from '../../src/studio/site-grid';
import { groundUnder } from '../../src/studio/site-ground';
import {
  planeFacingDeg,
  planeFit,
  planeFitTwice,
  planeSlopeDeg,
} from '../../src/studio/site-plane';
import { mapHeightInside, roofFitOf } from '../../src/studio/site-roof-fit';
import { boxOf, gridOf, inBox, maskOf } from './site-support';

/**
 * A drawn roof stands at its real height (`T-M05-002`, part g): the height map's plane inside the
 * roof, less its building's ground; a sloped roof's slope, facing and eave; a tank or a tree left
 * out; a roof with no building under it told apart.
 */

const RADIANS = Math.PI / 180;
const HOUSE = boxOf(-6, -5, 6, 5);
const inHouse = inBox(-6, -5, 6, 5);

/** A flat house `deck` metres high on level ground at 0. */
const flatHouse = (deck: number, extra: (p: GroundPoint) => number = () => 0) =>
  gridOf(60, 0.25, (p) => (inHouse(p) ? deck + extra(p) : 0));

describe('the plane through a roof’s heights', () => {
  it.each([
    ['level', 0, 0, 0, null],
    ['down to the east at 6°', -Math.tan(6 * RADIANS), 0, 6, 90],
    ['down to the north at 20°', 0, -Math.tan(20 * RADIANS), 20, 0],
    [
      'down to the south-west at 30°',
      Math.tan(30 * RADIANS) / Math.SQRT2,
      Math.tan(30 * RADIANS) / Math.SQRT2,
      30,
      225,
    ],
    ['just under 3°: flat, no facing', -Math.tan(2.9 * RADIANS), 0, 2.9, null],
  ])('%s', (_, eastRise, northRise, slope, facing) => {
    const grid = gridOf(20, 0.25, (p) => 5 + eastRise * p.east + northRise * p.north);
    const plane = planeFit(cellsInside(grid, boxOf(-5, -5, 5, 5)));
    expect(plane).not.toBeNull();
    if (plane === null) return;
    expect(planeSlopeDeg(plane)).toBeCloseTo(slope, 3);
    const read = planeFacingDeg(plane);
    if (facing === null) expect(read).toBeNull();
    else expect(read).toBeCloseTo(facing, 3);
    expect(plane.rmseM).toBeLessThan(1e-4);
  });

  it.each([
    ['eleven cells: too few', 11, null],
    ['twelve cells in one line: no plane', 12, null],
  ])('%s', (_, count) => {
    const cells = Array.from({ length: count }, (_, i) => ({ east: i, north: 0, height: 3 }));
    expect(planeFit(cells)).toBeNull();
  });

  it('a second pass leaves out what stands a metre off the first plane', () => {
    const grid = gridOf(20, 0.5, (p) => (inBox(2, 2, 4, 4)(p) ? 7.5 : 5));
    const cells = cellsInside(grid, boxOf(-5, -5, 5, 5));
    const once = planeFit(cells);
    const twice = planeFitTwice(cells);
    expect(once?.rmseM ?? 0).toBeGreaterThan(0.3);
    expect(twice?.height).toBeCloseTo(5, 6);
    expect(twice?.rmseM).toBeCloseTo(0, 6);
  });
});

describe('a drawn roof’s height, slope and facing from the height map', () => {
  it('a flat terrace stands at its deck', () => {
    expect(roofFitOf(flatHouse(9.1), HOUSE, 0)).toMatchObject({
      kind: 'roof',
      heightM: 9.1,
      slopeDeg: 0,
      facingDeg: null,
      clear: true,
    });
  });

  it.each([
    ['a stair room 2.4 m high', 2.4],
    ['a tank 0.61 m high', 0.61],
  ])('%s on the terrace is left out of its height', (_, rise) => {
    const grid = flatHouse(9.1, (p) => (inBox(2, 1, 5, 4)(p) ? rise : 0));
    expect(roofFitOf(grid, HOUSE, 0)).toMatchObject({ kind: 'roof', heightM: 9.1 });
  });

  it('a roof drawn past its parapet reads its deck, not the edge', () => {
    const grid = flatHouse(9.1, (p) => (inHouse(p) && !inBox(-5.6, -4.6, 5.6, 4.6)(p) ? 1 : 0));
    expect(roofFitOf(grid, HOUSE, 0)).toMatchObject({ heightM: 9.1 });
  });

  it('a shed sloping 6° to the east: its slope, its facing and its eave at the low edge', () => {
    const rise = Math.tan(6 * RADIANS);
    const grid = gridOf(60, 0.25, (p) => (inHouse(p) ? 6 - rise * (p.east + 6) : 0));
    expect(roofFitOf(grid, HOUSE, 0)).toMatchObject({
      kind: 'roof',
      slopeDeg: 6,
      facingDeg: 90,
      heightM: Math.round((6 - rise * 12) * 100) / 100,
      clear: true,
    });
  });

  it('a roof on a hill stands above its own ground', () => {
    const grid = gridOf(60, 0.25, (p) => (inHouse(p) ? 30 + 6.3 : 30));
    expect(roofFitOf(grid, HOUSE, 30)).toMatchObject({ heightM: 6.3 });
  });

  it.each([
    ['0.99 m above its ground: no building', 0.99, 'no_building'],
    ['1 m above its ground: a building', 1, 'roof'],
  ])('a roof whose middle stands %s', (_, deck, kind) => {
    expect(roofFitOf(flatHouse(deck), HOUSE, 0)?.kind).toBe(kind);
  });

  it('a roof the map cannot read clearly keeps its best height and says so', () => {
    const grid = flatHouse(7, (p) =>
      (Math.floor(p.east * 4) + Math.floor(p.north * 4)) % 2 === 0 ? 0.9 : 0,
    );
    const fit = roofFitOf(grid, HOUSE, 0);
    expect(fit).toMatchObject({ kind: 'roof', clear: false, slopeDeg: 0, facingDeg: null });
    if (fit?.kind === 'roof') expect(fit.heightM).toBeGreaterThanOrEqual(7);
  });

  it('a sloped roof the map cannot read clearly keeps its slope and facing, and says so', () => {
    const rise = Math.tan(20 * RADIANS);
    const grid = gridOf(60, 0.25, (p) => {
      if (!inHouse(p)) return 0;
      const noise = (Math.floor(p.east * 4) + Math.floor(p.north * 4)) % 2 === 0 ? 0.9 : 0;
      return 8 - rise * (p.north + 5) + noise;
    });
    const fit = roofFitOf(grid, HOUSE, 0);
    expect(fit).toMatchObject({ kind: 'roof', clear: false, facingDeg: 0 });
    if (fit?.kind === 'roof') expect(fit.slopeDeg).toBeCloseTo(20, 0);
  });

  it.each([
    ['a roof too small for twelve cells', boxOf(0, 0, 0.7, 0.7)],
    ['a roof off the map', boxOf(100, 100, 110, 110)],
    [
      'two corners',
      [
        { east: 0, north: 0 },
        { east: 3, north: 3 },
      ],
    ],
  ])('%s reads nothing', (_, corners) => {
    expect(roofFitOf(flatHouse(9), corners, 0)).toBeNull();
  });

  it('the fit check reads the map inside a roof, bumps and all', () => {
    expect(mapHeightInside(flatHouse(6.1), HOUSE, 0)).toBe(6.1);
    expect(mapHeightInside(flatHouse(6.1), boxOf(0, 0, 0.5, 0.5), 0)).toBeNull();
  });
});

describe('the ground a building stands on', () => {
  const house = (around: (p: GroundPoint) => number) => {
    const grid = gridOf(80, 0.5, (p) => (inHouse(p) ? 20 : around(p)));
    return groundUnder(grid, maskOf(grid, inHouse), HOUSE);
  };

  it('level ground reads as it is', () => {
    expect(house(() => 2)).toBe(2);
  });

  it('trees and cars on a tenth of the ring do not lift it', () => {
    expect(house((p) => (Math.floor(p.east) % 3 === 0 && p.north > 6 ? 6 : 2))).toBe(2);
  });

  it('on a hill, each building reads its own ring', () => {
    const ground = house((p) => 10 + 0.2 * p.north);
    expect(ground).toBeGreaterThan(8.5);
    expect(ground).toBeLessThan(10);
  });

  it('a row house with no open ring reads the lowest of the street within reach', () => {
    const street = inBox(-40, 26, 40, 40);
    const grid = gridOf(80, 0.5, (p) => (street(p) ? 1 : 12));
    const mask = maskOf(grid, (p) => !street(p));
    expect(groundUnder(grid, mask, HOUSE)).toBe(1);
  });

  it.each([
    ['no open cell within 30 m', () => false],
    ['an outline of two corners', () => true],
  ])('%s: no ground', (name, _) => {
    const grid = gridOf(80, 0.5, () => 12);
    const mask = maskOf(grid, () => true);
    const outline = name.startsWith('an outline') ? HOUSE.slice(0, 2) : HOUSE;
    expect(groundUnder(grid, mask, outline)).toBeNull();
  });
});

describe('a building’s eaves', () => {
  it('each wall where the roof falls to the ground is an eave, with its height', () => {
    const eaves = eavesOf(flatHouse(9.1), HOUSE, 0);
    expect(eaves).toHaveLength(4);
    for (const eave of eaves) expect(eave.heightM).toBe(9.1);
  });

  it('a wall under a tree’s crown is no eave: the height stays up outside it', () => {
    const grid = gridOf(60, 0.25, (p) => (inHouse(p) || inBox(-6, 5, 6, 9)(p) ? 9.1 : 0));
    const eaves = eavesOf(grid, HOUSE, 0);
    expect(eaves).toHaveLength(3);
    expect(eaves.some((eave) => eave.from.north === 5 && eave.to.north === 5)).toBe(false);
  });

  it.each([
    ['a wall 1.99 m high is no eave', 1.99, 0],
    ['a wall 2 m high is', 2, 4],
  ])('%s', (_, deck, count) => {
    expect(eavesOf(flatHouse(deck), HOUSE, 0)).toHaveLength(count);
  });

  it('a jog shorter than 1.5 m is never an eave', () => {
    const jog = [
      { east: -6, north: -5 },
      { east: 6, north: -5 },
      { east: 6, north: 5 },
      { east: 4.6, north: 5 },
      { east: 4.6, north: 5.01 },
      { east: -6, north: 5 },
    ];
    expect(
      eavesOf(flatHouse(9), jog, 0).every(
        (eave) => Math.hypot(eave.to.east - eave.from.east, eave.to.north - eave.from.north) >= 1.5,
      ),
    ).toBe(true);
  });
});
