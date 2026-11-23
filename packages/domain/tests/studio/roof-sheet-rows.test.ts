import { describe, expect, it } from 'vitest';
import { roofParapetAllRound, roofSideMarked } from '../../src/studio/roof-choices';
import { floorAt, floorStepped, floorTicks } from '../../src/studio/roof-sheet-rows';
import { roofNumberSet } from '../../src/studio/roof-values-set';
import { box, designOf, FACTS, kindOf, roofOf, SHED, stairOn, TERRACE } from './roof-meet-support';
import { LEAN, SLIDE, shaped, sheetOf } from './roof-sheet-support';

/**
 * A roof's sheet and a side's sheet (`T-M05-002`, part e, board section 6): one row per value, a
 * row the roof has no use for left out, and the amber dot only where something waits for a person.
 */
describe('the height slider’s floors', () => {
  const plinth = 0.45;
  const storey = 3;
  const ticks = floorTicks(plinth, storey, SLIDE);

  it('G is the plinth and one storey; each floor one storey more, within the slider', () => {
    expect(ticks.map((tick) => tick.floor)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(ticks[0]?.metres).toBe(3.45);
    expect(ticks.at(-1)?.metres).toBe(18.45);
  });

  it.each([
    ['a floor under the slider’s start is left out', { min: 4, max: 20 }, 1],
    ['a floor past its end is left out', { min: 2, max: 6.44 }, 0],
    ['a floor right on its end stays', { min: 2, max: 6.45 }, 0],
  ])('%s', (_why, slide, first) => {
    const found = floorTicks(plinth, storey, slide);
    expect(found[0]?.floor).toBe(first);
  });

  it('a market with no storey has no floors', () => {
    expect(floorTicks(plinth, 0, SLIDE)).toEqual([]);
  });

  it.each([
    ['on G, + goes to G+1', 3.45, 1, 6.45],
    ['on G+1, − goes to G', 6.45, -1, 3.45],
    ['between floors, + goes to the floor above', 5, 1, 6.45],
    ['between floors, − goes to the floor below', 5, -1, 3.45],
    ['under G, − has nowhere to go', 3, -1, null],
    ['on the top floor, + has nowhere to go', 18.45, 1, null],
    ['a hair under a floor counts as on it', 6.446, 1, 9.45],
  ] as const)('%s', (_why, metres, by, next) => {
    expect(floorStepped(ticks, metres, by)).toBe(next);
  });

  it.each([
    ['a height on a floor is that floor', 6.45, 1],
    ['a hair off is still on it', 6.454, 1],
    ['between floors is none', 6.47, null],
  ] as const)('%s', (_why, metres, floor) => {
    expect(floorAt(ticks, metres)?.floor ?? null).toBe(floor);
  });
});

describe('a roof’s sheet: one row per value it has', () => {
  it('a flat concrete terrace: height from ground with its floors, a parapet, its details; no slope', () => {
    const sheet = sheetOf(designOf(TERRACE), 0);
    expect(sheet.kind).toBeNull();
    expect(sheet.height.from).toEqual({ kind: 'ground' });
    expect(sheet.height.ticks[0]?.floor).toBe(0);
    // A roof on the ground starts at the plinth and one storey: on G.
    expect(sheet.height.floor?.floor).toBe(0);
    expect(sheet.slope).toBeNull();
    expect(sheet.overhang).toBeNull();
    expect(sheet.extras).toEqual([]);
    expect(sheet.parapet).toMatchObject({ allRound: true, byPerson: false, waits: false });
    expect(sheet.details).toMatchObject({ build: 'wall', measured: 'outside' });
    expect(sheet.shape).toMatchObject({ is: 'flat', byPerson: false, isLater: false });
  });

  it.each([
    ['gable', false],
    ['any', false],
    ['monitor', true],
    ['gambrel', true],
  ] as const)('a %s roof opens the picker with More shapes shown: %s', (shape, later) => {
    const row = sheetOf(designOf(shaped(shape)), 0).shape;
    expect(row?.isLater).toBe(later);
    expect(row?.[later ? 'later' : 'first']).toContain(shape);
  });

  it('a stair room’s sheet has a Stairs row: its sides open onto the roof, and where they are', () => {
    const design = designOf(TERRACE, stairOn(box(0, 0, 3, 3)));
    expect(sheetOf(design, 1).stairs).toEqual({
      sides: [
        { side: 1, faces: 'east' },
        { side: 2, faces: 'north' },
      ],
      on: 1,
      byPerson: false,
    });
    expect(sheetOf(design, 0).stairs).toBeNull();
  });

  it('a height between floors stands on none; on a floor, on it', () => {
    const between = { ...TERRACE, height: { metres: 5, setBy: 'person' as const } };
    expect(sheetOf(designOf(between), 0).height.floor).toBeNull();
    const floors = sheetOf(designOf(TERRACE), 0).height.ticks;
    const up = { ...TERRACE, height: { metres: floors[1]?.metres ?? 0, setBy: 'person' as const } };
    expect(sheetOf(designOf(up), 0).height.floor?.floor).toBe(1);
  });

  it('a shed: Height of low edge, a slope that runs one way, an overhang', () => {
    const sheet = sheetOf(designOf(LEAN), 0);
    expect(sheet.height.from).toEqual({ kind: 'low_edge' });
    expect(sheet.slope?.way.kind).toBe('down');
    expect(sheet.slope?.ridgeAboveM).toBeGreaterThan(0);
    expect(sheet.overhang).not.toBeNull();
  });

  it('north of the equator a shed runs down to the south, the side that looks toward it', () => {
    const sheet = sheetOf(designOf(LEAN), 0);
    // Its exact way in whole degrees, clockwise from north, shown beside the word (E097).
    expect(sheet.slope?.way).toEqual({ kind: 'down', way: 'south', bearing: 180 });
  });

  it('a gable faces two ways, and its ridge stands above its low edge', () => {
    const sheet = sheetOf(designOf(shaped('gable')), 0);
    // The 12 × 8 gable's faces look north and south, each with its exact way in degrees.
    expect(sheet.slope?.way).toEqual({
      kind: 'faces',
      ways: [
        { way: 'south', bearing: 180 },
        { way: 'north', bearing: 0 },
      ],
    });
    expect(sheet.slope?.ridgeAboveM).toBeGreaterThan(0);
    // The 12 × 8 gable's ridge runs east to west along its middle.
    const ridge = sheet.slope?.ridge;
    expect(ridge?.from.north).toBeCloseTo(4, 6);
    expect(ridge?.to.north).toBeCloseTo(4, 6);
    expect(Math.abs((ridge?.to.east ?? 0) - (ridge?.from.east ?? 0))).toBeGreaterThan(0);
  });

  it('a shed’s ridge is its high edge: north of the equator, its north side', () => {
    const ridge = sheetOf(designOf(LEAN), 0).slope?.ridge;
    expect(ridge?.from.north).toBeCloseTo(8, 6);
    expect(ridge?.to.north).toBeCloseTo(8, 6);
  });

  it.each([
    ['a concrete roof given a gable starts as a sloped slab', 'rcc', 20],
    ['a metal roof keeps its own slope', 'trapezoidal_sheet', 6],
    ['tiles on RCC keep theirs', 'tiles_on_rcc', 20],
  ])('%s', (_why, type, degrees) => {
    const roof = shaped('gable', { material: { type, setBy: 'person', confirmed: true } });
    expect(sheetOf(designOf(roof), 0).slope?.number.value).toBe(degrees);
  });

  it.each([
    ['a sawtooth adds its teeth', 'sawtooth', ['teeth']],
    ['a monitor adds its raised middle', 'monitor', ['raised_width', 'raised_height']],
    ['a mansard adds an upper slope and where it breaks', 'mansard', ['upper_slope', 'break_in']],
    ['a butterfly adds where its valley sits', 'butterfly', ['valley']],
    ['a hip adds nothing', 'hip', []],
  ])('%s', (_why, shape, keys) => {
    expect(sheetOf(designOf(shaped(shape)), 0).extras.map((each) => each.key)).toEqual(keys);
  });

  it('a stair room: what it is, with its choices; its height above the roof it stands on', () => {
    const sheet = sheetOf(designOf(TERRACE, stairOn(box(1, 1, 3, 3))), 1);
    expect(sheet.kind).toMatchObject({ is: 'stair_room', waits: true });
    expect(sheet.kind?.choices).toEqual([
      'stair_room',
      'upper_floor',
      'hole',
      'open_shed',
      'separate_part',
    ]);
    expect(sheet.height.from).toEqual({ kind: 'above', roof: { kind: 'roof', number: 1 } });
    expect(sheet.height.ticks).toEqual([]);
  });

  it('a kind a person made theirs waits no more', () => {
    const mine = roofOf('stair', box(1, 1, 3, 3), {
      kind: { is: 'stair_room', setBy: 'person' },
      on: 'terrace',
      material: { type: 'rcc', setBy: 'person', confirmed: true },
    });
    const sheet = sheetOf(designOf({ ...TERRACE, material: mine.material }, mine), 1);
    expect(sheet.kind?.waits).toBe(false);
    expect(sheet.waits).toBe(false);
  });

  it('a dormer keeps its own kind first among the choices', () => {
    const dormer = kindOf('dormer', 'dormer', box(11, 1, 2, 2), { partOf: 'shed' });
    const sheet = sheetOf(designOf(SHED, dormer), 1);
    expect(sheet.kind?.choices[0]).toBe('dormer');
  });

  it('an open shed has no walls: no parapet row and no parapet details', () => {
    const canopy = kindOf('canopy', 'open_shed', box(1, 1, 3, 3), { on: 'terrace' });
    const sheet = sheetOf(designOf(TERRACE, canopy), 1);
    expect(sheet.parapet).toBeNull();
    expect(sheet.details).toBeNull();
  });

  it.each([
    ['1.5 m does not wait', 1.5, false],
    ['above 1.5 m waits, though a person set it', 1.55, true],
  ])('a parapet height: %s', (_why, metres, waits) => {
    const set = roofNumberSet(designOf(TERRACE), { roof: 0, key: 'parapet_height' }, metres, FACTS);
    const confirmed = {
      ...set,
      roofs: set.roofs.map((roof) => ({
        ...roof,
        material: { type: 'rcc', setBy: 'person' as const, confirmed: true },
      })),
    };
    const sheet = sheetOf(confirmed, 0);
    expect(sheet.parapet?.waits).toBe(waits);
    expect(sheet.waits).toBe(waits);
  });

  it('a high parapet waits only while there is one', () => {
    const set = roofNumberSet(designOf(TERRACE), { roof: 0, key: 'parapet_height' }, 1.8, FACTS);
    const off = roofParapetAllRound(set, 0, false, FACTS);
    expect(sheetOf(off, 0).parapet?.waits).toBe(false);
  });

  it('a material not yet confirmed waits; confirmed, it does not', () => {
    expect(sheetOf(designOf(TERRACE), 0).waits).toBe(true);
    const confirmed = {
      ...TERRACE,
      material: { type: 'rcc', setBy: 'system' as const, confirmed: true },
    };
    expect(sheetOf(designOf(confirmed), 0).waits).toBe(false);
  });

  it('a low side against a taller roof’s wall is said, and waits', () => {
    const lean = { ...LEAN, height: { metres: 2.4, setBy: 'person' as const } };
    // The low side put against the terrace, which stands higher.
    const against = roofSideMarked(designOf(TERRACE, lean), 1, 3, 'low');
    const sheet = sheetOf(against, 1);
    expect(sheet.slope?.lowAgainst).toEqual({ kind: 'roof', number: 1 });
    expect(sheet.slope?.waits).toBe(true);
    const away = roofSideMarked(designOf(TERRACE, lean), 1, 1, 'low');
    expect(sheetOf(away, 1).slope?.lowAgainst).toBeNull();
  });
});
