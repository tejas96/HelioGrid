/*
 * The import's run (`T-M01-030f` AC-1, D2), against REAL state: a previewed job runs, its settled
 * rows land in the catalog — a platform match as a dated price on the tenant's override, an own SKU
 * match as a dated price on it, a new product as a SKU with its first price — every other row is
 * left out, the progress moves batch by batch, and the person who pressed import is the actor. A
 * row whose product changed since the preview fails rather than guessing; a run that cannot finish
 * ends as a report. What the run refuses, and its handoff, is `import-run-refusals.test.ts`.
 */
import type { RoleSet } from '@heliogrid/contracts';
import {
  catalogImportRow,
  catalogItem,
  catalogRateEntry,
  tenantCatalogOverride,
} from '@heliogrid/db';
import { CATALOG_IMPORT_RUN_BATCH_ROWS, localDate } from '@heliogrid/domain';
import { and, asc, eq, inArray } from 'drizzle-orm';
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
import {
  aPanelSpec,
  aPlatformItem,
  aRunTag,
  catalogServiceOf,
  entriesOf,
  importServiceOf,
  noKey,
  preset,
  publishIndiaPack,
  removePlatformItems,
} from './support';

const here = aCompany('Import Run EPC');
const owner = aPerson('Anjali Rao');
const manager = aPerson('Karan Mehta');
const fixture: Fixture = {
  companies: [here],
  people: [owner, manager],
  memberships: [
    aMembership(here, owner, [preset.epc_owner]),
    aMembership(here, manager, [preset.epc_owner]),
  ],
};
const OWNER: RoleSet = [preset.epc_owner];
const act = (person = owner) => ({ actorUserId: person.userId, now: Date.now() });
const run = aRunTag();

/** How far into a second batch the long list reaches. */
const INTO_THE_SECOND_BATCH = 20;
/** More rows than one batch holds, so the run takes two steps. */
const PAST_ONE_BATCH = CATALOG_IMPORT_RUN_BATCH_ROWS + INTO_THE_SECOND_BATCH;
/** The sheet rows the first case's lines land on, below its title row and header. */
const ROW = { platform: 3, own: 4, made: 5, broken: 6 } as const;
/** Of its four lines, the three the preview settled: the platform, own-SKU and new rows. */
const SETTLED = 3;

const skip = skipWithoutDatabase(
  'CATALOG IMPORT RUN PROOF',
  'That a run writes each settled row once into the catalog and keeps its result is UNPROVEN in this run.',
);

