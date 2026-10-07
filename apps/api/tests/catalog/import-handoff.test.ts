/*
 * The import's start (`T-M01-030c` AC-3, AC-8), against REAL state: a job and its handoff to
 * `catalogImport` commit together or not at all, a retried start makes one job and one workflow,
 * Finance is refused, another company reads 404, and only a confirmed price list starts one. Only
 * Temporal's own client is replaced, by a recorder under the real gateway.
 */
import type { RoleSet } from '@heliogrid/contracts';
import { catalogImportWorkflow } from '@heliogrid/contracts/workflows';
import {
  catalogImportJob,
  orchestrationOutbox,
  type TenantPool,
  type TenantScopedDb,
} from '@heliogrid/db';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { sha256Of } from '../../src/modules/file/internal/object-store.memory';
import { fileServiceOf, pngOf, UPLOADER } from '../files/support';
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
  aPriceList,
  aStoredPriceList,
  importServiceOf,
  preset,
  priceListType,
} from './support';

const here = aCompany('Import Handoff EPC');
const elsewhere = aCompany('Other Import Handoff EPC');
const owner = aPerson('Meera Joshi');
const rival = aPerson('Kabir Rao');
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
/** Any logo; its size matters to no case here. */
const A_LOGO = 64;

/** The two writes a start makes; a split commit leaves one without the other. */
const STARTED_WRITES = [
  ['the job', catalogImportJob],
  ['its event', orchestrationOutbox],
] as const;
type StartedTable = (typeof STARTED_WRITES)[number][1];

const rowsIn = async (tx: TenantScopedDb, table: StartedTable, tenantId: string) =>
  (await tx.select({ id: table.id }).from(table).where(eq(table.tenantId, tenantId))).length;

/**
 * A tenant pool whose transaction that writes to `table` fails once its work is done — the commit
 * that never came. Every other transaction commits, so a write made apart from it would stay.
 */
function failingTheCommitThatWrites(pool: TenantPool, table: StartedTable): TenantPool {
  return {
    withTenantTransaction: (tenantId, work) =>
      pool.withTenantTransaction(tenantId, async (tx) => {
        const before = await rowsIn(tx, table, tenantId);
        const done = await work(tx);
        if ((await rowsIn(tx, table, tenantId)) > before) {
          throw new Error('the commit was lost after the write');
        }
        return done;
      }),
  };
}

const skip = skipWithoutDatabase(
  'CATALOG IMPORT HANDOFF PROOF',
  'That an import starts once, and only for its own company, is UNPROVEN in this run.',
);

