import { createDb } from '@heliogrid/db';
import { Injectable, type OnApplicationShutdown, type Provider } from '@nestjs/common';
import { ENV } from '../../config/env';
import { ADMIN_DB } from './admin.token';
import { REFERENCE_DB } from './reference.token';
import { RUNTIME_DB } from './runtime.token';

/**
 * The two pools, created once and shared by every module (apps/api/CLAUDE.md tenancy).
 * They live in `common/db/` rather than in a feature module because tenancy is a
 * platform concern — the second module to need Postgres must not stand up a third pool.
 *
 * ONE holder with a shutdown hook, because a pool is a live socket: `app.close()` must end
 * both, or a command that boots this context to do one thing never exits, and the server's
 * graceful stop cuts in-flight queries instead of draining them.
 */
@Injectable()
export class DbPools implements OnApplicationShutdown {
  readonly runtime = createDb(ENV.DATABASE_URL, { max: ENV.DB_POOL_MAX });
  readonly admin = createDb(ENV.DATABASE_ADMIN_URL ?? ENV.DATABASE_URL, {
    max: ENV.DB_ADMIN_POOL_MAX,
  });

  async onApplicationShutdown(): Promise<void> {
    await Promise.all([this.runtime.client.end(), this.admin.client.end()]);
  }
}

export const dbProviders: Provider[] = [
  DbPools,
  { provide: RUNTIME_DB, useFactory: (pools: DbPools) => pools.runtime.db, inject: [DbPools] },
  // The same pool as RUNTIME_DB under a second name, because a token is a permission and these
  // two carry different ones: the tenant path pins a company, the reference path reads the
  // tables no company owns. One fence each (`common/db/reference.token.ts`).
  { provide: REFERENCE_DB, useFactory: (pools: DbPools) => pools.runtime.db, inject: [DbPools] },
  { provide: ADMIN_DB, useFactory: (pools: DbPools) => pools.admin.db, inject: [DbPools] },
];

/** What CommonModule exports: the pool tokens, and never the holder behind them. */
export const dbProviderTokens = [RUNTIME_DB, REFERENCE_DB, ADMIN_DB];
