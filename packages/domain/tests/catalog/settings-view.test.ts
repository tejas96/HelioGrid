import { describe, expect, it } from 'vitest';
import {
  type CatalogFilter,
  catalogFiltersOn,
  catalogLayerOf,
  catalogTeaches,
  NO_CATALOG_FILTER,
  type ResolvedFields,
  releaseFieldChanges,
  tierRowsOf,
  withKinds,
} from '../../src/catalog/settings-view';

const PANEL_SPECS: CatalogFilter = {
  ...NO_CATALOG_FILTER,
  kinds: ['panel'],
  wattMin: 500,
  wattMax: 600,
  technology: 'topcon',
};

const platform: ResolvedFields = {
  source: 'platform_item',
  hidden: false,
  preferred: false,
  rate: null,
  tax: null,
};

describe('withKinds — panel specs fold under panels', () => {
  it.each<[string, CatalogFilter['kinds'], boolean]>([
    ['panels kept', ['panel', 'inverter'], true],
    ['panels dropped', ['inverter'], false],
    ['every kind cleared', [], false],
  ])('keeps the panel specs only while panels are chosen (%s)', (_case, kinds, kept) => {
    const next = withKinds(PANEL_SPECS, kinds);
    expect(next.kinds).toEqual(kinds);
    expect(next.wattMin !== null && next.technology !== null).toBe(kept);
  });
});

describe('catalogFiltersOn — the count the filter button carries', () => {
  it.each<[string, CatalogFilter, number]>([
    ['nothing on', NO_CATALOG_FILTER, 0],
    ['a watt range is one filter', { ...NO_CATALOG_FILTER, wattMin: 500 }, 1],
    ['panel specs and their kind', PANEL_SPECS, 3],
    [
      'every dimension',
      {
        ...PANEL_SPECS,
        source: 'own_item',
        schemes: ['ALMM'],
        preferredOnly: true,
        archived: true,
      },
      7,
    ],
  ])('counts the filters on (%s)', (_case, filter, count) => {
    expect(catalogFiltersOn(filter)).toBe(count);
  });
});

describe('catalogLayerOf — the layer chip', () => {
  it.each<[string, ResolvedFields, string]>([
    ['an own SKU', { ...platform, source: 'own_item' }, 'own'],
    ['an untouched platform item', platform, 'platform'],
    ['a hidden platform item', { ...platform, hidden: true }, 'overridden'],
    ['a preferred platform item', { ...platform, preferred: true }, 'overridden'],
    ['an override price', { ...platform, rate: { source: 'override' } }, 'overridden'],
    ['an override tax', { ...platform, tax: { source: 'override' } }, 'overridden'],
    ['a pack tax alone', { ...platform, tax: { source: 'pack' } }, 'platform'],
  ])('reads %s as its layer', (_case, item, layer) => {
    expect(catalogLayerOf(item)).toBe(layer);
  });
});

describe('tierRowsOf — why each money field shows what it shows', () => {
  it('tier rows name an override price plain', () => {
    const rows = tierRowsOf({ ...platform, rate: { source: 'override' }, tax: { source: 'pack' } });
    expect(rows).toEqual([
      { field: 'price', from: 'override', missing: false },
      { field: 'tax', from: 'pack', missing: false },
    ]);
  });

  it.each<[string, ResolvedFields, string]>([
    ['a platform item', platform, 'platform_item'],
    ['an own SKU', { ...platform, source: 'own_item' }, 'own_item'],
  ])('a missing price is a gap (%s)', (_case, item, from) => {
    expect(tierRowsOf(item)?.[0]).toEqual({ field: 'price', from, missing: true });
  });

  it('an unset tax with no pack rate is a gap', () => {
    expect(tierRowsOf(platform)?.[1]).toEqual({ field: 'tax', from: 'pack', missing: true });
  });

  it.each<[string, ResolvedFields]>([
    ['no rate field', { source: 'platform_item', hidden: false, preferred: false, tax: null }],
    ['no tax field', { source: 'platform_item', hidden: false, preferred: false, rate: null }],
  ])('names no tier for a reader the wire hides money from (%s)', (_case, item) => {
    expect(tierRowsOf(item)).toBeNull();
  });
});

describe('catalogTeaches — the first-day card', () => {
  it.each<[number, number, boolean]>([
    [0, 0, true],
    [1, 0, false],
    [0, 1, false],
  ])('with %i releases and %i changed items teaches: %s', (releases, changedItems, teaches) => {
    expect(catalogTeaches({ releases, changedItems })).toBe(teaches);
  });
});

describe('releaseFieldChanges — a release line, field by field', () => {
  const side = { rate: null, taxPct: null, hidden: false, preferred: false, archived: false };

  it('an addition names only what it set, with no before', () => {
    expect(
      releaseFieldChanges(null, { ...side, rate: { amount: '14900' }, taxPct: '5.00' }),
    ).toEqual([
      { field: 'price', from: undefined, to: '14900' },
      { field: 'tax', from: undefined, to: '5.00' },
    ]);
  });

  it.each<[string, Partial<typeof side>, Partial<typeof side>, unknown]>([
    [
      'a price moved',
      { rate: { amount: '1' } } as never,
      { rate: { amount: '2' } } as never,
      { field: 'price', from: '1', to: '2' },
    ],
    [
      'a price cleared',
      { rate: { amount: '1' } } as never,
      {},
      { field: 'price', from: '1', to: null },
    ],
    ['shown to hidden', {}, { hidden: true }, { field: 'hidden', from: false, to: true }],
    ['preferred dropped', { preferred: true }, {}, { field: 'preferred', from: true, to: false }],
    ['archived', {}, { archived: true }, { field: 'archived', from: false, to: true }],
  ])('a change names its field (%s)', (_case, before, after, change) => {
    expect(releaseFieldChanges({ ...side, ...before }, { ...side, ...after })).toEqual([change]);
  });

  it('nothing moved names nothing', () => {
    expect(releaseFieldChanges(side, side)).toEqual([]);
  });
});
