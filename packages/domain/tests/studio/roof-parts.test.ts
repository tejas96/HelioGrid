import { describe, expect, it } from 'vitest';
import { EMPTY_STUDIO_DOCUMENT, type Roof, type StudioDocument } from '../../src/studio/document';
import type { GroundPoint } from '../../src/studio/ground';
import { faultOf } from '../../src/studio/roof-check';
import { cornerAdded, cornerDragged, cornerRemoved } from '../../src/studio/roof-edit';
import {
  belongsTo,
  roofKindOf,
  roofSidesOf,
  roofsTied,
  roofWithItsParts,
  standsOn,
  tierOf,
} from '../../src/studio/roof-kind';
import { roofMoved, roofTurned } from '../../src/studio/roof-move';
import type { RoofSide } from '../../src/studio/roof-parts';
import { run } from './roof-step-run';

/**
 * What part e stores on a roof, read and kept by the release before any studio writes it
 * (`T-M05-002`, part e): a design a later studio saved opens whole here, and every edit this
 * release makes leaves it one that later studio still reads.
 */
const p = (east: number, north: number): GroundPoint => ({ east, north });
const box = (west: number, south: number, wide: number, deep: number) => [
  p(west, south),
  p(west + wide, south),
  p(west + wide, south + deep),
  p(west, south + deep),
];
const roofOf = (id: string, corners: readonly GroundPoint[], more: Partial<Roof> = {}): Roof => ({
  id,
  corners,
  edges: corners.map(() => 'traced'),
  tracedOn: 'sky',
  height: null,
  ...more,
});
const designOf = (...roofs: Roof[]): StudioDocument => ({ ...EMPTY_STUDIO_DOCUMENT, roofs });
const done = (result: { kind: string; document?: StudioDocument }) => {
  if (result.kind !== 'done' || result.document === undefined) throw new Error('refused');
  return result.document;
};

const TERRACE = roofOf('terrace', box(0, 0, 10, 8));
const STAIR = roofOf('stair', box(0, 0, 3, 3), {
  kind: { is: 'stair_room', setBy: 'system' },
  on: 'terrace',
});
const TANK_ROOM = roofOf('tank', box(1, 1, 1, 1), {
  kind: { is: 'upper_floor', setBy: 'person' },
  on: 'stair',
});
const DUCT = roofOf('duct', box(6, 5, 1, 1), {
  kind: { is: 'hole', setBy: 'person' },
  partOf: 'terrace',
});
const SHED = roofOf('shed', box(10, 0, 4, 8));
const HOUSE = designOf(TERRACE, STAIR, TANK_ROOM, DUCT, SHED);

