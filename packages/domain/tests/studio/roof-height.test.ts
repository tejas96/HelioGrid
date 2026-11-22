import { describe, expect, it } from 'vitest';
import type { Roof, RoofHeight, StudioDocument } from '../../src/studio/document';
import { EMPTY_STUDIO_DOCUMENT } from '../../src/studio/document';
import {
  roofHeightDragged,
  roofHeightOf,
  roofHeightReset,
  roofHeightSet,
} from '../../src/studio/roof-height';

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

describe('the blue arrow moves the height in 10 cm steps, on the slider’s track', () => {
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
    [25, 0, 20],
  ])('%s m pulled %s m: %s m', (grabbedAt, risen, height) => {
    expect(roofHeightDragged(grabbedAt, risen)).toBe(height);
  });
});