describe.skipIf(skip)('running an import, against a migrated database', () => {
  let pools: ReturnType<typeof openPools>;
  let files: ReturnType<typeof fileServiceOf>;
  let listed = '';
  let listedName = '';
  let listedBrand = '';
  const runs = () => importRunServiceOf(pools, files, aRecordingTemporal());
  const aPreview = (lines: readonly string[]) =>
    aPreviewOf(pools, files, here.tenantId, OWNER, () => act(), lines);
  const jobOf = (jobId: string) =>
    importServiceOf(pools, files, aRecordingTemporal()).import(here.tenantId, OWNER, jobId);
  const ranRows = (jobId: string) =>
    pools.admin.db
      .select()
      .from(catalogImportRow)
      .where(eq(catalogImportRow.jobId, jobId))
      .orderBy(asc(catalogImportRow.rowNumber));
  const entries = (ids: readonly (string | null)[]) =>
    pools.admin.db
      .select()
      .from(catalogRateEntry)
      .where(
        inArray(
          catalogRateEntry.id,
          ids.filter((id): id is string => id !== null),
        ),
      );
  const ownSkus = (brand: string) => ownSkusNamed(pools, here.tenantId, brand);
  const anOwnSku = async (brand: string, rate: string) =>
    (
      await catalogServiceOf(pools).createItem(
        here.tenantId,
        OWNER,
        {
          brand,
          model: 'OP-1',
          spec: aPanelSpec(),
          certifications: [],
          preferred: false,
          rate: { amount: rate },
        },
        noKey,
        act(),
      )
    ).id;

  beforeAll(async () => {
    pools = openPools();
    await seed(pools.admin.db, fixture);
    await publishIndiaPack(pools);
    files = fileServiceOf(pools);
    listed = await aPlatformItem(pools, { model: `${run} Listed`, markets: ['IN'] });
    const [item] = await pools.admin.db
      .select()
      .from(catalogItem)
      .where(eq(catalogItem.id, listed));
    listedBrand = item?.brand ?? '';
    listedName = `${listedBrand},${item?.model}`;
  });

  afterAll(async () => {
    await unseed(pools.admin.db, fixture);
    await removePlatformItems(pools, [listed]);
    await pools.close();
  });

  it('writes each settled row into the catalog, leaves the rest out, and counts the run', async () => {
    const own = await anOwnSku(`Own ${run}`, '9000');
    const jobId = await aPreview([
      `${listedName},12500`,
      `Own ${run},OP-1,9500`,
      `New ${run},NP-1,11000,${A_NEW_PANEL}`,
      `Broken ${run},BP-1,`,
    ]);

    const started = await runs().run(here.tenantId, OWNER, jobId, act());
    expect([started.status, started.run?.done, started.run?.total, started.results]).toEqual([
      'running',
      0,
      SETTLED,
      null,
    ]);
    expect(await runEveryBatch(runs(), { tenantId: here.tenantId, jobId })).toBe('completed');

    const done = await jobOf(jobId);
    expect([done.run?.done, done.run?.total, done.results]).toEqual([
      SETTLED,
      SETTLED,
      { priceApplied: 2, productCreated: 1, leftOut: 1, failed: 0 },
    ]);
    const rows = await ranRows(jobId);
    expect(rows.map((row) => [row.rowNumber, row.result])).toEqual([
      [ROW.platform, 'price_applied'],
      [ROW.own, 'price_applied'],
      [ROW.made, 'product_created'],
      [ROW.broken, 'left_out'],
    ]);
    // A price is dated the day its step writes it (`T-M01-030f` D3), read after the steps ran.
    const writtenDay = localDate(Date.now(), 'Asia/Kolkata');
    const [override] = await pools.admin.db
      .select()
      .from(tenantCatalogOverride)
      .where(
        and(
          eq(tenantCatalogOverride.tenantId, here.tenantId),
          eq(tenantCatalogOverride.catalogItemId, listed),
        ),
      );
    const [made] = await ownSkus(`New ${run}`);
    const written = await entries(rows.map((row) => row.rateEntryId));
    expect(
      written
        .map((entry) => [
          entry.tenantCatalogOverrideId ?? entry.tenantCatalogItemId,
          entry.rateAmount,
          entry.entryDate,
          entry.enteredBy,
        ])
        .sort(),
    ).toEqual(
      [
        [override?.id, '12500.000', writtenDay, owner.userId],
        [own, '9500.000', writtenDay, owner.userId],
        [made?.id, '11000.000', writtenDay, owner.userId],
      ].sort(),
    );
    expect(rows.find((row) => row.rowNumber === ROW.made)?.createdItemId).toBe(made?.id);
    // A platform match is a price on the override, never a SKU of its own.
    expect(await ownSkus(listedBrand)).toEqual([]);
  });

  it('moves its progress one batch at a time', async () => {
    const lines = Array.from(
      { length: PAST_ONE_BATCH },
      (_, n) => `Batch ${run},B-${n},1000,${A_NEW_PANEL}`,
    );
    const jobId = await aPreview(lines);
    const step = { tenantId: here.tenantId, jobId };
    await runs().run(here.tenantId, OWNER, jobId, act());

    expect(await runs().applyRows(step, Date.now())).toEqual({ status: 'running' });
    expect((await jobOf(jobId)).run).toMatchObject({
      done: CATALOG_IMPORT_RUN_BATCH_ROWS,
      total: PAST_ONE_BATCH,
    });
    expect(await runs().applyRows(step, Date.now())).toEqual({ status: 'completed' });
    expect((await jobOf(jobId)).run).toMatchObject({ done: PAST_ONE_BATCH, total: PAST_ONE_BATCH });
    expect(await ownSkus(`Batch ${run}`)).toHaveLength(PAST_ONE_BATCH);
  });

  it('acts as the person who pressed import, not the one who started it', async () => {
    const jobId = await aPreview([`Runner ${run},R-1,8000,${A_NEW_PANEL}`]);

    const started = await runs().run(here.tenantId, OWNER, jobId, act(manager));
    await runEveryBatch(runs(), { tenantId: here.tenantId, jobId });

    const [made] = await ownSkus(`Runner ${run}`);
    expect([started.startedBy, started.run?.by]).toEqual([owner.userId, manager.userId]);
    const audited = await entriesOf(pools, here.tenantId, 'catalog.item_created', made?.id ?? '');
    expect(audited.map((entry) => entry.actorRef)).toEqual([manager.userId]);
  });

  it('fails a row whose product changed in the catalog since the preview', async () => {
    const own = await anOwnSku(`Changed ${run}`, '9000');
    const jobId = await aPreview([`Changed ${run},OP-1,9200,${A_NEW_PANEL}`]);
    await catalogServiceOf(pools).saveItem(
      here.tenantId,
      OWNER,
      own,
      {
        brand: `Changed ${run}`,
        model: 'OP-1',
        spec: aPanelSpec({ watt: 545 }),
        certifications: [],
        preferred: false,
      },
      act(),
    );
    const before = await pools.admin.db
      .select()
      .from(catalogRateEntry)
      .where(eq(catalogRateEntry.tenantCatalogItemId, own));

    await runs().run(here.tenantId, OWNER, jobId, act());
    await runEveryBatch(runs(), { tenantId: here.tenantId, jobId });

    const [row] = await ranRows(jobId);
    expect([row?.outcome, row?.result, row?.failure]).toEqual([
      'own_item_price',
      'failed',
      'changed_since_preview',
    ]);
    const after = await pools.admin.db
      .select()
      .from(catalogRateEntry)
      .where(eq(catalogRateEntry.tenantCatalogItemId, own));
    expect(after).toEqual(before);
  });

  it('ends a run that cannot finish as a report, every unwritten row failed as never tried', async () => {
    const jobId = await aPreview([`Ended ${run},E-1,7000,${A_NEW_PANEL}`, `Ended ${run},E-2,`]);
    await runs().run(here.tenantId, OWNER, jobId, act());

    expect(await runs().endRun({ tenantId: here.tenantId, jobId }, Date.now())).toEqual({
      status: 'completed',
    });

    expect((await ranRows(jobId)).map((row) => [row.result, row.failure])).toEqual([
      ['failed', 'not_applied'],
      ['left_out', null],
    ]);
    expect((await jobOf(jobId)).results).toEqual({
      priceApplied: 0,
      productCreated: 0,
      leftOut: 1,
      failed: 1,
    });
    expect(await ownSkus(`Ended ${run}`)).toEqual([]);
  });
});