describe('what a roof is, read forgivingly', () => {
  it.each([
    ['no kind stored: a building', undefined, 'building'],
    ['a kind this build knows', { is: 'open_shed', setBy: 'system' }, 'open_shed'],
    [
      'a kind a later studio added: a building here',
      { is: 'carport', setBy: 'person' },
      'building',
    ],
  ] as const)('%s', (_why, kind, is) => {
    expect(roofKindOf(roofOf('r', box(0, 0, 2, 2), kind === undefined ? {} : { kind }))).toBe(is);
  });

  it.each([
    ['a value the system set: assumed', { setBy: 'system' }, 'assumed'],
    ['a value a person set: estimated', { setBy: 'person' }, 'estimated'],
    [
      'a height read from the height map: its own tier',
      { setBy: 'system', tier: 'derived' },
      'derived',
    ],
    ['a ridge a person measured: its own tier', { setBy: 'person', tier: 'measured' }, 'measured'],
  ] as const)('%s', (_why, source, tier) => {
    expect(tierOf(source)).toBe(tier);
  });

  it('finds the roof one stands on and the roof it belongs to', () => {
    expect(standsOn(HOUSE, STAIR)).toBe(0);
    expect(belongsTo(HOUSE, STAIR)).toBe(0);
    // A hole stands on nothing, and goes with the roof it is part of.
    expect(standsOn(HOUSE, DUCT)).toBeNull();
    expect(belongsTo(HOUSE, DUCT)).toBe(0);
    expect(standsOn(HOUSE, TERRACE)).toBeNull();
    expect(belongsTo(HOUSE, SHED)).toBeNull();
  });

  it('an upper floor across two roofs stands on one and goes with the other', () => {
    const across = roofOf('across', box(8, 2, 4, 4), { on: 'shed', partOf: 'terrace' });
    const design = designOf(TERRACE, SHED, across);
    expect(standsOn(design, across)).toBe(1);
    expect(belongsTo(design, across)).toBe(0);
  });

  it.each([
    ['a roof that is gone', 'gone'],
    ['itself', 'lost'],
  ])('a link to %s reads as standing on the ground', (_why, to) => {
    const lost = roofOf('lost', box(0, 0, 2, 2), { on: to, partOf: to });
    const design = designOf(TERRACE, lost);
    expect(standsOn(design, lost)).toBeNull();
    expect(belongsTo(design, lost)).toBeNull();
  });

  it('gathers a roof with what stands on it, and what stands on that', () => {
    expect(roofWithItsParts(HOUSE, 0)).toEqual([0, 1, 3, 2]);
    expect(roofWithItsParts(HOUSE, 1)).toEqual([1, 2]);
    expect(roofWithItsParts(HOUSE, 4)).toEqual([4]);
  });

  it('a ring of links ends where it began', () => {
    const a = roofOf('a', box(0, 0, 2, 2), { on: 'b' });
    const b = roofOf('b', box(0, 0, 2, 2), { on: 'a' });
    expect(roofWithItsParts(designOf(a, b), 0)).toEqual([0, 1]);
  });

  it('ties a roof to the one it stands on, never to its neighbour', () => {
    expect(roofsTied(HOUSE, 0, 1)).toBe(true);
    expect(roofsTied(HOUSE, 3, 0)).toBe(true);
    expect(roofsTied(HOUSE, 0, 4)).toBe(false);
    expect(roofsTied(HOUSE, 0, 9)).toBe(false);
  });

  it.each([
    ['no list', undefined, [{}, {}, {}, {}]],
    ['a list that matches', [{ parapet: false }, {}, {}, {}], [{ parapet: false }, {}, {}, {}]],
    ['a list one short: no side holds anything', [{ parapet: false }, {}, {}], [{}, {}, {}, {}]],
    [
      'a list one long: no side holds anything',
      [{}, {}, {}, {}, { low: 'person' }],
      [{}, {}, {}, {}],
    ],
  ] as const)('a roof with %s', (_why, sides, read) => {
    const roof = roofOf('r', box(0, 0, 4, 4), sides === undefined ? {} : { sides });
    expect(roofSidesOf(roof)).toEqual(read);
  });
});

describe('edits keep what part e stores', () => {
  const SIDES: readonly RoofSide[] = [
    { parapet: false, low: 'person', stairsAt: 7, stairsBy: 'system' },
    { parapetM: 1.5 },
    {},
    { setbackM: 0, glass: 'system' },
  ];
  const sided = (sides: readonly RoofSide[] = SIDES) =>
    designOf(roofOf('terrace', box(0, 0, 10, 8), { sides }));

  it('a corner added splits its side in two, each half keeping the side’s settings', () => {
    // Side 0 runs 10 m; its new corner stands at 5 m, and the stairs stood 7 m along it.
    const added = done(cornerAdded(sided(), 0, 0)).roofs[0];
    expect(added?.sides).toEqual([
      { parapet: false, low: 'person' },
      { parapet: false, stairsAt: 2, stairsBy: 'system' },
      { parapetM: 1.5 },
      {},
      { setbackM: 0, glass: 'system' },
    ]);
  });

  it('stairs on the first half of a split side stay there', () => {
    const near = SIDES.map((side, i) => (i === 0 ? { ...side, stairsAt: 5 } : side));
    expect(done(cornerAdded(sided(near), 0, 0)).roofs[0]?.sides?.slice(0, 2)).toEqual([
      { parapet: false, low: 'person', stairsAt: 5, stairsBy: 'system' },
      { parapet: false },
    ]);
  });

  it('a corner removed joins its two sides: the side before keeps its settings and takes the other’s marks', () => {
    const five = done(cornerAdded(sided(), 0, 3));
    // Corner 0 goes: side 4 (before it) and side 0 (after it) join.
    const joined = done(cornerRemoved(five, 0, 0)).roofs[0];
    expect(joined?.corners).toHaveLength(4);
    expect(joined?.sides).toEqual([
      { parapetM: 1.5 },
      {},
      { setbackM: 0, glass: 'system' },
      // The half side before corner 0 was 4 m long: the stairs stand 7 m past its end.
      { setbackM: 0, low: 'person', stairsAt: 11, stairsBy: 'system' },
    ]);
  });

  it.each([
    ['added', (design: StudioDocument) => cornerAdded(design, 0, 1)],
    ['removed', (design: StudioDocument) => cornerRemoved(done(cornerAdded(design, 0, 1)), 0, 2)],
  ])('a roof with no side list has none after a corner is %s', (_why, edit) => {
    const roof = done(edit(designOf(TERRACE))).roofs[0] as Roof;
    expect(Object.keys(roof)).not.toContain('sides');
  });

  it('a side list that did not match the corners is dropped by the edit, never stored on the wrong sides', () => {
    const roof = done(cornerAdded(sided(SIDES.slice(0, 3)), 0, 1)).roofs[0] as Roof;
    expect(Object.keys(roof)).not.toContain('sides');
    expect(roof.corners).toHaveLength(5);
  });

  it('deleting a roof takes what stands on it and what is part of it, as one change', () => {
    const { document, commits } = run(
      [{ kind: 'tap', at: p(8, 2), system: 'metric' }, { kind: 'delete_roof' }],
      HOUSE,
    );
    expect(commits).toBe(1);
    expect(document.roofs.map((roof) => roof.id)).toEqual(['shed']);
  });

  it('deleting a stair room leaves the roof it stands on', () => {
    const { document } = run(
      [{ kind: 'tap', at: p(2.5, 2.5), system: 'metric' }, { kind: 'delete_roof' }],
      designOf(TERRACE, STAIR),
    );
    expect(document.roofs.map((roof) => roof.id)).toEqual(['terrace']);
  });

  it('a moved roof carries what stands on it; its neighbour stays', () => {
    const moved = roofMoved(HOUSE, 0, p(-20, 5));
    expect(moved.fault).toBeNull();
    expect(moved.document.roofs.map((roof) => roof.corners[0])).toEqual([
      p(-20, 5),
      p(-20, 5),
      p(-19, 6),
      p(-14, 10),
      p(10, 0),
    ]);
  });

  it('a turned roof turns what stands on it about the roof’s own middle', () => {
    const turned = roofTurned(designOf(TERRACE, STAIR), 0, 180, false);
    // The terrace's middle is (5, 4): the stair room's corner (0, 0) lands at (10, 8).
    expect(turned.document.roofs[1]?.corners[0]?.east).toBeCloseTo(10, 6);
    expect(turned.document.roofs[1]?.corners[0]?.north).toBeCloseTo(8, 6);
  });

  it('a roof carried past the site’s reach is refused with its roof', () => {
    expect(roofMoved(designOf(TERRACE, STAIR), 0, p(1_995, 0)).fault).toBe('too_far');
  });
});

