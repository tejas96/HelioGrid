import { describe, expect, it } from 'vitest';
import type { Roof } from '../../src/studio/document';
import { roofBuilt, roofSlopeDeg } from '../../src/studio/roof-built';
import {
  handFaceLowSet,
  handFaceLowSideOf,
  handFaceRowsOf,
  handFacesCleared,
} from '../../src/studio/roof-hand-face-set';
import {
  handFaceAt,
  handFaceRefusal,
  handFacesDrawn,
  handFacesKept,
} from '../../src/studio/roof-hand-faces';
import { roofNumberOf } from '../../src/studio/roof-values';
import { roofNumberReset, roofNumberSet } from '../../src/studio/roof-values-set';
import {
  anyRoof,
  faceOf,
  NORTH,
  NORTH_HALF,
  ROOF,
  SOUTH,
  SOUTH_HALF,
} from './roof-hand-face-support';
import { box, designOf, FACTS, p } from './roof-meet-support';
import { sheetOf } from './roof-sheet-support';

/**
 * Any shape's faces drawn by hand (`T-M05-002`, part e, E082, board 5.10): a face drawn with the
 * roof's own drawing tool closes onto its roof with the roof's slope and a low side the studio
 * picks; the next face starts at once; once the faces cover the roof it stands in them. The magnet
 * pulls a face's corners to the outline and the faces drawn before; a face may not leave its roof
 * or lie over another face.
 */

describe('the side a closed face slopes down to, where no person has said', () => {
  it.each([
    ['a gable’s south half: its eave, the long side on the outline', SOUTH_HALF, ROOF, 0],
    ['a gable’s north half: its eave on the north', NORTH_HALF, ROOF, 2],
    ['a hip’s end: the one side on the outline', [p(0, 0), p(2, 2), p(0, 4)], ROOF, 2],
    [
      'a face with no side on the outline: the side toward the equator',
      [p(2, 2), p(6, 2), p(6, 6), p(2, 6)],
      box(0, 0, 8, 8),
      0,
    ],
    [
      'a square face over the whole roof: of four alike, the one toward the equator',
      box(0, 0, 4, 4),
      box(0, 0, 4, 4),
      0,
    ],
  ] as const)('%s', (_why, face, outline, low) => {
    expect(handFaceLowSideOf(outline, face, NORTH)).toBe(low);
  });

  it('south of the equator, the face with no side on the outline slopes down to the north', () => {
    const face = [p(2, 2), p(6, 2), p(6, 6), p(2, 6)];
    expect(handFaceLowSideOf(box(0, 0, 8, 8), face, SOUTH)).toBe(2);
  });
});

describe('where a face may not stand', () => {
  it('past the roof’s outline', () => {
    expect(handFaceRefusal(anyRoof(ROOF), [p(0, 0), p(9, 0), p(9, 2), p(0, 2)])).toBe(
      'outside_roof',
    );
  });

  it('across an L’s inner corner, though its corners and its edges’ middles are on the roof', () => {
    const l = [p(0, 0), p(8, 0), p(8, 4), p(4, 4), p(4, 8), p(0, 8)];
    // Its long edge runs from the L's upper arm to its lower one through the corner cut away.
    expect(handFaceRefusal(anyRoof(l), [p(2, 7), p(2, 1), p(7.9, 0.5)])).toBe('outside_roof');
  });

  it('over a face drawn before', () => {
    const roof = anyRoof(ROOF, [faceOf(SOUTH_HALF)]);
    expect(handFaceRefusal(roof, [p(0, 1), p(8, 1), p(8, 4), p(0, 4)])).toBe('over_face');
  });

  it('a face drawn the same as one before lies over it', () => {
    const roof = anyRoof(ROOF, [faceOf(SOUTH_HALF)]);
    expect(handFaceRefusal(roof, [...SOUTH_HALF].reverse())).toBe('over_face');
  });

  it('beside a face drawn before, sharing its edge, it may', () => {
    expect(handFaceRefusal(anyRoof(ROOF, [faceOf(SOUTH_HALF)]), NORTH_HALF)).toBeNull();
  });

  it('a corner set on a face’s edge, part way along it, may', () => {
    const roof = anyRoof(ROOF, [faceOf(SOUTH_HALF)]);
    expect(handFaceRefusal(roof, [p(0, 2), p(4, 2), p(0, 4)])).toBeNull();
  });

  it('one more than a roof holds', () => {
    const strips = Array.from({ length: 32 }, (_, i) => faceOf(box(i * 0.25, 0, 0.25, 4)));
    const full = anyRoof(ROOF, strips);
    expect(handFacesKept(full)).toHaveLength(32);
    expect(handFaceRefusal(full, [p(0, 0), p(1, 0), p(0, 1)])).toBe('too_many_faces');
  });
});

