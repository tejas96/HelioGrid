/*
 * The import run writes each row once (`T-M01-030f` AC-2, D2), against REAL state: the same file
 * imported twice makes one SKU per unknown product and a second dated price on each matched
 * override; two imports previewed from one file before either ran make one SKU, because each row is
 * judged again at its write; a step run again after its commit was lost writes nothing twice; and a
 * step that writes past midnight dates its prices that day, never backdating one (rule b4).
 */
import type { RoleSet } from '@heliogrid/contracts';
import {
  catalogImportRow,
  catalogItem,
  catalogRateEntry,
  type TenantPool,
  tenantCatalogOverride,
} from '@heliogrid/db';
import { localDate } from '@heliogrid/domain';
import { and, asc, eq, isNotNull } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { fileServiceOf } from '../files/support';
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
import { aRecordingTemporal } from '../support/temporal';
import {
  A_NEW_PANEL,
  aPreviewOf,
  importRunServiceOf,
  ownSkusNamed,
  runEveryBatch,
} from './import-preview-support';
import { aPlatformItem, aRunTag, preset, publishIndiaPack, removePlatformItems } from './support';

const here = aCompany('Import Idempotency EPC');
const owner = aPerson('Meera Iyer');
const fixture: Fixture = {
  companies: [here],
  people: [owner],
  memberships: [aMembership(here, owner, [preset.epc_owner])],
};
const OWNER: RoleSet = [preset.epc_owner];
const act = () => ({ actorUserId: owner.userId, now: Date.now() });
const run = aRunTag();
/** A run pressed a day before its step writes: the step runs past midnight. */
const DAY_MS = 86_400_000;

/**
 * A tenant pool whose FIRST transaction that records a row's result fails once its work is done —
 * the commit that never came, as a step dying before Temporal hears back. It commits after that.
 */
function losingTheFirstCommitOfAResult(pool: TenantPool): TenantPool {
  let lost = false;
  const results = async (tx: Parameters<Parameters<TenantPool['withTenantTransaction']>[1]>[0]) =>
    (
      await tx
        .select({ id: catalogImportRow.id })
        .from(catalogImportRow)
        .where(isNotNull(catalogImportRow.result))
    ).length;
  return {
    withTenantTransaction: (tenantId, work) =>
      pool.withTenantTransaction(tenantId, async (tx) => {
        const before = await results(tx);
        const done = await work(tx);
        if (!lost && (await results(tx)) > before) {
          lost = true;
          throw new Error('the commit was lost after the write');
        }
        return done;
      }),
  };
}

const skip = skipWithoutDatabase(
  'CATALOG IMPORT IDEMPOTENCY PROOF',
  'That an import run never writes a SKU or a price twice is UNPROVEN in this run.',
);