describe('the touching check knows how roofs relate', () => {
  it.each([
    ['a stair room on its roof', 1],
    ['an upper floor on the stair room', 2],
    ['a hole in its roof', 3],
  ])('%s is never refused for lying over it', (_why, index) => {
    const roof = HOUSE.roofs[index] as Roof;
    expect(faultOf(HOUSE, index, roof.corners)).toBeNull();
    expect(cornerDragged(HOUSE, index, 2, p(4, 4), false).fault).toBeNull();
  });

  it('the roof under a stair room is not refused for what stands on it', () => {
    expect(faultOf(HOUSE, 0, TERRACE.corners)).toBeNull();
    expect(cornerDragged(HOUSE, 0, 2, p(10, 9), false).fault).toBeNull();
  });

  it('an open shed over a roof is not refused, though it stands on none', () => {
    const over = roofOf('over', box(-1, -1, 12, 10), {
      kind: { is: 'open_shed', setBy: 'system' },
    });
    const design = designOf(TERRACE, over);
    expect(faultOf(design, 1, over.corners)).toBeNull();
    expect(faultOf(design, 0, TERRACE.corners)).toBeNull();
  });

  it('a roof of a kind a later studio added, standing on another, is not refused either', () => {
    const later = roofOf('later', box(2, 2, 3, 3), {
      kind: { is: 'water_tank_room', setBy: 'person' },
      on: 'terrace',
    });
    const design = designOf(TERRACE, later);
    expect(roofMoved(design, 1, p(1, 1)).fault).toBeNull();
    expect(cornerDragged(design, 0, 2, p(10, 9), false).fault).toBeNull();
  });

  it('two buildings on the ground still never overlap', () => {
    expect(roofMoved(HOUSE, 4, p(-2, 0)).fault).toBe('would_overlap');
    expect(roofMoved(HOUSE, 0, p(2, 0)).fault).toBe('would_overlap');
  });

  it('a building of a kind a later studio added is kept clear of others, as a building is', () => {
    const later = roofOf('later', box(10, 0, 4, 8), { kind: { is: 'carport', setBy: 'person' } });
    expect(roofMoved(designOf(TERRACE, later), 1, p(-2, 0)).fault).toBe('would_overlap');
  });
});
