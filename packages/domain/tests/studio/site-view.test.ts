import { describe, expect, it } from 'vitest';
import { EMPTY_STUDIO_DOCUMENT, type StudioDocument } from '../../src/studio/document';
import {
  heightKeyOf,
  linedUp,
  lineUpCleared,
  lineUpLifted,
  lineUpNudged,
  lineUpOf,
} from '../../src/studio/site-view';

/**
 * The height view's line-up and key (`T-M05-002`, part g, board G23, G7): 10 cm steps, ±3 m up and
 * down, ±5 m each way, arrows that follow the screen; Back to automatic; the key's two ends.
 */

const design: StudioDocument = { ...EMPTY_STUDIO_DOCUMENT, roofs: [] };

describe('lining the map up by hand', () => {
  it.each([
    ['a lift kept to 10 cm', 0.34, 0.3],
    ['3 m is the most', 3.4, 3],
    ['−3 m the least', -9, -3],
  ])('%s', (_, lift, kept) => {
    expect(lineUpOf(lineUpLifted(design, lift)).lift).toBeCloseTo(kept, 9);
  });

  it('an arrow moves the map 10 cm the way it points on the screen, whatever the camera’s turn', () => {
    const east = lineUpNudged(design, { east: 3, north: 0 });
    expect(lineUpOf(east)).toEqual({ east: 0.1, north: 0, lift: 0 });
    const turned = lineUpNudged(east, { east: 0, north: -1 });
    expect(lineUpOf(turned).north).toBeCloseTo(-0.1, 9);
  });

  it('5 m is as far as the map moves', () => {
    let moved = design;
    for (let i = 0; i < 60; i += 1) moved = lineUpNudged(moved, { east: 1, north: 0 });
    expect(lineUpOf(moved).east).toBeCloseTo(5, 9);
  });

  it('back to automatic, or a line-up back at zero, leaves no line-up stored', () => {
    expect(lineUpCleared(lineUpLifted(design, 1)).site?.lineUp).toBeUndefined();
    expect(lineUpLifted(lineUpLifted(design, 1), 0).site?.lineUp).toBeUndefined();
  });
});

describe('the height view’s key', () => {
  it('runs from the low to the high of the map near the roofs, a pit and a mast left out', () => {
    const heights = [...Array.from({ length: 98 }, (_, i) => (i % 10) * 0.7), -4, 40];
    expect(heightKeyOf(heights)).toEqual({ lowM: 0, highM: 7 });
  });

  it('no height: no key', () => {
    expect(heightKeyOf([Number.NaN])).toBeNull();
  });
});

describe('a point of the map, where the line-up moved it', () => {
  it.each([
    ['no line-up leaves it', { east: 0, north: 0, lift: 0 }, { east: 5, north: 2 }],
    ['east and north move it so', { east: 0.3, north: -0.2, lift: 1 }, { east: 5.3, north: 1.8 }],
  ])('%s', (_, lineUp, moved) => {
    const point = linedUp({ east: 5, north: 2 }, lineUp);
    expect(point.east).toBeCloseTo(moved.east, 9);
    expect(point.north).toBeCloseTo(moved.north, 9);
  });
});
