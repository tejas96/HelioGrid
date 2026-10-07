/*
 * The import's mapping and its matching pass as a step (`T-M01-030d` AC-8, AC-11), against REAL
 * state: a mapping that fits its sheet hands the pass to the workflow in the job's transaction; one
 * that does not, or a job not ready for one, is refused with nothing written; a newer mapping
 * supersedes a pass still running; a retried pass writes its rows once; and only the outright
 * manage grant of the job's own company reaches any of it.
 */
import type { RoleSet } from '@heliogrid/contracts';
import { catalogImportJob, catalogImportRow, orchestrationOutbox } from '@heliogrid/db';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ContractException } from '../../src/common/errors/contract-exception';
import { CatalogImportRowsRepository } from '../../src/modules/catalog/catalog.import-rows.repository';
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
  aStoredPriceList,
  importPreviewServiceOf,
  importServiceOf,
  preset,
  publishIndiaPack,
} from './support';

const here = aCompany('Import Map EPC');
const elsewhere = aCompany('Other Import Map EPC');
const owner = aPerson('Kabir Shah');
const rival = aPerson('Nisha Rao');
const fixture: Fixture = {
  companies: [here, elsewhere],
  people: [owner, rival],
  memberships: [
    aMembership(here, owner, [preset.epc_owner]),
    aMembership(elsewhere, rival, [preset.epc_owner]),
  ],
};
const OWNER: RoleSet = [preset.epc_owner];
const FINANCE: RoleSet = [preset.finance];
const act = () => ({ actorUserId: owner.userId, now: Date.now() });

/** `aPriceList`'s columns, and the same three read the other way round. */
const AS_WRITTEN = { sheet: 0, headerRow: 0, columns: ['brand', 'model', 'rate'] as const };
const SWAPPED = { sheet: 0, headerRow: 0, columns: ['model', 'brand', 'rate'] as const };
/** `aPriceList`'s two products sit on sheet rows 2 and 3, below its header. */
const PRODUCT_ROW = { first: 2, second: 3 } as const;
const map = (mapping: typeof AS_WRITTEN | typeof SWAPPED) => ({
  ...mapping,
  columns: [...mapping.columns],
});

const skip = skipWithoutDatabase(
  'CATALOG IMPORT MAPPING PROOF',
  'That a mapping is refused, superseded and matched once is UNPROVEN in this run.',
);

