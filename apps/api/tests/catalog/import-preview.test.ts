/*
 * The import's matching pass and preview (`T-M01-030d` AC-1, AC-5), against REAL state: a mapped
 * price list becomes one judged row per filled sheet row, counted as the wizard shows them, each
 * with the file's price beside the catalog's price today — and no platform item changes, whatever
 * the file says about it. The steps are called as the step host calls them.
 */
import type { RoleSet } from '@heliogrid/contracts';
import { catalogItem } from '@heliogrid/db';
import type { CatalogImportField } from '@heliogrid/domain';
import { localDate } from '@heliogrid/domain';
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
  anImportStart,
  aPanelSpec,
  aPlatformItem,
  aRunTag,
  aStoredPriceList,
  catalogServiceOf,
  importPreviewServiceOf,
  importServiceOf,
  noKey,
  preset,
  publishIndiaPack,
  removePlatformItems,
} from './support';

const here = aCompany('Import Preview EPC');
const owner = aPerson('Meera Iyer');
const fixture: Fixture = {
  companies: [here],
  people: [owner],
  memberships: [aMembership(here, owner, [preset.epc_owner])],
};
const OWNER: RoleSet = [preset.epc_owner];
const act = () => ({ actorUserId: owner.userId, now: Date.now() });
const run = aRunTag();

/** The panel envelope's required fields, in the order the price list's columns give them. */
const COLUMNS: readonly CatalogImportField[] = [
  'brand',
  'model',
  'rate',
  'kind',
  'watt',
  'technology',
  'lengthMm',
  'widthMm',
  'vocV',
  'vmpV',
  'iscA',
  'impA',
  'tempCoeffVocPct',
];
const HEADER = 'Brand,Model,Rate,Kind,Watt,Technology,Length,Width,Voc,Vmp,Isc,Imp,Temp Coeff Voc';
const A_NEW_PANEL = 'panel,550,topcon,2278,1134,49.6,41.8,14,13.2,-0.25';

/**
 * The sheet row each line lands on in the paged list below a title row and the header: the file's
 * row numbers, which the grid shows the person.
 */
const SHEET_ROW = { listed: 3, own: 5, broken: 6 } as const;
const PRICED_ROWS = Object.keys(SHEET_ROW).length;
/** A watt the conflicting platform panel does not have. */
const ANOTHER_WATT = aPanelSpec().watt * 2;

const skip = skipWithoutDatabase(
  'CATALOG IMPORT PREVIEW PROOF',
  'That a mapped price list previews its rows, counted and priced, is UNPROVEN in this run.',
);

