import { file } from '@heliogrid/db';
import { FILE_DOWNLOAD_LINK_SECONDS } from '@heliogrid/domain';
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
import { declarationOf, fileServiceOf, NON_UPLOADER, pngOf, UPLOADER } from './support';

/** Reading a stored file (`T-FPLAT-035` C11, C14): only a confirmed file gets a link. */
/** A small logo's size in bytes; its exact value matters to no case here. */
const A_LOGO = 20;
const SECOND_MS = 1_000;

const skip = skipWithoutDatabase('FILE DOWNLOAD PROOF', 'Reading a file is UNPROVEN in this run.');

describe.skipIf(skip)('reading a stored file', () => {
  const company = aCompany('Download Solar');
  const owner = aPerson('Owner');
  const fixture = {
    companies: [company],
    people: [owner],
    memberships: [aMembership(company, owner, UPLOADER)],
  };
  let pools: ReturnType<typeof openPools>;
  let files: ReturnType<typeof fileServiceOf>;
  const act = () => ({ actorUserId: owner.userId, now: Date.now() });

  beforeAll(async () => {
    pools = openPools();
    await seed(pools.admin.db, fixture);
    files = fileServiceOf(pools);
  });

  afterAll(async () => {
    await unseed(pools.admin.db, fixture);
    await pools.close();
  });

  it('a file never completed has no download link', async () => {
    const declared = await files.service.declare(
      company.tenantId,
      UPLOADER,
      declarationOf(company.tenantId, pngOf(A_LOGO)),
      {},
      act(),
    );
    await expect(
      files.service.downloadUrl(company.tenantId, NON_UPLOADER, declared.file.id, Date.now()),
    ).rejects.toMatchObject({ code: 'FILE_NOT_UPLOADED', status: HttpStatus.CONFLICT });
  });

  it('any member reads a confirmed logo through a five-minute link', async () => {
    const bytes = pngOf(A_LOGO);
    const declared = await files.service.declare(
      company.tenantId,
      UPLOADER,
      declarationOf(company.tenantId, bytes),
      {},
      act(),
    );
    files.store.receive(declared.upload?.url ?? '', bytes);
    await files.service.complete(company.tenantId, UPLOADER, declared.file.id, act());
    const now = Date.now();
    const link = await files.service.downloadUrl(
      company.tenantId,
      NON_UPLOADER,
      declared.file.id,
      now,
    );
    expect(Date.parse(link.expiresAt) - now).toBe(FILE_DOWNLOAD_LINK_SECONDS * SECOND_MS);
    expect(link.url).toContain('type=image%2Fpng');
  });

  it('no signed link reaches the log or the row', async () => {
    const bytes = pngOf(A_LOGO);
    const declared = await files.service.declare(
      company.tenantId,
      UPLOADER,
      declarationOf(company.tenantId, bytes),
      {},
      act(),
    );
    const uploadUrl = declared.upload?.url ?? '';
    files.store.receive(uploadUrl, bytes);
    files.store.outage(true);
    await files.service
      .complete(company.tenantId, UPLOADER, declared.file.id, act())
      .catch(() => {});
    files.store.outage(false);
    await files.service.complete(company.tenantId, UPLOADER, declared.file.id, act());
    const link = await files.service.downloadUrl(
      company.tenantId,
      UPLOADER,
      declared.file.id,
      Date.now(),
    );
    expect(files.logged.length).toBeGreaterThan(0);
    const log = files.logged.join('');
    expect(log).not.toContain(uploadUrl);
    expect(log).not.toContain(link.url);
    const [row] = await pools.admin.db.select().from(file).where(eq(file.id, declared.file.id));
    expect(JSON.stringify(row)).not.toContain('memory://');
  });
});
