import { createDb } from '@heliogrid/db';
import type { Provider } from '@nestjs/common';
import { ENV } from '../../config/env';
import { ADMIN_DB } from './admin.token';
import { RUNTIME_DB } from './runtime.token';

/**
 * The two pools, created once and shared by every module (apps/api/CLAUDE.md tenancy).
 * They live in `common/db/` rather than in a feature module because tenancy is a
 * platform concern — the second module to need Postgres must not stand up a third pool.
 */
export const dbProviders: Provider[] = [
  {
    provide: RUNTIME_DB,
    useFactory: () => createDb(ENV.DATABASE_URL, { max: 10 }).db,
  },
  {
    provide: ADMIN_DB,
    useFactory: () => createDb(ENV.DATABASE_ADMIN_URL ?? ENV.DATABASE_URL, { max: 5 }).db,
  },
];
