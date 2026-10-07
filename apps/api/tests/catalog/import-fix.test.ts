/*
 * The import's row fix (`T-M01-030e` AC-1, AC-12), against REAL state: a typed cell, a row left
 * out or brought back, or an answer re-judges every row naming the fixed row's product, the counts
 * move with it, and the verdicts stored are the ones a whole new pass would give. No platform item
 * changes. What a fix refuses is `import-fix-refusals.test.ts`.
 */
import type { CatalogImportRowFixWrite, RoleSet } from '@heliogrid/contracts';
import { catalogImportRow, catalogItem } from '@heliogrid/db';
import { catalogSpecSchema, effectiveImportCells, importProductNames } from '@heliogrid/domain';
import { matchImportRows } from '@heliogrid/domain/server';
import { and, asc, eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CatalogSliceRepository } from '../../src/modules/catalog/catalog.slice.repository';
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
import { A_NEW_PANEL, aPreviewOf, PANEL_ENVELOPE_COLUMNS } from './import-preview-support';
import {
  aPlatformItem,
  aRunTag,
  catalogServiceOf,
  importPreviewServiceOf,
  importServiceOf,
  preset,
  publishIndiaPack,
  removePlatformItems,
} from './support';

const here = aCompany('Import Fix EPC');
const elsewhere = aCompany('Other Import Fix EPC');
const owner = aPerson('Farah Khan');
const rival = aPerson('Devika Menon');
const fixture: Fixture = {
  companies: [here, elsewhere],
  people: [owner, rival],
  memberships: [
    aMembership(here, owner, [preset.epc_owner]),
    aMembership(elsewhere, rival, [preset.epc_owner]),
  ],
};
const OWNER: RoleSet = [preset.epc_owner];
const act = () => ({ actorUserId: owner.userId, now: Date.now() });
const run = aRunTag();

/** The sheet rows a list's lines land on, below its title row and header; one it does not hold. */
const ROW = { first: 3, second: 4, third: 5, fourth: 6, fifth: 7, absent: 99 } as const;
/** A watt the conflicting platform panel does not have. */
const ANOTHER = { watt: 545 } as const;
/** `A_NEW_PANEL` as typed cells: the kind and envelope a broken row lacks. */
const NEW_PANEL_CELLS = Object.fromEntries(
  PANEL_ENVELOPE_COLUMNS.map((field, index) => [field, A_NEW_PANEL.split(',')[index] ?? '']),
);

const skip = skipWithoutDatabase(
  'CATALOG IMPORT FIX PROOF',
  'That a fixed row re-judges its product’s rows and moves the counts is UNPROVEN in this run.',
);

