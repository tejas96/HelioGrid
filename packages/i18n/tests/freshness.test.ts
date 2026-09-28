import {
  envelopeOf,
  type Freshness,
  type FreshnessWarning,
  freshnessOf,
  IN_PACK,
  type PackEnvelope,
  UNCHECKED,
} from '@heliogrid/domain';
import { describe, expect, it } from 'vitest';
import { freshnessLabel } from '../src/copy/freshness';
import { createTranslator } from '../src/runtime';

/**
 * `F8-18` — a figure that is not current says so beside its tier, and a stale one says what moved.
 * Every state is built by `freshnessOf`, the one minter, never cast.
 */
const PINS = {
  design: 'fp-1',
  catalogRelease: 'cat-1',
  tenantPriceBook: 3,
  engines: { yield: '1.0.0' },
};
const SAME = {
  design: 'fp-1',
  catalogRelease: 'cat-1',
  tenantPriceBook: 3,
  engines: { yield: '1.0.0' },
  recomputeInFlight: false,
};

const REVISION_1 = envelopeOf(IN_PACK, '2026-09-01T00:00:00.000Z');

/** Revision 2 with the tax and subsidy interiors changed, as a later publish would leave it. */
const RETAXED: PackEnvelope = {
  ...REVISION_1,
  revision: 2,
  pack: {
    ...REVISION_1.pack,
    tax: { ...(REVISION_1.pack.tax as object), scheme: 'VAT' },
    subsidy: { ...(REVISION_1.pack.subsidy as object), note: 'revised' },
  },
};

function warning(freshness: Freshness): FreshnessWarning {
  if (freshness.kind === 'current') throw new Error('expected a warning state');
  return freshness;
}

describe('freshnessLabel', () => {
  it('names every warning state, and what moved in pinned-input order', async () => {
    const { t } = await createTranslator('en');
    const recomputing = freshnessOf(PINS, { ...SAME, recomputeInFlight: true });
    const stale = freshnessOf(PINS, {
      ...SAME,
      engines: { yield: '2.0.0' },
      tenantPriceBook: 4,
      design: 'fp-2',
    });
    expect(freshnessLabel(t, warning(recomputing))).toBe('Recalculating');
    expect(freshnessLabel(t, warning(UNCHECKED))).toBe('Not checked');
    expect(freshnessLabel(t, warning(stale))).toBe(
      'Out of date: design, price book, calculation method changed',
    );
  });

  it('names a moved market pack by the keys that moved', async () => {
    const { t } = await createTranslator('en');
    const stale = freshnessOf(
      {
        design: 'fp-1',
        marketPack: { version: IN_PACK.version, keysRead: ['subsidy', 'tax', 'formats'] },
      },
      { design: 'fp-2', pinnedPack: REVISION_1, currentPack: RETAXED, recomputeInFlight: false },
    );
    expect(freshnessLabel(t, warning(stale))).toBe(
      'Out of date: design, tax rates, subsidy rules changed',
    );
  });

  it('names the moved pack keys where the market pack stands, between the inputs around it', async () => {
    const { t } = await createTranslator('en');
    const stale = freshnessOf(
      {
        tenantPriceBook: 3,
        marketPack: { version: IN_PACK.version, keysRead: ['tax'] },
        engines: { yield: '1.0.0' },
      },
      {
        tenantPriceBook: 4,
        pinnedPack: REVISION_1,
        currentPack: RETAXED,
        engines: { yield: '2.0.0' },
        recomputeInFlight: false,
      },
    );
    expect(freshnessLabel(t, warning(stale))).toBe(
      'Out of date: price book, tax rates, calculation method changed',
    );
  });

  it('prints every warning in Hindi and Marathi', async () => {
    const hindi = await createTranslator('hi');
    const marathi = await createTranslator('mr');
    const stale = warning(freshnessOf(PINS, { ...SAME, design: 'fp-2' }));
    for (const state of [stale, warning(UNCHECKED)]) {
      expect(freshnessLabel(hindi.t, state)).toMatch(/\p{Script=Devanagari}/u);
      expect(freshnessLabel(marathi.t, state)).toMatch(/\p{Script=Devanagari}/u);
      expect(freshnessLabel(marathi.t, state)).not.toBe(freshnessLabel(hindi.t, state));
    }
  });

  it('refuses a current figure, which prints no freshness word', async () => {
    const { t } = await createTranslator('en');
    const current = freshnessOf(PINS, SAME);
    expect(current.kind).toBe('current');
    /* Never called: the proof is that `tsc` refuses the argument. */
    // @ts-expect-error — a current figure is no warning (the rule `FreshnessWarning` holds)
    const printCurrent = () => freshnessLabel(t, current);
    expect(printCurrent).toBeTypeOf('function');
  });
});
