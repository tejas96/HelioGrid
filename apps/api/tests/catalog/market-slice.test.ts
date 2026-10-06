import { DEFAULT_PAGE_LIMIT } from '@heliogrid/contracts';
import { NotFoundException } from '@nestjs/common';
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
  OTHER_MARKET,
  preset,
  publishIndiaPack,
  removePlatformItems,
} from './support';

/**
 * A tenant sees exactly its market's platform slice plus its own SKUs (`M01-33`, AC-1), against
 * REAL state: an item listed only in another market never reaches its list or its item route,
 * another tenant's SKU never appears, its own does; a hidden item leaves the list and still
 * resolves by id (`M01-37`, AC-8). Every row is this run's, found by the run's own word.
 */

const run = aRunTag();
const here = aCompany('Slice EPC');
const elsewhere = aCompany('Other Slice EPC');
const owner = aPerson('Asha Kulkarni');
const rival = aPerson('Imran Shaikh');
const fixture: Fixture = {
  companies: [here, elsewhere],
  people: [owner, rival],
  memberships: [
    aMembership(here, owner, [preset.epc_owner]),
    aMembership(elsewhere, rival, [preset.epc_owner]),
  ],
};
const OWNER = [preset.epc_owner] as const;
/** Fewer letters than the run's tag: a word's start must find it. */
const PREFIX_LENGTH = 4;

const skip = skipWithoutDatabase(
  'CATALOG MARKET-SLICE PROOF',
  'Which items a tenant sees is UNPROVEN in this run.',
);

describe.skipIf(skip)('the market slice, against a migrated database', () => {
  let pools: ReturnType<typeof openPools>;
  let catalog: ReturnType<typeof catalogServiceOf>;
  const platform: string[] = [];
  let india: string;
  let otherMarket: string;
  let hidden: string;
  let ownSku: string;
  let rivalSku: string;

  const listed = async (tenantId: string, roles = OWNER) =>
    ids(
      (
        await catalog.list(
          tenantId,
          [...roles],
          { q: run, limit: DEFAULT_PAGE_LIMIT, page: 1 },
          Date.now(),
        )
      ).items,
    );

  beforeAll(async () => {
    pools = openPools();
    await seed(pools.admin.db, fixture);
    await publishIndiaPack(pools);
    catalog = catalogServiceOf(pools);
    india = await aPlatformItem(pools, { model: `${run} India`, markets: ['IN'] });
    otherMarket = await aPlatformItem(pools, { model: `${run} Other`, markets: [OTHER_MARKET] });
    hidden = await aPlatformItem(pools, { model: `${run} Hidden`, markets: ['IN'] });
    platform.push(india, otherMarket, hidden);
    const sku = (model: string) => ({
      brand: 'Own Panels',
      model,
      spec: aPanelSpec(),
      certifications: [],
      preferred: false,
    });
    ownSku = (
      await catalog.createItem(
        here.tenantId,
        [...OWNER],
        sku(`${run} Own`),
        noKey,
        actBy(owner.userId),
      )
    ).id;
    rivalSku = (
      await catalog.createItem(
        elsewhere.tenantId,
        [...OWNER],
        sku(`${run} Rival`),
        noKey,
        actBy(rival.userId),
      )
    ).id;
    await catalog.saveOverride(
      here.tenantId,
      [...OWNER],
      hidden,
      { hidden: true },
      noKey,
      actBy(owner.userId),
    );
  });

  afterAll(async () => {
    await unseed(pools.admin.db, fixture);
    await removePlatformItems(pools, platform);
    await pools.close();
  });

  it("lists its market's platform item and its own SKU, and nothing of another market or tenant", async () => {
    const seen = await listed(here.tenantId);
    expect(seen).toContain(india);
    expect(seen).toContain(ownSku);
    expect(seen).not.toContain(otherMarket);
    expect(seen).not.toContain(rivalSku);
  });

  it.each([
    ['an item listed only in another market', () => otherMarket],
    ["another tenant's own SKU", () => rivalSku],
  ])('answers 404 for %s on the item route', async (_, id) => {
    await expect(catalog.item(here.tenantId, [...OWNER], id(), Date.now())).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('reads its own SKU and its market item by id, each from its own tier', async () => {
    const own = await catalog.item(here.tenantId, [...OWNER], ownSku, Date.now());
    const listedHere = await catalog.item(here.tenantId, [...OWNER], india, Date.now());
    expect([own.source, own.provenance]).toEqual(['own_item', 'tenant_provided']);
    expect([listedHere.source, listedHere.provenance]).toEqual(['platform_item', 'representative']);
  });

  it('a hidden item leaves the list and still resolves by id', async () => {
    expect(await listed(here.tenantId)).not.toContain(hidden);
    const byId = await catalog.item(here.tenantId, [...OWNER], hidden, Date.now());
    expect(byId.hidden).toBe(true);
  });

  it('finds brand and model by the start of each word', async () => {
    const found = await catalog.list(
      here.tenantId,
      [...OWNER],
      { q: `${run.slice(0, PREFIX_LENGTH)} ind`, limit: DEFAULT_PAGE_LIMIT, page: 1 },
      Date.now(),
    );
    expect(ids(found.items)).toContain(india);
    expect(ids(found.items)).not.toContain(ownSku);
  });

  it("another tenant's override hides nothing here", async () => {
    expect(await listed(elsewhere.tenantId)).toContain(hidden);
  });
});
