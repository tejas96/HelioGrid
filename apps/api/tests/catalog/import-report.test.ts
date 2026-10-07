/*
 * The report's *Fix the N rows* (`T-M01-030g` AC-14), against REAL state: a row the run left open
 * is fixed on the completed job and run again, and only it is written; a row the run wrote is
 * never written or priced again. The report's prices are `import-report-prices.test.ts`; what the
 * fix refuses on a completed job is `import-fix-refusals.test.ts`.
 */
import type { RoleSet } from '@heliogrid/contracts';
import { catalogImportRow, catalogRateEntry, orchestrationOutbox } from '@heliogrid/db';
import { asc, eq } from 'drizzle-orm';
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
  aRunTag,
  catalogServiceOf,
  importPreviewServiceOf,
  importServiceOf,
  noKey,
  preset,
  publishIndiaPack,
} from './support';

const here = aCompany('Import Report EPC');
const owner = aPerson('Meera Iyer');
const fixture: Fixture = {
  companies: [here],
  people: [owner],
  memberships: [aMembership(here, owner, [preset.epc_owner])],
};
const OWNER: RoleSet = [preset.epc_owner];
const act = () => ({ actorUserId: owner.userId, now: Date.now() });
const run = aRunTag();

/** The sheet rows a list's lines land on, below its title row and header. */
const ROW = { first: 3, second: 4 } as const;

const skip = skipWithoutDatabase(
  'CATALOG IMPORT REPORT PROOF',
  'That a fixed open row is written once on a second run, and a written one never again, is UNPROVEN in this run.',
);