describe.skipIf(skip)('previewing an import, against a migrated database', () => {
  let pools: ReturnType<typeof openPools>;
  let files: ReturnType<typeof fileServiceOf>;
  const platform: { listed: string; conflicted: string } = { listed: '', conflicted: '' };
  const names = { listed: '', conflicted: '' };
  let ownItem = '';
  const imports = () => importServiceOf(pools, files, aRecordingTemporal());
  const previews = () => importPreviewServiceOf(pools, files);

  const nameOf = async (id: string) => {
    const [row] = await pools.admin.db
      .select({ brand: catalogItem.brand, model: catalogItem.model })
      .from(catalogItem)
      .where(eq(catalogItem.id, id));
    return `${row?.brand},${row?.model}`;
  };
  const platformRow = (id: string) =>
    pools.admin.db.select().from(catalogItem).where(eq(catalogItem.id, id));

  /** A price list stored, read, mapped by `COLUMNS` under its header, and matched. */
  const aPreviewOf = async (lines: readonly string[]) => {
    const csv = new TextEncoder().encode(['Supplier list', HEADER, ...lines].join('\n'));
    const fileId = await aStoredPriceList(files, here.tenantId, act(), undefined, csv);
    const job = await imports().start(here.tenantId, OWNER, anImportStart(fileId), {}, act());
    const step = { tenantId: here.tenantId, jobId: job.id };
    await imports().readFile(step, Date.now());
    const mapping = { sheet: 0, headerRow: 1, columns: [...COLUMNS] };
    await imports().map(here.tenantId, OWNER, job.id, mapping, Date.now());
    expect(await previews().matchRows(step, Date.now())).toEqual({ status: 'previewed' });
    return job.id;
  };

  beforeAll(async () => {
    pools = openPools();
    await seed(pools.admin.db, fixture);
    await publishIndiaPack(pools);
    files = fileServiceOf(pools);
    platform.listed = await aPlatformItem(pools, { model: `${run} Listed`, markets: ['IN'] });
    platform.conflicted = await aPlatformItem(pools, { model: `${run} Other`, markets: ['IN'] });
    names.listed = await nameOf(platform.listed);
    names.conflicted = await nameOf(platform.conflicted);
    const catalog = catalogServiceOf(pools);
    await catalog.saveOverride(
      here.tenantId,
      OWNER,
      platform.listed,
      { rate: { amount: '12000' } },
      noKey,
      act(),
    );
    const made = await catalog.createItem(
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
    ownItem = made.id;
  });

  afterAll(async () => {
    await unseed(pools.admin.db, fixture);
    await removePlatformItems(pools, [platform.listed, platform.conflicted]);
    await pools.close();
  });

  it('counts a platform match, an own-SKU match, a new product and a broken row', async () => {
    const jobId = await aPreviewOf([
      `${names.listed},"13,200"`,
      '',
      `Own ${run},OP-1,9500`,
      `New ${run},NP-1,11000,${A_NEW_PANEL}`,
      `Broken ${run},BP-1,`,
    ]);

    const job = await imports().import(here.tenantId, OWNER, jobId);

    expect(job.status).toBe('previewed');
    expect(job.counts).toEqual({ rows: 4, matched: 2, newItems: 1, needsAttention: 1, leftOut: 0 });
    expect(job.mapping).toEqual({ sheet: 0, headerRow: 1, columns: COLUMNS });
  });

  it('pages the rows by their sheet row numbers, the file’s price beside the catalog’s today', async () => {
    const jobId = await aPreviewOf([
      `${names.listed},"13,200"`,
      '',
      `Own ${run},OP-1,9500`,
      `Broken ${run},BP-1,`,
    ]);
    const today = localDate(Date.now(), 'Asia/Kolkata');

    const page = await previews().page(
      here.tenantId,
      OWNER,
      jobId,
      { page: 1, limit: 10 },
      Date.now(),
    );

    expect(page.totalCount).toBe(PRICED_ROWS);
    expect(
      page.items.map((row) => [row.rowNumber, row.outcome, row.filePrice, row.catalogPrice]),
    ).toEqual([
      [
        SHEET_ROW.listed,
        'price_override',
        '13200.00',
        { source: 'override', amount: '12000.00', currencyCode: 'INR', effectiveOn: today },
      ],
      [
        SHEET_ROW.own,
        'own_item_price',
        '9500.00',
        { source: 'own_item', amount: '9000.00', currencyCode: 'INR', effectiveOn: today },
      ],
      [SHEET_ROW.broken, 'needs_attention', null, null],
    ]);
    expect(page.items.map((row) => row.match)).toEqual([
      { source: 'platform_item', id: platform.listed },
      { source: 'own_item', id: ownItem },
      null,
    ]);
    const attention = await previews().page(
      here.tenantId,
      OWNER,
      jobId,
      { page: 1, limit: 10, outcome: 'needs_attention' },
      Date.now(),
    );
    expect(attention.items.map((row) => [row.rowNumber, row.attention])).toEqual([
      [
        SHEET_ROW.broken,
        [
          { reason: 'price_missing', fields: [] },
          { reason: 'kind_missing', fields: [] },
        ],
      ],
    ]);
  });

  it('asks about a platform match at another spec, and leaves the platform item as it was', async () => {
    const before = await platformRow(platform.conflicted);
    const jobId = await aPreviewOf([`${names.conflicted},12500,panel,${ANOTHER_WATT}`]);

    const page = await previews().page(
      here.tenantId,
      OWNER,
      jobId,
      { page: 1, limit: 10 },
      Date.now(),
    );
    expect(page.items.map((row) => [row.outcome, row.attention, row.match])).toEqual([
      ['needs_attention', [{ reason: 'spec_conflict', fields: ['watt'] }], null],
    ]);
    expect(await platformRow(platform.conflicted)).toEqual(before);
  });
});
