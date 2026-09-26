import { describe, expect, it } from 'vitest';
import { freshnessOf, UNCHECKED } from '../../src/format/freshness';
import { IN_FORMATS } from '../../src/format/pack';
import {
  compactQualified,
  qualifiers,
  qualifyMinorUnits,
  qualifyMoney,
  weakestTier,
} from '../../src/format/qualified';
import { envelopeOf } from '../../src/market/envelope';
import { IN_PACK } from '../../src/market/pack';
import { minorUnits } from '../../src/money/minor-units';

/**
 * `F3-24` — the format layer carries every honesty obligation WITH the value and never drops one
 * to fit. The three laws it joins: exactly one tier on every figure (`F8-01`), a figure that is
 * not reconciled reads provisional (`F8-12`), and one figure renders one way everywhere with the
 * same tier and the same disclosure (`F8-24`).
 *
 * The defect these cases exist to catch is a narrow one and a real one: the amount renders, the
 * label does not, and the screen looks finished.
 */

const MEASURED = {
  tier: 'measured',
  energySource: null,
  freshness: null,
  projection: null,
} as const;

describe('a figure cannot be rendered without its tier (F8-01)', () => {
  it('carries the tier it was built with', () => {
    const qualified = qualifyMoney(IN_FORMATS, 452471, MEASURED);
    expect(qualified.text).toBe('₹4,52,471');
    expect(qualified.tier).toBe('measured');
  });
});

describe('compacting keeps every qualifier the full rendering carried (F3-24)', () => {
  const qualified = qualifyMoney(IN_FORMATS, 9_200_000, {
    tier: 'estimated',
    standing: 'provisional',
    disclosure: 'Excludes subsidy',
    energySource: null,
    freshness: null,
    projection: null,
  });

  it('compacts the figure and nothing else', () => {
    const compact = compactQualified(IN_FORMATS, qualified);
    expect(compact.text).toBe('₹92L');
    expect(compact.tier).toBe(qualified.tier);
    expect(compact.standing).toBe(qualified.standing);
    expect(compact.disclosure).toBe(qualified.disclosure);
  });

  it('drops no qualifier however many times it is compacted', () => {
    const twice = compactQualified(IN_FORMATS, compactQualified(IN_FORMATS, qualified));
    expect(qualifiers(twice)).toEqual(qualifiers(qualified));
  });

  /* A LITERAL source, because `qualifiers()` does not list the source yet — comparing two lists
     would stay green with the source dropped from both. */
  it('keeps the energy source however many times it is compacted', () => {
    const fromFallback = qualifyMoney(IN_FORMATS, 9_200_000, {
      tier: 'derived',
      energySource: { kind: 'estimate' },
      freshness: null,
      projection: null,
    });
    const twice = compactQualified(IN_FORMATS, compactQualified(IN_FORMATS, fromFallback));
    expect(twice.energySource).toEqual({ kind: 'estimate' });
  });
});

describe('one figure renders one way for every reader (F8-24)', () => {
  it('is the same object, so two surfaces cannot disagree', () => {
    const once = qualifyMoney(IN_FORMATS, 452471.5, {
      tier: 'derived',
      energySource: null,
      freshness: null,
      projection: null,
    });
    const again = qualifyMoney(IN_FORMATS, 452471.5, {
      tier: 'derived',
      energySource: null,
      freshness: null,
      projection: null,
    });
    expect(again).toEqual(once);
  });

  it('prints an amount that must reconcile to the minor unit, never the screen default', () => {
    const qualified = qualifyMinorUnits(IN_FORMATS, minorUnits(4_527_101), MEASURED);
    expect(qualified.text).toBe('₹45,271.01');
  });
});

