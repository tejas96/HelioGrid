import { describe, expect, it } from 'vitest';
import type { Roof } from '../../src/studio/document';
import { roofMaterialConfirmed, roofMaterialPicked } from '../../src/studio/roof-material-set';
import { roofMadeInto } from '../../src/studio/roof-place';
import { roofStepAfter } from '../../src/studio/roof-step';
import { ROOF_STEP_START } from '../../src/studio/roof-step-state';
import { box, designOf, FACTS, kindOf, roofOf, SHED, stairOn, TERRACE } from './roof-meet-support';
import { saidOf } from './roof-step-support';

/**
 * What a roof is made of, as a person sets it (`T-M05-002`, part e): a pick is theirs; Confirm
 * keeps the guess and confirms what sits on the roof with the same material in the same tap.
 */
const guess = (type: string) => ({ type, setBy: 'system', confirmed: false }) as const;
const STAIR = { ...stairOn(box(0, 0, 3, 3)), material: guess('rcc') } as Roof;
const UPPER = kindOf('upper', 'upper_floor', box(5, 0, 5, 8), {
  on: 'terrace',
  material: guess('rcc'),
});

describe('a pick', () => {
  it('is the person’s, and confirmed; the other roofs keep theirs', () => {
    const picked = roofMaterialPicked(designOf(TERRACE, STAIR), 0, { type: 'clay_tile' });
    expect(picked.roofs[0]?.material).toEqual({
      type: 'clay_tile',
      setBy: 'person',
      confirmed: true,
    });
    expect(picked.roofs[1]).toBe(STAIR);
  });

  it('a type of their own keeps its name, trimmed, and what it is fixed like', () => {
    const pick = { type: 'other', name: '  Kota stone ', fixedLike: 'concrete' } as const;
    expect(roofMaterialPicked(designOf(TERRACE), 0, pick).roofs[0]?.material).toEqual({
      type: 'other',
      name: 'Kota stone',
      fixedLike: 'concrete',
      setBy: 'person',
      confirmed: true,
    });
  });

  it.each([
    ['no name', { type: 'other', fixedLike: 'concrete' }],
    ['a name of spaces', { type: 'other', name: '   ', fixedLike: 'concrete' }],
    ['a name past 60 letters', { type: 'other', name: 'x'.repeat(61), fixedLike: 'concrete' }],
    ['nothing it is fixed like', { type: 'other', name: 'Kota stone' }],
  ] as const)('a type of their own with %s changes nothing', (_why, pick) => {
    const design = designOf(TERRACE);
    expect(roofMaterialPicked(design, 0, pick)).toBe(design);
  });

  it('a name is not kept on a type from the list', () => {
    const picked = roofMaterialPicked(designOf(TERRACE), 0, { type: 'rcc', name: 'mine' });
    expect(picked.roofs[0]?.material).toEqual({ type: 'rcc', setBy: 'person', confirmed: true });
  });

  it('a hole is made of nothing, and a roof that is not there takes no pick', () => {
    const design = designOf(
      TERRACE,
      kindOf('duct', 'hole', box(4, 3, 1, 1), { partOf: 'terrace' }),
    );
    expect(roofMaterialPicked(design, 1, { type: 'rcc' })).toBe(design);
    expect(roofMaterialPicked(design, 9, { type: 'rcc' })).toBe(design);
    expect(roofMaterialConfirmed(design, 1)).toBe(design);
  });
});

