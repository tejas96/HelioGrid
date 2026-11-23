import { describe, expect, it } from 'vitest';
import { roofMaterialPicked } from '../../src/studio/roof-material-set';
import {
  type NumberAt,
  ROOF_NUMBER_SPECS,
  ROOF_NUMBERS,
  type RoofNumber,
  roofNumberOf,
} from '../../src/studio/roof-values';
import { roofNumberHeld, roofNumberReset, roofNumberSet } from '../../src/studio/roof-values-set';
import { box, designOf, FACTS, kindOf, roofOf, SHED, TERRACE } from './roof-meet-support';

/**
 * The numbers a roof's sheet sets (`T-M05-002`, part e): each starts as the studio's own value, a
 * person's value is kept and marked theirs, and a reset leaves the roof as it was.
 */
const HOUSE = designOf(TERRACE, SHED);
const at = (roof: number, key: RoofNumber, side?: number): NumberAt => ({ roof, key, side });
const shown = (design: typeof HOUSE, where: NumberAt, facts = FACTS) => {
  const found = roofNumberOf(design, where, facts);
  if (found === null) throw new Error('no such roof');
  return found;
};

describe('each number starts as the studio’s own value', () => {
  it.each([
    ['a sheet roof’s slope is its material’s in this market', 'slope', 1, 6],
    ['a parapet’s height is the market’s', 'parapet_height', 0, FACTS.parapetHeightM],
    ['the setback is the market’s', 'setback', 0, FACTS.setbackM],
    ['a wall’s thickness is the market’s', 'thickness', 0, FACTS.wallThicknessM],
    ['an upper slope', 'upper_slope', 1, 25],
    ['where the slope breaks', 'break_in', 1, 0.6],
    ['a sawtooth’s teeth', 'teeth', 1, 3],
    ['a raised middle’s height', 'raised_height', 1, 1],
    // The shed is 4 m across from its longest side: its raised middle is a quarter of that.
    ['a raised middle’s width is a quarter of the roof’s', 'raised_width', 1, 1],
    ['a valley sits in the middle', 'valley', 1, 0.5],
    ['an overhang is the market’s', 'overhang', 1, FACTS.overhangM],
  ] as const)('%s', (_why, key, roof, value) => {
    const found = shown(HOUSE, at(roof, key));
    expect(found.value).toBeCloseTo(value, 9);
    expect(found.system).toBeCloseTo(value, 9);
    expect(found).toMatchObject({ byPerson: false, side: null, outside: false });
  });

  it('an open shed’s first slope is the market’s for a sheet on posts, not its material’s', () => {
    const canopy = kindOf('canopy', 'open_shed', box(1, 1, 3, 3), {
      on: 'terrace',
      material: { type: 'trapezoidal_sheet', setBy: 'system', confirmed: false },
    });
    const facts = { ...FACTS, openShedSlopeDeg: 10 };
    expect(shown(designOf(TERRACE, canopy), at(1, 'slope'), facts).value).toBe(10);
    expect(shown(HOUSE, at(1, 'slope'), facts).value).toBe(6);
  });

  it('an overhang is the market’s; a dormer, cut into its roof, starts with none', () => {
    const dormer = kindOf('dormer', 'dormer', box(11, 1, 2, 2), {
      partOf: 'shed',
      material: SHED.material,
    });
    const design = designOf(TERRACE, SHED, dormer);
    expect(shown(design, at(1, 'overhang')).value).toBe(FACTS.overhangM);
    expect(shown(design, at(2, 'overhang'))).toMatchObject({ value: 0, system: 0 });
  });

  it('a mansard’s lower slope starts steep, on a steep slider; its reset names that slope', () => {
    const mansard = { ...SHED, shape: { is: 'mansard', setBy: 'person' } } as const;
    const lower = shown(designOf(mansard), at(0, 'slope'));
    expect(lower).toMatchObject({ value: 60, system: 60, slide: { min: 30, max: 80, step: 1 } });
    expect(shown(HOUSE, at(1, 'slope')).slide).toEqual({ min: 0, max: 60, step: 1 });
  });

  it('there is no number on a roof that is not there', () => {
    expect(roofNumberOf(HOUSE, at(7, 'slope'), FACTS)).toBeNull();
  });
});

