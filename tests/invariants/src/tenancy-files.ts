import { randomUUID } from 'node:crypto';
import type postgres from 'postgres';
import { assert, expectFail } from './tenancy-write-paths';

/**
 * The one files table's half of the tenancy invariant (migration 0013): a row per tenant for the
 * leak loop to read, and the two writes a session must never make across the pin.
 */
interface FileIds {
  readonly tenantA: string;
  readonly tenantB: string;
  readonly userA: string;
  readonly userB: string;
  readonly fileA: string;
  readonly fileB: string;
}

/** Migration 0013 — one pending file per tenant, on the admin path. */
export async function seedFiles(sql: postgres.Sql, ids: FileIds): Promise<void> {
  const { tenantA, tenantB, userA, userB, fileA, fileB } = ids;
  await sql`insert into file (id, tenant_id, subject_kind, subject_ref, provider, external_id,
      content_type, byte_size, checksum_sha256, uploaded_by, declared_at) values
    (${fileA}, ${tenantA}, 'tenant', ${tenantA}, 'local', ${`${tenantA}/${fileA}`},
     'image/png', 1, 'invariant', ${userA}, now()),
    (${fileB}, ${tenantB}, 'tenant', ${tenantB}, 'local', ${`${tenantB}/${fileB}`},
     'image/png', 1, 'invariant', ${userB}, now())`;
}

/**
 * Migration 0013 — a file is confirmed only under its own tenant's pin: completing tenant B's file
 * from tenant A's session touches nothing, though UPDATE on `uploaded_at` is granted; and a file
 * declared into tenant B from there is refused by the policy.
 */
export async function assertFileWritePath(sql: postgres.Sql, ids: FileIds): Promise<void> {
  const { tenantA, tenantB, userA, fileB } = ids;
  await sql.begin(async (tx) => {
    await tx`select set_config('app.tenant_id', ${tenantA}, true)`;
    await tx`set local role app_user`;
    const completed = await tx`update file set uploaded_at = now() where id = ${fileB}
      returning id`;
    assert(completed.length === 0, 'file: completing a tenant B file affects zero rows');
  });
  const smuggled = randomUUID();
  await expectFail(
    sql.begin(async (tx) => {
      await tx`select set_config('app.tenant_id', ${tenantA}, true)`;
      await tx`set local role app_user`;
      await tx`insert into file (id, tenant_id, subject_kind, subject_ref, provider, external_id,
        content_type, byte_size, checksum_sha256, uploaded_by, declared_at) values
        (${smuggled}, ${tenantB}, 'tenant', ${tenantB}, 'local', ${`${tenantB}/${smuggled}`},
         'image/png', 1, 'invariant', ${userA}, now())`;
    }),
    'declaring a tenant B file from a tenant A session must fail',
  );
}