describe('Confirm', () => {
  it('keeps the guess as the studio’s, confirmed: a roof with no word on it is confirmed as what it reads as', () => {
    const done = roofMaterialConfirmed(designOf(TERRACE), 0);
    expect(done.roofs[0]?.material).toEqual({ type: 'rcc', setBy: 'system', confirmed: true });
  });

  it('confirms a stair room and an upper floor on the roof, of the same material, in the same tap', () => {
    const done = roofMaterialConfirmed(designOf(TERRACE, STAIR, UPPER, SHED), 0);
    expect(done.roofs.map((roof) => roof.material?.confirmed)).toEqual([true, true, true, false]);
  });

  it('what sits on it but is made of something else still waits; so does an open shed over it', () => {
    const tin = { ...STAIR, material: guess('trapezoidal_sheet') } as Roof;
    const over = kindOf('over', 'open_shed', box(2, 2, 4, 4), {
      on: 'terrace',
      material: guess('rcc'),
    });
    const done = roofMaterialConfirmed(designOf(TERRACE, tin, over), 0);
    expect(done.roofs.map((roof) => roof.material?.confirmed)).toEqual([true, false, false]);
  });

  it('a stair room on another roof, made of the same thing, is not this roof’s to confirm', () => {
    const second = roofOf('second', box(30, 0, 10, 8));
    const theirs = { ...stairOn(box(30, 0, 3, 3), 'second'), material: guess('rcc') } as Roof;
    const done = roofMaterialConfirmed(designOf(TERRACE, second, theirs), 0);
    expect(done.roofs[2]).toBe(theirs);
  });

  it('a guess stored on a roof stays the studio’s when it is confirmed', () => {
    const done = roofMaterialConfirmed(designOf(TERRACE, STAIR), 1);
    expect(done.roofs[1]?.material).toEqual({ type: 'rcc', setBy: 'system', confirmed: true });
  });

  it('on the stair room confirms it alone: the roof under it still waits', () => {
    const done = roofMaterialConfirmed(designOf(TERRACE, STAIR), 1);
    expect(done.roofs[0]).toBe(TERRACE);
    expect(done.roofs[1]?.material?.confirmed).toBe(true);
  });

  it('a person’s pick stays theirs when confirmed again, and where all is confirmed nothing changes', () => {
    const mine = {
      ...TERRACE,
      material: { type: 'slate', setBy: 'person', confirmed: true },
    } as Roof;
    const design = designOf(mine);
    expect(roofMaterialConfirmed(design, 0)).toBe(design);
  });
});

describe('the roof step', () => {
  const design = designOf(TERRACE, STAIR);

  it('a pick and Confirm are each one change, and the roof stays picked', () => {
    const picked = roofStepAfter(
      ROOF_STEP_START,
      { kind: 'material', roof: 0, pick: { type: 'clay_tile' } },
      design,
    );
    expect(picked.commit?.roofs[0]?.material?.type).toBe('clay_tile');
    expect(picked.state).toMatchObject({ kind: 'idle', roof: 0 });
    expect(saidOf(picked.state)).toEqual({ kind: 'material_set', roof: 0 });
    const confirmed = roofStepAfter(ROOF_STEP_START, { kind: 'material', roof: 0 }, design);
    expect(confirmed.commit?.roofs.map((roof) => roof.material?.confirmed)).toEqual([true, true]);
  });

  it('Confirm where nothing waits is no change', () => {
    const done = roofMaterialConfirmed(design, 0);
    expect(roofStepAfter(ROOF_STEP_START, { kind: 'material', roof: 0 }, done).commit).toBeNull();
  });
});

describe('the kind a roof already is, picked by a person', () => {
  it('makes the studio’s guess theirs, and keeps everything else as it is', () => {
    const made = roofMadeInto(designOf(TERRACE, STAIR), 1, 'stair_room', FACTS);
    expect(made.roofs[1]).toEqual({ ...STAIR, kind: { is: 'stair_room', setBy: 'person' } });
  });

  it('a kind a person already picked, and a plain building, change nothing', () => {
    const mine = { ...STAIR, kind: { is: 'stair_room', setBy: 'person' } } as Roof;
    const design = designOf(TERRACE, mine);
    expect(roofMadeInto(design, 1, 'stair_room', FACTS)).toBe(design);
    expect(roofMadeInto(design, 0, 'building', FACTS)).toBe(design);
  });
});