describe.skipIf(skip)('starting an import, against a migrated database', () => {
  let pools: ReturnType<typeof openPools>;
  let files: ReturnType<typeof fileServiceOf>;
  let temporal: ReturnType<typeof aRecordingTemporal>;
  const imports = (tenants?: TenantPool) => importServiceOf(pools, files, temporal, tenants);
  const aFile = () => aStoredPriceList(files, here.tenantId, act());

  const eventsOf = (tenantId: string) =>
    pools.admin.db
      .select()
      .from(orchestrationOutbox)
      .where(eq(orchestrationOutbox.tenantId, tenantId));
  const eventsFor = async (jobId: string) =>
    (await eventsOf(here.tenantId)).filter((event) => event.payload.jobId === jobId);
  const jobsOf = (tenantId: string) =>
    pools.admin.db.select().from(catalogImportJob).where(eq(catalogImportJob.tenantId, tenantId));

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

  it('commits the job in reading with its handoff, and starts the workflow the event names', async () => {
    const job = await imports().start(
      here.tenantId,
      OWNER,
      anImportStart(await aFile()),
      {},
      act(),
    );

    expect(job).toMatchObject({ status: 'reading', fileName: 'Price list Aug 2026.csv' });
    const [event, ...more] = await eventsFor(job.id);
    expect(more).toEqual([]);
    expect(event).toMatchObject({
      tenantId: here.tenantId,
      workflow: catalogImportWorkflow.name,
      payload: { tenantId: here.tenantId, jobId: job.id, phase: 'read' },
      dispatchedAt: expect.any(Date),
    });
    expect(temporal.startedIds()).toEqual([`catalog-import-${event?.id}`]);
  });

  it.each(STARTED_WRITES)(
    'leaves neither the job nor its event when the commit after %s is lost',
    async (_write, table) => {
      const fileId = await aFile();
      const jobsBefore = (await jobsOf(here.tenantId)).length;
      const eventsBefore = (await eventsOf(here.tenantId)).length;

      const lost = imports(failingTheCommitThatWrites(pools.tenants, table)).start(
        here.tenantId,
        OWNER,
        anImportStart(fileId),
        {},
        act(),
      );

      await expect(lost).rejects.toThrow('the commit was lost');
      expect(await jobsOf(here.tenantId)).toHaveLength(jobsBefore);
      expect(await eventsOf(here.tenantId)).toHaveLength(eventsBefore);
      expect(temporal.startedIds()).toEqual([]);
    },
  );

  it('makes one job, one event and one workflow when a start is sent again with its key', async () => {
    const start = anImportStart(await aFile());
    const key = { 'idempotency-key': crypto.randomUUID() };

    const first = await imports().start(here.tenantId, OWNER, start, key, act());
    const again = await imports().start(here.tenantId, OWNER, start, key, act());

    expect(again.id).toBe(first.id);
    expect(await eventsFor(first.id)).toHaveLength(1);
    expect(temporal.startedIds()).toHaveLength(1);
  });

  it('refuses Finance the start and writes nothing', async () => {
    const fileId = await aFile();
    const jobsBefore = (await jobsOf(here.tenantId)).length;

    const refused = imports().start(here.tenantId, FINANCE, anImportStart(fileId), {}, act());

    await expect(refused).rejects.toBeInstanceOf(ForbiddenException);
    expect(await jobsOf(here.tenantId)).toHaveLength(jobsBefore);
  });

  it('reads another company’s job as not found, never as forbidden', async () => {
    const job = await imports().start(
      here.tenantId,
      OWNER,
      anImportStart(await aFile()),
      {},
      act(),
    );

    await expect(imports().import(elsewhere.tenantId, OWNER, job.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('starts from a confirmed price list only — never a logo, another company’s file or one not yet uploaded', async () => {
    const logo = pngOf(A_LOGO);
    const aLogo = await files.service.declare(
      here.tenantId,
      UPLOADER,
      {
        subjectKind: 'tenant',
        subjectRef: here.tenantId,
        contentType: 'image/png',
        byteSize: logo.length,
        checksumSha256: sha256Of(logo),
      },
      {},
      act(),
    );
    const pending = await files.service.declare(
      here.tenantId,
      UPLOADER,
      {
        subjectKind: 'catalog',
        subjectRef: here.tenantId,
        contentType: priceListType.csv,
        byteSize: aPriceList().length,
        checksumSha256: sha256Of(aPriceList()),
      },
      {},
      act(),
    );
    const theirs = await aFile();
    const start = (tenantId: string, fileId: string) =>
      imports().start(tenantId, OWNER, anImportStart(fileId), {}, act());

    await expect(start(here.tenantId, aLogo.file.id)).rejects.toBeInstanceOf(NotFoundException);
    await expect(start(elsewhere.tenantId, theirs)).rejects.toBeInstanceOf(NotFoundException);
    await expect(start(here.tenantId, pending.file.id)).rejects.toMatchObject({
      code: 'FILE_NOT_UPLOADED',
    });
  });

  it('refuses a key sent again with another body, and writes nothing for it', async () => {
    const key = { 'idempotency-key': crypto.randomUUID() };
    await imports().start(here.tenantId, OWNER, anImportStart(await aFile()), key, act());
    const jobsBefore = (await jobsOf(here.tenantId)).length;

    const reused = imports().start(here.tenantId, OWNER, anImportStart(await aFile()), key, act());

    await expect(reused).rejects.toMatchObject({ code: 'IDEMPOTENCY_KEY_REUSED' });
    expect(await jobsOf(here.tenantId)).toHaveLength(jobsBefore);
  });

  it('lists the company’s imports newest first, a page at a time, counted whole', async () => {
    const older = await imports().start(
      elsewhere.tenantId,
      OWNER,
      anImportStart(await aStoredPriceList(files, elsewhere.tenantId, act())),
      {},
      act(),
    );
    const newer = await imports().start(
      elsewhere.tenantId,
      OWNER,
      anImportStart(await aStoredPriceList(files, elsewhere.tenantId, act())),
      {},
      act(),
    );

    const first = await imports().imports(elsewhere.tenantId, OWNER, { page: 1, limit: 1 });
    const second = await imports().imports(elsewhere.tenantId, OWNER, { page: 2, limit: 1 });

    expect(first).toEqual({ items: [expect.objectContaining({ id: newer.id })], totalCount: 2 });
    expect(second).toEqual({ items: [expect.objectContaining({ id: older.id })], totalCount: 2 });
  });
});
