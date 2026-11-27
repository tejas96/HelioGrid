import { describe, expect, it } from 'vitest';
import type { StudioDocument } from '../../src/studio/document';
import {
  STAIRS_STRIP_M,
  stairsAsk,
  stairsDropOf,
  stairsOf,
  stairsPassed,
  stairsPlaced,
  stairsSidesOf,
} from '../../src/studio/roof-stairs';
import { stairsMomentOf } from '../../src/studio/roof-stairs-moment';
import { roofsWorked } from '../../src/studio/roof-worked';
import { box, designOf, FACTS, p, roofOf, SHED, stairOn, TERRACE } from './roof-meet-support';

/**
 * The stairs and their clear path (`T-M05-002`, part e, E119–E122, board 7): a stair room's stairs
 * start on its side that faces the most open roof; a drag or a tap moves them to a stair room's
 * side or a roof's edge, never a side another roof takes; with none, the bar asks until skipped.
 */
const CLEAR_M = 0.75;
const edgesOf = (design: StudioDocument) => roofsWorked(design, FACTS).edges;
const shown = (design: StudioDocument) => stairsOf(design, edgesOf(design), CLEAR_M);
// A stair room in the terrace's south-west corner: two of its sides are the terrace's outer walls.
const CORNER = designOf(TERRACE, stairOn(box(0, 0, 3, 3)));

describe('where the stairs reach the roof', () => {
  it('a stair room’s stairs start on its side facing the most open roof, assumed', () => {
    // East looks over 7 m of terrace, north over 5 m; south and west look off the roof.
    expect(shown(CORNER)).toMatchObject({
      roof: 1,
      side: 1,
      atM: 1.5,
      at: p(3, 1.5),
      outside: false,
      byPerson: false,
    });
  });

  it('only its sides that open onto the roof may hold them', () => {
    expect(stairsSidesOf(CORNER, edgesOf(CORNER), 1)).toEqual([1, 2]);
    expect(stairsSidesOf(CORNER, edgesOf(CORNER), 0)).toEqual([]);
  });

  it('the clear strip is the clear path wide, in front of the stairs, on the roof round them', () => {
    const strip = shown(CORNER)?.strip ?? [];
    expect(strip).toEqual([
      p(3, 1.5 - CLEAR_M / 2),
      p(3, 1.5 + CLEAR_M / 2),
      p(3 + STAIRS_STRIP_M, 1.5 + CLEAR_M / 2),
      p(3 + STAIRS_STRIP_M, 1.5 - CLEAR_M / 2),
    ]);
  });

  it('stairs a person placed on a roof’s edge are outside stairs, their strip on that roof', () => {
    const placed = stairsPlaced(CORNER, { roof: 0, side: 2, atM: 5 });
    const stairs = shown(placed);
    expect(stairs).toMatchObject({ roof: 0, side: 2, at: p(5, 8), outside: true, byPerson: true });
    // The terrace's north edge: the strip runs south, into it.
    expect(Math.min(...(stairs?.strip ?? []).map((corner) => corner.north))).toBeCloseTo(
      8 - STAIRS_STRIP_M,
      6,
    );
  });

  it('placed again, only the last side holds them', () => {
    const twice = stairsPlaced(stairsPlaced(CORNER, { roof: 0, side: 2, atM: 5 }), {
      roof: 1,
      side: 2,
      atM: 1,
    });
    const holding = twice.roofs.flatMap((roof, r) =>
      (roof.sides ?? []).flatMap((side, s) => (side.stairsAt === undefined ? [] : [[r, s]])),
    );
    expect(holding).toEqual([[1, 2]]);
  });

  it('a stored place on a side another roof now takes is passed over: the guess stands', () => {
    // The stairs were put on the terrace's east edge; the shed now takes that side.
    const placed = stairsPlaced(CORNER, { roof: 0, side: 1, atM: 4 });
    expect(shown(designOf(...placed.roofs, SHED))).toMatchObject({
      roof: 1,
      side: 1,
      byPerson: false,
    });
  });

  it('a stair room whose sides all look off its roof gives way to another that opens onto it', () => {
    // The first stair room covers the whole of a small roof apart; the second is the terrace's.
    const hut = roofOf('hut', box(20, 0, 2, 2));
    const shut = { ...stairOn(box(20, 0, 2, 2), 'hut'), id: 'stair-1' };
    expect(shown(designOf(TERRACE, hut, shut, stairOn(box(0, 0, 3, 3))))).toMatchObject({
      roof: 3,
      byPerson: false,
    });
  });

  it.each([
    ['no stair room: it asks', designOf(TERRACE), true],
    ['passed over: it asks no more', stairsPassed(designOf(TERRACE)), false],
    ['a stair room guesses them: nothing to ask', CORNER, false],
    ['no roof yet: nothing to ask', designOf(), false],
  ])('%s', (_why, design, asks) => {
    expect(stairsAsk(design, shown(design))).toBe(asks);
  });
});

