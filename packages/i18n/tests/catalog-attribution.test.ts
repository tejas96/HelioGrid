import type { ResolvedCatalogItemWire } from '@heliogrid/contracts';
import { describe, expect, it } from 'vitest';
import { catalogAttributionRowOf, catalogAttributionWords } from '../src/copy/catalog-attribution';
import { catalogPriceFrom } from '../src/copy/catalog-settings';
import { catalogItemsWords } from '../src/copy/catalog-words';
import { versionRowWords } from '../src/copy/price-book';
import { createTranslator } from '../src/runtime';

const formats = {
  number: (value: number) => String(value),
  money: (amount: string) => `₹${amount}`,
  percent: (pct: string) => `${Number(pct)}%`,
};

const PLATFORM: ResolvedCatalogItemWire = {
  id: '01a20000-0000-7000-8000-000000000301',
  source: 'platform_item',
  brand: 'Adani Solar',
  model: 'AS-7-545',
  spec: {
    kind: 'panel',
    watt: 545,
    technology: 'mono_perc',
    lengthMm: 2278,
    widthMm: 1134,
    vocV: 49.6,
    vmpV: 41.8,
    iscA: 14,
    impA: 13.2,
    tempCoeffVocPct: -0.25,
    warrantyYears: 30,
    weightKg: 27,
  },
  provenance: 'representative',
  availability: null,
  certifications: [],
  badges: [],
  tax: null,
  rate: null,
  hidden: false,
  preferred: false,
  archived: false,
};

const RATE = { amount: '12500', currencyCode: 'INR', effectiveOn: '2026-10-24' } as const;

/** *Why a price is what it is* (`SCR-M01-15` m15-d): one card per item the company changed. */
describe('the attribution table, row by row', () => {
  it('an overridden price and tax read as the company set them', async () => {
    const { t } = await createTranslator('en');
    const row = catalogAttributionRowOf(
      t,
      {
        ...PLATFORM,
        rate: { ...RATE, source: 'override' },
        tax: { source: 'override', pct: '5.00' },
      },
      formats,
    );
    expect(row).toMatchObject({
      name: 'Adani Solar AS-7-545',
      what: 'Panel · Overridden',
      price: '₹12500',
      tax: '5%',
      taxOverridden: true,
      pickers: 'Shown',
      pickersOwn: false,
      preferred: 'No',
    });
  });

  it('a hidden item with no price names both, and the hide as the company set it', async () => {
    const { t } = await createTranslator('en');
    const row = catalogAttributionRowOf(t, { ...PLATFORM, hidden: true }, formats);
    expect(row).toMatchObject({ price: null, tax: null, pickers: 'Hidden', pickersOwn: true });
    /* The hide is the company's; the missing price is the platform's, never *Your override*. */
    const { t: say } = await createTranslator('en');
    expect(row?.priceFrom).toBe(catalogPriceFrom(say, 'platform'));
  });

  it('an own SKU reads as yours, its switches its own', async () => {
    const { t } = await createTranslator('en');
    const row = catalogAttributionRowOf(
      t,
      {
        ...PLATFORM,
        source: 'own_item',
        provenance: 'tenant_provided',
        preferred: true,
        rate: { ...RATE, source: 'own_item' },
      },
      formats,
    );
    expect(row).toMatchObject({ what: 'Panel · Your SKU', preferred: 'Yes', preferredOwn: false });
  });

  it.each([
    ['an item the company never changed', PLATFORM],
    [
      'a reader the wire hides money from',
      { ...PLATFORM, hidden: true, rate: undefined, tax: undefined },
    ],
  ])('%s draws no card', async (_case, item) => {
    const { t } = await createTranslator('en');
    expect(catalogAttributionRowOf(t, item, formats)).toBeNull();
  });

  it('the caption counts the changed items of the whole', async () => {
    const { t } = await createTranslator('en');
    expect(catalogAttributionWords(t, { changed: 6, total: 342 }, formats.number).caption).toBe(
      'Why a price is what it is — the 6 of 342 items you have changed',
    );
  });
});

describe('the filter panel counts in items', () => {
  it.each([
    [1, 'Show 1 item'],
    [12, 'Show 12 items'],
  ])('%i reads %j', async (count, words) => {
    const { t } = await createTranslator('en');
    const list = { count: 34, matched: null, archived: false, fresh: false, preferredFirst: true };
    expect(catalogItemsWords(t, ['ALMM'], list).filterPanel.showResults(count)).toBe(words);
  });
});

describe('a rate of the new version', () => {
  it.each([
    ["the wire's figure typed back", '6500.00', '6500', null],
    ['a new figure', '6500.00', '7000', '₹6500.00'],
  ])('%s: was %s, now %s', async (_case, was, amount, struck) => {
    const { t } = await createTranslator('en');
    const row = versionRowWords(
      t,
      { name: { en: 'Engineering' }, amount, was },
      'en',
      formats.money,
    );
    expect(row.was).toBe(struck);
  });
});
