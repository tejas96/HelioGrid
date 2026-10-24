import { type CatalogItemsQuery, catalogItemsQuerySchema } from '@heliogrid/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  aCompany,
  aMembership,
  aPerson,
  type Fixture,
  openPools,
  seed,
  skipWithoutDatabase,
  unseed,
} from '../support/fixture';
import {
  actBy,
  aPanelSpec,
  aPlatformItem,
  aRunTag,
  catalogServiceOf,
  ids,
  noKey,
  preset,
  publishIndiaPack,
  removePlatformItems,
} from './support';

/**
 * Catalog settings' list (`SCR-M01-15`): hidden items stay in it while pickers lose them, every
 * order ends in a unique tiebreak, an item with no price follows every priced one, a price change
 * counts as a change, kinds narrow as a list, and the changed list holds what this company set and
 * nothing another set. Every row is this run's, found by its word.
 */

const run = aRunTag();
const here = aCompany('Settings List EPC');
const owner = aPerson('Meera Joshi');
const there = aCompany('Settings List Other EPC');
const otherOwner = aPerson('Kabir Rao');
const fixture: Fixture = {
  companies: [here, there],
  people: [owner, otherOwner],
  memberships: [
    aMembership(here, owner, [preset.epc_owner]),
    aMembership(there, otherOwner, [preset.epc_owner]),
  ],
};
const OWNER = [preset.epc_owner];
/** A member the wire hides money from (`resolvedCatalogItemSchema`, ruling 1A). */
const SALES = [preset.sales_executive];
const PAGE = { limit: 50, page: 1 } as const;

const skip = skipWithoutDatabase(
  'CATALOG SETTINGS LIST PROOF',
  "Catalog settings' hidden rows, orders and kind list are UNPROVEN in this run.",
);