describe.skipIf(skip)('fixing an import’s rows, against a migrated database', () => {
  let pools: ReturnType<typeof openPools>;
  let files: ReturnType<typeof fileServiceOf>;
  const platform = { listed: '', conflicted: '' };
  const names = { listed: '', conflicted: '' };
  const previews = () => importPreviewServiceOf(pools, files);
  const aPreview = (lines: readonly string[]) =>
    aPreviewOf(pools, files, here.tenantId, OWNER, act, lines);
  const fix = (jobId: string, rowNumber: number, change: CatalogImportRowFixWrite) =>
    previews().fix(here.tenantId, OWNER, jobId, rowNumber, change, Date.now());

  const nameOf = async (id: string) => {
    const [row] = await pools.admin.db
      .select({ brand: catalogItem.brand, model: catalogItem.model })
      .from(catalogItem)
      .where(eq(catalogItem.id, id));
    return `${row?.brand},${row?.model}`;
  };
  const platformRow = (id: string) =>
    pools.admin.db.select().from(catalogItem).where(eq(catalogItem.id, id));
  const verdicts = (rows: readonly { rowNumber: number; outcome: string }[]) =>
    rows.map((row) => [row.rowNumber, row.outcome]);

  beforeAll(async () => {
    pools = openPools();
    await seed(pools.admin.db, fixture);
    await publishIndiaPack(pools);
    files = fileServiceOf(pools);
    platform.listed = await aPlatformItem(pools, { model: `${run} Listed`, markets: ['IN'] });
    platform.conflicted = await aPlatformItem(pools, { model: `${run} Other`, markets: ['IN'] });
    names.listed = await nameOf(platform.listed);
    names.conflicted = await nameOf(platform.conflicted);
  });

  afterAll(async () => {
    await unseed(pools.admin.db, fixture);
    await removePlatformItems(pools, [platform.listed, platform.conflicted]);
    await pools.close();
  });

  it('types a broken row’s price and envelope, and the counts move', async () => {
    const jobId = await aPreview([`Broken ${run},BP-1,`]);

    const fixed = await fix(jobId, ROW.first, { cells: { rate: '11000', ...NEW_PANEL_CELLS } });

    expect(verdicts(fixed.rows)).toEqual([[ROW.first, 'new_item']]);
    expect(fixed.rows[0]?.filePrice).toBe('11000.00');
    expect(fixed.counts).toEqual({
      rows: 1,
      matched: 0,
      newItems: 1,
      needsAttention: 0,
      leftOut: 0,
    });
    const job = await importServiceOf(pools, files, aRecordingTemporal()).import(
      here.tenantId,
      OWNER,
      jobId,
    );
    expect(job.counts).toEqual(fixed.counts);
  });

  it('leaving out the first of two rows naming one product matches the second', async () => {
    const jobId = await aPreview([`${names.listed},13200`, `${names.listed},13300`]);

    const out = await fix(jobId, ROW.first, { leaveOut: true });

    expect(verdicts(out.rows)).toEqual([
      [ROW.first, 'left_out'],
      [ROW.second, 'price_override'],
    ]);
    expect(out.counts).toMatchObject({ matched: 1, needsAttention: 0, leftOut: 1 });
    const back = await fix(jobId, ROW.first, { leaveOut: false });
    expect(verdicts(back.rows)).toEqual([
      [ROW.first, 'price_override'],
      [ROW.second, 'needs_attention'],
    ]);
    expect(back.rows[1]?.attention).toEqual([{ reason: 'repeated_in_file', fields: [] }]);
  });

  it('types a missing price on a row naming a platform item, and it matches', async () => {
    const jobId = await aPreview([`${names.listed},`]);

    const fixed = await fix(jobId, ROW.first, { cells: { rate: '13200' } });

    expect(verdicts(fixed.rows)).toEqual([[ROW.first, 'price_override']]);
    expect(fixed.counts).toMatchObject({ matched: 1, needsAttention: 0 });
  });

  it('answers only the rows a fix moved, never a repeat that stays the repeat', async () => {
    const listed = `${names.listed},13200`;
    const jobId = await aPreview([listed, listed, `${names.listed},`]);

    const fixed = await fix(jobId, ROW.third, { cells: { rate: '13400' } });

    expect(verdicts(fixed.rows)).toEqual([[ROW.third, 'needs_attention']]);
  });

  it('makes a row the repeat of another once its name is retyped onto that row’s product', async () => {
    const jobId = await aPreview([`${names.listed},13200`, `New ${run},NP-1,11000,${A_NEW_PANEL}`]);
    const [brand, model] = names.listed.split(',');

    const fixed = await fix(jobId, ROW.second, { cells: { brand, model } });

    expect(verdicts(fixed.rows)).toEqual([[ROW.second, 'needs_attention']]);
    expect(fixed.rows[0]?.attention.map((item) => item.reason)).toContain('repeated_in_file');
    expect(fixed.counts).toMatchObject({ matched: 1, newItems: 0, needsAttention: 1 });
  });

  it('keeps the catalog’s spec on an answer, and leaves the platform item as it was', async () => {
    const before = await platformRow(platform.conflicted);
    const jobId = await aPreview([`${names.conflicted},12500,panel,${ANOTHER.watt}`]);

    const kept = await fix(jobId, ROW.first, { answer: 'keep_catalog_spec' });

    expect(kept.rows.map((row) => [row.outcome, row.answer, row.match])).toEqual([
      ['price_override', 'keep_catalog_spec', { source: 'platform_item', id: platform.conflicted }],
    ]);
    expect(await platformRow(platform.conflicted)).toEqual(before);
  });

  it('makes a conflicting row a new product when it is imported as the company’s own', async () => {
    const line = `${names.conflicted},12500,${A_NEW_PANEL.replace('550', String(ANOTHER.watt))}`;
    const jobId = await aPreview([line]);

    const own = await fix(jobId, ROW.first, { answer: 'import_as_own_item' });

    expect(own.rows.map((row) => [row.outcome, row.match])).toEqual([['new_item', null]]);
  });

  it('stores, after a run of fixes, the verdicts a whole new pass gives', async () => {
    const jobId = await aPreview([
      `${names.listed},13200`,
      `${names.listed},13300`,
      `New ${run},NP-2,11000,${A_NEW_PANEL}`,
      `${names.conflicted},12500,panel,${ANOTHER.watt}`,
      `Broken ${run},BP-2,`,
    ]);
    const [brand, model] = names.listed.split(',');
    await fix(jobId, ROW.first, { leaveOut: true });
    await fix(jobId, ROW.third, { cells: { brand, model } });
    await fix(jobId, ROW.fourth, { answer: 'keep_catalog_spec' });
    await fix(jobId, ROW.fifth, { cells: { rate: '9000', ...NEW_PANEL_CELLS } });
    await fix(jobId, ROW.first, { leaveOut: false });

    const stored = await pools.admin.db
      .select()
      .from(catalogImportRow)
      .where(and(eq(catalogImportRow.jobId, jobId)))
      .orderBy(asc(catalogImportRow.rowNumber));
    const inputs = stored.map((row) => ({
      cells: effectiveImportCells(row),
      leftOut: row.leftOut,
      answer: row.answer,
    }));
    const scope = await catalogServiceOf(pools).scopeOf(here.tenantId, Date.now());
    const named = await new CatalogSliceRepository(pools.tenants).named(
      here.tenantId,
      scope.marketCode,
      importProductNames(inputs),
    );
    const entry = (row: (typeof named)[number]) => ({
      ...row,
      spec: catalogSpecSchema.parse(row.spec),
    });
    const fresh = matchImportRows(inputs, {
      platformItems: named.filter((row) => row.source === 'platform_item').map(entry),
      ownItems: named.filter((row) => row.source === 'own_item').map(entry),
      currency: scope.formats,
    });

    expect(
      stored.map((row) => [row.outcome, row.attention, row.catalogItemId, row.tenantCatalogItemId]),
    ).toEqual(
      fresh.map((match) => [
        match.outcome,
        match.outcome === 'needs_attention' ? match.attention : [],
        match.outcome === 'price_override' ? match.platformItemId : null,
        match.outcome === 'own_item_price' ? match.ownItemId : null,
      ]),
    );
  });
});
