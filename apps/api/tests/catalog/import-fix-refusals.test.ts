/*
 * What the import's row fix refuses (`T-M01-030e` AC-8, AC-12; `T-M01-030g` AC-14), against REAL
 * state: an answer to a row that asks none, a job a new mapping is matching again, a row a
 * completed run wrote, a role without the outright manage grant, and another company's job or a
 * row the sheet does not hold — each with nothing written.
 */
import type { CatalogImportRowFixWrite, RoleSet } from '@heliogrid/contracts';
import { catalogImportRow, catalogItem } from '@heliogrid/db';
import {
  ConflictException,
  ForbiddenException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ContractException } from '../../src/common/errors/contract-exception';
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
  PRICE_COLUMNS,
  runEveryBatch,
} from './import-preview-support';
import {
  aPlatformItem,
  aRunTag,
  importPreviewServiceOf,
  importServiceOf,
  preset,
  publishIndiaPack,
  removePlatformItems,
} from './support';

const here = aCompany('Import Fix Refusals EPC');
const elsewhere = aCompany('Other Import Fix Refusals EPC');
const owner = aPerson('Ritu Sen');
const rival = aPerson('Omar Qureshi');
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
const run = aRunTag();

/** The sheet row of a list's first line, below its title row and header; one it does not hold. */
const ROW = { first: 3, absent: 99 } as const;

const skip = skipWithoutDatabase(
  'CATALOG IMPORT FIX REFUSALS PROOF',
  'That a refused fix writes nothing, and reads another company’s job as not found, is UNPROVEN in this run.',
);

describe.skipIf(skip)('refusing an import row fix, against a migrated database', () => {
  let pools: ReturnType<typeof openPools>;
  let files: ReturnType<typeof fileServiceOf>;
  let listed = '';
  const previews = () => importPreviewServiceOf(pools, files);
  const aPreview = (lines: readonly string[]) =>
    aPreviewOf(pools, files, here.tenantId, OWNER, act, lines);
  const fix = (jobId: string, rowNumber: number, change: CatalogImportRowFixWrite) =>
    previews().fix(here.tenantId, OWNER, jobId, rowNumber, change, Date.now());
  const storedRows = (jobId: string) =>
    pools.admin.db
      .select()
      .from(catalogImportRow)
      .where(eq(catalogImportRow.jobId, jobId))
      .orderBy(asc(catalogImportRow.rowNumber));
  const names = { listed: '' };

  beforeAll(async () => {
    pools = openPools();
    await seed(pools.admin.db, fixture);
    await publishIndiaPack(pools);
    files = fileServiceOf(pools);
    listed = await aPlatformItem(pools, { model: `${run} Listed`, markets: ['IN'] });
    const [row] = await pools.admin.db
      .select({ brand: catalogItem.brand, model: catalogItem.model })
      .from(catalogItem)
      .where(eq(catalogItem.id, listed));
    names.listed = `${row?.brand},${row?.model}`;
  });

  afterAll(async () => {
    await unseed(pools.admin.db, fixture);
    await removePlatformItems(pools, [listed]);
    await pools.close();
  });

  it('refuses an answer on a row that asks no question, and changes nothing', async () => {
    const jobId = await aPreview([`${names.listed},13200`]);
    const before = await storedRows(jobId);

    const refused = fix(jobId, ROW.first, { answer: 'import_as_own_item' });

    await expect(refused).rejects.toBeInstanceOf(ContractException);
    await expect(refused).rejects.toMatchObject({
      code: 'DOMAIN_RULE_VIOLATION',
      details: [{ path: 'answer', issue: 'asks_no_question' }],
    });
    await expect(refused).rejects.toSatisfy(
      (error: ContractException) => error.getStatus() === HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(await storedRows(jobId)).toEqual(before);
  });

  it('refuses a fix on a job a new mapping is matching again', async () => {
    const jobId = await aPreview([`${names.listed},13200`]);
    const imports = importServiceOf(pools, files, aRecordingTemporal());
    const columns = [...PRICE_COLUMNS];
    await imports.map(here.tenantId, OWNER, jobId, { sheet: 0, headerRow: 1, columns }, Date.now());

    await expect(fix(jobId, ROW.first, { leaveOut: true })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('refuses a fix to a row a completed run wrote, and changes nothing', async () => {
    const jobId = await aPreview([`Written ${run},W-1,5000,${A_NEW_PANEL}`]);
    const runs = importRunServiceOf(pools, files, aRecordingTemporal());
    await runs.run(here.tenantId, OWNER, jobId, act());
    await runEveryBatch(runs, { tenantId: here.tenantId, jobId });
    const before = await storedRows(jobId);

    await expect(fix(jobId, ROW.first, { leaveOut: true })).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(await storedRows(jobId)).toEqual(before);
  });

  it('refuses Finance the fix and changes nothing', async () => {
    const jobId = await aPreview([`${names.listed},13200`]);
    const before = await storedRows(jobId);

    const refused = previews().fix(
      here.tenantId,
      FINANCE,
      jobId,
      ROW.first,
      { leaveOut: true },
      Date.now(),
    );

    await expect(refused).rejects.toBeInstanceOf(ForbiddenException);
    expect(await storedRows(jobId)).toEqual(before);
  });

  it('reads another company’s job, and a row the sheet does not hold, as not found', async () => {
    const jobId = await aPreview([`${names.listed},13200`]);

    const theirs = previews().fix(
      elsewhere.tenantId,
      OWNER,
      jobId,
      ROW.first,
      { leaveOut: true },
      Date.now(),
    );
    const noRow = fix(jobId, ROW.absent, { leaveOut: true });

    await expect(theirs).rejects.toBeInstanceOf(NotFoundException);
    await expect(noRow).rejects.toBeInstanceOf(NotFoundException);
  });
});