describe('what the bar says about the stairs', () => {
  const guessed = shown(CORNER);
  const base = {
    ...{ placing: false, held: false, ask: false, stairs: guessed },
    ...{ guessNew: true, editable: true },
  };
  it.each([
    ['placing first', { placing: true, held: true, ask: true }, 'placing'],
    ['held next', { held: true, ask: true }, 'moving'],
    ['no stairs: it asks', { ask: true, stairs: null }, 'ask'],
    ['a guess made in this opening says a drag moves it', {}, 'guessed'],
    ['the guess the design opened with: nothing, on every reopen', { guessNew: false }, null],
    [
      'a person’s stairs: nothing',
      { stairs: shown(stairsPlaced(CORNER, { roof: 1, side: 2, atM: 1 })) },
      null,
    ],
    ['a reader: nothing', { editable: false, ask: true, stairs: null }, null],
  ] as const)('%s', (_why, facts, moment) => {
    expect(stairsMomentOf({ ...base, ...facts })).toBe(moment);
  });
});

describe('dragging the stairs', () => {
  const drop = (design: StudioDocument, at: ReturnType<typeof p>, magnet = true) =>
    stairsDropOf(design, edgesOf(design), at, 0.3, magnet);

  it.each([
    [
      'near a stair room’s side, the magnet pulls to its middle',
      p(3.1, 1.2),
      true,
      1,
      1,
      1.5,
      'middle',
    ],
    ['without the magnet it stays where it is let go', p(3.1, 1.2), false, 1, 1, 1.2, null],
    [
      'near a roof edge’s end, it pulls to the end: outside stairs',
      p(9.8, 7.9),
      true,
      0,
      2,
      0,
      'end',
    ],
  ] as const)('%s', (_why, at, magnet, roof, side, atM, pulled) => {
    expect(drop(CORNER, at, magnet)).toMatchObject({ roof, side, atM, pulled });
  });

  it('the stretch of a stair room’s side that another roof takes holds no stairs; the rest does', () => {
    // A tank room against the corner stair room's east side, along its northern metre.
    const tank = { ...stairOn(box(3, 2, 2, 1)), id: 'tank' };
    const design = designOf(TERRACE, stairOn(box(0, 0, 3, 3)), tank);
    expect(drop(design, p(3.05, 2.6), false)).toBeNull();
    expect(drop(design, p(3.05, 0.8), false)).toMatchObject({ roof: 1, side: 1 });
  });

  it('a stair room’s side that looks off its roof takes no stairs', () => {
    // The corner stair room's south side lies on the terrace's south edge, which the room takes.
    expect(drop(CORNER, p(1.5, 0.05), false)).toBeNull();
  });

  it('a roof edge takes outside stairs; a stair room’s side does not', () => {
    expect(drop(CORNER, p(6, 7.9))?.outside).toBe(true);
    expect(drop(CORNER, p(3.1, 1.5))?.outside).toBe(false);
  });

  it.each([
    ['a side another roof takes holds no stairs', designOf(TERRACE, SHED), p(10.05, 4)],
    ['out of reach of every side, nothing', CORNER, p(6, 4)],
  ])('%s', (_why, design, at) => {
    expect(drop(design, at)).toBeNull();
  });
});
