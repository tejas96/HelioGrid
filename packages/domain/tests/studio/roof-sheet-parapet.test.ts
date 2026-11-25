import { describe, expect, it } from 'vitest';
import { compassOf } from '../../src/studio/compass';
import type { Roof } from '../../src/studio/document';
import { roofParapetAllRound, roofParapetBuilt } from '../../src/studio/roof-choices';
import { roofWithSideWall } from '../../src/studio/roof-sides';
import { sideBearing } from '../../src/studio/roof-slope-way';
import { roofNumberSet } from '../../src/studio/roof-values-set';
import { designOf, FACTS, TERRACE } from './roof-meet-support';
import { sheetOf } from './roof-sheet-support';

/**
 * The parapet on a roof's sheet: one switch, and everything about its wall under it while a wall
 * stands — what it is built as, its height, a wall's thickness and where the lengths were taped.
 */
describe('the parapet on a roof’s sheet', () => {
  it('a railing has no thickness to set: it stands its own 5 cm', () => {
    const rail = roofParapetBuilt(designOf(TERRACE), 0, 'railing', FACTS);
    expect(sheetOf(rail, 0).parapet).toMatchObject({ build: 'railing', thickness: null });
  });

  it('switched off and on again, the parapet keeps its height and what it is built as', () => {
    const high = roofNumberSet(designOf(TERRACE), { roof: 0, key: 'parapet_height' }, 1.2, FACTS);
    const rail = roofParapetBuilt(high, 0, 'railing', FACTS);
    const back = roofParapetAllRound(roofParapetAllRound(rail, 0, false, FACTS), 0, true, FACTS);
    expect(sheetOf(back, 0).parapet).toMatchObject({ build: 'railing', height: { value: 1.2 } });
  });

  const SOUTH = compassOf(sideBearing(TERRACE.corners, 0));
  const sided = (allRound: boolean, walls: [number, boolean][]) => {
    const switched = roofParapetAllRound(designOf(TERRACE), 0, allRound, FACTS);
    const roof = walls.reduce(
      (held, [side, wall]) => roofWithSideWall(held, side, wall),
      switched.roofs[0] as Roof,
    );
    return sheetOf({ ...switched, roofs: [roof] }, 0).parapet;
  };
  it.each([
    ['all round, no side set apart', true, [], true, null],
    ['all round, one side taken off', true, [[0, false]], true, { walled: 3, of: 4, only: SOUTH }],
    ['all round, a side tapped on again: nothing apart', true, [[0, true]], true, null],
    [
      'all round, two sides taken off',
      true,
      [
        [0, false],
        [1, false],
      ],
      true,
      { walled: 2, of: 4, only: null },
    ],
    [
      'all round, every side taken off: no wall',
      true,
      [
        [0, false],
        [1, false],
        [2, false],
        [3, false],
      ],
      false,
      { walled: 0, of: 4, only: null },
    ],
    ['off, no side set apart: no wall', false, [], false, null],
    ['off, one side added', false, [[0, true]], true, { walled: 1, of: 4, only: SOUTH }],
  ] as const)('%s', (_why, allRound, walls, anyWall, apart) => {
    const parapet = sided(allRound, walls as unknown as [number, boolean][]);
    expect(parapet?.walls).toBe(anyWall);
    expect(parapet?.apart).toEqual(apart);
  });

  it('a high parapet waits on a roof switched off with one side added', () => {
    const set = roofNumberSet(designOf(TERRACE), { roof: 0, key: 'parapet_height' }, 1.8, FACTS);
    const off = roofParapetAllRound(set, 0, false, FACTS);
    const roof = roofWithSideWall(off.roofs[0] as Roof, 0, true);
    expect(sheetOf({ ...off, roofs: [roof] }, 0).parapet?.waits).toBe(true);
  });
});
