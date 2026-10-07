/*
 * The import run's handoff and refusals (`T-M01-030f` AC-3, AC-8), against REAL state: the job's
 * move to `running`, its left-out rows and its outbox event commit together or not at all, a run
 * sent twice hands off once, and a role without the outright manage grant, another company, or a
 * job not yet previewed is refused with nothing written.
 */
import type { RoleSet } from '@heliogrid/contracts';
import {
  catalogImportJob,
  catalogImportRow,
  orchestrationOutbox,
  type TenantPool,
} from '@heliogrid/db';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { and, eq, isNotNull } from 'drizzle-orm';
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
import { A_NEW_PANEL, aPreviewOf, importRunServiceOf } from './import-preview-support';
import {
  anImportStart,
  aRunTag,
  aStoredPriceList,
  importServiceOf,
  preset,
  publishIndiaPack,
} from './support';

const here = aCompany('Import Run Refusals EPC');
const elsewhere = aCompany('Other Import Run Refusals EPC');
const owner = aPerson('Leela Pillai');
const rival = aPerson('Arjun Bose');
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

/**
 * A tenant pool whose transaction that writes an outbox event fails once its work is done — the
 * commit that never came. Every other transaction commits, so a write made apart from it would stay.
 */
function failingTheCommitOfTheHandoff(pool: TenantPool): TenantPool {
  const events = async (tx: Parameters<Parameters<TenantPool['withTenantTransaction']>[1]>[0]) =>
    (await tx.select({ id: orchestrationOutbox.id }).from(orchestrationOutbox)).length;
  return {
    withTenantTransaction: (tenantId, work) =>
      pool.withTenantTransaction(tenantId, async (tx) => {
        const before = await events(tx);
        const done = await work(tx);
        if ((await events(tx)) > before) throw new Error('the commit was lost after the write');
        return done;
      }),
  };
}

/** The CHECK a refused write broke, by name; null when the write went through. */
async function constraintRefusing(write: PromiseLike<unknown>): Promise<string | null> {
  try {
    await write;
    return null;
  } catch (error) {
    const cause = (error as { cause?: { constraint_name?: string } }).cause;
    return cause?.constraint_name ?? String(error);
  }
}

const skip = skipWithoutDatabase(
  'CATALOG IMPORT RUN REFUSALS PROOF',
  'That a run hands off once, and refuses whoever may not run it, is UNPROVEN in this run.',
);

describe.skipIf(skip)('handing off and refusing an import run, against a migrated database', () => {
  let pools: ReturnType<typeof openPools>;
  let files: ReturnType<typeof fileServiceOf>;
  const aPreview = () =>
    aPreviewOf(pools, files, here.tenantId, OWNER, act, [
      `Handoff ${run},H-1,6000,${A_NEW_PANEL}`,
      `Handoff ${run},H-2,`,
    ]);
  const runEventsFor = async (jobId: string) =>
    (
      await pools.admin.db
        .select()
        .from(orchestrationOutbox)
        .where(eq(orchestrationOutbox.tenantId, here.tenantId))
    ).filter((event) => event.payload.jobId === jobId && event.payload.phase === 'run');
  const statusOf = async (jobId: string) =>
    (
      await pools.admin.db
        .select({ status: catalogImportJob.status })
        .from(catalogImportJob)
        .where(eq(catalogImportJob.id, jobId))
    )[0]?.status;
  const resultsOf = (jobId: string) =>
    pools.admin.db
      .select()
      .from(catalogImportRow)
      .where(and(eq(catalogImportRow.jobId, jobId), isNotNull(catalogImportRow.result)));
  const untouched = async (jobId: string) => [
    await statusOf(jobId),
    (await runEventsFor(jobId)).length,
    (await resultsOf(jobId)).length,
  ];

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

  it('leaves neither the run nor its event when the commit is lost', async () => {
    const jobId = await aPreview();
    const temporal = aRecordingTemporal();
    const lost = importRunServiceOf(
      pools,
      files,
      temporal,
      failingTheCommitOfTheHandoff(pools.tenants),
    );

    await expect(lost.run(here.tenantId, OWNER, jobId, act())).rejects.toThrow(
      'the commit was lost',
    );

    expect(await untouched(jobId)).toEqual(['previewed', 0, 0]);
    expect(temporal.starts).toEqual([]);
  });

  it('hands a run sent twice off once, and answers the second as the job stands', async () => {
    const jobId = await aPreview();
    const temporal = aRecordingTemporal();
    const runs = importRunServiceOf(pools, files, temporal);

    const first = await runs.run(here.tenantId, OWNER, jobId, act());
    const second = await runs.run(here.tenantId, OWNER, jobId, act());

    expect([first.status, second.status]).toEqual(['running', 'running']);
    const events = await runEventsFor(jobId);
    expect(events).toHaveLength(1);
    expect(temporal.startedIds()).toEqual([`catalog-import-${events[0]?.id}`]);
    expect((await resultsOf(jobId)).map((row) => row.result)).toEqual(['left_out']);
  });

  it('refuses Finance the run and changes nothing', async () => {
    const jobId = await aPreview();

    await expect(
      importRunServiceOf(pools, files, aRecordingTemporal()).run(
        here.tenantId,
        FINANCE,
        jobId,
        act(),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(await untouched(jobId)).toEqual(['previewed', 0, 0]);
  });

  it('reads another company’s job as not found, and changes nothing', async () => {
    const jobId = await aPreview();

    await expect(
      importRunServiceOf(pools, files, aRecordingTemporal()).run(elsewhere.tenantId, OWNER, jobId, {
        actorUserId: rival.userId,
        now: Date.now(),
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(await untouched(jobId)).toEqual(['previewed', 0, 0]);
  });

  it('refuses a job the matching pass has not previewed', async () => {
    const temporal = aRecordingTemporal();
    const fileId = await aStoredPriceList(files, here.tenantId, act());
    const job = await importServiceOf(pools, files, temporal).start(
      here.tenantId,
      OWNER,
      anImportStart(fileId),
      {},
      act(),
    );

    await expect(
      importRunServiceOf(pools, files, temporal).run(here.tenantId, OWNER, job.id, act()),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(await untouched(job.id)).toEqual(['reading', 0, 0]);
  });

  it('refuses a reason on a row not yet run, a failed row with no reason, and a running job with no one who ran it', async () => {
    const jobId = await aPreview();
    const admin = pools.admin.db;

    const refusals = [
      // A reason on a row not yet run: the result is null, which a bare `=` would let through.
      await constraintRefusing(
        admin
          .update(catalogImportRow)
          .set({ failure: 'not_applied' })
          .where(eq(catalogImportRow.jobId, jobId)),
      ),
      await constraintRefusing(
        admin
          .update(catalogImportRow)
          .set({ result: 'failed' })
          .where(eq(catalogImportRow.jobId, jobId)),
      ),
      await constraintRefusing(
        admin
          .update(catalogImportJob)
          .set({ status: 'running' })
          .where(eq(catalogImportJob.id, jobId)),
      ),
    ];

    expect(refusals).toEqual([
      'catalog_import_row_result_names_its_write',
      'catalog_import_row_result_names_its_write',
      'catalog_import_job_run_has_runner',
    ]);
    expect(await untouched(jobId)).toEqual(['previewed', 0, 0]);
  });
});
