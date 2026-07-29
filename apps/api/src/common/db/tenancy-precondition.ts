import { assertRuntimeRoleIsNotPrivileged, type Db } from '@heliogrid/db';
import type { INestApplication } from '@nestjs/common';
import { RUNTIME_DB } from './runtime.token';

/**
 * Boot-time tenancy precondition (docs/08 §124).
 *
 * Lives in `common/db/` rather than `main.ts` because that is the only place outside a
 * repository permitted to touch `@heliogrid/db` — dependency-cruiser
 * `db-access-in-repositories-only` rejected the direct import, correctly. `main.ts` stays
 * bootstrap-only and never sees the db package.
 */
export async function assertTenancyPrecondition(app: INestApplication): Promise<void> {
  await assertRuntimeRoleIsNotPrivileged(app.get<Db>(RUNTIME_DB));
}
