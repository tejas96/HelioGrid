import { describe, expect, it } from 'vitest';
import { basisLineOf, tierFitsBasis } from '../../src/format/disclosure';
import { PROVENANCE_TIERS } from '../../src/format/qualified';

/**
 * `F8-20` / `F8-22` — which honesty line a document carries is read off two facts: whether a design
 * stands behind it, and how that design's roof was captured. `F8-21` — a document with no design
 * holds only heuristic figures. LITERAL answers, so a reorder of the tier tuple cannot move them.
 */
describe('basisLineOf', () => {
  it.each([
    { roofTier: null },
    { roofTier: 'measured' },
    { roofTier: 'derived' },
    { roofTier: 'estimated' },
    { roofTier: 'assumed' },
  ] as const)(
    'a document without a design carries the indicative line, whatever survey exists (F8-20)',
    ({ roofTier }) => {
      expect(basisLineOf({ designed: false, roofTier })).toBe('indicative');
    },
  );

  it.each([
    { roofTier: 'derived', line: 'imageryBasis' },
    { roofTier: 'estimated', line: 'imageryBasis' },
    { roofTier: 'assumed', line: 'imageryBasis' },
    { roofTier: null, line: 'imageryBasis' },
    { roofTier: 'measured', line: null },
  ] as const)(
    'a design on a roof not measured on site carries the imagery line (F8-22)',
    ({ roofTier, line }) => {
      expect(basisLineOf({ designed: true, roofTier })).toBe(line);
    },
  );
});

describe('tierFitsBasis', () => {
  it.each([
    { tier: 'measured', withoutDesign: false },
    { tier: 'derived', withoutDesign: false },
    { tier: 'estimated', withoutDesign: true },
    { tier: 'assumed', withoutDesign: true },
  ] as const)(
    'a document without a design takes only estimated or assumed figures (F8-21)',
    ({ tier, withoutDesign }) => {
      expect(tierFitsBasis({ designed: false, roofTier: null }, tier)).toBe(withoutDesign);
      expect(tierFitsBasis({ designed: false, roofTier: 'measured' }, tier)).toBe(withoutDesign);
    },
  );

  it.each(PROVENANCE_TIERS)('a document with a design takes every tier', (tier) => {
    expect(tierFitsBasis({ designed: true, roofTier: 'derived' }, tier)).toBe(true);
  });
});
