import { describe, expect, it } from 'vitest';
import {
  buildingsOf,
  draggedOntoScan,
  outlinesApart,
  roofsAsDrawn,
  roofsMoved,
  scanMatched,
} from '../../src/studio/roof-buildings';
import type { SiteBuilding } from '../../src/studio/site-data';
import { scanFitsOf } from '../../src/studio/site-scan-fit';
import { box, designOf, FACTS, roofOf, SHED, stairOn, TERRACE } from './roof-meet-support';
import { boxOf, gridOf, inBox } from './site-support';

/**
 * LiDAR's Move (`T-M05-002g`, board frames 11–14): roofs that touch are one building, moved as one
 * piece; Match the scan finds where the scan sees each building and hands its flat roofs' heights
 * to the data; Back to as drawn puts them back as the design opened.
 */

describe('roofs that touch, within 30 cm, are one building', () => {
  it.each([
    ['touching', 10, true],
    ['29 cm apart', 10.29, true],
    ['30 cm apart', 10.3, true],
    ['31 cm apart', 10.31, false],
    ['far apart', 20, false],
  ])('%s', (_, west, one) => {
    const design = designOf(TERRACE, roofOf('next', box(west, 0, 4, 8)));
    expect(buildingsOf(design).length).toBe(one ? 1 : 2);
  });

  it('overlapping outlines are 0 apart', () => {
    expect(outlinesApart(box(0, 0, 4, 4), box(2, 2, 4, 4))).toBe(0);
  });

  it('what stands on a roof goes with its building, but never names a chip', () => {
    const design = designOf(TERRACE, stairOn(box(2, 2, 3, 3)), roofOf('far', box(30, 0, 5, 5)));
    expect(buildingsOf(design)).toEqual([
      { roofs: [0], members: [0, 1] },
      { roofs: [2], members: [2] },
    ]);
  });

  it('a chain of touching roofs is one building, however it is drawn', () => {
    const design = designOf(
      roofOf('a', box(0, 0, 4, 4)),
      roofOf('c', box(8, 0, 4, 4)),
      roofOf('b', box(4, 0, 4, 4)),
    );
    expect(buildingsOf(design)).toEqual([{ roofs: [0, 1, 2], members: [0, 1, 2] }]);
  });
});

describe('several roofs moved as one', () => {
  it('each roof and what stands on it moves once, to the centimetre', () => {
    const design = designOf(TERRACE, stairOn(box(2, 2, 3, 3)), SHED);
    const { document, fault } = roofsMoved(design, [0, 2], { east: 1.234, north: -0.5 });
    expect(fault).toBeNull();
    expect(document.roofs[1]?.corners[0]).toEqual({ east: 3.23, north: 1.5 });
    expect(document.roofs[2]?.corners[0]).toEqual({ east: 11.23, north: -0.5 });
  });

  it('a move past the ground’s reach says so', () => {
    expect(roofsMoved(designOf(TERRACE), [0], { east: 9_000, north: 0 }).fault).toBe('too_far');
  });
});

/** A scan where each true building is a block `heightM` high on flat ground. */
function scanOf(
  blocks: readonly { readonly ring: ReturnType<typeof boxOf>; readonly heightM: number }[],
) {
  const inside = blocks.map((block) => {
    const [sw, , ne] = block.ring;
    return {
      at: inBox(sw?.east ?? 0, sw?.north ?? 0, ne?.east ?? 0, ne?.north ?? 0),
      heightM: block.heightM,
    };
  });
  const grid = gridOf(120, 0.25, (point) => inside.find((one) => one.at(point))?.heightM ?? 0);
  const buildings: SiteBuilding[] = blocks.map((block) => ({
    outline: block.ring,
    groundM: 0,
    heightM: null,
    floorsAbove: null,
  }));
  return {
    grids: { areas: [{ grid, surround: grid }], buildings },
    outlines: buildings.map((b) => b.outline),
  };
}

const NO_LINE_UP = { east: 0, north: 0, lift: 0 };