describe('a figure that is not reconciled reads provisional (F8-12)', () => {
  it('keeps the standing beside the amount rather than beside the screen', () => {
    const qualified = qualifyMoney(IN_FORMATS, 452471, {
      tier: 'derived',
      standing: 'provisional',
      energySource: null,
      freshness: null,
      projection: null,
    });
    expect(qualified.standing).toBe('provisional');
    expect(qualifiers(qualified)).toContain('provisional');
  });

  it('omits what was never claimed rather than inventing a standing', () => {
    const qualified = qualifyMoney(IN_FORMATS, 452471, MEASURED);
    expect(qualified.standing).toBeNull();
    expect(qualified.disclosure).toBeNull();
    expect(qualifiers(qualified)).toEqual(['measured']);
  });
});

/**
 * `F8-10` — the fallback does not stop at the energy figure: money computed from it carries the
 * fallback and never reads final. The tier is not the fallback's to change — a simulated figure is
 * `derived` whichever data fed it, and the source label is what says the data was the estimate.
 */
describe('money computed from energy (F8-10)', () => {
  const FALLBACK = { kind: 'estimate' } as const;
  const SARAH3 = { kind: 'record', databases: ['SARAH3'] } as const;

  it.each([
    { tier: 'derived', standing: undefined, reads: 'provisional' },
    { tier: 'measured', standing: 'confirmed', reads: 'provisional' },
    { tier: 'assumed', standing: 'provisional', reads: 'provisional' },
    { tier: 'derived', standing: 'pending', reads: 'pending' },
    { tier: 'derived', standing: 'reported', reads: 'reported' },
  ] as const)('money from the fallback reads provisional (F8-10)', ({ tier, standing, reads }) => {
    const payback = qualifyMoney(IN_FORMATS, 452471, {
      tier,
      standing,
      energySource: FALLBACK,
      freshness: null,
      projection: null,
    });
    expect(payback.standing).toBe(reads);
    expect(payback.tier).toBe(tier);
    expect(payback.energySource).toEqual({ kind: 'estimate' });
    const inPaise = qualifyMinorUnits(IN_FORMATS, minorUnits(45_247_100), {
      tier,
      standing,
      energySource: FALLBACK,
      freshness: null,
      projection: null,
    });
    expect(inPaise.standing).toBe(reads);
  });

  it('money from the source of record keeps what its caller claimed', () => {
    const payback = qualifyMoney(IN_FORMATS, 452471, {
      tier: 'derived',
      standing: 'confirmed',
      energySource: SARAH3,
      freshness: null,
      projection: null,
    });
    expect(payback.tier).toBe('derived');
    expect(payback.standing).toBe('confirmed');
    expect(payback.energySource).toEqual({ kind: 'record', databases: ['SARAH3'] });
  });

  it('a figure must say what fed it, even when nothing did', () => {
    // @ts-expect-error — `energySource` is required: `null` is said out loud, never left out.
    const unsaid = qualifyMoney(IN_FORMATS, 452471, {
      tier: 'derived',
      freshness: null,
      projection: null,
    });
    expect(unsaid.energySource).toBeNull();
  });
});

describe('an unrenderable amount carries no figure and still carries its tier', () => {
  it('renders nothing rather than NaN, and does not lose the label with it', () => {
    const qualified = qualifyMoney(IN_FORMATS, null, MEASURED);
    expect(qualified.text).toBe('');
    expect(qualified.tier).toBe('measured');
  });
});

/**
 * `F8-12` — money that is not established as current never reads final. `F8-13` — only the
 * comparison establishes it: stale, mid-recompute and never compared all read provisional.
 */