describe.skipIf(skip)('mapping an import, against a migrated database', () => {
  let pools: ReturnType<typeof openPools>;
  let files: ReturnType<typeof fileServiceOf>;
  const imports = () => importServiceOf(pools, files, aRecordingTemporal());
  const previews = () => importPreviewServiceOf(pools, files);

  /** A job whose file is stored and — unless asked not to — read. */
  const aJob = async (read = true) => {
    const fileId = await aStoredPriceList(files, here.tenantId, act());
    const job = await imports().start(here.tenantId, OWNER, anImportStart(fileId), {}, act());
    const step = { tenantId: here.tenantId, jobId: job.id };
    if (read) await imports().readFile(step, Date.now());
    return { jobId: job.id, step };
  };
  const jobRow = async (jobId: string) => {
    const [row] = await pools.admin.db
      .select()
      .from(catalogImportJob)
      .where(eq(catalogImportJob.id, jobId));
    return row;
  };
  const rowsOf = (jobId: string) =>
    pools.admin.db
      .select({ rowNumber: catalogImportRow.rowNumber, cells: catalogImportRow.cells })
      .from(catalogImportRow)
      .where(eq(catalogImportRow.jobId, jobId))
      .orderBy(catalogImportRow.rowNumber);
  const matchEventsOf = async (jobId: string) =>
    (
      await pools.admin.db
        .select({ payload: orchestrationOutbox.payload })
        .from(orchestrationOutbox)
        .where(and(eq(orchestrationOutbox.tenantId, here.tenantId)))
    ).filter((event) => event.payload.jobId === jobId && event.payload.phase === 'match');
  const page = (tenantId: string, roles: RoleSet, jobId: string) =>
    previews().page(tenantId, roles, jobId, { page: 1, limit: 10 }, Date.now());

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

  it('hands one matching pass to the workflow, however often the same mapping is sent', async () => {
    const { jobId } = await aJob();

    const mapped = await imports().map(here.tenantId, OWNER, jobId, map(AS_WRITTEN), Date.now());
    await imports().map(here.tenantId, OWNER, jobId, map(AS_WRITTEN), Date.now());

    expect(mapped).toMatchObject({ status: 'matching', mapping: AS_WRITTEN, counts: null });
    expect(await matchEventsOf(jobId)).toHaveLength(1);
    expect((await jobRow(jobId))?.mappingRevision).toBe(1);
  });

  it.each([
    ['a sheet the file does not hold', { ...map(AS_WRITTEN), sheet: 1 }, 'sheet'],
    ['a header below the top rows', { ...map(AS_WRITTEN), headerRow: 3 }, 'headerRow'],
    [
      'more columns than the sheet fills',
      { ...map(AS_WRITTEN), columns: [...AS_WRITTEN.columns, null] },
      'columns',
    ],
  ])('refuses %s and writes nothing', async (_, mapping, path) => {
    const { jobId } = await aJob();

    const refused = imports().map(here.tenantId, OWNER, jobId, mapping, Date.now());

    await expect(refused).rejects.toBeInstanceOf(ContractException);
    await expect(refused).rejects.toMatchObject({ details: [expect.objectContaining({ path })] });
    expect(await jobRow(jobId)).toMatchObject({ status: 'mapped', mapping: null });
    expect(await matchEventsOf(jobId)).toHaveLength(0);
  });

  it('refuses a mapping before the file is read, and the rows before they are matched', async () => {
    const { jobId } = await aJob(false);

    await expect(
      imports().map(here.tenantId, OWNER, jobId, map(AS_WRITTEN), Date.now()),
    ).rejects.toBeInstanceOf(ConflictException);
    await expect(page(here.tenantId, OWNER, jobId)).rejects.toBeInstanceOf(ConflictException);
    expect(await jobRow(jobId)).toMatchObject({ status: 'reading', mappingRevision: 0 });
  });

  it('a superseded pass writes nothing, and the newer mapping’s pass writes its rows', async () => {
    const { jobId, step } = await aJob();
    await imports().map(here.tenantId, OWNER, jobId, map(AS_WRITTEN), Date.now());
    const firstRevision = (await jobRow(jobId))?.mappingRevision ?? 0;
    await imports().map(here.tenantId, OWNER, jobId, map(SWAPPED), Date.now());

    // The first pass reaches its write only now, after the second mapping was confirmed.
    const stale = await new CatalogImportRowsRepository(pools.tenants).replace(
      here.tenantId,
      jobId,
      firstRevision,
      [
        {
          rowNumber: 2,
          cells: { brand: 'Stale' },
          outcome: 'needs_attention',
          attention: [],
          catalogItemId: null,
          tenantCatalogItemId: null,
        },
      ],
      Date.now(),
    );

    expect(stale).toBe('matching');
    expect(await rowsOf(jobId)).toEqual([]);
    expect(await previews().matchRows(step, Date.now())).toEqual({ status: 'previewed' });
    expect((await rowsOf(jobId)).map((row) => row.cells.brand)).toEqual(['WS-545', 'ASB-540']);
    expect(await matchEventsOf(jobId)).toHaveLength(2);
  });

  it('writes the pass’s rows once, however often the step is retried', async () => {
    const { jobId, step } = await aJob();
    await imports().map(here.tenantId, OWNER, jobId, map(AS_WRITTEN), Date.now());

    await previews().matchRows(step, Date.now());
    const first = await rowsOf(jobId);
    expect(await previews().matchRows(step, Date.now())).toEqual({ status: 'previewed' });

    expect(first.map((row) => row.rowNumber)).toEqual([PRODUCT_ROW.first, PRODUCT_ROW.second]);
    expect(await rowsOf(jobId)).toEqual(first);
  });

  it('puts a pass that failed past every retry back to mapped, and leaves a previewed job be', async () => {
    const failed = await aJob();
    await imports().map(here.tenantId, OWNER, failed.jobId, map(AS_WRITTEN), Date.now());
    const previewed = await aJob();
    await imports().map(here.tenantId, OWNER, previewed.jobId, map(AS_WRITTEN), Date.now());
    await previews().matchRows(previewed.step, Date.now());

    expect(await previews().endMatch(failed.step, Date.now())).toEqual({ status: 'mapped' });
    expect(await previews().endMatch(previewed.step, Date.now())).toEqual({ status: 'previewed' });
  });

  it('refuses Finance the mapping and changes nothing', async () => {
    const { jobId } = await aJob();

    const refused = imports().map(here.tenantId, FINANCE, jobId, map(AS_WRITTEN), Date.now());

    await expect(refused).rejects.toBeInstanceOf(ForbiddenException);
    expect(await jobRow(jobId)).toMatchObject({ status: 'mapped', mappingRevision: 0 });
    expect(await matchEventsOf(jobId)).toHaveLength(0);
  });

  it('refuses Finance the rows, and reads another company’s job as not found', async () => {
    const { jobId, step } = await aJob();
    await imports().map(here.tenantId, OWNER, jobId, map(AS_WRITTEN), Date.now());
    await previews().matchRows(step, Date.now());

    await expect(page(here.tenantId, FINANCE, jobId)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(page(elsewhere.tenantId, OWNER, jobId)).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      imports().map(elsewhere.tenantId, OWNER, jobId, map(SWAPPED), Date.now()),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect((await jobRow(jobId))?.mappingRevision).toBe(1);
  });
});
