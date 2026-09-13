import { createDb, tenantPool } from '@heliogrid/db';
import { Injectable, type OnApplicationShutdown, type Provider } from '@nestjs/common';
import { ENV } from '../../config/env';
import { ADMIN_DB } from './admin.token';
import { REFERENCE_DB } from './reference.token';
import { TENANT_DB } from './tenant.token';

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
  // The DOOR, not the database: what a tenant repository receives has no query of its own, so a
  // read that never names its tenant fails to compile rather than reading every company's rows.
  {
    provide: TENANT_DB,
    useFactory: (pools: DbPools) => tenantPool(pools.runtime.db),
    inject: [DbPools],
  },
  // The SAME socket the door above wraps, handed over raw, because a token is a permission and
  // these two carry different ones: the door pins a company, this reads the tables no company
  // owns and the role's own privileges at boot. Fenced (`common/db/reference.token.ts`).
  { provide: REFERENCE_DB, useFactory: (pools: DbPools) => pools.runtime.db, inject: [DbPools] },
  { provide: ADMIN_DB, useFactory: (pools: DbPools) => pools.admin.db, inject: [DbPools] },
];

/** What CommonModule exports: the pool tokens, and never the holder behind them. */
export const dbProviderTokens = [TENANT_DB, REFERENCE_DB, ADMIN_DB];
