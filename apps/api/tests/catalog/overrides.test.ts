import { DEFAULT_PAGE_LIMIT } from '@heliogrid/contracts';
import { localDate } from '@heliogrid/domain';
import { ConflictException } from '@nestjs/common';
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
  entriesOf,
  ids,
  ledgerOf,
  noKey,
  preset,
  publishIndiaPack,
  removePlatformItems,
} from './support';

/**
 * The sparse override on a platform item (`M01-37`, `M01-38`, AC-8, AC-10), against REAL state:
 * a preferred item ranks first, its tax and rate come from the override, an archived item lists
 * only under its filter; a clear resets every field and ends the rate with one dated absence,
 * the history kept (b11); an own SKU has no override; each act records one entry.
 */

const run = aRunTag();
const here = aCompany('Override EPC');
const owner = aPerson('Asha Kulkarni');
const fixture: Fixture = {
  companies: [here],
  people: [owner],
  memberships: [aMembership(here, owner, [preset.epc_owner])],
};
const OWNER = [preset.epc_owner];
const DAY_MS = 86_400_000;
const DAYS_AHEAD = 5;

const skip = skipWithoutDatabase(
  'CATALOG OVERRIDE PROOF',
  'The tenant override on a platform item is UNPROVEN in this run.',
);

describe.skipIf(skip)('the override, against a migrated database', () => {
  let pools: ReturnType<typeof openPools>;
  let catalog: ReturnType<typeof catalogServiceOf>;
  let plain: string;
  let favourite: string;
  let retired: string;
  const now = Date.now();
  const by = () => actBy(owner.userId, now);
  const list = async (archived?: boolean) =>
    (
      await catalog.list(
        here.tenantId,
        OWNER,
        { q: run, limit: DEFAULT_PAGE_LIMIT, page: 1, archived },
        now,
      )
    ).items;

  beforeAll(async () => {
    pools = openPools();
    await seed(pools.admin.db, fixture);
    await publishIndiaPack(pools);
    catalog = catalogServiceOf(pools);
    // Named so the plain one sorts first by name: only the override can put the favourite ahead.
    plain = await aPlatformItem(pools, { model: `${run} A plain`, markets: ['IN'] });
    favourite = await aPlatformItem(pools, { model: `${run} Z favourite`, markets: ['IN'] });
    retired = await aPlatformItem(pools, {
      model: `${run} Retired`,
      markets: ['IN'],
      archived: true,
    });
  });

  afterAll(async () => {
    await unseed(pools.admin.db, fixture);
    await removePlatformItems(pools, [plain, favourite, retired]);
    await pools.close();
  });

  it('a preferred item ranks first, and its tax and rate are the override’s', async () => {
    const saved = await catalog.saveOverride(
      here.tenantId,
      OWNER,
      favourite,
      { preferred: true, taxPct: '12.00', rate: { amount: '5000' } },
      noKey,
      by(),
    );
    expect(saved).toMatchObject({
      preferred: true,
      tax: { source: 'override', pct: '12.00' },
      rate: { source: 'override', amount: '5000.00' },
    });
    expect(ids(await list())).toEqual([favourite, plain]);
    const [, other] = await list();
    expect([other?.tax, other?.rate]).toEqual([null, null]);
  });

  it('an archived platform item lists only under its filter', async () => {
    expect(ids(await list())).not.toContain(retired);
    expect(ids(await list(true))).toEqual([retired]);
  });

  it('a clear resets every field, ends the rate with one dated absence, and keeps the history', async () => {
    const before = await ledgerOf(pools, here.tenantId);
    const cleared = await catalog.clearOverride(here.tenantId, OWNER, favourite, by());
    expect([cleared.preferred, cleared.hidden, cleared.tax, cleared.rate]).toEqual([
      false,
      false,
      null,
      null,
    ]);
    const after = await ledgerOf(pools, here.tenantId);
    expect(after.slice(0, before.length)).toEqual(before);
    expect(after.slice(before.length).map((entry) => [entry.rateAmount, entry.entryDate])).toEqual([
      [null, localDate(now, 'Asia/Kolkata')],
    ]);
  });

  it('a clear also ends a rate dated after today', async () => {
    const later = now + DAYS_AHEAD * DAY_MS;
    await catalog.recordRate(
      here.tenantId,
      OWNER,
      favourite,
      { amount: '4800', effectiveOn: localDate(later, 'Asia/Kolkata') },
      noKey,
      by(),
    );
    await catalog.clearOverride(here.tenantId, OWNER, favourite, by());
    expect((await catalog.item(here.tenantId, OWNER, favourite, later)).rate).toBeNull();
  });

  it('a clear with nothing to clear writes nothing', async () => {
    const before = await ledgerOf(pools, here.tenantId);
    await catalog.clearOverride(here.tenantId, OWNER, plain, by());
    expect(await ledgerOf(pools, here.tenantId)).toEqual(before);
    expect(await entriesOf(pools, here.tenantId, 'catalog.override_cleared', plain)).toEqual([]);
  });

  it('an own SKU has no override', async () => {
    const own = await catalog.createItem(
      here.tenantId,
      OWNER,
      {
        brand: 'Own',
        model: `${run} Own`,
        spec: aPanelSpec(),
        certifications: [],
        preferred: false,
      },
      noKey,
      by(),
    );
    await expect(
      catalog.saveOverride(here.tenantId, OWNER, own.id, { hidden: true }, noKey, by()),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('records the save once and each clear once', async () => {
    expect(
      await entriesOf(pools, here.tenantId, 'catalog.override_changed', favourite),
    ).toHaveLength(1);
    expect(
      await entriesOf(pools, here.tenantId, 'catalog.override_cleared', favourite),
    ).toHaveLength(2);
  });
});
