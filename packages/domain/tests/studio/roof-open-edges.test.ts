import { describe, expect, it } from 'vitest';
import type { GroundPoint } from '../../src/studio/ground';
import {
  roofAreaM2,
  roofSurfaceM2,
  roofsAreaM2,
  setbackLines,
} from '../../src/studio/roof-free-ground';
import { edgesOf, parapetNow } from '../../src/studio/roof-open-edges';
import { ringAreaM2 } from '../../src/studio/roof-polygons';
import { C_ROOF } from './roof-kernel-support';
import {
  box,
  designOf,
  FACTS,
  kindOf,
  p,
  roofOf,
  SHED,
  stairOn,
  TERRACE,
} from './roof-meet-support';

/**
 * Where a roof has a parapet, its area and its setback line (`T-M05-002`, part e): a parapet only
 * where the roof is open to the sky, split exactly where another roof starts; an area that leaves
 * out holes and what stands on the roof; a setback in from the inside of the parapet.
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

describe('a roof’s area', () => {
  const stair = stairOn(box(0, 0, 3, 3));
  const duct = kindOf('duct', 'hole', box(6, 5, 1, 1), { partOf: 'terrace' });

  it('leaves out its holes and what stands on it', () => {
    expect(roofAreaM2(designOf(TERRACE, stair, duct), 0)).toBeCloseTo(80 - 9 - 1, 6);
    expect(roofAreaM2(designOf(TERRACE, stair, duct), 1)).toBeCloseTo(9, 6);
  });

  it('a roof covered by an open shed keeps its own area', () => {
    const tin = kindOf('tin', 'open_shed', box(-0.5, -0.5, 11, 9), { on: 'terrace' });
    expect(roofAreaM2(designOf(TERRACE, tin), 0)).toBeCloseTo(80, 6);
  });

  it('a separate part is carved out of the roof round it', () => {
    const back = kindOf('back', 'separate_part', box(6, 0, 4, 8), { partOf: 'terrace' });
    expect(roofAreaM2(designOf(TERRACE, back), 0)).toBeCloseTo(48, 6);
  });

  it('every roof together counts each spot once, as seen from above', () => {
    expect(roofsAreaM2(designOf(TERRACE, stair, SHED))).toBeCloseTo(80 + 32, 6);
    expect(roofsAreaM2(designOf(TERRACE, stair, duct, SHED))).toBeCloseTo(80 + 32 - 1, 6);
    // An upper floor that sticks 2 m out past the terrace adds only what sticks out.
    const out = kindOf('upper', 'upper_floor', box(-2, 0, 6, 4), { on: 'terrace' });
    expect(roofsAreaM2(designOf(TERRACE, out))).toBeCloseTo(80 + 8, 6);
    expect(roofsAreaM2(designOf())).toBe(0);
  });

  it('a sloped roof’s surface is its area from above over the cosine of its slope', () => {
    const sloped = { ...SHED, slope: { degrees: 30, ...PERSON } };
    expect(roofSurfaceM2(designOf(sloped), 0, FACTS)).toBeCloseTo(32 / Math.cos(Math.PI / 6), 6);
    // A 30° roof is 15% bigger than it looks from above.
    expect(roofSurfaceM2(designOf(sloped), 0, FACTS) / 32).toBeCloseTo(1.1547, 4);
    expect(roofSurfaceM2(designOf(TERRACE), 0, FACTS)).toBeCloseTo(80, 6);
  });
});

describe('the setback line', () => {
  const area = (rings: GroundPoint[][]) =>
    rings.map((ring) => ringAreaM2(ring)).sort((a, b) => a - b);

  it('stands in from the inside of the parapet: the wall’s thickness, then the setback', () => {
    const [ring] = setbackLines(designOf(TERRACE), 0, FACTS);
    expect(ring).toContainEqual(p(0.73, 0.73));
    expect(ringAreaM2(ring ?? [])).toBeCloseTo((10 - 1.46) * (8 - 1.46), 6);
  });

  it('lengths measured inside the parapet: the wall stands outside the outline, and only the setback is kept', () => {
    const taped = {
      ...TERRACE,
      parapet: { allRound: true, metres: 1, ...PERSON, lengthsMeasured: 'inside' as const },
    };
    expect(setbackLines(designOf(taped), 0, FACTS)[0]).toContainEqual(p(0.5, 0.5));
  });

  it('where there is no parapet it is measured from the edge', () => {
    const bare = { ...TERRACE, parapet: { allRound: false, metres: 1, ...PERSON } };
    expect(area(setbackLines(designOf(bare), 0, FACTS))[0]).toBeCloseTo(9 * 7, 6);
  });

  it('a side with its own setback keeps it: down to 0 on a boundary side', () => {
    const bare = {
      ...TERRACE,
      parapet: { allRound: false, metres: 1, ...PERSON },
      sides: [{}, { setbackM: 0 }, {}, {}],
    };
    expect(area(setbackLines(designOf(bare), 0, FACTS))[0]).toBeCloseTo(9.5 * 7, 6);
  });

  it('a seam with a roof of the same height keeps no panel back', () => {
    const bare = { ...TERRACE, parapet: { allRound: false, metres: 1, ...PERSON } };
    const [ring] = setbackLines(designOf(bare, roofOf('next', box(10, 0, 4, 8))), 0, FACTS);
    expect(ringAreaM2(ring ?? [])).toBeCloseTo(9.5 * 7, 6);
  });

  it('runs round what stands on the roof: a stair room in the middle is ringed, 0.5 m clear', () => {
    const bare = { ...TERRACE, parapet: { allRound: false, metres: 1, ...PERSON } };
    const rings = setbackLines(designOf(bare, stairOn(box(4, 3, 2, 2))), 0, FACTS);
    expect(area(rings)).toEqual([expect.closeTo(3 * 3, 6), expect.closeTo(9 * 7, 6)]);
  });

  it('a taller wall against the roof counts as an edge', () => {
    const bare = { ...TERRACE, parapet: { allRound: false, metres: 1, ...PERSON } };
    const tall = roofOf('tall', box(10, 0, 4, 8), { height: { metres: 6, ...PERSON } });
    expect(area(setbackLines(designOf(bare, tall), 0, FACTS))[0]).toBeCloseTo(9 * 7, 6);
  });

  it.each([
    ['along the face: shorter as seen from above', 'along_face', Math.cos(Math.PI / 6)],
    ['from above, where the market says so', 'from_above', 1],
  ] as const)('on a sloped roof it is measured %s', (_why, setbackMeasure, share) => {
    const sloped = { ...SHED, slope: { degrees: 30, ...PERSON } };
    const [ring] = setbackLines(designOf(sloped), 0, { ...FACTS, setbackMeasure });
    expect(ringAreaM2(ring ?? [])).toBeCloseTo((4 - share) * (8 - share), 6);
  });
});