describe.skipIf(skip)('the Catalog settings list, against a migrated database', () => {
  let pools: ReturnType<typeof openPools>;
  let catalog: ReturnType<typeof catalogServiceOf>;
  const platform: string[] = [];
  let cheap: string;
  let dear: string;
  let unpriced: string;
  let hidden: string;
  let ownSku: string;
  let blank: string;

  const listed = async (query: Partial<CatalogItemsQuery>) =>
    (await catalog.list(here.tenantId, OWNER, { q: run, ...PAGE, ...query }, Date.now())).items;

  beforeAll(async () => {
    pools = openPools();
    await seed(pools.admin.db, fixture);
    await publishIndiaPack(pools);
    catalog = catalogServiceOf(pools);
    cheap = await aPlatformItem(pools, { model: `${run} Cheap`, markets: ['IN'] });
    dear = await aPlatformItem(pools, { model: `${run} Dear`, markets: ['IN'] });
    unpriced = await aPlatformItem(pools, { model: `${run} Unpriced`, markets: ['IN'] });
    hidden = await aPlatformItem(pools, { model: `${run} Hidden`, markets: ['IN'] });
    blank = await aPlatformItem(pools, { model: `${run} Blank`, markets: ['IN'] });
    platform.push(cheap, dear, unpriced, hidden, blank);
    const act = actBy(owner.userId);
    await catalog.saveOverride(here.tenantId, OWNER, blank, { preferred: false }, noKey, act);
    await catalog.saveOverride(
      there.tenantId,
      OWNER,
      unpriced,
      { preferred: true, taxPct: '5.00' },
      noKey,
      actBy(otherOwner.userId),
    );
    await catalog.saveOverride(
      here.tenantId,
      OWNER,
      dear,
      { rate: { amount: '30000' } },
      noKey,
      act,
    );
    await catalog.saveOverride(
      here.tenantId,
      OWNER,
      cheap,
      { rate: { amount: '9000' } },
      noKey,
      act,
    );
    await catalog.saveOverride(here.tenantId, OWNER, hidden, { hidden: true }, noKey, act);
    ownSku = (
      await catalog.createItem(
        here.tenantId,
        OWNER,
        {
          brand: 'Own Panels',
          model: `${run} Own`,
          spec: aPanelSpec(),
          certifications: [],
          preferred: false,
        },
        noKey,
        act,
      )
    ).id;
    await catalog.recordRate(here.tenantId, OWNER, ownSku, { amount: '15000' }, noKey, act);
  });

  afterAll(async () => {
    await unseed(pools.admin.db, fixture);
    await removePlatformItems(pools, platform);
    await pools.close();
  });

  it('includeHidden keeps a hidden platform item', async () => {
    const items = await listed({ includeHidden: true });
    expect(items.find((item) => item.id === hidden)?.hidden).toBe(true);
  });

  it('the default list leaves a hidden item out', async () => {
    expect(ids(await listed({}))).not.toContain(hidden);
  });

  it.each(['preferred', 'name', 'price', 'recent'] as const)(
    'sort orders with an id tiebreak (%s)',
    async (sort) => {
      const first = ids(await listed({ sort, includeHidden: true }));
      const again = ids(await listed({ sort, includeHidden: true }));
      expect(new Set(first).size).toBe(first.length);
      expect(again).toEqual(first);
    },
  );

  it('name orders by brand, then model', async () => {
    const items = await listed({ sort: 'name' });
    const names = items.map((item) => `${item.brand}\u0000${item.model}`);
    expect(names).toEqual([...names].sort());
  });

  it('price puts an item with no price last', async () => {
    const order = ids(await listed({ sort: 'price' }));
    expect(order.indexOf(cheap)).toBeLessThan(order.indexOf(ownSku));
    expect(order.indexOf(ownSku)).toBeLessThan(order.indexOf(dear));
    expect(order.indexOf(dear)).toBeLessThan(order.indexOf(unpriced));
  });

  it('a new rate entry moves an item up under recent', async () => {
    await catalog.recordRate(
      here.tenantId,
      OWNER,
      ownSku,
      { amount: '15500' },
      noKey,
      actBy(owner.userId),
    );
    expect(ids(await listed({ sort: 'recent' }))[0]).toBe(ownSku);
  });

  it('a reader the wire hides money from cannot order by it', async () => {
    for (const sort of ['price', 'recent'] as const) {
      const asked = await catalog.list(here.tenantId, SALES, { q: run, ...PAGE, sort }, Date.now());
      const preferred = await catalog.list(
        here.tenantId,
        SALES,
        { q: run, ...PAGE, sort: 'preferred' },
        Date.now(),
      );
      expect(ids(asked.items)).toEqual(ids(preferred.items));
    }
  });

  it('kind takes a list', async () => {
    expect(ids(await listed({ kinds: ['inverter'] }))).toEqual([]);
    expect(ids(await listed({ kinds: ['inverter', 'panel'] }))).toContain(cheap);
  });

  /** What this company changed: two prices, a hide and its own SKU. */
  const CHANGED_HERE = ['cheap', 'dear', 'hidden', 'own'] as const;

  it('changed keeps own SKUs and items whose override sets something', async () => {
    const changed = ids(await listed({ changed: true }));
    expect([...changed].sort()).toEqual([cheap, dear, hidden, ownSku].sort());
    expect(changed).toHaveLength(CHANGED_HERE.length);
  });

  it('an override record that sets nothing is not changed', async () => {
    expect(ids(await listed({ changed: true }))).not.toContain(blank);
  });

  it("changed never lists another tenant's override", async () => {
    const changed = await catalog.list(
      here.tenantId,
      OWNER,
      { q: run, ...PAGE, changed: true },
      Date.now(),
    );
    expect(ids(changed.items)).not.toContain(unpriced);
    expect(changed.totalCount).toBe(CHANGED_HERE.length);
  });

  it('a reader the wire hides money from cannot find a price through changed', async () => {
    const changed = await catalog.list(
      here.tenantId,
      SALES,
      { q: run, ...PAGE, changed: true },
      Date.now(),
    );
    expect(ids(changed.items)).not.toContain(cheap);
    expect(ids(changed.items)).not.toContain(dear);
    expect(ids(changed.items)).toContain(hidden);
  });

  it('an unknown param is ignored', () => {
    const parsed = catalogItemsQuerySchema.parse({ page: '1', fromNextYear: 'true' });
    expect(parsed).not.toHaveProperty('fromNextYear');
  });
});
