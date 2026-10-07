/*
 * The report's two prices (`T-M01-030g` AC-13, decision 1), against REAL state: each written row
 * shows the price in force before its write and the price it applied, the rows narrow by result, a
 * row the run never wrote shows the price its item holds now and none applied, and a written row
 * whose item's price was cleared before the run shows no price before it.
 */
import type { RoleSet } from '@heliogrid/contracts';
import { catalogItem } from '@heliogrid/db';
import { type CatalogImportRowResult, localDate } from '@heliogrid/domain';
import { eq } from 'drizzle-orm';
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
  runEveryBatch,
} from './import-preview-support';
import {
  aPanelSpec,
  aPlatformItem,
  aRunTag,
  catalogServiceOf,
  importPreviewServiceOf,
  noKey,
  preset,
  publishIndiaPack,
  removePlatformItems,
} from './support';

const here = aCompany('Import Report Prices EPC');
const owner = aPerson('Farhan Ali');
const fixture: Fixture = {
  companies: [here],
  people: [owner],
  memberships: [aMembership(here, owner, [preset.epc_owner])],
};
const OWNER: RoleSet = [preset.epc_owner];
const act = () => ({ actorUserId: owner.userId, now: Date.now() });
const today = () => localDate(Date.now(), 'Asia/Kolkata');
const run = aRunTag();

/** The sheet rows a list's lines land on, below its title row and header. */
const ROW = { first: 3, second: 4, third: 5, fifth: 7 } as const;

const skip = skipWithoutDatabase(
  'CATALOG IMPORT REPORT PRICES PROOF',
  'That the report shows the price before each write and the price it applied is UNPROVEN in this run.',
);

describe.skipIf(skip)('the import report’s prices, against a migrated database', () => {
  let pools: ReturnType<typeof openPools>;
  let files: ReturnType<typeof fileServiceOf>;
  let cleared = '';
  const platform = { priced: '', bare: '' };
  const names = { priced: '', bare: '' };
  const runs = () => importRunServiceOf(pools, files, aRecordingTemporal());
  const aPreview = (lines: readonly string[]) =>
    aPreviewOf(pools, files, here.tenantId, OWNER, act, lines);
  const runToTheEnd = async (jobId: string) => {
    await runs().run(here.tenantId, OWNER, jobId, act());
    await runEveryBatch(runs(), { tenantId: here.tenantId, jobId });
  };
  const reportOf = async (jobId: string, result?: CatalogImportRowResult) =>
    (
      await importPreviewServiceOf(pools, files).page(
        here.tenantId,
        OWNER,
        jobId,
        { page: 1, limit: 50, result },
        Date.now(),
      )
    ).items;
  const nameOf = async (id: string) => {
    const [item] = await pools.admin.db.select().from(catalogItem).where(eq(catalogItem.id, id));
    return `${item?.brand},${item?.model}`;
  };
  const priced = (amount: string, source: 'override' | 'own_item') => ({
    source,
    amount,
    currencyCode: 'INR',
    effectiveOn: today(),
  });

  beforeAll(async () => {
    pools = openPools();
    await seed(pools.admin.db, fixture);
    await publishIndiaPack(pools);
    files = fileServiceOf(pools);
    cleared = await aPlatformItem(pools, { model: `${run} Cleared`, markets: ['IN'] });
    platform.priced = await aPlatformItem(pools, { model: `${run} Priced`, markets: ['IN'] });
    platform.bare = await aPlatformItem(pools, { model: `${run} Bare`, markets: ['IN'] });
    names.priced = await nameOf(platform.priced);
    names.bare = await nameOf(platform.bare);
    await catalogServiceOf(pools).saveOverride(
      here.tenantId,
      OWNER,
      platform.priced,
      { rate: { amount: '12000' } },
      noKey,
      act(),
    );
  });

  afterAll(async () => {
    await unseed(pools.admin.db, fixture);
    await removePlatformItems(pools, [cleared, platform.priced, platform.bare]);
    await pools.close();
  });

  it('shows each written row’s price before and the price it applied, and narrows by result', async () => {
    await catalogServiceOf(pools).createItem(
      here.tenantId,
      OWNER,
      {
        brand: `Own ${run}`,
        model: 'OP-1',
        spec: aPanelSpec(),
        certifications: [],
        preferred: false,
        rate: { amount: '9000' },
      },
      noKey,
      act(),
    );
    const jobId = await aPreview([
      `${names.priced},12500`,
      `${names.bare},8000`,
      `Own ${run},OP-1,9500`,
      `New ${run},NP-1,11000,${A_NEW_PANEL}`,
      `Broken ${run},BP-1,`,
    ]);
    const before = await reportOf(jobId);
    await runToTheEnd(jobId);

    const report = await reportOf(jobId);
    expect(before.map((row) => [row.priceBefore, row.priceApplied])).toEqual(
      before.map(() => [null, null]),
    );
    expect(report.map((row) => [row.result, row.priceBefore, row.priceApplied])).toEqual([
      ['price_applied', priced('12000.00', 'override'), priced('12500.00', 'override')],
      ['price_applied', null, priced('8000.00', 'override')],
      ['price_applied', priced('9000.00', 'own_item'), priced('9500.00', 'own_item')],
      ['product_created', null, priced('11000.00', 'own_item')],
      ['left_out', null, null],
    ]);
    expect((await reportOf(jobId, 'left_out')).map((row) => row.rowNumber)).toEqual([ROW.fifth]);
    expect((await reportOf(jobId, 'price_applied')).map((row) => row.rowNumber)).toEqual([
      ROW.first,
      ROW.second,
      ROW.third,
    ]);
  });

  it('shows a row the run never wrote at the price its item holds now, with none applied', async () => {
    await catalogServiceOf(pools).createItem(
      here.tenantId,
      OWNER,
      {
        brand: `Unrun ${run}`,
        model: 'U-1',
        spec: aPanelSpec(),
        certifications: [],
        preferred: false,
        rate: { amount: '9000' },
      },
      noKey,
      act(),
    );
    const jobId = await aPreview([`Unrun ${run},U-1,9500`]);
    await runs().run(here.tenantId, OWNER, jobId, act());
    await runs().endRun({ tenantId: here.tenantId, jobId }, Date.now());

    const [row] = await reportOf(jobId);

    expect([row?.result, row?.failure, row?.priceBefore, row?.priceApplied]).toEqual([
      'failed',
      'not_applied',
      priced('9000.00', 'own_item'),
      null,
    ]);
  });

  it('shows no price before a write whose item’s price was cleared', async () => {
    const catalog = catalogServiceOf(pools);
    await catalog.saveOverride(
      here.tenantId,
      OWNER,
      cleared,
      { rate: { amount: '7000' } },
      noKey,
      act(),
    );
    await catalog.recordRate(
      here.tenantId,
      OWNER,
      cleared,
      { amount: null, effectiveOn: today() },
      noKey,
      act(),
    );
    const jobId = await aPreview([`${await nameOf(cleared)},7500`]);
    await runToTheEnd(jobId);

    const [row] = await reportOf(jobId);

    expect([row?.result, row?.priceBefore, row?.priceApplied]).toEqual([
      'price_applied',
      null,
      priced('7500.00', 'override'),
    ]);
  });
});
