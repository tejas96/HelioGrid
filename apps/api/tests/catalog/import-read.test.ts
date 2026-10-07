/*
 * The import's read step (`T-M01-030c` AC-10), against REAL state: a stored price list becomes its
 * sheets as the file wrote them — once, however often Temporal retries the step — and a file that
 * cannot be read, or a store that stays down, ends the job `unreadable` with the reason step 1
 * shows. The step is called as the step host calls it; Temporal's own client only records.
 */
import type { RoleSet } from '@heliogrid/contracts';
import { catalogImportJob } from '@heliogrid/db';
import { and, eq } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
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
  aWorkbookOf,
  importServiceOf,
  type PriceListType,
  preset,
  priceListType,
} from './support';

const here = aCompany('Import Read EPC');
const owner = aPerson('Farah Khan');
const fixture: Fixture = {
  companies: [here],
  people: [owner],
  memberships: [aMembership(here, owner, [preset.epc_owner])],
};
const OWNER: RoleSet = [preset.epc_owner];
const act = () => ({ actorUserId: owner.userId, now: Date.now() });

/** A zip's opening bytes, so the store keeps it as an `.xlsx`, followed by nothing a workbook holds. */
const NOT_A_WORKBOOK = new Uint8Array(
  Buffer.concat([
    Buffer.from('504b0304140006000800', 'hex'),
    Buffer.alloc(Uint8Array.BYTES_PER_ELEMENT),
  ]),
);

const skip = skipWithoutDatabase(
  'CATALOG IMPORT READ PROOF',
  'That an import reads its file once, or says why it cannot, is UNPROVEN in this run.',
);

describe.skipIf(skip)('reading an import’s file, against a migrated database', () => {
  let pools: ReturnType<typeof openPools>;
  let files: ReturnType<typeof fileServiceOf>;
  let temporal: ReturnType<typeof aRecordingTemporal>;
  const imports = () => importServiceOf(pools, files, temporal);

  /** A started job of a stored file, and the step input the workflow would send for it. */
  const aJobOf = async (contentType?: PriceListType, bytes?: Uint8Array) => {
    const fileId = await aStoredPriceList(files, here.tenantId, act(), contentType, bytes);
    const job = await imports().start(here.tenantId, OWNER, anImportStart(fileId), {}, act());
    return { job, step: { tenantId: here.tenantId, jobId: job.id } };
  };
  const updatedAtOf = async (jobId: string) => {
    const [row] = await pools.admin.db
      .select({ updatedAt: catalogImportJob.updatedAt })
      .from(catalogImportJob)
      .where(and(eq(catalogImportJob.tenantId, here.tenantId), eq(catalogImportJob.id, jobId)));
    return row?.updatedAt;
  };

  beforeAll(async () => {
    pools = openPools();
    await seed(pools.admin.db, fixture);
    files = fileServiceOf(pools);
  });

  beforeEach(() => {
    temporal = aRecordingTemporal();
  });

  afterAll(async () => {
    await unseed(pools.admin.db, fixture);
    await pools.close();
  });

  it('reads a stored CSV into its sheet once, however often the step is retried', async () => {
    const { job, step } = await aJobOf();

    expect(await imports().readFile(step, Date.now())).toEqual({ status: 'mapped' });
    const firstRead = await updatedAtOf(job.id);
    expect(await imports().readFile(step, Date.now())).toEqual({ status: 'mapped' });

    expect(await updatedAtOf(job.id)).toEqual(firstRead);
    expect((await imports().import(here.tenantId, OWNER, job.id)).sheets).toEqual([
      expect.objectContaining({
        rowCount: 3,
        columnCount: 3,
        topRows: [
          ['Brand', 'Model', 'Rate'],
          ['Waaree', 'WS-545', '13,200'],
          ['Adani', 'ASB-540', '12900'],
        ],
      }),
    ]);
  });

  it('reads an .xlsx sheet by sheet', async () => {
    const workbook = await aWorkbookOf({
      Panels: [
        ['Brand', 'Model', 'Rate'],
        ['Waaree', 'WS-545', '13200'],
      ],
      Inverters: [['Brand', 'Model', 'Rate']],
    });
    const { job, step } = await aJobOf(priceListType.xlsx, workbook);

    await imports().readFile(step, Date.now());

    const read = await imports().import(here.tenantId, OWNER, job.id);
    expect(read.sheets?.map((sheet) => [sheet.name, sheet.rowCount])).toEqual([
      ['Panels', 2],
      ['Inverters', 1],
    ]);
  });

  it('marks a workbook it cannot open unreadable, for the person to choose another file', async () => {
    const { job, step } = await aJobOf(priceListType.xlsx, NOT_A_WORKBOOK);

    expect(await imports().readFile(step, Date.now())).toEqual({ status: 'unreadable' });

    expect(await imports().import(here.tenantId, OWNER, job.id)).toMatchObject({
      unreadableReason: 'cannot_open',
      sheets: null,
    });
  });

  it('throws for a retry while the store is down, then ends the read as not read', async () => {
    const { job, step } = await aJobOf();
    files.store.outage(true);
    try {
      await expect(imports().readFile(step, Date.now())).rejects.toThrow();
      expect(await imports().endRead(step, Date.now())).toEqual({ status: 'unreadable' });
    } finally {
      files.store.outage(false);
    }

    expect(await imports().import(here.tenantId, OWNER, job.id)).toMatchObject({
      unreadableReason: 'not_read',
    });
  });

  it('fails a step whose job is gone for good, so its workflow ends instead of retrying', async () => {
    const gone = { tenantId: here.tenantId, jobId: crypto.randomUUID() };

    await expect(imports().readFile(gone, Date.now())).rejects.toMatchObject({
      nonRetryable: true,
    });
    await expect(imports().endRead(gone, Date.now())).rejects.toMatchObject({ nonRetryable: true });
  });
});
