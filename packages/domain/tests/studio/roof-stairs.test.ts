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
import { roofsWorked } from '../../src/studio/roof-worked';
import { box, designOf, FACTS, p, SHED, stairOn, TERRACE } from './roof-meet-support';

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

  it.each([
    ['no stair room: it asks', designOf(TERRACE), true],
    ['passed over: it asks no more', stairsPassed(designOf(TERRACE)), false],
    ['a stair room guesses them: nothing to ask', CORNER, false],
    ['no roof yet: nothing to ask', designOf(), false],
  ])('%s', (_why, design, asks) => {
    expect(stairsAsk(design, shown(design))).toBe(asks);
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
