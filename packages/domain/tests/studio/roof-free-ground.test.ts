import { describe, expect, it } from 'vitest';
import type { GroundPoint } from '../../src/studio/ground';
import { roofAreaM2, roofSurfaceM2, roofsAreaM2 } from '../../src/studio/roof-free-ground';
import { ringAreaM2 } from '../../src/studio/roof-polygons';
import { setbackLines } from '../../src/studio/roof-setback';
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
 * A roof's free ground (`T-M05-002`, part e): an area that leaves out holes and what stands on the
 * roof, the site's area with every spot counted once, and a setback line in from the inside of the
 * parapet.
 */
const PERSON = { setBy: 'person' } as const;

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

  it('a duct counts as roof where another roof lies over it, and not where it is open to the sky', () => {
    const tin = kindOf('tin', 'open_shed', box(5, 4, 4, 4), { on: 'terrace' });
    expect(roofsAreaM2(designOf(TERRACE, duct))).toBeCloseTo(79, 6);
    expect(roofsAreaM2(designOf(TERRACE, duct, tin))).toBeCloseTo(80, 6);
  });

  it('a duct in a separate part is no roof: the roof that part is carved from does not cover it', () => {
    const back = kindOf('back', 'separate_part', box(6, 0, 4, 8), { partOf: 'terrace' });
    const vent = kindOf('vent', 'hole', box(7, 3, 1, 1), { partOf: 'back' });
    expect(roofsAreaM2(designOf(TERRACE, back, vent))).toBeCloseTo(79, 6);
  });

  it('a roof’s surface follows each side’s own slope: an uneven gable is not one slope’s', () => {
    const uneven = roofOf('r', box(0, 0, 10, 6), {
      shape: { is: 'gable', setBy: 'person' },
      slope: { degrees: 30, ...PERSON },
      sides: [{}, {}, { slopeDeg: 45 }, {}],
    });
    // The two planes meet where 30°'s rise over d equals 45°'s over 6 − d.
    const d = 6 / (1 + Math.tan(Math.PI / 6));
    const surface = (10 * d) / Math.cos(Math.PI / 6) + (10 * (6 - d)) / Math.cos(Math.PI / 4);
    expect(roofSurfaceM2(designOf(uneven), 0, FACTS)).toBeCloseTo(surface, 6);
  });

  it('a mansard’s surface counts its steep lower faces and its low upper ones', () => {
    const mansard = roofOf('r', box(0, 0, 10, 6), {
      shape: {
        is: 'mansard',
        setBy: 'person',
        upperSlope: { degrees: 25, ...PERSON },
        breakIn: { metres: 0.6, ...PERSON },
      },
      slope: { degrees: 60, ...PERSON },
    });
    const lower = 60 - 8.8 * 4.8;
    const surface = lower / Math.cos(Math.PI / 3) + (8.8 * 4.8) / Math.cos((25 * Math.PI) / 180);
    expect(roofSurfaceM2(designOf(mansard), 0, FACTS)).toBeCloseTo(surface, 6);
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

  it('a market with a setback for each kind of edge: the ridge, the eave and the gable end each keep their own', () => {
    // A gable 4 m wide and 8 m long, its ridge down the middle: each face is 2 × 8 m.
    const sloped = { ...SHED, slope: { degrees: 30, ...PERSON } };
    const byEdge = { eave: 0, ridge: 0.45, hipOrValley: null, gableEnd: null };
    const facts = { ...FACTS, setbackMeasure: 'from_above' as const, setbackByEdge: byEdge };
    const rings = setbackLines(designOf(sloped), 0, facts);
    // Nothing kept at the eave, 0.45 m at the ridge, and the roof's own 0.5 m at each gable end.
    expect(area(rings)).toEqual([expect.closeTo(1.55 * 7, 6), expect.closeTo(1.55 * 7, 6)]);
    // A flat roof has no ridge or eave: it keeps its one setback.
    const bare = { ...TERRACE, parapet: { allRound: false, metres: 1, ...PERSON } };
    expect(area(setbackLines(designOf(bare), 0, facts))[0]).toBeCloseTo(9 * 7, 6);
  });

  it('with a setback for each kind of edge, the line still runs round a duct in a sloped roof', () => {
    const sloped = { ...SHED, slope: { degrees: 30, ...PERSON } };
    const byEdge = { eave: 0, ridge: 0.45, hipOrValley: null, gableEnd: null };
    const facts = { ...FACTS, setbackMeasure: 'from_above' as const, setbackByEdge: byEdge };
    // A duct in the west face, 10.5–11.5 east, 3–4 north.
    const vent = kindOf('vent', 'hole', box(10.5, 3, 1, 1), { partOf: 'shed' });
    const rings = setbackLines(designOf(sloped, vent), 0, facts);
    // The east face keeps its 1.55 × 7 m. The duct's 0.5 m ring reaches right across the west
    // face's free strip, from 2.5 to 4.5 north: what is left of it is 2 m to the south and 3 m north.
    expect(area(rings)).toEqual([
      expect.closeTo(1.55 * 2, 6),
      expect.closeTo(1.55 * 3, 6),
      expect.closeTo(1.55 * 7, 6),
    ]);
  });

  it('with a setback for each kind of edge, a side keeps its own and a seam keeps none', () => {
    const byEdge = { eave: 0.3, ridge: 0.45, hipOrValley: null, gableEnd: null };
    const facts = { ...FACTS, setbackMeasure: 'from_above' as const, setbackByEdge: byEdge };
    // The east eave (side 1) keeps a person's 1 m; the west eave keeps the market's 0.3 m.
    const own = {
      ...SHED,
      slope: { degrees: 30, ...PERSON },
      sides: [{}, { setbackM: 1 }, {}, {}],
    };
    expect(area(setbackLines(designOf(own), 0, facts))).toEqual([
      expect.closeTo((2 - 1 - 0.45) * 7, 6),
      expect.closeTo((2 - 0.3 - 0.45) * 7, 6),
    ]);
    // A sloped roof of the same height along the whole east eave: that eave is a seam.
    const sloped = { ...SHED, slope: { degrees: 30, ...PERSON } };
    const next = { ...SHED, id: 'next', corners: box(14, 0, 4, 8) };
    expect(area(setbackLines(designOf(sloped, next), 0, facts))).toEqual([
      expect.closeTo((2 - 0.3 - 0.45) * 7, 6),
      expect.closeTo((2 - 0.45) * 7, 6),
    ]);
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