describe('when the faces cover the roof', () => {
  const HOLED = [p(0, 2), p(3, 2), p(3, 2.1), p(5, 2.1), p(5, 2), p(8, 2), p(8, 4), p(0, 4)];
  const CUT_CORNER = [p(0.3, 0), p(8, 0), p(8, 2), p(0, 2), p(0, 0.3)];
  const WEST = [p(0, 0), p(4, 0), p(4, 2), p(0, 2)];
  const EAST = [p(4, 0), p(8, 0), p(8, 2), p(4, 2)];
  it.each([
    ['two halves sharing their edge', 'whole', [SOUTH_HALF, NORTH_HALF]],
    [
      'a hole left in the middle, smaller than the centimetre band allows',
      'part',
      [SOUTH_HALF, HOLED],
    ],
    ['a corner of the roof no face reaches', 'part', [CUT_CORNER, NORTH_HALF]],
    [
      'three faces, one meeting the other two part way along its edge',
      'whole',
      [WEST, EAST, NORTH_HALF],
    ],
  ] as const)('%s: %s', (_why, drawn, faces) => {
    const roof = anyRoof(
      ROOF,
      faces.map((corners) => faceOf([...corners])),
    );
    expect(handFacesDrawn(roof)).toBe(drawn);
  });
});

describe('an Any-shape roof’s sheet', () => {
  const NORTH_FACE = { ...faceOf(NORTH_HALF), lowSide: 2 };
  it.each([
    ['no face drawn: its Faces row says so, and its slope runs no way yet', [], 'none', null],
    ['some drawn: the rest waits, and still no way', [faceOf(SOUTH_HALF)], 'part', null],
    [
      'all drawn: it slopes the ways its faces do',
      [faceOf(SOUTH_HALF), NORTH_FACE],
      'whole',
      'faces',
    ],
  ] as const)('%s', (_why, faces, drawn, way) => {
    const sheet = sheetOf(designOf(anyRoof(ROOF, faces)), 0);
    expect(sheet.faces).toEqual({ drawn, count: faces.length });
    expect(sheet.slope?.way?.kind ?? null).toBe(way);
  });
});

describe('a face’s slope and its low side', () => {
  const both = designOf(
    anyRoof(ROOF, [faceOf(SOUTH_HALF), { ...faceOf(NORTH_HALF, 40, 'person'), lowSide: 2 }]),
  );

  it('the roof’s Slope row sets every face a person has not set', () => {
    const after = roofNumberSet(both, { roof: 0, key: 'slope' }, 35, FACTS);
    const slopes = after.roofs[0]?.shape?.faces?.map((face) => face.slope);
    expect(slopes).toEqual([
      { degrees: 35, setBy: 'system' },
      { degrees: 40, setBy: 'person' },
    ]);
  });

  it('a face no person set follows the roof as it is now, whatever slope it stores', () => {
    // Drawn while the roof stood at 33°; its material has changed since, and so has its slope.
    const roof = anyRoof(ROOF, [faceOf(SOUTH_HALF, 33), faceOf(NORTH_HALF, 33, 'person')]);
    const now = roofSlopeDeg(roof, FACTS);
    expect(now).not.toBe(33);
    expect(roofBuilt(roof, FACTS).faces.map((face) => face.slopeDeg)).toEqual([now, 33]);
    const at = { roof: 0, key: 'slope', face: 0 } as const;
    expect(roofNumberOf(designOf(roof), at, FACTS)).toMatchObject({ value: now, system: now });
  });

  it('a face’s own slope is a person’s; its reset follows the roof’s again', () => {
    const at = { roof: 0, key: 'slope', face: 0 } as const;
    const set = roofNumberSet(both, at, 12, FACTS);
    expect(roofNumberOf(set, at, FACTS)).toMatchObject({ value: 12, byPerson: true });
    const reset = roofNumberReset(set, at, FACTS);
    const roofs = roofSlopeDeg(reset.roofs[0] as Roof, FACTS);
    expect(roofNumberOf(reset, at, FACTS)).toMatchObject({ value: roofs, byPerson: false });
  });

  it('a person picks the side a face slopes down to', () => {
    const after = handFaceLowSet(both, 0, 0, 2);
    expect(after.roofs[0]?.shape?.faces?.[0]?.lowSide).toBe(2);
    expect(handFaceLowSet(both, 0, 0, 9)).toEqual(both);
  });

  it('the face’s sheet names each side by the way it looks, and the one it slopes down to', () => {
    const rows = handFaceRowsOf(both, 0, 1, FACTS);
    expect(rows?.low).toBe(2);
    expect(rows?.sides.map((side) => side.faces)).toEqual(['south', 'east', 'north', 'west']);
    expect(rows?.slope).toMatchObject({ value: 40, byPerson: true });
  });

  it('a tap on the model finds the face under it once the roof stands in its faces', () => {
    expect(handFaceAt(both, 0, p(3, 3))).toBe(1);
    expect(handFaceAt(both, 0, p(3, 1))).toBe(0);
    const part = designOf(anyRoof(ROOF, [faceOf(SOUTH_HALF)]));
    expect(handFaceAt(part, 0, p(3, 1))).toBeNull();
  });

  it('Draw again: every face goes, as one change', () => {
    const cleared = handFacesCleared(both, 0);
    expect(cleared.roofs[0]?.shape).toEqual({ is: 'any', setBy: 'person' });
  });
});
