import { describe, expect, it } from 'vitest';
import { edgesOf, parapetNow } from '../../src/studio/roof-open-edges';
import { C_ROOF } from './roof-kernel-support';
import { box, designOf, FACTS, kindOf, roofOf, SHED, stairOn, TERRACE } from './roof-meet-support';

/**
 * Where a roof has a parapet (`T-M05-002`, part e): only where the roof is open to the sky, split
 * exactly where another roof starts; a side a person tapped keeps their choice.
 */
const PERSON = { setBy: 'person' } as const;
/** Each side as its stretches: `from–to` and whether a wall stands there. */
const walls = (design: ReturnType<typeof designOf>, index: number) =>
  edgesOf(design, index, FACTS).map((side) =>
    side.map(
      (stretch) =>
        `${stretch.from.toFixed(2)}-${stretch.to.toFixed(2)}:${stretch.wall ? stretch.metres : 'none'}`,
    ),
  );
const ALL_ROUND = [['0.00-1.00:1'], ['0.00-1.00:1'], ['0.00-1.00:1'], ['0.00-1.00:1']];
const NONE = [['0.00-1.00:none'], ['0.00-1.00:none'], ['0.00-1.00:none'], ['0.00-1.00:none']];

describe('a parapet only where the roof is open to the sky', () => {
  it('a flat concrete roof starts with a 1.0 m wall all round; a sheet roof with none', () => {
    expect(walls(designOf(TERRACE), 0)).toEqual(ALL_ROUND);
    expect(walls(designOf(SHED), 0)).toEqual(NONE);
    expect(parapetNow(designOf(TERRACE), TERRACE, FACTS)).toMatchObject({
      allRound: true,
      metres: 1,
      thicknessM: 0.23,
      build: 'wall',
      lengthsMeasured: 'outside',
      byPerson: false,
    });
  });

  it('a sloped roof starts with none, whatever it is made of', () => {
    const sloped = roofOf('r', box(0, 0, 10, 8), { shape: { is: 'gable', setBy: 'person' } });
    expect(walls(designOf(sloped), 0)).toEqual(NONE);
  });

  it('a stair room on the corner: its walls stand where the terrace’s parapet would, and it has none of its own', () => {
    const design = designOf(TERRACE, stairOn(box(0, 0, 3, 3)));
    expect(walls(design, 0)).toEqual([
      ['0.00-0.30:none', '0.30-1.00:1'],
      ['0.00-1.00:1'],
      ['0.00-1.00:1'],
      ['0.00-0.63:1', '0.63-1.00:none'],
    ]);
    expect(edgesOf(design, 0, FACTS)[0]?.[0]).toMatchObject({ state: 'under', other: 1 });
    // A mumty's top holds tanks, not a wall.
    expect(walls(design, 1)).toEqual(NONE);
  });

  it('an upper floor keeps its type’s parapet on the sides open to the sky', () => {
    const design = designOf(
      TERRACE,
      kindOf('upper', 'upper_floor', box(4, 0, 6, 4), { on: 'terrace' }),
    );
    expect(walls(design, 1)).toEqual(ALL_ROUND);
  });

  it('an open shed has no walls, so the roof under it keeps its parapet', () => {
    const shed = kindOf('tin', 'open_shed', box(-0.5, -0.5, 11, 9), { on: 'terrace' });
    expect(walls(designOf(TERRACE, shed), 0)).toEqual(ALL_ROUND);
    expect(walls(designOf(TERRACE, shed), 1)).toEqual(NONE);
  });

  it('two roofs of one height meet: the seam has no wall, the rest of that side keeps its', () => {
    const neighbour = roofOf('next', box(10, 2, 4, 3));
    const design = designOf(TERRACE, neighbour);
    expect(walls(design, 0)[1]).toEqual(['0.00-0.25:1', '0.25-0.63:none', '0.63-1.00:1']);
    expect(edgesOf(design, 0, FACTS)[1]?.[1]).toMatchObject({ state: 'shared', other: 1 });
    // The neighbour's whole west side is the seam.
    expect(walls(design, 1)[3]).toEqual(['0.00-1.00:none']);
  });

  it.each([
    ['a higher roof against the edge: its wall is there', 6, 'none', 'under'],
    ['a lower roof beside it: the edge is open to the sky', 2, '1', 'open'],
  ])('%s', (_why, metres, wall, state) => {
    const neighbour = roofOf('next', box(10, 0, 4, 8), { height: { metres, ...PERSON } });
    const design = designOf(TERRACE, neighbour);
    expect(walls(design, 0)[1]).toEqual([`0.00-1.00:${wall}`]);
    expect(edgesOf(design, 0, FACTS)[1]?.[0]?.state).toBe(state);
  });

  it('a side a person tapped keeps their choice: off on an open side, on along a seam', () => {
    const tapped = {
      ...TERRACE,
      sides: [{ parapet: false }, { parapet: true, parapetM: 1.5 }, {}, {}],
    };
    const design = designOf(tapped, roofOf('next', box(10, 2, 4, 3)));
    expect(walls(design, 0)).toEqual([
      ['0.00-1.00:none'],
      ['0.00-1.00:1.5'],
      ['0.00-1.00:1'],
      ['0.00-1.00:1'],
    ]);
    expect(edgesOf(design, 0, FACTS)[1]?.[0]?.state).toBe('person');
  });

  it('a C roof with an upper floor on one arm keeps its parapet everywhere else', () => {
    const upper = kindOf('upper', 'upper_floor', box(4, 0, 6, 3), { on: 'c' });
    const design = designOf(roofOf('c', C_ROOF), upper);
    const sides = walls(design, 0);
    expect(sides[0]).toEqual(['0.00-0.40:1', '0.40-1.00:none']);
    expect(sides[1]).toEqual(['0.00-1.00:none']);
    expect(sides[2]).toEqual(['0.00-0.86:none', '0.86-1.00:1']);
    expect(sides.slice(3)).toEqual([
      ['0.00-1.00:1'],
      ['0.00-1.00:1'],
      ['0.00-1.00:1'],
      ['0.00-1.00:1'],
      ['0.00-1.00:1'],
    ]);
  });

  it('an upper floor drawn 0.2 m inside the wall still takes that stretch: edges within 0.3 m are met', () => {
    const upper = kindOf('upper', 'upper_floor', box(4, 0.2, 5.8, 2.8), { on: 'c' });
    expect(walls(designOf(roofOf('c', C_ROOF), upper), 0)[0]).toEqual([
      '0.00-0.40:1',
      '0.40-1.00:none',
    ]);
  });

  it('a duct’s first parapet follows its roof’s', () => {
    const duct = (roof: typeof TERRACE) =>
      designOf(roof, kindOf('duct', 'hole', box(6, 5, 1, 1), { partOf: roof.id }));
    expect(walls(duct(TERRACE), 1)).toEqual(ALL_ROUND);
    const bare = { ...TERRACE, parapet: { allRound: false, metres: 1, ...PERSON } };
    expect(walls(duct(bare), 1)).toEqual(NONE);
  });

  it('holes linked in a ring have no parapet to follow, and the reading ends', () => {
    const a = kindOf('a', 'hole', box(2, 2, 1, 1), { partOf: 'b' });
    const b = kindOf('b', 'hole', box(4, 2, 1, 1), { on: 'a' });
    expect(parapetNow(designOf(a, b), a, FACTS).allRound).toBe(false);
  });

  it('a parapet a person set is read as set: its height, its build, where the lengths were measured', () => {
    const set = {
      ...TERRACE,
      parapet: {
        allRound: true,
        metres: 1.8,
        ...PERSON,
        build: 'railing' as const,
        thickness: { metres: 0.1, ...PERSON },
        lengthsMeasured: 'inside' as const,
      },
    };
    expect(parapetNow(designOf(set), set, FACTS)).toEqual({
      allRound: true,
      metres: 1.8,
      thicknessM: 0.1,
      build: 'railing',
      lengthsMeasured: 'inside',
      byPerson: true,
    });
  });
});
