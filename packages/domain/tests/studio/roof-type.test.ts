import { describe, expect, it } from 'vitest';
import {
  EMPTY_STUDIO_DOCUMENT,
  ROOFS_MAX,
  type Roof,
  type StudioDocument,
} from '../../src/studio/document';
import { entryMetres, entryRead, pairOf } from '../../src/studio/roof-entry';
import { lengthSet } from '../../src/studio/roof-length';
import { edgeLengths, roofArea } from '../../src/studio/roof-shape';
import type { RoofStepEvent } from '../../src/studio/roof-step-state';
import { scaleTierOf } from '../../src/studio/roof-trust';
import { typedPlaceOf, typedResult, typedStart } from '../../src/studio/roof-type';
import { drawn, p, RECTANGLE, run, STAMP } from './roof-step-run';

const START = { length: 10, width: 8 };
const OPEN: RoofStepEvent = { kind: 'type_size', start: START, system: 'metric' };
const PLACE: RoofStepEvent = { kind: 'place', id: 'typed-1', stamp: null, system: 'metric' };
const m = (main: string) => ({ main, inches: '', measured: false });
const size = (length: string, width: string): RoofStepEvent => ({
  kind: 'type_entry',
  length: m(length),
  width: m(width),
});

describe('a box reads a plain number, never part of one (T-M05-002)', () => {
  it.each([
    ['13.2', 13.2],
    ['.5', 0.5],
    ['8.', 8],
    [' 7 ', 7],
  ])('%j is %s m', (text, metres) => {
    expect(entryMetres(m(text), 'metric')).toBe(metres);
  });

  // The old reader dropped every other character: 1e3 read as 13 m, 1O as 1 m.
  it.each(['1e3', '1O', '12a.5', '1.2.3', '-4', '4m'])('%j is refused as not a number', (text) => {
    expect(entryRead(m(text), 'metric')).toEqual({ kind: 'bad' });
    expect(entryMetres(m(text), 'metric')).toBeNull();
  });

  it('an empty box is empty, not refused', () => {
    expect(entryRead(m(''), 'metric')).toEqual({ kind: 'empty' });
  });

  it.each([
    ['40\'6"', 40, 6],
    ['40′ 6″', 40, 6],
    ['40 ft 6 in', 40, 6],
    ["40'", 40, 0],
  ])('feet box %j is %s ft %s in', (text, feet, inches) => {
    const read = entryRead({ main: text, inches: '9', measured: false }, 'imperial');
    expect(read.kind).toBe('metres');
    if (read.kind === 'metres') expect(read.metres).toBeCloseTo(feet * 0.3048 + inches * 0.0254, 6);
  });

  it('the old reader made 406 ft of 40\'6"; feet and inches in two boxes still read', () => {
    expect(entryMetres({ main: '43', inches: '4', measured: false }, 'imperial')).toBeCloseTo(
      43 * 0.3048 + 4 * 0.0254,
      6,
    );
    expect(entryRead({ main: '43', inches: 'x', measured: false }, 'imperial')).toEqual({
      kind: 'bad',
    });
  });

  it.each([
    ['13.2x8.6', ['13.2', '8.6']],
    ['13.2 × 8.6', ['13.2', '8.6']],
    ['13.2m X 8.6m', ['13.2', '8.6']],
    ['13*8', ['13', '8']],
  ])('one box %j is a length and a width', (text, pair) => {
    expect(pairOf(text)).toEqual(pair);
  });

  it.each(['13.2', '13.2x', 'x8', '13x8x2', '1e3x8'])('one box %j is not a pair', (text) => {
    expect(pairOf(text)).toBeNull();
  });
});

