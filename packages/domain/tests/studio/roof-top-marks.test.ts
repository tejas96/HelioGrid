import { describe, expect, it } from 'vitest';
import type { Roof } from '../../src/studio/document';
import { roofStepAfter } from '../../src/studio/roof-step';
import { ROOF_STEP_START } from '../../src/studio/roof-step-state';
import { roofTopMarksOf } from '../../src/studio/roof-top-marks-build';
import { roofsWorked } from '../../src/studio/roof-worked';
import { box, designOf, FACTS, kindOf, p, SHED, stairOn, TERRACE } from './roof-meet-support';
import { saidOf } from './roof-step-support';

/**
 * What the top view marks on each roof (`T-M05-002`, part e): a solid side where it has a wall and
 * a dashed one where it has none, split exactly; a dot on each side; "+3 m" on a roof that stands
 * on another; and an arrow down each sloped face.
 */
const STAIR = stairOn(box(0, 0, 3, 3));
const marksOf = (...roofs: Roof[]) => {
  const design = designOf(...roofs);
  return roofTopMarksOf(design, FACTS, roofsWorked(design, FACTS));
};

describe('the sides of a roof in the top view', () => {
  const [terrace, stair, shed] = marksOf(TERRACE, STAIR, SHED);

  it('the south side is split exactly where the stair room’s wall ends: none under it, a wall beyond', () => {
    expect(terrace?.sides[0]).toEqual([
      { from: p(0, 0), to: p(3, 0), wall: false },
      { from: p(3, 0), to: p(10, 0), wall: true },
    ]);
  });

  it('the side the shed meets at the same height has no wall, and the mark says which roof takes it', () => {
    expect(terrace?.sides[1]).toEqual([{ from: p(10, 0), to: p(10, 8), wall: false }]);
    expect(terrace?.noWall).toMatchObject({ why: 'under', other: 1 });
  });

  it('a sheet roof has no wall on any side: every side is dashed, and it has none to say why of', () => {
    expect(shed?.sides.flat().every((stretch) => !stretch.wall)).toBe(true);
    expect(shed?.dots.every((dot) => !dot.wall)).toBe(true);
    expect(shed?.noWall).toBeNull();
  });

  it('a side’s dot sits at the middle of its longest stretch with a wall', () => {
    expect(terrace?.dots[0]).toEqual({ at: p(6.5, 0), wall: true });
    // A dot that would sit on the side's own middle, where its + adds a corner, sits a quarter
    // of the way along instead. This side has no wall: a tap adds one.
    expect(terrace?.dots[1]).toEqual({ at: p(10, 2), wall: false });
  });

  it('the stair room says its height above the terrace; a roof on the ground says none', () => {
    expect(stair?.aboveM).toBe(3);
    expect(stair?.kind).toBe('stair_room');
    expect(terrace?.aboveM).toBeNull();
    expect(shed?.aboveM).toBeNull();
  });

  it('a hole says no height: it stands on nothing', () => {
    const [, duct] = marksOf(
      TERRACE,
      kindOf('duct', 'hole', box(4, 3, 1, 1), { partOf: 'terrace' }),
    );
    expect(duct).toMatchObject({ kind: 'hole', aboveM: null });
  });
});

