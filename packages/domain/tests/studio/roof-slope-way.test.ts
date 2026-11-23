import { describe, expect, it } from 'vitest';
import {
  bearingsApart,
  compassOf,
  gableTurnedFor,
  glassSideOf,
  lowSideOf,
  sideBearing,
} from '../../src/studio/roof-slope-way';
import { box, designOf, FACTS, roofOf, TERRACE } from './roof-meet-support';

/**
 * Which way a roof slopes (`T-M05-002`, part e): a person's tap first, then a taller wall it
 * stands against, else toward the equator. The low side is a side of the roof, never an angle.
 */
const PUNE = 18.5;
const SYDNEY = -33.9;
const RECT = box(0, 0, 10, 6);
const PERSON = { setBy: 'person' } as const;

describe('the compass', () => {
  it.each([
    [0, 'north'],
    [22.4, 'north'],
    [22.6, 'north_east'],
    [90, 'east'],
    [135, 'south_east'],
    [180, 'south'],
    [225, 'south_west'],
    [270, 'west'],
    [315, 'north_west'],
    [359, 'north'],
    [-45, 'north_west'],
    [405, 'north_east'],
  ] as const)('a bearing of %s° is %s', (bearing, way) => {
    expect(compassOf(bearing)).toBe(way);
  });

  it.each([
    [0, 180],
    [1, 90],
    [2, 0],
    [3, 270],
  ])('side %s of a rectangle looks out to %s°, whichever way it was drawn', (side, bearing) => {
    expect(sideBearing(RECT, side)).toBeCloseTo(bearing, 6);
    // Drawn clockwise, the same wall is side 2 − i (the sides run the other way round).
    const turned = [...RECT].reverse();
    expect(sideBearing(turned, (2 - side + 4) % 4)).toBeCloseTo(bearing, 6);
  });

  it.each([
    [10, 350, 20],
    [0, 180, 180],
    [90, 270, 180],
    [45, 45, 0],
  ])('bearings %s° and %s° are %s° apart', (a, b, apart) => {
    expect(bearingsApart(a, b)).toBeCloseTo(apart, 6);
  });
});

describe('a shed roof’s low side', () => {
  it.each([
    ['north of the equator: the side that looks south', PUNE, 0],
    ['south of the equator: the side that looks north', SYDNEY, 2],
  ])('with nothing said, %s', (_why, latitude, side) => {
    expect(lowSideOf(designOf(roofOf('r', RECT)), 0, FACTS, latitude)).toEqual({
      side,
      byPerson: false,
      againstWall: null,
    });
  });

  it('beside a taller roof its high side goes against that wall, so rain runs away from the house', () => {
    // The lean-to stands against the east wall of a two-storey house.
    const house = roofOf('house', box(0, 0, 10, 8), { height: { metres: 6, ...PERSON } });
    const leanTo = roofOf('lean', box(10, 0, 4, 8));
    const low = lowSideOf(designOf(house, leanTo), 1, FACTS, PUNE);
    // Its west side (3) is against the wall: the low side is the east side (1).
    expect(low).toEqual({ side: 1, byPerson: false, againstWall: null });
  });

  it('a roof of the same height beside it is no taller wall: the equator decides', () => {
    expect(
      lowSideOf(designOf(TERRACE, roofOf('lean', box(10, 0, 4, 8))), 1, FACTS, PUNE).side,
    ).toBe(0);
  });

  it('a low side a person put against a taller wall is kept, and says whose wall', () => {
    const house = roofOf('house', box(0, 0, 10, 8), { height: { metres: 6, ...PERSON } });
    const leanTo = roofOf('lean', box(10, 0, 4, 8), { sides: [{}, {}, {}, { low: 'person' }] });
    expect(lowSideOf(designOf(house, leanTo), 1, FACTS, PUNE)).toEqual({
      side: 3,
      byPerson: true,
      againstWall: 0,
    });
  });

  it('the low side is a side of the roof: turned with it, it is still that side', () => {
    const kept = { sides: [{}, { low: 'system' as const }, {}, {}] };
    const turned = [...RECT.slice(1), RECT[0]].filter((corner) => corner !== undefined);
    expect(lowSideOf(designOf(roofOf('r', RECT, kept)), 0, FACTS, PUNE).side).toBe(1);
    expect(lowSideOf(designOf(roofOf('r', turned, kept)), 0, FACTS, PUNE)).toMatchObject({
      side: 1,
      byPerson: false,
    });
  });
});

describe('a gable’s ridge, and a sawtooth’s glass', () => {
  it.each([
    ['a clearly longer roof: the ridge runs along it', box(0, 0, 10, 6), PUNE, false],
    ['a square, north of the equator: an eave already looks south', box(0, 0, 6, 6), PUNE, false],
    [
      'within 10%, long east–west: its eaves look north and south as it is',
      box(0, 0, 6.5, 6),
      PUNE,
      false,
    ],
    [
      'within 10%, long north–south: the ridge is turned so a face looks south',
      box(0, 0, 6, 6.5),
      PUNE,
      true,
    ],
    ['11% longer north–south: no longer near square', box(0, 0, 6, 6.7), PUNE, false],
  ] as const)('%s', (_why, corners, latitude, turned) => {
    expect(gableTurnedFor(corners, latitude)).toBe(turned);
  });

  it.each([
    ['north of the equator: north', PUNE, 2, false],
    ['south of the equator: south', SYDNEY, 0, false],
    ['4.9° from the equator: marked to check', 4.9, 2, true],
    ['5° from the equator: not marked', 5, 2, false],
  ])('the glass faces away from the equator — %s', (_why, latitude, side, toCheck) => {
    expect(glassSideOf(RECT, latitude)).toEqual({ side, toCheck });
  });
});