describe('Type the size: the card, the place and Place roof (T-M05-002c)', () => {
  it('opens at the market’s start size, on the pin', () => {
    const { state } = run([OPEN]);
    expect(state.kind).toBe('typing');
    if (state.kind !== 'typing') return;
    expect(state.place).toEqual({ kind: 'pin' });
    expect(entryMetres(state.length, 'metric')).toBe(10);
    expect(entryMetres(state.width, 'metric')).toBe(8);
  });

  it('opens from a drawing with no corner yet, never from one begun', () => {
    expect(run([{ kind: 'draw', magnet: true }, OPEN]).state.kind).toBe('typing');
    const begun = run([
      { kind: 'draw', magnet: true },
      { kind: 'tap', at: p(0, 0), system: 'metric' },
      OPEN,
    ]);
    expect(begun.state.kind).toBe('drawing');
  });

  it('places a rectangle centred on the pin, its length east–west, every edge typed', () => {
    const { document, commits, state } = run([OPEN, size('13.2', '8.6'), PLACE]);
    expect(commits).toBe(1);
    const roof = document.roofs[0] as Roof;
    expect(roof.tracedOn).toBe('none');
    expect(roof.edges).toEqual(['typed', 'typed', 'typed', 'typed']);
    expect(edgeLengths(roof.corners).map((v) => +v.toFixed(6))).toEqual([13.2, 8.6, 13.2, 8.6]);
    expect(roof.corners[0]).toEqual(p(-6.6, -4.3));
    expect(roofArea(roof.corners)).toBeCloseTo(113.52, 6);
    expect(state).toMatchObject({
      kind: 'idle',
      roof: 0,
      said: { kind: 'placed', onPicture: false },
    });
  });

  it('a length longer than the width still runs east–west: the roof never turns as you slide', () => {
    const { document } = run([OPEN, size('4', '9'), PLACE]);
    const [a, b] = (document.roofs[0] as Roof).corners;
    expect((b?.east ?? 0) - (a?.east ?? 0)).toBeCloseTo(4, 9);
  });

  it('the first roof placed on the sky picture keeps its stamp; a later one does not change it', () => {
    const onSky: RoofStepEvent = { ...PLACE, stamp: STAMP } as RoofStepEvent;
    const first = run([OPEN, onSky]);
    expect(first.document.drawnOn).toEqual(STAMP);
    expect(first.state).toMatchObject({ said: { kind: 'placed', onPicture: true } });
    const later = run(
      [OPEN, { ...onSky, stamp: { source: 'google', takenOn: '2026-01-01' } } as RoofStepEvent],
      drawn,
    );
    expect(later.document.drawnOn).toEqual(drawn.drawnOn);
  });

  it('Cancel drops the card and changes nothing', () => {
    const { state, commits } = run([OPEN, size('12', '6'), { kind: 'cancel' }]);
    expect(commits).toBe(0);
    expect(state.kind).toBe('idle');
  });

  it('a refused card does not place', () => {
    const { commits, state } = run([OPEN, size('0.2', '6'), PLACE]);
    expect(commits).toBe(0);
    expect(state.kind).toBe('typing');
  });

  it.each([
    ['abc', '6', 'not_a_number'],
    ['0.2', '6', 'too_short'],
    ['1000', '6', 'too_long'],
  ])('%s × %s is refused: %s', (length, width, kind) => {
    const { state } = run([OPEN, size(length, width)]);
    if (state.kind !== 'typing') throw new Error(state.kind);
    expect(typedResult(state, EMPTY_STUDIO_DOCUMENT, 'metric')).toEqual({
      kind: 'refused',
      refusal: { kind },
    });
  });

  it('an empty box waits: neither placed nor refused', () => {
    const { state } = run([OPEN, size('', '6')]);
    if (state.kind !== 'typing') throw new Error(state.kind);
    expect(typedResult(state, EMPTY_STUDIO_DOCUMENT, 'metric').kind).toBe('empty');
  });

  it('the one box fills both numbers; an unreadable one is refused as typed', () => {
    const typed = run([OPEN, { kind: 'type_pair', text: '13.2x8.6' }]).state;
    if (typed.kind !== 'typing') throw new Error(typed.kind);
    expect(entryMetres(typed.length, 'metric')).toBe(13.2);
    expect(entryMetres(typed.width, 'metric')).toBe(8.6);
    const bad = run([OPEN, { kind: 'type_pair', text: '13.2xx' }]).state;
    if (bad.kind !== 'typing') throw new Error(bad.kind);
    expect(typedResult(bad, EMPTY_STUDIO_DOCUMENT, 'metric')).toEqual({
      kind: 'refused',
      refusal: { kind: 'not_a_number' },
    });
  });

  it('metres to feet while the card is open writes the same lengths in feet', () => {
    const { state } = run([
      OPEN,
      size('13.2', '8.6'),
      { kind: 'type_units', from: 'metric', to: 'imperial' },
    ]);
    if (state.kind !== 'typing') throw new Error(state.kind);
    expect(state.length).toMatchObject({ main: '43', inches: '4' });
    // Feet are written to the inch: 43 ft 4 in is 13.208 m.
    expect(entryMetres(state.length, 'imperial')).toBeCloseTo(13.2, 1);
  });
});

