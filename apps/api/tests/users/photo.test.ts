import { memberPhoto } from '@heliogrid/db';
import { FOUNDER_ROLE } from '@heliogrid/domain';
import { HttpStatus, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { sha256Of } from '../../src/modules/file/internal/object-store.memory';
import { UserAdminRepository } from '../../src/modules/user/user.admin.repository';
import { UserPhotoRepository } from '../../src/modules/user/user.photo.repository';
import { UserService } from '../../src/modules/user/user.service';
import { declarationOf, fileServiceOf, NON_UPLOADER, pngOf } from '../files/support';
import {
  aCompany,
  aMembership,
  aPerson,
  openPools,
  seed,
  skipWithoutDatabase,
  unseed,
} from '../support/fixture';

/**
 * A person's photo in one company (`T-M01-009` AC-3, AC-4; `T-M01-011c` AC-13), through the service
 * over the real repositories and a migrated database: only a confirmed file of this company, stored
 * against the caller's own account, is pointed at, each company keeps its own, and the read answers
 * the one of the company asked.
 */
const A_PHOTO = 300;
/** A preset that may not store the company's files: a photo of oneself needs none. */
const ANY_ROLE = NON_UPLOADER;

const skip = skipWithoutDatabase('MEMBER PHOTO PROOF', 'A member photo is UNPROVEN in this run.');

describe.skipIf(skip)("a person's photo in a company", () => {
  const company = aCompany('Photo Solar');
  const elsewhere = aCompany('Other Photo Solar');
  const anjali = aPerson('Anjali');
  const teammate = aPerson('Teammate');
  const fixture = {
    companies: [company, elsewhere],
    people: [anjali, teammate],
    memberships: [
      aMembership(company, anjali, ANY_ROLE),
      aMembership(company, teammate, [FOUNDER_ROLE]),
      aMembership(elsewhere, anjali, ANY_ROLE),
    ],
  };
  const memberships = fixture.memberships.map((m) => m.membershipId);
  let pools: ReturnType<typeof openPools>;
  let files: ReturnType<typeof fileServiceOf>;
  let users: UserService;
  const actOf = (userId: string) => ({ actorUserId: userId, now: Date.now() });

  /** A photo `who` declared against `against`'s account in `tenantId`, stored unless `stored` is false. */
  async function aPhotoOf(tenantId: string, who: string, against = who, stored = true) {
    const bytes = pngOf(A_PHOTO);
    const declared = await files.service.declare(
      tenantId,
      ANY_ROLE,
      {
        subjectKind: 'user_account',
        subjectRef: against,
        contentType: 'image/png',
        byteSize: bytes.length,
        checksumSha256: sha256Of(bytes),
      },
      {},
      actOf(who),
    );
    if (!stored) return declared.file.id;
    if (declared.upload === null || !files.store.receive(declared.upload.url, bytes)) {
      throw new Error('the memory store refused the upload');
    }
    await files.service.complete(tenantId, ANY_ROLE, declared.file.id, actOf(who));
    return declared.file.id;
  }

  beforeAll(async () => {
    pools = openPools();
    await seed(pools.admin.db, fixture);
    files = fileServiceOf(pools);
    users = new UserService(
      new UserAdminRepository(pools.admin.db),
      new UserPhotoRepository(pools.tenants),
      files.service,
    );
  });

  afterAll(async () => {
    await unseed(pools.admin.db, fixture);
    await pools.close();
  });

  const heldBy = async (membershipId: string) => {
    const [row] = await pools.admin.db
      .select({ fileId: memberPhoto.fileId })
      .from(memberPhoto)
      .where(eq(memberPhoto.membershipId, membershipId));
    return row?.fileId ?? null;
  };

  it('sets, reads back and clears the pointer', async () => {
    const fileId = await aPhotoOf(company.tenantId, anjali.userId);
    await expect(users.setMyPhoto(company.tenantId, fileId, actOf(anjali.userId))).resolves.toEqual(
      {
        photoFileId: fileId,
      },
    );
    expect(await heldBy(memberships[0] ?? '')).toBe(fileId);
    const replaced = await aPhotoOf(company.tenantId, anjali.userId);
    await users.setMyPhoto(company.tenantId, replaced, actOf(anjali.userId));
    expect(await heldBy(memberships[0] ?? '')).toBe(replaced);
    await expect(users.setMyPhoto(company.tenantId, null, actOf(anjali.userId))).resolves.toEqual({
      photoFileId: null,
    });
    expect(await heldBy(memberships[0] ?? '')).toBeNull();
  });

  it("another company's file, a teammate's file and another kind answer 404", async () => {
    const theirs = await aPhotoOf(elsewhere.tenantId, anjali.userId);
    const teammates = await aPhotoOf(company.tenantId, teammate.userId);
    const logo = await files.service.declare(
      company.tenantId,
      [FOUNDER_ROLE],
      declarationOf(company.tenantId, pngOf(A_PHOTO)),
      {},
      actOf(teammate.userId),
    );
    for (const fileId of [theirs, teammates, logo.file.id]) {
      await expect(
        users.setMyPhoto(company.tenantId, fileId, actOf(anjali.userId)),
      ).rejects.toBeInstanceOf(NotFoundException);
    }
    expect(await heldBy(memberships[0] ?? '')).toBeNull();
  });

  it('a file never stored answers 409', async () => {
    const pending = await aPhotoOf(company.tenantId, anjali.userId, anjali.userId, false);
    const refusal = users.setMyPhoto(company.tenantId, pending, actOf(anjali.userId));
    await expect(refusal).rejects.toMatchObject({
      code: 'FILE_NOT_UPLOADED',
      status: HttpStatus.CONFLICT,
    });
  });

  it("a photo set in one company is not the other's", async () => {
    const here = await aPhotoOf(company.tenantId, anjali.userId);
    await users.setMyPhoto(company.tenantId, here, actOf(anjali.userId));
    expect(await heldBy(memberships[2] ?? '')).toBeNull();
    const there = await aPhotoOf(elsewhere.tenantId, anjali.userId);
    await users.setMyPhoto(elsewhere.tenantId, there, actOf(anjali.userId));
    expect(await heldBy(memberships[0] ?? '')).toBe(here);
    expect(await heldBy(memberships[2] ?? '')).toBe(there);
    await users.setMyPhoto(company.tenantId, null, actOf(anjali.userId));
    expect(await heldBy(memberships[2] ?? '')).toBe(there);
    await users.setMyPhoto(elsewhere.tenantId, null, actOf(anjali.userId));
  });

  it('reads back the photo it set, in that company alone', async () => {
    const here = await aPhotoOf(company.tenantId, anjali.userId);
    await users.setMyPhoto(company.tenantId, here, actOf(anjali.userId));
    await expect(users.myPhoto(company.tenantId, anjali.userId)).resolves.toEqual({
      photoFileId: here,
    });
    await expect(users.myPhoto(elsewhere.tenantId, anjali.userId)).resolves.toEqual({
      photoFileId: null,
    });
    await expect(users.myPhoto(company.tenantId, teammate.userId)).resolves.toEqual({
      photoFileId: null,
    });
    await users.setMyPhoto(company.tenantId, null, actOf(anjali.userId));
  });

  it('reads null after a clear', async () => {
    const fileId = await aPhotoOf(company.tenantId, anjali.userId);
    await users.setMyPhoto(company.tenantId, fileId, actOf(anjali.userId));
    await users.setMyPhoto(company.tenantId, null, actOf(anjali.userId));
    await expect(users.myPhoto(company.tenantId, anjali.userId)).resolves.toEqual({
      photoFileId: null,
    });
  });
});
