import { randomUUID } from 'node:crypto';
import { IDEMPOTENCY_KEY_HEADER } from '@heliogrid/contracts';
import { entitlement, storageGaugeSnapshot } from '@heliogrid/db';
import type { EntitlementLimitKind } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { declarationOf, fileServiceOf, pngOf, UPLOADER } from '../files/support';
import {
  aCompany,
  aMembership,
  aPerson,
  type Company,
  openPools,
  seed,
  skipWithoutDatabase,
  unseed,
} from '../support/fixture';

/**
 * The storage gate (`M12-23`, `BM-20`) at upload issuance, through the file service over the real
 * repositories: only a gauge past the ceiling plus a tenth refuses a new upload, with the typed cap
 * denial; confirming an upload already declared is never gated.
 */

const skip = skipWithoutDatabase(
  'STORAGE GATE PROOF',
  'That storage refuses only new uploads past its headroom is UNPROVEN in this run.',
);

const GB = 1_000_000_000;
const CEILING_GB = 10;
/** The ceiling plus its tenth of headroom, in bytes: 11 GB. */
const HEADROOM_BYTES = CEILING_GB * GB + CEILING_GB * (GB / 10);
/** Far past any ceiling here. */
const FAR_OVER_BYTES = CEILING_GB * HEADROOM_BYTES;
const A_PHOTO = 200;

describe.skipIf(skip)('the storage gate (M12-23, BM-20)', () => {
  const owner = aPerson('Storage Owner');
  const companies: Company[] = [];
  let pools: ReturnType<typeof openPools>;
  let files: ReturnType<typeof fileServiceOf>;

  beforeAll(async () => {
    pools = openPools();
    files = fileServiceOf(pools);
  });

  afterAll(async () => {
    await unseed(pools.admin.db, { companies, people: [owner], memberships: [] });
    await pools.close();
  });

  /** A company with a storage limit of this kind, and its latest nightly gauge, if any. */
  async function aCompanyStoring(
    limitKind: EntitlementLimitKind | null,
    gaugeBytes: number | null,
  ): Promise<string> {
    const company = aCompany(`Storage gate ${randomUUID()}`);
    const people = companies.length === 0 ? [owner] : [];
    companies.push(company);
    await seed(pools.admin.db, {
      companies: [company],
      people,
      memberships: [aMembership(company, owner, UPLOADER)],
    });
    if (limitKind !== null) {
      await pools.admin.db.insert(entitlement).values({
        tenantId: company.tenantId,
        entitlementKey: 'storage_gb',
        limitKind,
        limitValue: limitKind === 'count' ? CEILING_GB : null,
        source: 'trial',
        recomputedAt: new Date(),
      });
    }
    if (gaugeBytes !== null) {
      // An older, smaller reading first: the gate reads the newest one.
      await pools.admin.db.insert(storageGaugeSnapshot).values([
        {
          tenantId: company.tenantId,
          snapshotDate: '2026-10-28',
          gaugeBytes: 0,
          takenAt: new Date(),
        },
        { tenantId: company.tenantId, snapshotDate: '2026-10-29', gaugeBytes, takenAt: new Date() },
      ]);
    }
    return company.tenantId;
  }

  const declare = (tenantId: string) =>
    files.service.declare(
      tenantId,
      UPLOADER,
      declarationOf(tenantId, pngOf(A_PHOTO)),
      {},
      {
        actorUserId: owner.userId,
        now: Date.now(),
      },
    );

  it('a new upload stops only above the ceiling plus a tenth', async () => {
    const over = await aCompanyStoring('count', HEADROOM_BYTES + 1);
    await expect(declare(over)).rejects.toMatchObject({
      status: HttpStatus.FORBIDDEN,
      code: 'ENTITLEMENT_BLOCKED',
      blocked: {
        reason: 'cap',
        capability: 'new_file_upload',
        key: 'storage_gb',
        resetsAt: null,
      },
    });

    const atHeadroom = await aCompanyStoring('count', HEADROOM_BYTES);
    expect((await declare(atHeadroom)).upload?.method).toBe('PUT');
  });

  it.each([
    { why: 'before its first nightly gauge', limitKind: 'count', gauge: null },
    { why: 'with no limit written yet', limitKind: null, gauge: FAR_OVER_BYTES },
    { why: 'on an unlimited ceiling', limitKind: 'unlimited', gauge: FAR_OVER_BYTES },
    { why: 'on a negotiated ceiling', limitKind: 'custom', gauge: FAR_OVER_BYTES },
  ] as const)('a company uploads $why', async ({ limitKind, gauge }) => {
    const tenantId = await aCompanyStoring(limitKind, gauge);
    expect((await declare(tenantId)).upload?.method).toBe('PUT');
  });

  it('a retried declaration answers the file it made first, even once the gauge has crossed', async () => {
    const tenantId = await aCompanyStoring('count', null);
    const body = declarationOf(tenantId, pngOf(A_PHOTO));
    const headers = { [IDEMPOTENCY_KEY_HEADER]: randomUUID() };
    const act = { actorUserId: owner.userId, now: Date.now() };
    const first = await files.service.declare(tenantId, UPLOADER, body, headers, act);
    await pools.admin.db.insert(storageGaugeSnapshot).values({
      tenantId,
      snapshotDate: '2026-10-29',
      gaugeBytes: FAR_OVER_BYTES,
      takenAt: new Date(),
    });
    const retried = await files.service.declare(tenantId, UPLOADER, body, headers, act);
    expect(retried.file.id).toBe(first.file.id);
    // A new declaration is still refused.
    await expect(declare(tenantId)).rejects.toMatchObject({ status: HttpStatus.FORBIDDEN });
  });

  it('a file declared before the gauge crossed still completes', async () => {
    const tenantId = await aCompanyStoring('count', null);
    const bytes = pngOf(A_PHOTO);
    const declared = await files.service.declare(
      tenantId,
      UPLOADER,
      declarationOf(tenantId, bytes),
      {},
      { actorUserId: owner.userId, now: Date.now() },
    );
    await pools.admin.db.insert(storageGaugeSnapshot).values({
      tenantId,
      snapshotDate: '2026-10-29',
      gaugeBytes: FAR_OVER_BYTES,
      takenAt: new Date(),
    });
    if (declared.upload === null) throw new Error('a new declare always carries a link');
    expect(files.store.receive(declared.upload.url, bytes)).toBe(true);
    const done = await files.service.complete(tenantId, UPLOADER, declared.file.id, {
      actorUserId: owner.userId,
      now: Date.now(),
    });
    expect(done.uploadedAt).not.toBeNull();
    await expect(declare(tenantId)).rejects.toMatchObject({ status: HttpStatus.FORBIDDEN });
  });
});
