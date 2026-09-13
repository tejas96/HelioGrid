import { assertRuntimeRoleIsNotPrivileged, type Db } from '@heliogrid/db';
import type { INestApplication } from '@nestjs/common';
import { REFERENCE_DB } from './reference.token';

/**
 * Boot-time tenancy precondition (docs/engineering/08 §4, BYPASSRLS warning).
 *
 * Takes the REFERENCE token, not the tenant door: this asks the connection about its own role's
 * privileges, which is not a tenant's read and has no tenant to pin.
 *
 * Lives in `common/db/` rather than `main.ts` because that is the only place outside a
 * repository permitted to touch `@heliogrid/db` — dependency-cruiser
 * `db-access-in-repositories-only` rejected the direct import, correctly. `main.ts` stays
 * bootstrap-only and never sees the db package.
 */
export async function assertTenancyPrecondition(app: INestApplication): Promise<void> {
  await assertRuntimeRoleIsNotPrivileged(app.get<Db>(REFERENCE_DB));
}