describe.skipIf(skip)('fixing a completed import’s open rows, against a migrated database', () => {
  let pools: ReturnType<typeof openPools>;
  let files: ReturnType<typeof fileServiceOf>;
  const runs = () => importRunServiceOf(pools, files, aRecordingTemporal());
  const previews = () => importPreviewServiceOf(pools, files);
  const aPreview = (lines: readonly string[]) =>
    aPreviewOf(pools, files, here.tenantId, OWNER, act, lines);
  const runToTheEnd = async (jobId: string) => {
    const started = await runs().run(here.tenantId, OWNER, jobId, act());
    await runEveryBatch(runs(), { tenantId: here.tenantId, jobId });
    return started;
  };
  const fix = (jobId: string, rowNumber: number, cells: Record<string, string>) =>
    previews().fix(here.tenantId, OWNER, jobId, rowNumber, { cells }, Date.now());
  const storedRows = (jobId: string) =>
    pools.admin.db
      .select()
      .from(catalogImportRow)
      .where(eq(catalogImportRow.jobId, jobId))
      .orderBy(asc(catalogImportRow.rowNumber));
  const entriesOn = (ownSku: string) =>
    pools.admin.db
      .select()
      .from(catalogRateEntry)
      .where(eq(catalogRateEntry.tenantCatalogItemId, ownSku));
  const runEventsFor = async (jobId: string) =>
    (
      await pools.admin.db
        .select()
        .from(orchestrationOutbox)
        .where(eq(orchestrationOutbox.tenantId, here.tenantId))
    ).filter((event) => event.payload.jobId === jobId && event.payload.phase === 'run');

  beforeAll(async () => {
    pools = openPools();
    await seed(pools.admin.db, fixture);
    await publishIndiaPack(pools);
    files = fileServiceOf(pools);
  });

  afterAll(async () => {
    await unseed(pools.admin.db, fixture);
    await pools.close();
  });

  it('writes only the fixed open row when a completed import is run again', async () => {
    const jobId = await aPreview([
      `Again ${run},A-1,5000,${A_NEW_PANEL}`,
      `Again ${run},A-2,,${A_NEW_PANEL}`,
    ]);
    await runToTheEnd(jobId);
    const [first] = await storedRows(jobId);
    const [made] = await ownSkusNamed(pools, here.tenantId, `Again ${run}`);

    const fixed = await fix(jobId, ROW.second, { rate: '5200' });
    expect(fixed.rows.map((row) => [row.rowNumber, row.outcome, row.result])).toEqual([
      [ROW.second, 'new_item', 'left_out'],
    ]);
    const again = await runToTheEnd(jobId);
    expect(again.status).toBe('running');

    const rows = await storedRows(jobId);
    expect(rows.map((row) => [row.rowNumber, row.result])).toEqual([
      [ROW.first, 'product_created'],
      [ROW.second, 'product_created'],
    ]);
    expect(rows[0]?.rateEntryId).toBe(first?.rateEntryId);
    expect(await entriesOn(made?.id ?? '')).toHaveLength(1);
    expect(
      (await ownSkusNamed(pools, here.tenantId, `Again ${run}`)).map((sku) => sku.model).sort(),
    ).toEqual(['A-1', 'A-2']);
    const job = await importServiceOf(pools, files, aRecordingTemporal()).import(
      here.tenantId,
      OWNER,
      jobId,
    );
    expect([job.status, job.results]).toEqual([
      'completed',
      { priceApplied: 0, productCreated: 2, leftOut: 0, failed: 0 },
    ]);
    expect(await runEventsFor(jobId)).toHaveLength(2);
  });

  it('answers a completed import with nothing to write as it stands, and hands nothing off', async () => {
    const jobId = await aPreview([`Done ${run},D-1,4000,${A_NEW_PANEL}`, `Done ${run},D-2,`]);
    await runToTheEnd(jobId);
    const rowsBefore = await storedRows(jobId);

    const again = await runs().run(here.tenantId, OWNER, jobId, act());

    expect(again.status).toBe('completed');
    expect(await runEventsFor(jobId)).toHaveLength(1);
    expect(await storedRows(jobId)).toEqual(rowsBefore);
  });

  it('runs again past a row that failed, which keeps its failure', async () => {
    const catalog = catalogServiceOf(pools);
    const sku = { brand: `Stale ${run}`, model: 'S-1', certifications: [], preferred: false };
    const own = await catalog.createItem(
      here.tenantId,
      OWNER,
      { ...sku, spec: aPanelSpec(), rate: { amount: '9000' } },
      noKey,
      act(),
    );
    const jobId = await aPreview([
      `Stale ${run},S-1,9200,${A_NEW_PANEL}`,
      `Stale ${run},S-2,,${A_NEW_PANEL}`,
    ]);
    await catalog.saveItem(
      here.tenantId,
      OWNER,
      own.id,
      { ...sku, spec: aPanelSpec({ watt: 545 }) },
      act(),
    );
    await runToTheEnd(jobId);
    await fix(jobId, ROW.second, { rate: '5000' });

    const again = await runToTheEnd(jobId);

    expect(again.status).toBe('running');
    expect((await storedRows(jobId)).map((row) => [row.outcome, row.result, row.failure])).toEqual([
      ['needs_attention', 'failed', 'changed_since_preview'],
      ['new_item', 'product_created', null],
    ]);
    expect(await entriesOn(own.id)).toHaveLength(1);
  });

  it('leaves out a failed row the person left out, clearing its failure', async () => {
    const catalog = catalogServiceOf(pools);
    const sku = { brand: `Dropped ${run}`, model: 'X-1', certifications: [], preferred: false };
    const own = await catalog.createItem(
      here.tenantId,
      OWNER,
      { ...sku, spec: aPanelSpec(), rate: { amount: '9000' } },
      noKey,
      act(),
    );
    const jobId = await aPreview([
      `Dropped ${run},X-1,9200,${A_NEW_PANEL}`,
      `Dropped ${run},X-2,,${A_NEW_PANEL}`,
    ]);
    const spec = aPanelSpec({ watt: 545 });
    await catalog.saveItem(here.tenantId, OWNER, own.id, { ...sku, spec }, act());
    await runToTheEnd(jobId);
    await previews().fix(here.tenantId, OWNER, jobId, ROW.first, { leaveOut: true }, Date.now());
    await fix(jobId, ROW.second, { rate: '5000' });

    await runToTheEnd(jobId);

    expect((await storedRows(jobId)).map((row) => [row.outcome, row.result, row.failure])).toEqual([
      ['left_out', 'left_out', null],
      ['new_item', 'product_created', null],
    ]);
  });

  it('asks which is meant when an open row is fixed to a product the run already priced', async () => {
    const jobId = await aPreview([
      `Twice ${run},T-2,,${A_NEW_PANEL}`,
      `Twice ${run},T-1,6000,${A_NEW_PANEL}`,
    ]);
    await runToTheEnd(jobId);
    const [made] = await ownSkusNamed(pools, here.tenantId, `Twice ${run}`);

    const fixed = await fix(jobId, ROW.first, { model: 'T-1', rate: '6100' });

    expect(fixed.rows.map((row) => [row.rowNumber, row.outcome, row.attention])).toEqual([
      [ROW.first, 'needs_attention', [{ reason: 'repeated_in_file', fields: [] }]],
    ]);
    await runs().run(here.tenantId, OWNER, jobId, act());
    expect(await entriesOn(made?.id ?? '')).toHaveLength(1);
    expect((await storedRows(jobId)).map((row) => [row.outcome, row.result])).toEqual([
      ['needs_attention', 'left_out'],
      ['new_item', 'product_created'],
    ]);
  });
});
