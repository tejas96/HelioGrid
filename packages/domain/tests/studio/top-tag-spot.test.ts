import { describe, expect, it } from 'vitest';
import { pointInside } from '../../src/studio/roof-shape';
import { topTagSpot, topTagSpotsOf } from '../../src/studio/top-tag-spot';

/**
 * A tag on a roof's top stands on that roof's own open top (`T-M05-002g`): a stair room in its
 * middle never carries the roof's tag.
 */

const square = (west: number, south: number, side: number) => [
  { east: west, north: south },
  { east: west + side, north: south },
  { east: west + side, north: south + side },
  { east: west, north: south + side },
];
const ROOF = square(0, 0, 12);
const STAIR_ROOM = square(4, 4, 4);

describe('where a roof’s top tag stands (T-M05-002g)', () => {
  it.each([
    // why, roofs over it → the spot is its middle
    ['nothing stands on it: its middle', [], true],
    ['a room on another part of it: its middle', [square(0, 0, 3)], true],
    ['a stair room in its middle: off it', [STAIR_ROOM], false],
  ] as const)('%s', (_why, over, middle) => {
    const spot = topTagSpot(ROOF, over);
    expect(spot.east === 6 && spot.north === 6).toBe(middle);
    expect(pointInside(spot, ROOF)).toBe(true);
    for (const outline of over) expect(pointInside(spot, outline)).toBe(false);
  });

  it('covered all over: its middle, as before', () => {
    expect(topTagSpot(ROOF, [square(-1, -1, 14)])).toEqual({ east: 6, north: 6 });
  });
});

describe('which roofs of a building cover another’s top (T-M05-002g)', () => {
  const NEXT_DOOR = square(12, 0, 8);
  it.each([
    // why, the building's roofs → which spots are their middles
    ['one roof: its middle', [ROOF], [true]],
    [
      'a stair room on it: the roof’s tag moves off, the room’s stays',
      [ROOF, STAIR_ROOM],
      [false, true],
    ],
    ['the room drawn first: the same', [STAIR_ROOM, ROOF], [true, false]],
    ['two roofs side by side: both middles', [ROOF, NEXT_DOOR], [true, true]],
  ] as const)('%s', (_why, outlines, middles) => {
    const spots = topTagSpotsOf(outlines);
    expect(
      spots.map((spot, at) => {
        const own = outlines[at] ?? [];
        const mean = {
          east: own.reduce((sum, c) => sum + c.east, 0) / own.length,
          north: own.reduce((sum, c) => sum + c.north, 0) / own.length,
        };
        return spot.east === mean.east && spot.north === mean.north;
      }),
    ).toEqual(middles);
  });
});
