import { describe, expect, it } from 'vitest';
import type {
  CatalogOverride,
  CatalogRateEntry,
  OwnCatalogItem,
  PlatformCatalogItem,
} from '../../src/catalog/resolve';
import { resolveCatalogItem } from '../../src/catalog/resolve';
import type { PanelSpec } from '../../src/catalog/specs';
import { type BasisPoints, basisPoints } from '../../src/money/basis-points';
import { minorUnits } from '../../src/money/minor-units';

const WAAREE_550: PanelSpec = {
  kind: 'panel',
  watt: 550,
  technology: 'bifacial',
  lengthMm: 2278,
  widthMm: 1134,
  vocV: 49.9,
  vmpV: 41.9,
  iscA: 14.0,
  impA: 13.13,
  tempCoeffVocPct: -0.26,
};

const ALMM_LISTED = { scheme: 'ALMM', reference: 'MNRE/ALMM/I/2026/0412' } as const;
const DCR_COMPLIANT = { scheme: 'DCR', reference: null } as const;
const IN_BADGES = ['ALMM', 'DCR'] as const;

const PLATFORM_PANEL: PlatformCatalogItem = {
  id: 'platform-waaree-550',
  brand: 'Waaree',
  model: 'Bi-55-550 Bifacial',
  spec: WAAREE_550,
  provenance: 'representative',
  availability: 'available',
  certifications: [ALMM_LISTED, DCR_COMPLIANT],
  archived: false,
};

function rateEntry(
  amount: number | null,
  effectiveOn: string,
  sequence: number,
  currency = 'INR',
): CatalogRateEntry {
  return { amount: amount === null ? null : minorUnits(amount), currency, effectiveOn, sequence };
}

/** ₹13,750 from 1 May, ₹14,000 from 1 June, cleared on 1 July. */
const MAY = rateEntry(1_375_000, '2026-05-01', 1);
const JUNE = rateEntry(1_400_000, '2026-06-01', 2);
const CLEARED_IN_JULY = rateEntry(null, '2026-07-01', 3);
const LEDGER = [MAY, JUNE, CLEARED_IN_JULY];

function override(change: Partial<CatalogOverride> = {}): CatalogOverride {
  return { taxRate: null, hidden: false, preferred: false, rates: LEDGER, ...change };
}

const OWN_PANEL: OwnCatalogItem = {
  id: 'own-waaree-550',
  brand: PLATFORM_PANEL.brand,
  model: PLATFORM_PANEL.model,
  spec: WAAREE_550,
  certifications: [ALMM_LISTED],
  preferred: false,
  archived: false,
  rates: [rateEntry(1_300_000, '2026-05-01', 1)],
};

function resolvePlatform(
  itemOverride: CatalogOverride | null,
  pricedOn = '2026-06-15',
  packTaxRate: BasisPoints | null = null,
  item: PlatformCatalogItem = PLATFORM_PANEL,
) {
  return resolveCatalogItem({
    platformItem: item,
    override: itemOverride,
    pricedOn,
    packTaxRate,
    badgedSchemes: IN_BADGES,
  });
}

function rateOn(pricedOn: string, rates: readonly CatalogRateEntry[]) {
  return resolvePlatform(override({ rates }), pricedOn).rate?.value.amount ?? null;
}

describe('the rate on a date (M01-44)', () => {
  it.each([
    ['2026-05-01', 1_375_000],
    ['2026-05-31', 1_375_000],
    ['2026-06-01', 1_400_000],
    ['2026-06-30', 1_400_000],
  ])('%s is priced by the newest entry on or before it', (pricedOn, amount) => {
    expect(rateOn(pricedOn, LEDGER)).toBe(amount);
  });

  it('a date before the first entry has no rate', () => {
    expect(rateOn('2026-04-30', LEDGER)).toBeNull();
    expect(rateOn('2026-04-30', [MAY, JUNE])).toBeNull();
  });

  it('a cleared rate is absent from its date and the earlier price still resolves before it', () => {
    expect(rateOn('2026-07-01', LEDGER)).toBeNull();
    expect(rateOn('2026-12-31', LEDGER)).toBeNull();
    expect(rateOn('2026-06-30', LEDGER)).toBe(1_400_000);
  });

  it('of two entries on one date the later-recorded one is the rate', () => {
    const recordedFirst = rateEntry(1_450_000, '2026-06-01', 4);
    const recordedLater = rateEntry(1_500_000, '2026-06-01', 7);
    expect(rateOn('2026-06-01', [recordedLater, recordedFirst])).toBe(1_500_000);
    expect(rateOn('2026-06-01', [recordedFirst, recordedLater])).toBe(1_500_000);
  });

  it('the order entries arrive in never changes the rate', () => {
    for (const rates of [
      [CLEARED_IN_JULY, JUNE, MAY],
      [JUNE, MAY, CLEARED_IN_JULY],
      [JUNE, CLEARED_IN_JULY, MAY],
    ]) {
      expect(rateOn('2026-06-15', rates)).toBe(1_400_000);
      expect(rateOn('2026-05-15', rates)).toBe(1_375_000);
      expect(rateOn('2026-07-15', rates)).toBeNull();
    }
  });

  it('names the date and currency of the entry it used', () => {
    expect(resolvePlatform(override()).rate).toEqual({
      source: 'override',
      value: { amount: 1_400_000, currency: 'INR', effectiveOn: '2026-06-01' },
    });
    const inDollars = override({ rates: [rateEntry(18_900, '2026-06-01', 1, 'USD')] });
    expect(resolvePlatform(inDollars).rate?.value).toEqual({
      amount: 18_900,
      currency: 'USD',
      effectiveOn: '2026-06-01',
    });
  });

  it('a priced-on day not written YYYY-MM-DD is refused, never ordered as text', () => {
    expect(() => resolvePlatform(override(), '2026-6-15')).toThrow(RangeError);
  });

  it('a rate entry dated other than YYYY-MM-DD is refused, never ordered as text', () => {
    const stamped = rateEntry(1_400_000, '2026-06-01T00:00:00.000Z', 2);
    expect(() => resolvePlatform(override({ rates: [MAY, stamped] }))).toThrow(RangeError);
  });
});