describe.skipIf(skip)('running an import more than once, against a migrated database', () => {
  let pools: ReturnType<typeof openPools>;
  let files: ReturnType<typeof fileServiceOf>;
  let listed = '';
  let listedName = '';
  const runs = (tenants?: TenantPool) =>
    importRunServiceOf(pools, files, aRecordingTemporal(), tenants);
  const aPreview = (lines: readonly string[]) =>
    aPreviewOf(pools, files, here.tenantId, OWNER, act, lines);
  const runToTheEnd = async (jobId: string) => {
    await runs().run(here.tenantId, OWNER, jobId, act());
    return runEveryBatch(runs(), { tenantId: here.tenantId, jobId });
  };
  const skusNamed = (brand: string) => ownSkusNamed(pools, here.tenantId, brand);
  const pricesOfSku = (id: string) =>
    pools.admin.db
      .select()
      .from(catalogRateEntry)
      .where(eq(catalogRateEntry.tenantCatalogItemId, id));
  const pricesOfListed = async () => {
    const [override] = await pools.admin.db
      .select({ id: tenantCatalogOverride.id })
      .from(tenantCatalogOverride)
      .where(
        and(
          eq(tenantCatalogOverride.tenantId, here.tenantId),
          eq(tenantCatalogOverride.catalogItemId, listed),
        ),
      );
    return pools.admin.db
      .select()
      .from(catalogRateEntry)
      .where(eq(catalogRateEntry.tenantCatalogOverrideId, override?.id ?? ''))
      .orderBy(asc(catalogRateEntry.sequence));
  };
  const resultsOf = async (jobId: string) =>
    (
      await pools.admin.db
        .select()
        .from(catalogImportRow)
        .where(eq(catalogImportRow.jobId, jobId))
        .orderBy(asc(catalogImportRow.rowNumber))
    ).map((row) => row.result);

  beforeAll(async () => {
    pools = openPools();
    await seed(pools.admin.db, fixture);
    await publishIndiaPack(pools);
    files = fileServiceOf(pools);
  });

  // Each case prices the platform item from nothing, so each has one of its own.
  const aListedItem = async (model: string) => {
    listed = await aPlatformItem(pools, { model: `${run} ${model}`, markets: ['IN'] });
    const [item] = await pools.admin.db
      .select()
      .from(catalogItem)
      .where(eq(catalogItem.id, listed));
    listedName = `${item?.brand},${item?.model}`;
    return listed;
  };
  const listedItems: string[] = [];

  afterAll(async () => {
    await unseed(pools.admin.db, fixture);
    await removePlatformItems(pools, listedItems);
    await pools.close();
  });

  it('makes one SKU per unknown product and a second dated price per matched override when one file is imported twice', async () => {
    listedItems.push(await aListedItem('Twice'));
    const lines = [`${listedName},12000`, `Twice ${run},T-1,8000,${A_NEW_PANEL}`];

    expect(await runToTheEnd(await aPreview(lines))).toBe('completed');
    const second = await aPreview(lines);
    expect(await runToTheEnd(second)).toBe('completed');
    // Temporal sends a step again when its reply was lost after the commit: it writes nothing.
    const again = await runs().applyRows({ tenantId: here.tenantId, jobId: second }, Date.now());
    expect(again).toEqual({ status: 'completed' });

    const [sku, ...more] = await skusNamed(`Twice ${run}`);
    expect(more).toEqual([]);
    expect(await resultsOf(second)).toEqual(['price_applied', 'price_applied']);
    expect((await pricesOfListed()).map((entry) => entry.rateAmount)).toEqual([
      '12000.000',
      '12000.000',
    ]);
    expect(await pricesOfSku(sku?.id ?? '')).toHaveLength(2);
  });

  it('makes one SKU when two imports previewed from one file run one after the other', async () => {
    const lines = [`Stale ${run},S-1,8000,${A_NEW_PANEL}`];
    const first = await aPreview(lines);
    const second = await aPreview(lines);

    expect([await runToTheEnd(first), await runToTheEnd(second)]).toEqual([
      'completed',
      'completed',
    ]);

    const [sku, ...more] = await skusNamed(`Stale ${run}`);
    expect(more).toEqual([]);
    expect([await resultsOf(first), await resultsOf(second)]).toEqual([
      ['product_created'],
      ['price_applied'],
    ]);
    expect(await pricesOfSku(sku?.id ?? '')).toHaveLength(2);
  });

  it('writes nothing twice when a step runs again after its commit is lost', async () => {
    listedItems.push(await aListedItem('Lost'));
    const jobId = await aPreview([`${listedName},9900`, `Lost ${run},L-1,7700,${A_NEW_PANEL}`]);
    const step = { tenantId: here.tenantId, jobId };
    await runs().run(here.tenantId, OWNER, jobId, act());

    await expect(
      runs(losingTheFirstCommitOfAResult(pools.tenants)).applyRows(step, Date.now()),
    ).rejects.toThrow('the commit was lost');
    expect(await runEveryBatch(runs(), step)).toBe('completed');

    const [sku, ...more] = await skusNamed(`Lost ${run}`);
    expect(more).toEqual([]);
    expect(await pricesOfSku(sku?.id ?? '')).toHaveLength(1);
    expect(await pricesOfListed()).toHaveLength(1);
    expect(await resultsOf(jobId)).toEqual(['price_applied', 'product_created']);
  });

  it('dates a price by the day its step writes it, never the day before', async () => {
    const jobId = await aPreview([`Midnight ${run},M-1,6600,${A_NEW_PANEL}`]);
    await runs().run(here.tenantId, OWNER, jobId, {
      actorUserId: owner.userId,
      now: Date.now() - DAY_MS,
    });

    expect(await runEveryBatch(runs(), { tenantId: here.tenantId, jobId })).toBe('completed');

    const [sku] = await skusNamed(`Midnight ${run}`);
    const [price] = await pricesOfSku(sku?.id ?? '');
    expect(price?.entryDate).toBe(localDate(Date.now(), 'Asia/Kolkata'));
  });
});
