import { describe, expect, it } from 'vitest';
import type { Coordinate } from '../../src/format/areas';
import { EMPTY_STUDIO_DOCUMENT, type Roof, type StudioDocument } from '../../src/studio/document';
import { coordinateOf, type GroundPoint } from '../../src/studio/ground';
import { drawingsAfterPinMove, PIN_FIX_REACH_M } from '../../src/studio/site-moved';

const PIN: Coordinate = { latitude: 16.845_6, longitude: 74.601_2 };
/** The pin moved this far east and north, as a stored pin: six decimals. */
const pinAt = (east: number, north: number): Coordinate => {
  const at = coordinateOf(PIN, { east, north });
  return {
    latitude: Math.round(at.latitude * 1e6) / 1e6,
    longitude: Math.round(at.longitude * 1e6) / 1e6,
  };
};

const roofAt = (corners: readonly GroundPoint[]): Roof => ({
  id: 'roof-1',
  corners,
  edges: corners.map(() => 'traced' as const),
  tracedOn: 'sky',
  height: null,
});
const SQUARE = [
  { east: 10, north: 10 },
  { east: 20, north: 10 },
  { east: 20, north: 20 },
];
const drawn = (pictureScale = 1, corners: readonly GroundPoint[] = SQUARE): StudioDocument => ({
  ...EMPTY_STUDIO_DOCUMENT,
  drawnOn: { source: 'google', takenOn: '2025-01-01' },
  roofs: [roofAt(corners)],
  pictureScale,
});
/** To the whole metre: a stored pin keeps six decimals, about 0.1 m. */
const cornersOf = (document: StudioDocument | null | undefined) =>
  document?.roofs[0]?.corners.map((c) => ({
    east: Math.round(c.east),
    north: Math.round(c.north),
  }));

describe('a drawing when the pin moves', () => {
  it.each([
    ['no pin before: the first pin moves nothing', null, pinAt(30, 0)],
    ['the same pin', PIN, PIN],
  ])('%s', (_, before, after) => {
    expect(drawingsAfterPinMove([drawn()], before, after, false)).toEqual({
      kind: 'done',
      documents: [null],
    });
  });

  it('a fix keeps each roof on its house: the roof moves back by the pin’s shift', () => {
    const answer = drawingsAfterPinMove([drawn()], PIN, pinAt(5, -3), false);
    expect(answer.kind).toBe('done');
    if (answer.kind !== 'done') return;
    expect(cornersOf(answer.documents[0])).toEqual([
      { east: 5, north: 13 },
      { east: 15, north: 13 },
      { east: 15, north: 23 },
    ]);
  });

  it('a fix on a stretched picture moves the roof by the shift stretched the same', () => {
    const answer = drawingsAfterPinMove([drawn(2)], PIN, pinAt(4, 0), false);
    expect(answer.kind === 'done' && cornersOf(answer.documents[0])).toEqual([
      { east: 2, north: 10 },
      { east: 12, north: 10 },
      { east: 12, north: 20 },
    ]);
  });

  it('a fix keeps the picture, its scale and its stamp', () => {
    const before = drawn(1.5);
    const answer = drawingsAfterPinMove([before], PIN, pinAt(5, 0), false);
    const after = answer.kind === 'done' ? answer.documents[0] : null;
    expect(after?.pictureScale).toBe(1.5);
    expect(after?.drawnOn).toEqual(before.drawnOn);
    expect(after?.roofs[0]?.edges).toEqual(before.roofs[0]?.edges);
  });

  it('a design with no roofs is never written', () => {
    expect(drawingsAfterPinMove([EMPTY_STUDIO_DOCUMENT], PIN, pinAt(900, 0), false)).toEqual({
      kind: 'done',
      documents: [null],
    });
  });

  it.each([
    ['at the reach', PIN_FIX_REACH_M - 0.5, 'done'],
    ['just past it', PIN_FIX_REACH_M + 0.5, 'refused'],
    ['another town', 20_000, 'refused'],
  ])('a move %s with roofs drawn: %s', (_, east, kind) => {
    expect(drawingsAfterPinMove([drawn()], PIN, pinAt(east, 0), false).kind).toBe(kind);
  });

  it('a fix that would carry a corner past the site’s reach counts as another site', () => {
    const edge = [
      { east: 1_990, north: 0 },
      { east: 1_999, north: 0 },
      { east: 1_999, north: 5 },
    ];
    expect(drawingsAfterPinMove([drawn(1, edge)], PIN, pinAt(-20, 0), false).kind).toBe('refused');
  });

  it('another site, once asked: every roof goes, with the picture’s stamp and scale', () => {
    const answer = drawingsAfterPinMove(
      [drawn(2), EMPTY_STUDIO_DOCUMENT],
      PIN,
      pinAt(900, 0),
      true,
    );
    expect(answer).toEqual({
      kind: 'done',
      documents: [{ ...EMPTY_STUDIO_DOCUMENT, picture: null }, null],
    });
  });

  it('another site keeps the picture a person picked', () => {
    const picked = { ...drawn(), picture: 'none' as const };
    const answer = drawingsAfterPinMove([picked], PIN, pinAt(900, 0), true);
    expect(answer.kind === 'done' && answer.documents[0]?.picture).toBe('none');
  });

  it('every design of the lead is moved, the empty ones left alone', () => {
    const answer = drawingsAfterPinMove(
      [drawn(), EMPTY_STUDIO_DOCUMENT, drawn()],
      PIN,
      pinAt(5, 0),
      false,
    );
    expect(answer.kind === 'done' && answer.documents.map((d) => d === null)).toEqual([
      false,
      true,
      false,
    ]);
  });
});