describe('the override on a platform item (M01-37, M01-32)', () => {
  it("an override's set fields win", () => {
    const resolved = resolvePlatform(
      override({ taxRate: basisPoints(1200), hidden: true, preferred: true }),
      '2026-06-15',
      basisPoints(500),
    );
    expect(resolved.tax).toEqual({ source: 'override', value: 1200 });
    expect(resolved.rate?.source).toBe('override');
    expect(resolved.hidden).toBe(true);
    expect(resolved.preferred).toBe(true);
  });

  it.each([
    ['an override with no tax', override()],
    ['no override', null],
  ])('an unset tax falls through to the pack rate (%s)', (_, itemOverride) => {
    expect(resolvePlatform(itemOverride, '2026-06-15', basisPoints(500)).tax).toEqual({
      source: 'pack',
      value: 500,
    });
    expect(resolvePlatform(itemOverride, '2026-06-15', null).tax).toBeNull();
  });

  it('a zero tax override wins over the pack rate', () => {
    const resolved = resolvePlatform(
      override({ taxRate: basisPoints(0) }),
      '2026-06-15',
      basisPoints(1200),
    );
    expect(resolved.tax).toEqual({ source: 'override', value: 0 });
  });

  it.each([
    ['no override', null],
    ['an override with no rate entry', override({ rates: [] })],
  ])('an unset price resolves to no rate (%s)', (_, itemOverride) => {
    expect(resolvePlatform(itemOverride).rate).toBeNull();
  });

  it('with no override, hide and preferred read their defaults', () => {
    const resolved = resolvePlatform(null);
    expect(resolved.hidden).toBe(false);
    expect(resolved.preferred).toBe(false);
  });
});

describe("a tenant's own SKU (M01-36)", () => {
  it('an own SKU shadows no platform item', () => {
    const own = resolveCatalogItem({
      ownItem: OWN_PANEL,
      pricedOn: '2026-06-15',
      packTaxRate: basisPoints(1200),
      badgedSchemes: IN_BADGES,
    });
    const platform = resolvePlatform(null);

    expect(own).toMatchObject({
      id: 'own-waaree-550',
      source: 'own_item',
      provenance: 'tenant_provided',
      availability: null,
      badges: ['ALMM'],
      tax: { source: 'pack', value: 1200 },
      rate: { source: 'own_item', value: { amount: 1_300_000 } },
    });
    expect(platform).toMatchObject({ id: 'platform-waaree-550', source: 'platform_item' });
    expect(platform.rate).toBeNull();
  });

  it('an own SKU with no rate entry is still an item, with no rate', () => {
    const own = resolveCatalogItem({
      ownItem: { ...OWN_PANEL, rates: [] },
      pricedOn: '2026-06-15',
      packTaxRate: null,
      badgedSchemes: IN_BADGES,
    });
    expect(own.rate).toBeNull();
    expect(own.spec).toEqual(WAAREE_550);
  });
});

describe('archive, hide and badges never change what an old output resolves (M01-42, M01-34)', () => {
  it.each(['2026-05-15', '2026-06-15', '2026-07-15'])(
    'an archived or hidden item resolves identically apart from its flag (%s)',
    (pricedOn) => {
      const before = resolvePlatform(override(), pricedOn);
      const archived = resolvePlatform(override(), pricedOn, null, {
        ...PLATFORM_PANEL,
        archived: true,
      });
      const hidden = resolvePlatform(override({ hidden: true }), pricedOn);

      expect(archived).toEqual({ ...before, archived: true });
      expect(hidden).toEqual({ ...before, hidden: true });
    },
  );

  it('a scheme the pack no longer declares keeps its certification and loses its badge', () => {
    const resolved = resolveCatalogItem({
      platformItem: PLATFORM_PANEL,
      override: null,
      pricedOn: '2026-06-15',
      packTaxRate: null,
      badgedSchemes: ['ALMM'],
    });
    expect(resolved.certifications).toEqual([ALMM_LISTED, DCR_COMPLIANT]);
    expect(resolved.badges).toEqual(['ALMM']);
  });

  it("badges follow the market's declared order, not the item's", () => {
    const resolved = resolveCatalogItem({
      platformItem: PLATFORM_PANEL,
      override: null,
      pricedOn: '2026-06-15',
      packTaxRate: null,
      badgedSchemes: ['DCR', 'ALMM'],
    });
    expect(resolved.badges).toEqual(['DCR', 'ALMM']);
  });

  it('brand and model pass through byte-identical', () => {
    const brand = '  Adani Solar ';
    const model = 'ELAN Shine 545 ‑ TOPCon';
    const resolved = resolvePlatform(null, '2026-06-15', null, { ...PLATFORM_PANEL, brand, model });
    expect(resolved.brand).toBe(brand);
    expect(resolved.model).toBe(model);
  });
});
