import { describe, expect, it } from 'vitest';
import type { Roof, StudioDocument } from '../../src/studio/document';
import { EMPTY_STUDIO_DOCUMENT } from '../../src/studio/document';
import {
  roofHeightDragged,
  roofHeightOf,
  roofHeightReset,
  roofHeightSet,
  roofHeightSlide,
} from '../../src/studio/roof-height';
import type { RoofHeight } from '../../src/studio/roof-parts';

const STOREY_M = 3;
const roofOf = (height: RoofHeight | null): Roof => ({
  id: 'r',
  corners: [
    { east: 0, north: 0 },
    { east: 8, north: 0 },
    { east: 8, north: 6 },
  ],
  edges: ['traced', 'traced', 'traced'],
  tracedOn: 'sky',
  height,
});
const documentOf = (roof: Roof): StudioDocument => ({ ...EMPTY_STUDIO_DOCUMENT, roofs: [roof] });

describe('the height a roof stands at (T-M05-002, Values)', () => {
  it.each([
    [
      'none set: the market’s storey, assumed',
      null,
      { metres: 3, setBy: 'system', tier: 'assumed' },
    ],
    [
      'set by the system',
      { metres: 3.6, setBy: 'system' },
      { metres: 3.6, setBy: 'system', tier: 'assumed' },
    ],
    [
      'set by a person: estimated',
      { metres: 4.5, setBy: 'person' },
      { metres: 4.5, setBy: 'person', tier: 'estimated' },
    ],
  ] as const)('%s', (_why, height, shown) => {
    expect(roofHeightOf(roofOf(height), STOREY_M)).toEqual(shown);
  });
});

describe('a person sets the height, and a reset hands it back', () => {
  it.each([
    // typed metres → stored, or the refusal
    [0.29, { refused: 'too_short' }],
    [0.3, { metres: 0.3 }],
    [4.567, { metres: 4.57 }],
    [300, { metres: 300 }],
    [300.01, { refused: 'too_long' }],
    [0, { refused: 'too_short' }],
    [-2, { refused: 'too_short' }],
    [Number.NaN, { refused: 'too_short' }],
  ] as const)('%s m: %o', (metres, expected) => {
    const result = roofHeightSet(documentOf(roofOf(null)), 0, metres);
    if ('refused' in expected) {
      expect(result).toEqual({ kind: 'refused', refusal: expected.refused });
      return;
    }
    expect(result.kind).toBe('done');
    if (result.kind !== 'done') return;
    expect(result.document.roofs[0]?.height).toEqual({ metres: expected.metres, setBy: 'person' });
  });

  it('the reset brings back the system’s height', () => {
    const set = documentOf(roofOf({ metres: 4.5, setBy: 'person' }));
    const reset = roofHeightReset(set, 0);
    expect(roofHeightOf(reset.roofs[0] as Roof, STOREY_M)).toMatchObject({
      metres: 3,
      setBy: 'system',
    });
  });
});

describe('the slider reaches a house, and grows with a taller building (T-M05-002)', () => {
  const FLOORS = { plinthHeightM: 0.45, storeyHeightM: 3 };
  it.each([
    // the roof stands at → the slider's top
    ['a house keeps 2 to 20 m', 3.45, 20],
    ['a house up to G+3 keeps 20 m', 12.45, 20],
    ['G+4 reaches two floors more, past 20 m', 15.45, 21.5],
    ['G+5 reaches two floors more, to G+7', 18.45, 24.5],
    ['a 30 m block reaches the floor two above it', 30, 36.5],
    ['a tower stops at 60 m', 55, 60],
    ['a roof past 60 m is typed', 100, 60],
  ])('%s', (_why, stands, max) => {
    expect(roofHeightSlide(stands, FLOORS)).toEqual({ min: 2, max, step: 0.1 });
  });

  it('a market with no storey keeps 2 to 20 m until a roof is taller', () => {
    const none = { plinthHeightM: 0.45, storeyHeightM: 0 };
    expect(roofHeightSlide(9, none).max).toBe(20);
    expect(roofHeightSlide(30, none).max).toBe(30);
  });
});

describe('the blue arrow moves the height in 10 cm steps, on the slider’s track', () => {
  const HOUSE = { min: 2, max: 20, step: 0.1 };
  it.each([
    // grabbed at, risen → height
    [3, 0, 3],
    [3, 1.5, 4.5],
    [3, 0.049, 3],
    [3, 0.051, 3.1],
    [3, -0.96, 2],
    [3, -1.06, 2],
    [3, 17, 20],
    [3, 17.2, 20],
  ])('%s m pulled %s m: %s m', (grabbedAt, risen, height) => {
    expect(roofHeightDragged(grabbedAt, risen, HOUSE)).toBe(height);
  });

  it.each([
    // grabbed past the track's top, risen → height: it never falls back onto the track
    [70, 0, 70],
    [70, 1, 71],
    [70, -20, 50],
    [299.9, 1, 300],
  ])('a %s m tower pulled %s m: %s m', (grabbedAt, risen, height) => {
    expect(roofHeightDragged(grabbedAt, risen, { min: 2, max: 60, step: 0.1 })).toBe(height);
  });
});
