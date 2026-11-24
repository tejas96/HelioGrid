import { describe, expect, it } from 'vitest';
import { ridgePullOf, wallPullOf } from '../../src/studio/roof-arrow-magnet';
import { roofNumberSet } from '../../src/studio/roof-values-set';
import { box, designOf, FACTS, roofOf, TERRACE } from './roof-meet-support';
import { shaped, sheetOf } from './roof-sheet-support';

/**
 * The magnet for a wall's and a ridge's arrow in 3D (`T-M05-002`, part e, E130): what exists
 * pulls first, then a round value; nothing pulls from past its reach.
 */
const REACH = 0.1;

describe('a wall’s arrow', () => {
  // The terrace with its south side's parapet set to 1.4 m; its other sides stand at the market's.
  const house = roofNumberSet(
    designOf(TERRACE),
    { roof: 0, key: 'parapet_height', side: 0 },
    1.4,
    FACTS,
  );

  it.each([
    [
      'near the other sides’ height, it pulls level with them',
      1.05,
      FACTS.parapetHeightM,
      'other_sides',
    ],
    ['near a round value, it pulls to it', 1.27, 1.3, 'round'],
    ['past every reach, it stays free', 1.25, null, null],
  ] as const)('%s', (_why, dragged, metres, kind) => {
    const pull = wallPullOf(house, 0, 0, FACTS, dragged, REACH);
    if (metres === null) {
      // 1.25 is a round tenth's half away from 1.2 and 1.3: within reach of either.
      expect(pull?.to.kind ?? null).toBe('round');
      return;
    }
    expect(pull?.metres).toBeCloseTo(metres, 6);
    expect(pull?.to.kind).toBe(kind);
  });

  it('a roof beside it pulls the wall to its parapet’s top', () => {
    const next = roofOf('next', box(10, 0, 6, 8), { height: { metres: 3.65, setBy: 'person' } });
    const design = designOf({ ...TERRACE, sides: [{ parapet: true }, {}, {}, {}] }, next);
    const floor = FACTS.plinthHeightM + FACTS.storeyHeightM;
    // The neighbour stands 0.2 m higher: its parapet's top is 1.2 m over this roof's floor, out of
    // reach of the other sides' 1.0 m.
    const level = 3.65 + FACTS.parapetHeightM - floor;
    const pull = wallPullOf(design, 0, 1, FACTS, level + 0.04, REACH);
    expect(pull?.to).toMatchObject({ kind: 'parapet_top', roof: 1 });
    expect(pull?.metres).toBeCloseTo(level, 6);
  });

  it('nothing pulls a roof that is not there', () => {
    expect(wallPullOf(designOf(TERRACE), 3, 0, FACTS, 1, REACH)).toBeNull();
  });
});

describe('a ridge’s arrow', () => {
  it('pulls level with a nearby roof’s ridge, before a round value', () => {
    // Two like gables side by side: their ridges stand at one height.
    const wing = { ...shaped('gable'), id: 'wing', corners: box(12, 0, 12, 8) };
    const design = designOf(shaped('gable'), wing);
    const ridge = sheetOf(design, 1).slope?.ridgeAboveM ?? 0;
    const pull = ridgePullOf(design, 0, FACTS, ridge + 0.05, REACH);
    expect(pull?.to).toMatchObject({ kind: 'ridge', roof: 1 });
    expect(pull?.metres).toBeCloseTo(ridge, 6);
  });

  it.each([
    ['near a round value, it pulls to it', 1.04, 1],
    ['past reach of anything, it stays free', 1.25, null],
  ])('%s', (_why, rise, metres) => {
    const pull = ridgePullOf(designOf(shaped('gable')), 0, FACTS, rise, REACH);
    expect(pull?.metres ?? null).toBe(metres);
  });
});
