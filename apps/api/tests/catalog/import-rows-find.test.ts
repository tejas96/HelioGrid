/*
 * What the import wizard reads off a job's rows (`T-M01-017`), against REAL state: several outcomes
 * or results at once, a search over cell values, another company's job answered 404, the items a
 * row's name named and the row a repeat points at, and a left-out row priced by the one product it
 * named (D129).
 */
import type { CatalogImportRowsQuery, RoleSet } from '@heliogrid/contracts';
import { catalogImportRow, catalogItem } from '@heliogrid/db';
import type { CatalogSpec, InverterSpec } from '@heliogrid/domain';
import { NotFoundException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
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
import { aPreviewOf, importRunServiceOf, runEveryBatch } from './import-preview-support';
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

const here = aCompany('Import Rows Find EPC');
const other = aCompany('Import Rows Find Other EPC');
const owner = aPerson('Meera Iyer');
const otherOwner = aPerson('Kabir Shah');
const fixture: Fixture = {
  companies: [here, other],
  people: [owner, otherOwner],
  memberships: [
    aMembership(here, owner, [preset.epc_owner]),
    aMembership(other, otherOwner, [preset.epc_owner]),
  ],
};
const OWNER: RoleSet = [preset.epc_owner];
const act = () => ({ actorUserId: owner.userId, now: Date.now() });
const run = aRunTag();

/** The sheet rows a list's lines land on, below its title row and header. */
const ROW = { first: 3, second: 4, third: 5 } as const;

const INVERTER: InverterSpec = {
  kind: 'inverter',
  acKw: 5,
  phases: 1,
  mppt: { count: 2, minV: 90, maxV: 550, maxCurrentA: 12.5, stringsPerMppt: 1 },
  maxDcV: 600,
  efficiencyPct: 97.6,
};

const skip = skipWithoutDatabase(
  'CATALOG IMPORT ROWS FIND PROOF',
  'That the wizard reads rows by outcome lists, search and named items is UNPROVEN in this run.',
);

describe.skipIf(skip)('the import wizard’s row reads, against a migrated database', () => {
  let pools: ReturnType<typeof openPools>;
  let files: ReturnType<typeof fileServiceOf>;
  const platform = { priced: '', bare: '' };
  const names = { priced: '', bare: '' };
  const preview = () => importPreviewServiceOf(pools, files);
  const runs = () => importRunServiceOf(pools, files, aRecordingTemporal());
  const aPreview = (lines: readonly string[]) =>
    aPreviewOf(pools, files, here.tenantId, OWNER, act, lines);
  const rowsOf = async (jobId: string, query: Omit<CatalogImportRowsQuery, 'page' | 'limit'>) =>
    preview().page(here.tenantId, OWNER, jobId, { page: 1, limit: 50, ...query }, Date.now());
  const nameOf = async (id: string) => {
    const [item] = await pools.admin.db.select().from(catalogItem).where(eq(catalogItem.id, id));
    return `${item?.brand},${item?.model}`;
  };
  const leaveOut = (jobId: string, rowNumber: number) =>
    preview().fix(here.tenantId, OWNER, jobId, rowNumber, { leaveOut: true }, Date.now());
  const ownItem = (
    brand: string,
    model: string,
    spec: CatalogSpec = aPanelSpec(),
    amount?: string,
  ) =>
    catalogServiceOf(pools).createItem(
      here.tenantId,
      OWNER,
      {
        brand,
        model,
        spec,
        certifications: [],
        preferred: false,
        ...(amount === undefined ? {} : { rate: { amount } }),
      },
      noKey,
      act(),
    );

  beforeAll(async () => {
    pools = openPools();
    await seed(pools.admin.db, fixture);
    await publishIndiaPack(pools);
    files = fileServiceOf(pools);
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
    await ownItem(`Own ${run}`, 'OP-1', aPanelSpec(), '9000');
    await ownItem(`Duo ${run}`, 'D-5');
    await ownItem(`Duo ${run}`, 'D-5', INVERTER);
  });

  afterAll(async () => {
    await unseed(pools.admin.db, fixture);
    await removePlatformItems(pools, [platform.priced, platform.bare]);
    await pools.close();
  });

  it('answers another company’s job with 404', async () => {
    const jobId = await aPreview([`${names.bare},8000`]);
    await expect(
      preview().page(other.tenantId, OWNER, jobId, { page: 1, limit: 50 }, Date.now()),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('reads several outcomes and results at once', async () => {
    const jobId = await aPreview([
      `${names.bare},8000`,
      `Own ${run},OP-1,9500`,
      `Gone ${run},G-1,`,
    ]);
    const matched = await rowsOf(jobId, { outcomes: ['price_override', 'own_item_price'] });
    expect(matched.items.map((row) => row.rowNumber)).toEqual([ROW.first, ROW.second]);
    expect(matched.totalCount).toBe(2);

    await runs().run(here.tenantId, OWNER, jobId, act());
    await runEveryBatch(runs(), { tenantId: here.tenantId, jobId });
    const open = await rowsOf(jobId, { results: ['left_out', 'failed'] });
    expect(open.items.map((row) => row.rowNumber)).toEqual([ROW.third]);
  });

  it('finds rows by cell value, never by key name', async () => {
    const jobId = await aPreview([`${names.bare},8000`, `Own ${run},OP-1,9500`]);
    const own = await rowsOf(jobId, { q: `own ${run}` });
    expect([own.items.map((row) => row.rowNumber), own.totalCount]).toEqual([[ROW.second], 1]);
    expect((await rowsOf(jobId, { q: 'rate' })).totalCount).toBe(0);
    expect((await rowsOf(jobId, { q: '%' })).totalCount).toBe(0);
  });

  it('names the product a needs-attention row matched, and the row a repeat repeats', async () => {
    const jobId = await aPreview([`${names.priced},`, `${names.bare},8000`, `${names.bare},8100`]);
    const rows = (await rowsOf(jobId, {})).items;
    const [brand, model] = names.priced.split(',');
    expect(rows[0]?.named.map((item) => [item.id, item.brand, item.model, item.kind])).toEqual([
      [platform.priced, brand, model, 'panel'],
    ]);
    expect(rows[2]?.repeats).toEqual({ rowNumber: ROW.second, filePrice: '8000.00' });
  });

  it('offers each candidate of a brand and model sold as two kinds', async () => {
    const jobId = await aPreview([`Duo ${run},D-5,700`]);
    const [row] = (await rowsOf(jobId, {})).items;
    expect(row?.named.map((item) => item.kind).sort()).toEqual(['inverter', 'panel']);
  });

  it('prices a left-out row by the one product it named', async () => {
    const jobId = await aPreview([`${names.priced},`, `Duo ${run},D-5,700`]);
    await leaveOut(jobId, ROW.first);
    await leaveOut(jobId, ROW.second);
    await runs().run(here.tenantId, OWNER, jobId, act());
    await runEveryBatch(runs(), { tenantId: here.tenantId, jobId });

    const report = (await rowsOf(jobId, { results: ['left_out'] })).items;
    expect(report.map((row) => [row.rowNumber, row.priceBefore?.amount ?? null])).toEqual([
      [ROW.first, '12000.00'],
      [ROW.second, null],
    ]);
  });

  it('rewrites a repeat whose earlier row was left out', async () => {
    const jobId = await aPreview([
      `${names.bare},8000`,
      `${names.bare},8100`,
      `${names.bare},8200`,
    ]);
    const fixed = await leaveOut(jobId, ROW.first);
    const third = fixed.rows.find((row) => row.rowNumber === ROW.third);
    expect(third?.repeats?.rowNumber).toBe(ROW.second);
  });

  it('reads a row written before the named items', async () => {
    const jobId = await aPreview([`${names.priced},`]);
    await pools.admin.db
      .update(catalogImportRow)
      .set({ namedItems: [], repeatsRow: null })
      .where(and(eq(catalogImportRow.tenantId, here.tenantId), eq(catalogImportRow.jobId, jobId)));
    const [row] = (await rowsOf(jobId, {})).items;
    expect([row?.named, row?.repeats, row?.catalogPrice]).toEqual([[], null, null]);
  });
});
