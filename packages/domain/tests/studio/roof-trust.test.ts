import { describe, expect, it } from 'vitest';
import type { PictureChoice, Roof, RoofEdgeTrust, StudioDocument } from '../../src/studio/document';
import { EMPTY_STUDIO_DOCUMENT } from '../../src/studio/document';
import { roofMarksOf } from '../../src/studio/roof-step-view';
import { edgeTier, roofAreaTier, scaleTierOf } from '../../src/studio/roof-trust';

const roofOf = (edges: RoofEdgeTrust[], tracedOn: PictureChoice = 'sky'): Roof => ({
  id: 'r',
  corners: [
    { east: 0, north: 0 },
    { east: 8, north: 0 },
    { east: 8, north: 6 },
    { east: 0, north: 6 },
  ],
  edges,
  tracedOn,
  height: null,
});
const documentOf = (roofs: Roof[], pictureScale = 1): StudioDocument => ({
  ...EMPTY_STUDIO_DOCUMENT,
  roofs,
  pictureScale,
});

describe('how far a length can be trusted (F8-01)', () => {
  it.each([
    // trust, traced on, the scale's tier → the edge's tier
    ['traced', 'sky', null, 'derived'],
    ['traced', 'own', null, 'derived'],
    ['traced', 'none', null, 'estimated'],
    ['typed', 'sky', null, 'estimated'],
    ['measured', 'sky', null, 'measured'],
    ['assumed', 'none', null, 'assumed'],
    ['assumed', 'none', 'measured', 'assumed'],
    ['traced', 'sky', 'estimated', 'estimated'],
    ['traced', 'sky', 'measured', 'derived'],
    ['traced', 'none', 'measured', 'estimated'],
    ['measured', 'sky', 'estimated', 'measured'],
  ] as const)('%s on %s, scale %s: %s', (trust, tracedOn, scale, tier) => {
    expect(edgeTier(trust, tracedOn, scale)).toBe(tier);
  });

  it.each([
    [
      'nothing set: the picture’s own scale',
      documentOf([roofOf(['traced', 'traced', 'traced', 'traced'])]),
      null,
    ],
    [
      'one length typed',
      documentOf([roofOf(['typed', 'traced', 'traced', 'traced'])], 1.1),
      'estimated',
    ],
    [
      'one length measured',
      documentOf([roofOf(['measured', 'traced', 'traced', 'traced'])], 1.1),
      'measured',
    ],
    [
      'typed and measured: the weaker',
      documentOf([roofOf(['measured', 'typed', 'traced', 'traced'])], 1.1),
      'estimated',
    ],
    [
      'scaled, but the set length was split away',
      documentOf([roofOf(['traced', 'traced', 'traced', 'traced'])], 1.1),
      'estimated',
    ],
  ])('the scale’s tier, %s', (_name, document, tier) => {
    expect(scaleTierOf(document)).toBe(tier);
  });

  it.each([
    ['all traced on the sky picture', ['traced', 'traced', 'traced', 'traced'], null, 'derived'],
    ['one typed', ['typed', 'traced', 'traced', 'traced'], 'estimated', 'estimated'],
    ['all measured', ['measured', 'measured', 'measured', 'measured'], 'measured', 'measured'],
  ] as const)('a roof’s area: %s → %s', (_name, edges, scale, tier) => {
    expect(roofAreaTier(roofOf([...edges]), scale)).toBe(tier);
  });
});

describe('a roof not on a picture pulses its longest length while none of its own is set', () => {
  it.each([
    // edges of a typed or grid roof → its longest pulses
    ['drawn on the bare grid', ['traced', 'traced', 'traced', 'traced'], true],
    [
      'the market’s start size, no person set it',
      ['assumed', 'assumed', 'assumed', 'assumed'],
      true,
    ],
    ['one length typed', ['typed', 'assumed', 'assumed', 'assumed'], false],
  ] as const)('%s', (_why, edges, pulses) => {
    const [marks] = roofMarksOf(documentOf([roofOf([...edges], 'none')]));
    expect(marks?.edges.some((edge) => edge.pulse)).toBe(pulses);
    // A length no person set reads "about"; one typed does not.
    expect(marks?.edges.map((edge) => edge.about)).toEqual(edges.map((t) => t !== 'typed'));
  });
});