const fitsFor = (
  design: ReturnType<typeof designOf>,
  scan: ReturnType<typeof scanOf>,
  lineUp = NO_LINE_UP,
) =>
  scanFitsOf({
    buildings: buildingsOf(design).map((building) => ({
      ground: building.roofs.map((i) => design.roofs[i] as (typeof design.roofs)[number]),
      members: building.members.map((i) => design.roofs[i] as (typeof design.roofs)[number]),
    })),
    outlines: scan.outlines,
    grids: scan.grids,
    lineUp,
  });

describe('where the scan sees each building', () => {
  const scan = scanOf([{ ring: boxOf(3, 2, 13, 10), heightM: 9 }]);

  it('a roof traced 3 m west and 2 m south of its building is found there, with its height', () => {
    const [fit] = fitsFor(designOf(TERRACE), scan);
    expect(fit?.shift?.east).toBeCloseTo(3, 1);
    expect(fit?.shift?.north).toBeCloseTo(2, 1);
    const read = fit?.reads.terrace;
    expect(read?.kind === 'roof' ? read.heightM : null).toBeCloseTo(9, 0);
    expect(fit?.ranges.terrace).toEqual({ lowM: 9, highM: 9 });
  });

  it('a roof already on its building is left where it is', () => {
    expect(fitsFor(designOf(roofOf('on', boxOf(3, 2, 13, 10))), scan)[0]?.shift).toBeNull();
  });

  it('a building more than 5 m off is not looked for', () => {
    expect(fitsFor(designOf(roofOf('away', boxOf(-20, -20, -12, -12))), scan)[0]?.shift).toBeNull();
  });

  it.each([
    ['4.8 m east: found there', 4.8, 4.8, false],
    ['5 m east: found there', 5, 5, false],
    ['7 m east: past the reach, not moved', 7, null, true],
    ['12 m east: past the reach, not moved', 12, null, true],
  ])('the scan’s building %s', (_, east, found, beyond) => {
    const [fit] = fitsFor(
      designOf(TERRACE),
      scanOf([{ ring: boxOf(east, 0, east + 10, 8), heightM: 9 }]),
    );
    expect(fit?.beyondReach).toBe(beyond);
    if (found === null) expect(fit?.shift).toBeNull();
    else expect(fit?.shift?.east).toBeCloseTo(found, 0);
  });

  it('a building past the reach: Match moves nothing and keeps its height', () => {
    const far = scanOf([{ ring: boxOf(7, 0, 17, 8), heightM: 9 }]);
    const design = designOf({
      ...TERRACE,
      height: { metres: 4, setBy: 'system', tier: 'derived' },
    });
    const [building] = buildingsOf(design);
    const [fit] = fitsFor(design, far);
    if (building === undefined || fit === undefined) throw new Error('no fit');
    expect(scanMatched(design, [{ building, fit }], FACTS)).toBe(design);
  });

  it('a second Match after matching does nothing', () => {
    const design = designOf(TERRACE);
    const [building] = buildingsOf(design);
    const [fit] = fitsFor(design, scan);
    if (building === undefined || fit === undefined) throw new Error('no fit');
    const matched = scanMatched(design, [{ building, fit }], FACTS);
    const [again] = fitsFor(matched, scan);
    expect(again?.shift).toBeNull();
    expect(again?.beyondReach).toBe(false);
    if (again === undefined) throw new Error('no fit');
    expect(scanMatched(matched, [{ building, fit: again }], FACTS)).toEqual(matched);
  });

  it('with no scan building at all, nothing moves', () => {
    expect(fitsFor(designOf(TERRACE), scanOf([]))[0]?.shift).toBeNull();
  });

  it('the map lined up moves where the scan sees it', () => {
    const [fit] = fitsFor(designOf(TERRACE), scan, { east: -3, north: -2, lift: 0 });
    expect(fit?.shift).toBeNull();
  });

  it('a campus: each building finds its own place by its own shift', () => {
    const campus = scanOf([
      { ring: boxOf(3, 2, 13, 10), heightM: 9 },
      { ring: boxOf(30, 0, 36, 6), heightM: 4 },
      { ring: boxOf(-30, -20, -22, -12), heightM: 12 },
    ]);
    const design = designOf(
      TERRACE,
      roofOf('b', boxOf(31, 1, 37, 7)),
      roofOf('c', boxOf(-30, -20, -22, -12)),
    );
    const fits = fitsFor(design, campus);
    expect(fits[0]?.shift?.east).toBeCloseTo(3, 1);
    expect(fits[1]?.shift?.east).toBeCloseTo(-1, 1);
    expect(fits[1]?.shift?.north).toBeCloseTo(-1, 1);
    expect(fits[2]?.shift).toBeNull();
  });
});