describe('what sticks out, and which way a face slopes', () => {
  it('a stair room 0.8 m past its roof’s edge is marked at its farthest point', () => {
    const [, stair] = marksOf(TERRACE, stairOn(box(-0.8, 2, 3, 3)));
    expect(stair?.sticksOutM).toBeCloseTo(0.8, 6);
    expect(stair?.sticksOutAt?.east).toBeCloseTo(-0.8, 6);
  });

  it('within its roof nothing is marked', () => {
    expect(marksOf(TERRACE, STAIR)[1]).toMatchObject({ sticksOutM: 0, sticksOutAt: null });
  });

  it('each sloped face carries a short line down its slope; a flat roof carries none', () => {
    const [terrace, shed] = marksOf(TERRACE, SHED);
    expect(terrace?.slopes).toEqual([]);
    expect(shed?.slopes).toHaveLength(2);
    // A gable over a 4 m by 8 m shed runs its ridge the long way: one face runs down to the
    // west, one to the east, each line inside its own half.
    const ways = (shed?.slopes ?? []).map((slope) => Math.sign(slope.to.east - slope.from.east));
    expect(ways.sort()).toEqual([-1, 1]);
    for (const slope of shed?.slopes ?? []) {
      expect(
        Math.hypot(slope.to.east - slope.from.east, slope.to.north - slope.from.north),
      ).toBeLessThanOrEqual(1.6 + 1e-9);
    }
  });
});

describe('a tap on a side’s dot', () => {
  const design = designOf(TERRACE, STAIR);
  const picked = roofStepAfter(
    ROOF_STEP_START,
    { kind: 'tap', at: p(8, 6), system: 'metric' },
    design,
  );

  it('takes that side’s wall off as one change, keeps the roof picked, and says how many sides have one', () => {
    const after = roofStepAfter(
      picked.state,
      { kind: 'side_wall', roof: 0, side: 2, wall: false, walled: 3 },
      design,
    );
    expect(after.commit?.roofs[0]?.sides).toEqual([{}, {}, { parapet: false }, {}]);
    expect(after.state).toMatchObject({ kind: 'idle', roof: 0 });
    expect(saidOf(after.state)).toEqual({
      kind: 'side_wall',
      roof: 0,
      side: 2,
      wall: false,
      walled: 3,
      sides: 4,
    });
    const [terrace] = marksOf(...(after.commit?.roofs ?? []));
    expect(terrace?.sides[2]).toEqual([{ from: p(10, 8), to: p(0, 8), wall: false }]);
  });

  it('a wall a person puts on a side stands along all of it, under the stair room too', () => {
    const after = roofStepAfter(
      picked.state,
      { kind: 'side_wall', roof: 0, side: 0, wall: true, walled: 4 },
      design,
    );
    const [terrace] = marksOf(...(after.commit?.roofs ?? []));
    expect(terrace?.sides[0]).toEqual([{ from: p(0, 0), to: p(10, 0), wall: true }]);
  });

  it('keeps what the other sides hold, and starts a list afresh where the stored one does not match', () => {
    const held = { ...TERRACE, sides: [{ parapetM: 1.5 }, {}, {}, {}] } as Roof;
    const loose = { ...TERRACE, sides: [{ parapetM: 1.5 }] } as Roof;
    const tap = { kind: 'side_wall', roof: 0, side: 1, wall: false, walled: 3 } as const;
    expect(roofStepAfter(picked.state, tap, designOf(held)).commit?.roofs[0]?.sides).toEqual([
      { parapetM: 1.5 },
      { parapet: false },
      {},
      {},
    ]);
    expect(roofStepAfter(picked.state, tap, designOf(loose)).commit?.roofs[0]?.sides).toEqual([
      {},
      { parapet: false },
      {},
      {},
    ]);
  });

  it('the side tapped keeps its own height: only its wall is taken off', () => {
    const held = { ...TERRACE, sides: [{ parapetM: 1.5 }, {}, {}, {}] } as Roof;
    const tap = { kind: 'side_wall', roof: 0, side: 0, wall: false, walled: 3 } as const;
    expect(roofStepAfter(picked.state, tap, designOf(held)).commit?.roofs[0]?.sides?.[0]).toEqual({
      parapetM: 1.5,
      parapet: false,
    });
  });

  it.each([
    ['a side the roof does not have', 0, 9],
    ['a roof that is not there', 7, 0],
  ])('%s changes nothing', (_why, roof, side) => {
    const tap = { kind: 'side_wall', roof, side, wall: false, walled: 3 } as const;
    expect(roofStepAfter(picked.state, tap, design).commit).toBeNull();
  });
});
