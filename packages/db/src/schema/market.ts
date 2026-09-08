import type { PackEnvelope } from '@heliogrid/domain';
import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

/**
 * The market pack, stored (`T-FCORE-016`). Both tables are READABLE GLOBAL reference data: no
 * `tenant_id`, no RLS, SELECT for every member of `app_user` and no write privilege — the publish
 * command on the admin path is the only writer (`F1-12`). `GLOBAL_READABLE_TABLES` in the
 * tenancy scan holds that; this file mirrors the migration and is what the application
 * queries through.
 */

/** One market's configuration as a versioned unit (`F1-01`). The code is the whole identity. */
export const marketPack = pgTable(
  'market_pack',
  {
    /** ISO 3166-1 alpha-2, the `MarketCode` brand re-minted on read — never a label (`F1-09`). */
    marketCode: text('market_code').primaryKey(),
  },
  (table) => [check('market_pack_market_code_alpha2', sql`${table.marketCode} ~ '^[A-Z]{2}$'`)],
);

/**
 * One published, dated revision of a pack (`F1-11`). The pair `(market_code, revision)` IS the
 * identity an output pins, so no surrogate id doubles it. Everything else the pack says lives
 * in ONE payload column: the currency and the launch-gate facts derive from it, and a column
 * beside it would be a second home for one fact. A ninth key is therefore a data change, not a
 * migration. Rows are superseded, never deleted — a pinned version lives forever.
 */
export const marketPackVersion = pgTable(
  'market_pack_version',
  {
    marketCode: text('market_code')
      .notNull()
      .references(() => marketPack.marketCode),
    revision: integer('revision').notNull(),
    publishedAt: timestamp('published_at', { withTimezone: true, mode: 'date' }).notNull(),
    /** Typed as the ENVELOPE's payload, never as `MarketPack`: the whole is parsed in domain. */
    pack: jsonb('pack').$type<PackEnvelope['pack']>().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.marketCode, table.revision] }),
    /** The current-version read and the staleness comparison; the primary key serves pinned reads. */
    index('market_pack_version_current_idx').on(table.marketCode, table.publishedAt.desc()),
    check('market_pack_version_revision_positive', sql`${table.revision} >= 1`),
  ],
);