describe('Match the scan', () => {
  const scan = scanOf([{ ring: boxOf(3, 2, 13, 10), heightM: 9 }]);
  const person = { metres: 4, setBy: 'person' } as const;

  it('moves a building as one piece and hands its flat roofs’ heights to the data', () => {
    const design = designOf({ ...TERRACE, height: person }, stairOn(box(2, 2, 3, 3)));
    const [building] = buildingsOf(design);
    const [fit] = fitsFor(design, scan);
    if (building === undefined || fit === undefined) throw new Error('no building');
    const matched = scanMatched(design, [{ building, fit }], FACTS);
    expect(matched.roofs[0]?.corners[0]?.east).toBeCloseTo(3, 1);
    expect(matched.roofs[1]?.corners[0]?.east).toBeCloseTo(5, 1);
    expect(matched.roofs[0]?.height).toBeNull();
  });

  it('a sloped roof moves only: its height stays as drawn', () => {
    const sloped = { ...SHED, id: 'shed', corners: box(0, 0, 10, 8), height: person };
    const design = designOf(sloped);
    const [building] = buildingsOf(design);
    const [fit] = fitsFor(design, scan);
    if (building === undefined || fit === undefined) throw new Error('no building');
    const matched = scanMatched(design, [{ building, fit }], FACTS);
    expect(matched.roofs[0]?.corners[0]?.east).toBeCloseTo(3, 1);
    expect(matched.roofs[0]?.height).toEqual(person);
  });

  it('a roof the scan reads nothing in keeps its height', () => {
    const design = designOf({ ...roofOf('lone', boxOf(40, 40, 44, 44)), height: person });
    const [building] = buildingsOf(design);
    const fit = { shift: null, beyondReach: false, reads: {}, ranges: {} };
    if (building === undefined) throw new Error('no building');
    expect(scanMatched(design, [{ building, fit }], FACTS)).toEqual(design);
  });
});

describe('Back to as drawn', () => {
  it('the picked roofs take back their outline and height as the design opened; the others stay', () => {
    const opening = designOf({ ...TERRACE, height: { metres: 4, setBy: 'person' } }, SHED);
    const moved = roofsMoved(opening, [0, 1], { east: 2, north: 0 }).document;
    const back = roofsAsDrawn(
      { ...moved, roofs: moved.roofs.map((r, i) => (i === 0 ? { ...r, height: null } : r)) },
      opening,
      ['terrace'],
    );
    expect(back.roofs[0]?.corners).toEqual(TERRACE.corners);
    expect(back.roofs[0]?.height).toEqual({ metres: 4, setBy: 'person' });
    expect(back.roofs[1]?.corners[0]?.east).toBe(12);
  });

  it('a roof drawn since the design opened keeps what it has', () => {
    const now = designOf(TERRACE);
    expect(roofsAsDrawn(now, designOf(), ['terrace'])).toBe(now);
  });
});

describe('the magnet on a drag pulls a building onto the scan', () => {
  const fit = { east: 3, north: 2 };
  it.each([
    ['within a metre: pulled onto the scan', { east: 2.4, north: 1.5 }, fit, true, fit, true],
    ['at a metre: still pulled', { east: 2, north: 2 }, fit, true, fit, true],
    [
      'past a metre: where the finger is',
      { east: 1.9, north: 2 },
      fit,
      true,
      { east: 1.9, north: 2 },
      false,
    ],
    [
      'the magnet off: where the finger is',
      { east: 2.9, north: 2 },
      fit,
      false,
      { east: 2.9, north: 2 },
      false,
    ],
    [
      'the scan sees it nowhere else',
      { east: 0.2, north: 0 },
      null,
      true,
      { east: 0.2, north: 0 },
      false,
    ],
  ] as const)('%s', (_, by, at, magnet, moved, onScan) => {
    expect(draggedOntoScan(by, at, magnet)).toEqual({ by: moved, onScan });
  });
});