describe('money and its freshness (F8-12)', () => {
  const PACK = envelopeOf(IN_PACK, '2026-09-01T00:00:00.000Z');
  const PINS = { tenantPriceBook: 3 };
  const NOW = { tenantPriceBook: 3, pinnedPack: PACK, currentPack: PACK, recomputeInFlight: false };
  const CURRENT = freshnessOf(PINS, NOW);
  const STALE = freshnessOf(PINS, { ...NOW, tenantPriceBook: 4 });
  const RECOMPUTING = freshnessOf(PINS, { ...NOW, recomputeInFlight: true });

  it.each([
    { freshness: STALE, standing: undefined, reads: 'provisional' },
    { freshness: STALE, standing: 'confirmed', reads: 'provisional' },
    { freshness: RECOMPUTING, standing: undefined, reads: 'provisional' },
    { freshness: RECOMPUTING, standing: 'confirmed', reads: 'provisional' },
    { freshness: UNCHECKED, standing: undefined, reads: 'provisional' },
    { freshness: UNCHECKED, standing: 'confirmed', reads: 'provisional' },
    { freshness: STALE, standing: 'pending', reads: 'pending' },
    { freshness: UNCHECKED, standing: 'reported', reads: 'reported' },
    { freshness: CURRENT, standing: 'confirmed', reads: 'confirmed' },
    { freshness: CURRENT, standing: undefined, reads: null },
    { freshness: null, standing: 'confirmed', reads: 'confirmed' },
  ] as const)(
    'money that is not current reads provisional (F8-12)',
    ({ freshness, standing, reads }) => {
      const total = qualifyMoney(IN_FORMATS, 452471, {
        tier: 'derived',
        standing,
        energySource: null,
        freshness,
        projection: null,
      });
      expect(total.standing).toBe(reads);
      expect(total.tier).toBe('derived');
      expect(total.freshness).toBe(freshness);
      const inPaise = qualifyMinorUnits(IN_FORMATS, minorUnits(45_247_100), {
        tier: 'derived',
        standing,
        energySource: null,
        freshness,
        projection: null,
      });
      expect(inPaise.standing).toBe(reads);
    },
  );

  it('a current figure from the fallback still reads provisional (F8-10, F8-12)', () => {
    const payback = qualifyMoney(IN_FORMATS, 452471, {
      tier: 'derived',
      standing: 'confirmed',
      energySource: { kind: 'estimate' },
      freshness: CURRENT,
      projection: null,
    });
    expect(payback.standing).toBe('provisional');
    expect(payback.energySource).toEqual({ kind: 'estimate' });
  });

  /* A LITERAL `moved`, because `qualifiers()` does not list the freshness — comparing two lists
     would stay green with the freshness dropped from both. */
  it('keeps the freshness however many times it is compacted', () => {
    const total = qualifyMoney(IN_FORMATS, 9_200_000, {
      tier: 'derived',
      energySource: null,
      freshness: STALE,
      projection: null,
    });
    const twice = compactQualified(IN_FORMATS, compactQualified(IN_FORMATS, total));
    expect(twice.freshness).toMatchObject({ kind: 'stale', moved: ['tenantPriceBook'] });
    expect(twice.standing).toBe('provisional');
  });

  it('a money figure must state its freshness, even when it is a record', () => {
    // @ts-expect-error — `freshness` is required: `null` is said out loud, never left out.
    const unsaid = qualifyMoney(IN_FORMATS, 452471, {
      tier: 'derived',
      energySource: null,
      projection: null,
    });
    expect(unsaid.freshness).toBeNull();
  });
});

/**
 * `F8-04` — an aggregate is only as strong as its weakest member. The neighbouring pairs carry
 * LITERAL answers, so a reorder of the tier tuple turns this table red rather than moving with it.
 */
describe('weakestTier', () => {
  it.each([
    { members: ['measured', 'derived'], weakest: 'derived' },
    { members: ['derived', 'estimated'], weakest: 'estimated' },
    { members: ['estimated', 'assumed'], weakest: 'assumed' },
    { members: ['assumed', 'measured'], weakest: 'assumed' },
    { members: ['derived', 'derived'], weakest: 'derived' },
    { members: ['measured'], weakest: 'measured' },
  ] as const)("an aggregate carries its weakest member's tier (F8-04)", ({ members, weakest }) => {
    expect(weakestTier(members)).toBe(weakest);
  });

  it.each([
    { members: [] },
    { members: ['measured', null] },
    { members: [null, 'assumed'] },
  ] as const)(
    'an aggregate with no members, or an unknown one, has no tier (F8-01)',
    ({ members }) => {
      expect(weakestTier(members)).toBeNull();
    },
  );
});
