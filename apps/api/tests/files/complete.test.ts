import type { ObjectStore } from '@heliogrid/contracts';
import { file } from '@heliogrid/db';
import { HttpStatus } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  aCompany,
  aMembership,
  aPerson,
  openPools,
  seed,
  skipWithoutDatabase,
  unseed,
} from '../support/fixture';
import {
  alteredCopyOf,
  declarationOf,
  fileServiceOf,
  htmlOf,
  NON_UPLOADER,
  pngOf,
  UPLOADER,
} from './support';

/**
 * Confirming an upload (`T-FPLAT-035` C7, C9, C10, C12, C13): a file becomes readable only when
 * the store holds exactly the declared bytes, of the declared type, confirmed by its uploader.
 */
/** A small logo's size in bytes; its exact value matters to no case here. */
const A_LOGO = 64;

/** A store that keeps the bytes but reports no checksum — what `complete` must never trust. */
const forgetsChecksums = (store: ObjectStore): ObjectStore => ({
  provider: store.provider,
  signUpload: (request) => store.signUpload(request),
  signDownload: (request) => store.signDownload(request),
  head: async (key) => {
    const stored = await store.head(key);
    return stored === null ? null : { ...stored, checksumSha256: null };
  },
  readFirstBytes: (key, count) => store.readFirstBytes(key, count),
});

const skip = skipWithoutDatabase(
  'FILE COMPLETE PROOF',
  'Confirming a file is UNPROVEN in this run.',
);