describe('a typed roof beside the roof on the pin (T-M05-002c)', () => {
  // The drawn roof covers 0..8 east, 0..6 north: the pin (0, 0) is on its corner.
  it('goes east of the roof in the way, sharing its wall', () => {
    expect(typedPlaceOf(drawn.roofs, 10, 8)).toEqual({ kind: 'beside', roof: 0, side: 'east' });
    const { document } = run([OPEN, size('4', '3'), PLACE], drawn);
    const added = document.roofs[1] as Roof;
    expect(Math.min(...added.corners.map((c) => c.east))).toBeCloseTo(8, 9);
  });

  it('keeps its place as it grows: a size that runs into another roof is refused and names it', () => {
    const shed: Roof = {
      id: 'shed',
      corners: [p(19, 2), p(21, 2), p(21, 4), p(19, 4)],
      edges: ['traced', 'traced', 'traced', 'traced'],
      tracedOn: 'sky',
      height: null,
    };
    const two: StudioDocument = { ...drawn, roofs: [...drawn.roofs, shed] };
    const { state } = run([OPEN, size('14', '3')], two);
    if (state.kind !== 'typing') throw new Error(state.kind);
    // The start size fits east of the drawn roof; grown to 14 m it reaches the shed.
    expect(state.place).toEqual({ kind: 'beside', roof: 0, side: 'east' });
    expect(typedResult(state, two, 'metric')).toEqual({
      kind: 'refused',
      refusal: { kind: 'overlaps', roof: 1 },
    });
  });

  it('is refused once the design holds the most roofs', () => {
    const full: StudioDocument = {
      ...EMPTY_STUDIO_DOCUMENT,
      roofs: Array.from({ length: ROOFS_MAX }, (_, i) => ({
        ...(drawn.roofs[0] as Roof),
        id: `r${i}`,
        corners: (drawn.roofs[0] as Roof).corners.map((c) => p(c.east + i * 20, c.north + 50)),
      })),
    };
    const size0 = typedStart(full.roofs, START, 'metric');
    expect(typedResult(size0, full, 'metric')).toEqual({
      kind: 'refused',
      refusal: { kind: 'too_many_roofs' },
    });
  });
});

describe('only a roof traced on the picture sizes it (T-M05-002c)', () => {
  const typedOnly = run([OPEN, size('6', '4'), PLACE]).document;

  it('a typed roof does not stop the first picture length from sizing the picture', () => {
    // The typed roof sits on the pin; the picture roof is drawn beside it, then sized.
    const both = run(
      [
        { kind: 'draw', magnet: false },
        { kind: 'tap', at: p(10, 0), system: 'metric' },
        { kind: 'tap', at: p(18, 0), system: 'metric' },
        { kind: 'tap', at: p(18, 6), system: 'metric' },
        { kind: 'tap', at: p(10, 6), system: 'metric' },
        { kind: 'close', id: 'pic', tracedOn: 'sky', stamp: STAMP },
      ],
      typedOnly,
    ).document;
    const result = lengthSet(both, 1, 0, 16, 'typed');
    if (result.kind !== 'done') throw new Error(result.kind);
    expect(result.document.pictureScale).toBeCloseTo(2, 9);
    // The picture roof doubled about the pin; the typed roof kept its true size.
    expect(edgeLengths((result.document.roofs[0] as Roof).corners)[0]).toBeCloseTo(6, 9);
    expect(edgeLengths((result.document.roofs[1] as Roof).corners)[1]).toBeCloseTo(12, 9);
  });

  it('a roof drawn on the bare grid is never stretched: its first length fixes its own edge', () => {
    const grid = run([
      ...RECTANGLE.slice(0, -1),
      { kind: 'close', id: 'g', tracedOn: 'none', stamp: null },
    ]).document;
    const result = lengthSet(grid, 0, 0, 10, 'typed');
    if (result.kind !== 'done') throw new Error(result.kind);
    expect(result.document.pictureScale).toBe(1);
    expect(edgeLengths((result.document.roofs[0] as Roof).corners)[1]).toBeCloseTo(6, 9);
  });

  it('the picture’s tier never comes from a typed roof', () => {
    expect(scaleTierOf(typedOnly)).toBeNull();
  });
});

describe('the one box waits while a pair is half typed (T-M05-002c)', () => {
  it.each(['', '1', '13.2', '13.2x', '13.2 ×', '.', 'x8'])('%j waits', (text) => {
    const { state } = run([OPEN, { kind: 'type_pair', text }]);
    if (state.kind !== 'typing') throw new Error(state.kind);
    expect(typedResult(state, EMPTY_STUDIO_DOCUMENT, 'metric').kind).toBe('empty');
  });

  it.each(['abc', '13.2xx8', '13.2x8x1', '1e3x8'])('%j is refused', (text) => {
    const { state } = run([OPEN, { kind: 'type_pair', text }]);
    if (state.kind !== 'typing') throw new Error(state.kind);
    expect(typedResult(state, EMPTY_STUDIO_DOCUMENT, 'metric').kind).toBe('refused');
  });

  it('a roof placed beside another says which', () => {
    const { state } = run([OPEN, size('4', '3'), PLACE], drawn);
    expect(state).toMatchObject({ said: { kind: 'placed', beside: 0 } });
  });
});
