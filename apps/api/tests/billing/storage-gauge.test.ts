import { randomUUID } from 'node:crypto';
import { storageGaugeSnapshot } from '@heliogrid/db';
import { MS_PER_DAY } from '@heliogrid/domain';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { UsageService } from '../../src/modules/billing/usage.service';
import { declarationOf, fileServiceOf, pngOf, UPLOADER } from '../files/support';
import {
  aCompany,
  aMembership,
  aPerson,
  openPools,
  seed,
  skipWithoutDatabase,
  unseed,
} from '../support/fixture';
import { usageServiceOf } from './support';

/**
 * The nightly storage gauge (`M12-33`, `BM-20`) over the real file and ledger tables: a reading of
 * each company's confirmed files, once a night — never a counter that moves between nights.
 */

const skip = skipWithoutDatabase(
  'STORAGE GAUGE PROOF',
  'That storage is a nightly gauge of stored files is UNPROVEN in this run.',
);

const NIGHT = Date.parse('2026-10-30T01:00:00Z');
const LATER_THAT_NIGHT = Date.parse('2026-10-30T01:01:00Z');
const NEXT_NIGHT = NIGHT + MS_PER_DAY;

/** The files the case stores, in bytes: two confirmed, one never uploaded, one added later. */
const LOGO = 300;
const PHOTO = 500;
const NEVER_UPLOADED = 700;
const LATE_PHOTO = 1_000;

describe.skipIf(skip)('the nightly storage gauge (M12-33, BM-20)', () => {
  const owner = aPerson('Gauge Owner');
  const storing = aCompany(`Gauge storing ${randomUUID()}`);
  const empty = aCompany(`Gauge empty ${randomUUID()}`);
  const fixture = {
    companies: [storing, empty],
    people: [owner],
    memberships: [aMembership(storing, owner, UPLOADER), aMembership(empty, owner, UPLOADER)],
  };
  let pools: ReturnType<typeof openPools>;
  let files: ReturnType<typeof fileServiceOf>;
  let usage: UsageService;

  beforeAll(async () => {
    pools = openPools();
    await seed(pools.admin.db, fixture);
    files = fileServiceOf(pools);
    usage = usageServiceOf(pools);
  });

  afterAll(async () => {
    await unseed(pools.admin.db, fixture);
    await pools.close();
  });

  /** Declares a PNG of `size` bytes and, when `confirmed`, uploads and completes it. */
  async function aFile(size: number, confirmed: boolean): Promise<void> {
    const bytes = pngOf(size);
    const act = { actorUserId: owner.userId, now: Date.now() };
    const declared = await files.service.declare(
      storing.tenantId,
      UPLOADER,
      declarationOf(storing.tenantId, bytes),
      {},
      act,
    );
    if (!confirmed) return;
    if (declared.upload === null) throw new Error('a new declare always carries a link');
    expect(files.store.receive(declared.upload.url, bytes)).toBe(true);
    await files.service.complete(storing.tenantId, UPLOADER, declared.file.id, act);
  }

  const readingsOf = (tenantId: string) =>
    pools.admin.db
      .select({ date: storageGaugeSnapshot.snapshotDate, bytes: storageGaugeSnapshot.gaugeBytes })
      .from(storageGaugeSnapshot)
      .where(eq(storageGaugeSnapshot.tenantId, tenantId))
      .orderBy(storageGaugeSnapshot.snapshotDate);

  it('the nightly gauge weighs each company’s stored files once a night', async () => {
    await aFile(LOGO, true);
    await aFile(PHOTO, true);
    // Declared and never uploaded: no stored bytes, so no weight.
    await aFile(NEVER_UPLOADED, false);
    const ids = [storing.tenantId, empty.tenantId];

    await usage.weigh(ids, NIGHT);
    expect(await readingsOf(storing.tenantId)).toEqual([
      { date: '2026-10-30', bytes: LOGO + PHOTO },
    ]);
    expect(await readingsOf(empty.tenantId)).toEqual([{ date: '2026-10-30', bytes: 0 }]);

    // More files the same night change nothing: a gauge is read once a night, never counted.
    await aFile(LATE_PHOTO, true);
    await usage.weigh(ids, LATER_THAT_NIGHT);
    expect(await readingsOf(storing.tenantId)).toEqual([
      { date: '2026-10-30', bytes: LOGO + PHOTO },
    ]);

    // The next night reads the new weight, and the gate's read is the newest.
    await usage.weigh(ids, NEXT_NIGHT);
    expect(await readingsOf(storing.tenantId)).toEqual([
      { date: '2026-10-30', bytes: LOGO + PHOTO },
      { date: '2026-10-31', bytes: LOGO + PHOTO + LATE_PHOTO },
    ]);
    expect((await usage.latestStorageGauge(storing.tenantId))?.gaugeBytes).toBe(
      LOGO + PHOTO + LATE_PHOTO,
    );
    // Another company's reading is never this one's.
    expect((await usage.latestStorageGauge(empty.tenantId))?.gaugeBytes).toBe(0);
  });
});
