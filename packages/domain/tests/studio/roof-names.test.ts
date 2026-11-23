import { describe, expect, it } from 'vitest';
import { roofNameOf, roofNumber } from '../../src/studio/roof-names';
import { box, designOf, kindOf, SHED, stairOn, TERRACE } from './roof-meet-support';

/**
 * What a roof is called (`T-M05-002`, part e): "Roof n" names only a roof on the ground; a roof
 * that stands on another, or is part of one, is named by its kind.
 */
describe('what a roof is called', () => {
  const design = designOf(
    TERRACE,
    stairOn(box(0, 0, 3, 3)),
    SHED,
    kindOf('tank', 'upper_floor', box(1, 1, 1, 1), { on: 'stair' }),
    kindOf('yard', 'open_shed', box(30, 0, 4, 4)),
    kindOf('duct', 'hole', box(11, 2, 1, 1), { partOf: 'shed' }),
  );

  it.each([
    ['the first roof on the ground', 0, { kind: 'roof', number: 1 }],
    ['a stair room: by its kind, and the roof it stands on', 1, { kind: 'stair_room', with: 1 }],
    [
      'the second roof on the ground: Roof 2, though it is third in the design',
      2,
      { kind: 'roof', number: 2 },
    ],
    [
      'a roof on a stair room: it goes with no numbered roof',
      3,
      { kind: 'upper_floor', with: null },
    ],
    ['an open shed in a yard: by its kind', 4, { kind: 'open_shed', with: null }],
    ['a hole in Roof 2', 5, { kind: 'hole', with: 2 }],
  ] as const)('%s', (_why, index, name) => {
    expect(roofNameOf(design, index)).toEqual(name);
  });

  it('only a roof on the ground has a number', () => {
    expect([0, 1, 2, 3, 4, 5].map((index) => roofNumber(design, index))).toEqual([
      1,
      null,
      2,
      null,
      null,
      null,
    ]);
    expect(roofNameOf(design, 9)).toBeNull();
  });
});