describe.skipIf(skip)('confirming an upload', () => {
  const company = aCompany('Complete Solar');
  const owner = aPerson('Owner');
  const partner = aPerson('Partner');
  const fixture = {
    companies: [company],
    people: [owner, partner],
    memberships: [aMembership(company, owner, UPLOADER), aMembership(company, partner, UPLOADER)],
  };
  let pools: ReturnType<typeof openPools>;
  let files: ReturnType<typeof fileServiceOf>;
  const act = () => ({ actorUserId: owner.userId, now: Date.now() });

  /** Declares a PNG of these bytes and returns the file id and where to PUT them. */
  const declare = async (bytes: Uint8Array) => {
    const declared = await files.service.declare(
      company.tenantId,
      UPLOADER,
      declarationOf(company.tenantId, bytes),
      {},
      act(),
    );
    if (declared.upload === null) throw new Error('a new declare always carries a link');
    return { id: declared.file.id, url: declared.upload.url };
  };
  const uploadedAtOf = async (id: string) => {
    const [row] = await pools.admin.db
      .select({ uploadedAt: file.uploadedAt })
      .from(file)
      .where(eq(file.id, id));
    return row?.uploadedAt ?? null;
  };

  beforeAll(async () => {
    pools = openPools();
    await seed(pools.admin.db, fixture);
    files = fileServiceOf(pools);
  });

  afterAll(async () => {
    await unseed(pools.admin.db, fixture);
    await pools.close();
  });

  it('makes an uploaded file readable', async () => {
    const bytes = pngOf(A_LOGO);
    const { id, url } = await declare(bytes);
    expect(files.store.receive(url, bytes)).toBe(true);
    const done = await files.service.complete(company.tenantId, UPLOADER, id, act());
    expect(done.uploadedAt).not.toBeNull();
  });

  it('completing before the upload leaves the file unreadable', async () => {
    const { id } = await declare(pngOf(A_LOGO));
    await expect(
      files.service.complete(company.tenantId, UPLOADER, id, act()),
    ).rejects.toMatchObject({ code: 'FILE_NOT_UPLOADED', status: HttpStatus.CONFLICT });
    expect(await uploadedAtOf(id)).toBeNull();
  });

  it('completing twice answers the same file', async () => {
    const bytes = pngOf(A_LOGO);
    const { id, url } = await declare(bytes);
    files.store.receive(url, bytes);
    const [a, b] = await Promise.all([
      files.service.complete(company.tenantId, UPLOADER, id, act()),
      files.service.complete(company.tenantId, UPLOADER, id, act()),
    ]);
    expect(a.uploadedAt).toBe(b.uploadedAt);
    const again = await files.service.complete(company.tenantId, UPLOADER, id, act());
    expect(again.uploadedAt).toBe(a.uploadedAt);
  });

  it('bytes of another length are never made readable', async () => {
    const bytes = pngOf(A_LOGO);
    const { id } = await declare(bytes);
    const [row] = await pools.admin.db
      .select({ key: file.externalId })
      .from(file)
      .where(eq(file.id, id));
    files.store.keepUnchecked(row?.key ?? '', pngOf(A_LOGO + 1));
    await expect(
      files.service.complete(company.tenantId, UPLOADER, id, act()),
    ).rejects.toMatchObject({ code: 'FILE_CONTENT_MISMATCH' });
    expect(await uploadedAtOf(id)).toBeNull();
  });

  it('bytes of the declared length but another checksum are never made readable', async () => {
    const bytes = pngOf(A_LOGO);
    const { id } = await declare(bytes);
    const [row] = await pools.admin.db
      .select({ key: file.externalId })
      .from(file)
      .where(eq(file.id, id));
    files.store.keepUnchecked(row?.key ?? '', alteredCopyOf(bytes));
    await expect(
      files.service.complete(company.tenantId, UPLOADER, id, act()),
    ).rejects.toMatchObject({ code: 'FILE_CONTENT_MISMATCH' });
    expect(await uploadedAtOf(id)).toBeNull();
  });

  it('a store that kept no checksum never makes the file readable', async () => {
    const forgetful = fileServiceOf(pools, forgetsChecksums);
    const bytes = pngOf(A_LOGO);
    const declared = await forgetful.service.declare(
      company.tenantId,
      UPLOADER,
      declarationOf(company.tenantId, bytes),
      {},
      act(),
    );
    forgetful.store.receive(declared.upload?.url ?? '', bytes);
    await expect(
      forgetful.service.complete(company.tenantId, UPLOADER, declared.file.id, act()),
    ).rejects.toMatchObject({ code: 'FILE_CONTENT_MISMATCH' });
    expect(await uploadedAtOf(declared.file.id)).toBeNull();
  });

  it('bytes that are not the declared image are never made readable', async () => {
    const page = htmlOf();
    const { id, url } = await declare(page);
    expect(files.store.receive(url, page)).toBe(true);
    await expect(
      files.service.complete(company.tenantId, UPLOADER, id, act()),
    ).rejects.toMatchObject({
      code: 'FILE_CONTENT_MISMATCH',
      status: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(await uploadedAtOf(id)).toBeNull();
  });

  it('only the uploader, still permitted, completes a file', async () => {
    const bytes = pngOf(A_LOGO);
    const { id, url } = await declare(bytes);
    files.store.receive(url, bytes);
    await expect(
      files.service.complete(company.tenantId, UPLOADER, id, {
        actorUserId: partner.userId,
        now: Date.now(),
      }),
    ).rejects.toMatchObject({ status: HttpStatus.NOT_FOUND });
    await expect(
      files.service.complete(company.tenantId, NON_UPLOADER, id, act()),
    ).rejects.toMatchObject({ status: HttpStatus.FORBIDDEN });
    expect(await uploadedAtOf(id)).toBeNull();
  });

  it('a store outage leaves the file pending and retryable', async () => {
    const bytes = pngOf(A_LOGO);
    const { id, url } = await declare(bytes);
    files.store.receive(url, bytes);
    files.store.outage(true);
    await expect(
      files.service.complete(company.tenantId, UPLOADER, id, act()),
    ).rejects.toMatchObject({
      code: 'OBJECT_STORE_UNAVAILABLE',
      status: HttpStatus.SERVICE_UNAVAILABLE,
    });
    expect(await uploadedAtOf(id)).toBeNull();
    files.store.outage(false);
    const retried = await files.service.complete(company.tenantId, UPLOADER, id, act());
    expect(retried.uploadedAt).not.toBeNull();
  });
});
