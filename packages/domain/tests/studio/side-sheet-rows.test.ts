import { describe, expect, it } from 'vitest';
import { roofSideEnded, roofSideMarked } from '../../src/studio/roof-choices';
import { ROOF_NUMBER_SPECS, type RoofNumber, roofNumberTyped } from '../../src/studio/roof-numbers';
import { sideSheetRowsOf } from '../../src/studio/roof-sheet-build';
import { roofNumberOf } from '../../src/studio/roof-values';
import { roofNumberSet } from '../../src/studio/roof-values-set';
import { roofsWorked } from '../../src/studio/roof-worked';
import { box, designOf, FACTS, roofOf, TERRACE } from './roof-meet-support';
import { LEAN, shaped, sideOf } from './roof-sheet-support';

/**
 * A side's sheet (`T-M05-002`, part e, board 6.3), and a number as its box takes it: which way the
 * side looks, its parapet and why, its own numbers, and what it is to the roof's shape.
 */
describe('a side’s sheet', () => {
  it('names the way the side looks, and follows the roof’s parapet', () => {
    // Side 0 runs west to east along the south: it looks south.
    const side = sideOf(designOf(TERRACE), 0, 0);
    expect(side).toMatchObject({ faces: 'south', parapet: { on: true, why: { kind: 'roof' } } });
    expect(side.parapetHeight?.byPerson).toBe(false);
    expect(side.setback.byPerson).toBe(false);
    expect(side.role).toBeNull();
  });

  it('a seam with a roof of the same height has no parapet, and says with which', () => {
    const next = roofOf('next', box(10, 0, 6, 8));
    // Side 1 of the terrace runs up its east edge, against the next roof.
    const side = sideOf(designOf(TERRACE, next), 0, 1);
    expect(side.parapet).toEqual({
      on: false,
      why: { kind: 'shared', with: { kind: 'roof', number: 2 } },
    });
    expect(side.parapetHeight).toBeNull();
  });

  it('a wall a person took off is theirs', () => {
    const off = {
      ...TERRACE,
      sides: [{ parapet: false }, {}, {}, {}],
    };
    expect(sideOf(designOf(off), 0, 0).parapet).toEqual({ on: false, why: { kind: 'person' } });
  });

  it('a shed’s sides: the low side is said; the others could be', () => {
    const sides = [0, 1, 2, 3].map((side) => sideOf(designOf(LEAN), 0, side).role);
    expect(sides.filter((role) => role?.kind === 'low' && role.is)).toHaveLength(1);
    expect(sides.every((role) => role?.kind === 'low')).toBe(true);
  });

  it('a gable’s two ends are gable ends, its eaves have no role; a hip end turns it', () => {
    const gable = designOf(shaped('gable'));
    // The ridge runs along the long sides (0 and 2): the ends are 1 and 3.
    expect(sideOf(gable, 0, 1).role).toEqual({ kind: 'end', end: 'gable' });
    expect(sideOf(gable, 0, 0).role).toBeNull();
    const hipped = roofSideEnded(gable, 0, 1, 'hip');
    expect(sideOf(hipped, 0, 1).role).toEqual({ kind: 'end', end: 'hip' });
    expect(sideOf(hipped, 0, 3).role).toEqual({ kind: 'end', end: 'gable' });
  });

  it('a sawtooth’s glass faces away from the equator first; a person may turn it', () => {
    const teeth = designOf(shaped('sawtooth'));
    // North of the equator: the glass looks north, side 2.
    expect(sideOf(teeth, 0, 2).role).toEqual({ kind: 'glass', is: true });
    expect(sideOf(teeth, 0, 0).role).toEqual({ kind: 'glass', is: false });
    const turned = roofSideMarked(teeth, 0, 0, 'glass');
    expect(sideOf(turned, 0, 0).role).toEqual({ kind: 'glass', is: true });
  });

  it.each([
    [1.4, false],
    [1.5, false],
    [1.6, true],
  ])('a side’s parapet of %s m waits: %s', (metres, waits) => {
    const set = roofNumberSet(
      designOf(TERRACE),
      { roof: 0, key: 'parapet_height', side: 0 },
      metres,
      FACTS,
    );
    expect(sideOf(set, 0, 0)).toMatchObject({ heightWaits: waits, waits });
    expect(sideOf(set, 0, 1)).toMatchObject({ heightWaits: false, waits: false });
  });

  it('a side past the roof’s corners has no sheet', () => {
    const worked = roofsWorked(designOf(TERRACE), FACTS);
    expect(sideSheetRowsOf(designOf(TERRACE), 0, 4, FACTS, worked, 0)).toBeNull();
    expect(sideSheetRowsOf(designOf(TERRACE), 0, -1, FACTS, worked, 0)).toBeNull();
  });
});

describe('a number as its box takes it', () => {
  const shown = (key: RoofNumber, value: number) => {
    const found = roofNumberOf(
      roofNumberSet(designOf(shaped('butterfly')), { roof: 0, key }, value, FACTS),
      { roof: 0, key },
      FACTS,
    );
    if (found === null) throw new Error('no number');
    return found;
  };

  it.each([
    ['a length in metres', 'setback', 0.75, 'metric', 0.75, 'm', 0.75],
    [
      'a length in feet where feet are used, kept to the centimetre',
      'setback',
      0.9144,
      'imperial',
      2.99,
      'ft',
      0.91,
    ],
    ['a slope in degrees, either way', 'slope', 14, 'imperial', 14, '°', 14],
    ['a valley’s place in per cent', 'valley', 0.25, 'metric', 25, '%', 0.25],
  ] as const)('%s', (_why, key, value, system, typed, unit, back) => {
    const box = roofNumberTyped(shown(key, value), system);
    expect(box.value).toBeCloseTo(typed, 9);
    expect(box.unit).toBe(unit);
    // Back in what the roof stores, which keeps a length to the centimetre.
    expect(box.back(box.value)).toBeCloseTo(back, 2);
  });

  it('a box in feet keeps the ends typing allows, in feet', () => {
    const box = roofNumberTyped(shown('setback', 1), 'imperial');
    expect(box.min).toBe(0);
    expect(box.back(box.max)).toBeCloseTo(ROOF_NUMBER_SPECS.setback.typed.max, 1);
  });
});