describe('a person’s value is kept, and a reset leaves the roof as it was', () => {
  it.each(ROOF_NUMBERS.map((key) => [key] as const))('%s', (key) => {
    const { slide } = ROOF_NUMBER_SPECS[key];
    const value = slide.min + slide.step * 3;
    const set = roofNumberSet(HOUSE, at(1, key), value, FACTS);
    expect(shown(set, at(1, key))).toMatchObject({ byPerson: true });
    expect(shown(set, at(1, key)).value).toBeCloseTo(value, 9);
    // The studio's own value is what the reset names: a person's value does not move it.
    expect(shown(set, at(1, key)).system).toBeCloseTo(shown(HOUSE, at(1, key)).system, 9);
    expect(set.roofs[0]).toBe(HOUSE.roofs[0]);
    expect(roofNumberReset(set, at(1, key), FACTS).roofs[1]).toEqual(SHED);
  });

  it('a reset on a roof no person touched changes nothing stored', () => {
    for (const key of ROOF_NUMBERS) {
      expect(roofNumberReset(HOUSE, at(0, key), FACTS).roofs[0]).toEqual(TERRACE);
    }
  });

  it('a change of material reaches a slope the studio gave, never one a person set', () => {
    const tiled = roofMaterialPicked(HOUSE, 1, { type: 'clay_tile' });
    expect(shown(tiled, at(1, 'slope')).value).not.toBe(6);
    const mine = roofMaterialPicked(roofNumberSet(HOUSE, at(1, 'slope'), 20, FACTS), 1, {
      type: 'clay_tile',
    });
    expect(shown(mine, at(1, 'slope'))).toMatchObject({ value: 20, byPerson: true });
  });

  it('a parapet height set keeps whether the parapet runs all round, as the studio had it', () => {
    const terrace = roofNumberSet(HOUSE, at(0, 'parapet_height'), 1.2, FACTS).roofs[0];
    expect(terrace?.parapet).toEqual({ allRound: true, metres: 1.2, setBy: 'person' });
    const shed = roofNumberSet(HOUSE, at(1, 'parapet_height'), 1.2, FACTS).roofs[1];
    expect(shed?.parapet).toMatchObject({ allRound: false, metres: 1.2 });
  });

  it('a wall’s thickness is kept beside a parapet height a person set, and each resets alone', () => {
    const both = roofNumberSet(
      roofNumberSet(HOUSE, at(0, 'parapet_height'), 1.2, FACTS),
      at(0, 'thickness'),
      0.115,
      FACTS,
    );
    const thin = roofNumberReset(both, at(0, 'parapet_height'), FACTS);
    expect(shown(thin, at(0, 'parapet_height'))).toMatchObject({ value: 1, byPerson: false });
    expect(shown(thin, at(0, 'thickness'))).toMatchObject({ value: 0.12, byPerson: true });
    expect(roofNumberReset(thin, at(0, 'thickness'), FACTS).roofs[0]).toEqual(TERRACE);
  });
});

describe('a value is kept between the ends typing allows, to its grain; none is refused', () => {
  it.each([
    ['a parapet under the low band', 'parapet_height', 0.04, 0.1],
    ['a low band', 'parapet_height', 0.1, 0.1],
    ['a parapet at the most', 'parapet_height', 3, 3],
    ['a parapet past the most', 'parapet_height', 3.01, 3],
    ['a length to the centimetre', 'setback', 0.526, 0.53],
    ['a setback below none', 'setback', -1, 0],
    ['a slope in whole degrees', 'slope', 14.6, 15],
    ['a slope short of a wall', 'slope', 120, 89],
    ['teeth in whole teeth', 'teeth', 4.4, 4],
    ['no teeth at all', 'teeth', 0, 1],
    ['a valley by its step', 'valley', 0.42, 0.4],
    ['a valley short of the edge', 'valley', 1, 0.9],
    ['what is no number', 'thickness', Number.NaN, 0.02],
  ] as const)('%s', (_why, key, typed, held) => {
    expect(roofNumberHeld(key, typed)).toBe(held);
  });

  it.each([
    ['at the slider’s end', 2, false],
    ['a step past it', 2.05, true],
    ['under its start', 0.25, true],
  ] as const)('a parapet %s shows in the box alone: %s', (_why, metres, outside) => {
    const set = roofNumberSet(HOUSE, at(0, 'parapet_height'), metres, FACTS);
    expect(shown(set, at(0, 'parapet_height')).outside).toBe(outside);
  });
});

describe('a side’s own parapet height and setback', () => {
  const tall = roofNumberSet(HOUSE, at(0, 'parapet_height', 2), 1.5, FACTS);

  it('follow the roof’s until a person sets them, and the reset names the roof’s', () => {
    expect(shown(HOUSE, at(0, 'parapet_height', 2))).toMatchObject({
      side: 2,
      value: 1,
      system: 1,
      byPerson: false,
    });
    const roofs = roofNumberSet(HOUSE, at(0, 'setback'), 0.8, FACTS);
    expect(shown(roofs, at(0, 'setback', 1))).toMatchObject({ value: 0.8, system: 0.8 });
  });

  it('one side set is that side’s alone; the roof’s and the other sides’ stand', () => {
    expect(shown(tall, at(0, 'parapet_height', 2))).toMatchObject({
      value: 1.5,
      system: 1,
      byPerson: true,
    });
    expect(shown(tall, at(0, 'parapet_height', 1))).toMatchObject({ value: 1, byPerson: false });
    expect(shown(tall, at(0, 'parapet_height'))).toMatchObject({ value: 1, byPerson: false });
    expect(tall.roofs[0]?.parapet).toBeUndefined();
  });

  it('a setback of 0 on a boundary side is a value, not an absence', () => {
    const none = roofNumberSet(HOUSE, at(0, 'setback', 3), 0, FACTS);
    expect(shown(none, at(0, 'setback', 3))).toMatchObject({ value: 0, byPerson: true });
  });

  it('its reset takes the side’s value away and keeps what else the side holds', () => {
    const walled = roofOf('terrace', TERRACE.corners, {
      sides: [{}, {}, { parapet: false, parapetM: 1.5 }, {}],
    });
    const reset = roofNumberReset(designOf(walled), at(0, 'parapet_height', 2), FACTS);
    expect(reset.roofs[0]?.sides?.[2]).toEqual({ parapet: false });
  });

  it.each([
    ['a side the roof does not have', 9],
    ['a side before the first', -1],
  ] as const)('%s changes nothing', (_why, side) => {
    expect(roofNumberSet(HOUSE, at(0, 'setback', side), 1, FACTS)).toEqual(HOUSE);
  });

  it('a number no side holds of its own is the roof’s, whichever side asks', () => {
    expect(shown(HOUSE, at(1, 'slope', 2)).side).toBeNull();
    const set = roofNumberSet(HOUSE, at(1, 'slope', 2), 20, FACTS);
    expect(set.roofs[1]?.slope).toEqual({ degrees: 20, setBy: 'person' });
    expect(set.roofs[1]?.sides).toBeUndefined();
  });
});
