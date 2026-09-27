import { randomUUID } from 'node:crypto';
import { IDEMPOTENCY_KEY_HEADER } from '@heliogrid/contracts';
import { file } from '@heliogrid/db';
import { FILE_MAX_BYTES } from '@heliogrid/domain';
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

/**
 * Declaring a file (`T-FPLAT-035` C1, C3, C4, C5, C15), through the service over the real
 * repository and a migrated database: who may, how large, against what, and a retried send.
 */
/** A small logo's size in bytes; its exact value matters to no case here. */
const A_LOGO = 200;

const skip = skipWithoutDatabase('FILE DECLARE PROOF', 'Declaring a file is UNPROVEN in this run.');

describe.skipIf(skip)('declaring a file', () => {
  const company = aCompany('Declare Solar');
  const elsewhere = aCompany('Other Solar');
  const owner = aPerson('Owner');
  const seller = aPerson('Seller');
  const fixture = {
    companies: [company, elsewhere],
    people: [owner, seller],
    memberships: [
      aMembership(company, owner, UPLOADER),
      aMembership(company, seller, NON_UPLOADER),
    ],
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

  it('declares the logo as pending, with a link to upload it to', async () => {
    const bytes = pngOf(A_LOGO);
    const declared = await files.service.declare(
      company.tenantId,
      UPLOADER,
      declarationOf(company.tenantId, bytes),
      {},
      act(),
    );
    expect(declared.file).toMatchObject({
      byteSize: A_LOGO,
      contentType: 'image/png',
      uploadedAt: null,
    });
    expect(declared.upload?.method).toBe('PUT');
    expect(declared.upload?.headers['content-type']).toBe('image/png');
  });

  it('the object key is built from server ids only', async () => {
    const declared = await files.service.declare(
      company.tenantId,
      UPLOADER,
      declarationOf(company.tenantId, pngOf(A_LOGO)),
      {},
      act(),
    );
    const [row] = await pools.admin.db
      .select({ externalId: file.externalId, provider: file.provider })
      .from(file)
      .where(eq(file.id, declared.file.id));
    expect(row).toEqual({
      externalId: `${company.tenantId}/${declared.file.id}`,
      provider: 'local',
    });
  });

  it('a member who may not manage settings cannot upload the logo', async () => {
    const refused = files.service.declare(
      company.tenantId,
      NON_UPLOADER,
      declarationOf(company.tenantId, pngOf(A_LOGO)),
      {},
      { actorUserId: seller.userId, now: Date.now() },
    );
    await expect(refused).rejects.toMatchObject({ status: HttpStatus.FORBIDDEN });
  });

  it("takes the company's own id in either case", async () => {
    const declaration = {
      ...declarationOf(company.tenantId, pngOf(A_LOGO)),
      subjectRef: company.tenantId.toUpperCase(),
    };
    const declared = await files.service.declare(
      company.tenantId,
      UPLOADER,
      declaration,
      {},
      act(),
    );
    expect(declared.file.uploadedAt).toBeNull();
  });

  it('a file for a subject outside this company is not found', async () => {
    const refused = files.service.declare(
      company.tenantId,
      UPLOADER,
      declarationOf(elsewhere.tenantId, pngOf(A_LOGO)),
      {},
      act(),
    );
    await expect(refused).rejects.toMatchObject({ status: HttpStatus.NOT_FOUND });
  });

  it('refuses a file larger than the kind takes, and stores nothing', async () => {
    const declaration = {
      ...declarationOf(company.tenantId, pngOf(A_LOGO)),
      byteSize: FILE_MAX_BYTES + 1,
    };
    const refused = files.service.declare(company.tenantId, UPLOADER, declaration, {}, act());
    await expect(refused).rejects.toMatchObject({
      code: 'FILE_TOO_LARGE',
      status: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('a declare replayed with its key returns the first file', async () => {
    const headers = { [IDEMPOTENCY_KEY_HEADER]: randomUUID() };
    const declaration = declarationOf(company.tenantId, pngOf(A_LOGO));
    const first = await files.service.declare(
      company.tenantId,
      UPLOADER,
      declaration,
      headers,
      act(),
    );
    const again = await files.service.declare(
      company.tenantId,
      UPLOADER,
      declaration,
      headers,
      act(),
    );
    expect(again.file.id).toBe(first.file.id);
    expect(again.upload).not.toBeNull();
    files.store.receive(first.upload?.url ?? '', pngOf(A_LOGO));
    await files.service.complete(company.tenantId, UPLOADER, first.file.id, act());
    const afterComplete = await files.service.declare(
      company.tenantId,
      UPLOADER,
      declaration,
      headers,
      act(),
    );
    expect(afterComplete.file.id).toBe(first.file.id);
    expect(afterComplete.upload).toBeNull();
    const other = { ...declaration, byteSize: A_LOGO + 1 };
    await expect(
      files.service.declare(company.tenantId, UPLOADER, other, headers, act()),
    ).rejects.toMatchObject({ code: 'IDEMPOTENCY_KEY_REUSED' });
  });
});
