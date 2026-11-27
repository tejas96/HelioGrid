import type { HeightGrid } from '@heliogrid/domain';
import { describe, expect, it } from 'vitest';
import { shadeCasterOf, shadeCatcherOf, sunlightPiecesOf } from '../../src/react/site-shade-cells';

/**
 * The site's shade and sunlight as the scene draws them (`T-M05-002`, part g): the drawn roofs
 * cast their own shade, so the height map's cells under them and against their walls cast none —
 * unless a neighbour stands taller there — wherever the person lined the map up; and a roof's
 * sunlight never hangs past its walls.
 */

const STEP_M = 0.5;
const SIDE = 60;
const NONE = { east: 0, north: 0, lift: 0 };
/** Six corners a cell, three numbers each. */
const PER_CELL = 18;

/** A grid 30 m a side from (-10, -10), each point's height from `at`. */
function gridOf(at: (east: number, north: number) => number): HeightGrid {
  const heights = new Float32Array(SIDE * SIDE);
  for (let r = 0; r < SIDE; r += 1) {
    for (let c = 0; c < SIDE; c += 1)
      heights[r * SIDE + c] = at(-10 + c * STEP_M, -10 + r * STEP_M);
  }
  return { west: -10, south: -10, stepM: STEP_M, cols: SIDE, rows: SIDE, heights };
}

const box = (west: number, south: number, east: number, north: number) => [
  { east: west, north: south },
  { east, north: south },
  { east, north },
  { east: west, north },
];
const within = (e: number, n: number, w: number, s: number, ea: number, no: number) =>
  e >= w && e < ea && n >= s && n < no;
const cellsCast = (positions: Float32Array) => positions.length / PER_CELL;

describe('the height map’s shadow caster', () => {
  const house = gridOf((e, n) => (within(e, n, 0, 0, 4, 4) ? 6 : 0));
  const roof = { outline: box(0, 0, 4, 4), topM: 6 };

  it('the map under a drawn roof and against its walls casts nothing: the model casts it', () => {
    expect(cellsCast(shadeCasterOf(house, [], NONE))).toBeGreaterThan(0);
    expect(cellsCast(shadeCasterOf(house, [roof], NONE))).toBe(0);
  });

  it.each([
    ['as high as the roof: its wall, left out', 6, false],
    ['taller by more than half a metre: a neighbour’s wall, kept', 12, true],
  ])('a wall half a metre past the roof’s %s', (_, heightM, casts) => {
    const grid = gridOf((e, n) => {
      if (within(e, n, 0, 0, 4, 4)) return 6;
      return within(e, n, 4.5, 0, 5, 4) ? heightM : 0;
    });
    expect(cellsCast(shadeCasterOf(grid, [roof], NONE)) > 0).toBe(casts);
  });

  it.each([
    ['a sloped roof, its ridge 1.75 m over its low edge', (e: number) => 6 + 0.5 * e],
    ['a terrace whose 1 m parapet the map reads', (e: number) => (e < 0.5 || e >= 3.5 ? 7 : 6)],
  ])('%s: its own edge is still its own, though higher than its deck', (_, top) => {
    const grid = gridOf((e, n) => (within(e, n, 0, 0, 4, 4) ? top(e) : 0));
    expect(cellsCast(shadeCasterOf(grid, [roof], NONE))).toBe(0);
  });

  it('lined up, the cut follows the map: the house drawn 2 m east of the map stays cut', () => {
    const drawn = { outline: box(2, 0, 6, 4), topM: 6 };
    expect(cellsCast(shadeCasterOf(house, [drawn], NONE))).toBeGreaterThan(0);
    expect(cellsCast(shadeCasterOf(house, [drawn], { east: 2, north: 0, lift: 0 }))).toBe(0);
  });

  it('lined up, the caster stands where the map was moved and lifted', () => {
    const cast = shadeCasterOf(house, [], { east: 2, north: 0, lift: 1 });
    const xs = Array.from({ length: cast.length / 3 }, (_, i) => cast[i * 3] as number);
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(1.5);
    expect(Math.max(...Array.from(cast).filter((_, i) => i % 3 === 1))).toBe(7);
  });
});

/** The heights a catcher's corners stand at, inside a box on the ground. */
function heightsWithin(
  positions: Float32Array,
  west: number,
  south: number,
  east: number,
  north: number,
) {
  const ys: number[] = [];
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i] as number;
    const n = -(positions[i + 2] as number);
    if (x > west && x < east && n > south && n < north) ys.push(positions[i + 1] as number);
  }
  return ys;
}
const cornersOf = (positions: Float32Array) =>
  Array.from({ length: positions.length / 3 }, (_, i) =>
    Array.from(positions.subarray(i * 3, i * 3 + 3)).join(','),
  );

describe('the height map’s shadow catcher', () => {
  const house = gridOf((e, n) => (within(e, n, 0, 0, 4, 4) ? 6 : 0));

  it('catches shade at the height the map reads: a neighbour’s top catches it up there, not under itself', () => {
    const catcher = shadeCatcherOf(house, NONE);
    expect(heightsWithin(catcher, 0.5, 0.5, 3.5, 3.5).every((y) => y === 6)).toBe(true);
    expect(heightsWithin(catcher, 8, 8, 12, 12).every((y) => y === 0)).toBe(true);
  });

  it('covers the whole map, the bare ground and the drawn roofs’ ground alike', () => {
    expect(cellsCast(shadeCatcherOf(house, NONE))).toBe((SIDE - 1) * (SIDE - 1));
  });

  it('stands on the caster’s own corners, so a top shades nothing of itself', () => {
    const catcher = new Set(cornersOf(shadeCatcherOf(house, NONE)));
    expect(cornersOf(shadeCasterOf(house, [], NONE)).every((corner) => catcher.has(corner))).toBe(
      true,
    );
  });

  it('lined up, the catcher stands where the map was moved and lifted', () => {
    const catcher = shadeCatcherOf(house, { east: 2, north: 0, lift: 1 });
    expect(heightsWithin(catcher, 2.5, 0.5, 5.5, 3.5).every((y) => y === 7)).toBe(true);
  });
});

describe('a roof’s sunlight on its top', () => {
  const corners = box(0, 0, 3.25, 4);
  it.each([
    ['a metre wholly on the roof: whole', { east: 1.5, north: 1.5 }, 1, 0.5],
    [
      'a metre astride the wall: the quarter strip on the roof',
      { east: 3.5, north: 0.5 },
      4,
      0.125,
    ],
  ])('%s', (_, at, count, half) => {
    const pieces = sunlightPiecesOf({ cellM: 1, cells: [{ ...at, share: 0.9 }] }, corners);
    expect(pieces).toHaveLength(count);
    expect(pieces.every((piece) => piece.half === half && piece.share === 0.9)).toBe(true);
    expect(pieces.every((piece) => piece.east + piece.half <= 3.25)).toBe(true);
  });
});
