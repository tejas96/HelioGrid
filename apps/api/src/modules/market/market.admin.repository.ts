import { type Db, marketPack, marketPackVersion } from '@heliogrid/db';
import type { PackEnvelope } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { desc, eq, sql } from 'drizzle-orm';
import { ADMIN_DB } from '../../common/db/admin.token';

/**
 * See `publishNext`. Fixed forever: a changed key excludes nobody running the old one.
 *
 * It must fit INT4. The two-key form of `pg_advisory_xact_lock` takes two `int4`, not the one
 * `bigint` the single-key form takes — `packages/db`'s migrate runner uses the latter, and
 * copying its key straight across overflowed and the lock call failed outright.
 */
const PUBLISH_LOCK_KEY = 827_012_502;

/**
 * The ONE writer of the pack tables (`F1-12`). It rides the admin pool because the pack is
 * platform-authored reference data that no tenant role may write: `app_user` holds SELECT
 * only, and the owner role writes through here alone, from the publish command.
 */
@Injectable()
export class MarketPackAdminRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(ADMIN_DB) private readonly db: Db) {}

  /**
   * Serialises publishers, so the READ that chooses the next revision and the INSERT that takes
   * it cannot be split by another. The lock has to span BOTH: two publishers otherwise read the
   * same current revision before either writes, compute the same next one, and the loser dies on
   * `market_pack_version`'s primary key instead of seeing that the winner had already published.
   * Locking only the write would leave the race exactly where it was.
   *
   * `pg_advisory_xact_lock` rather than the session-scoped pair `packages/db`'s migrate runner
   * takes: this one is already inside a transaction, so the commit or the rollback releases it
   * and no `finally` can leak it. Keyed per MARKET, so publishing India never waits on another.
   * Arbitrary but FIXED — changing the key silently stops excluding anyone running the old value,
   * exactly as the runner's own key says of its own.
   *
   * `decide` is passed IN because choosing the next revision is `packages/domain`'s and this is
   * a repository: it orders the reads and the write around a decision it does not make.
   */
  async publishNext(
    market: string,
    decide: (current: PackEnvelope | null) => PackEnvelope | null,
  ): Promise<{ current: PackEnvelope | null; written: PackEnvelope | null }> {
    return this.db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(${PUBLISH_LOCK_KEY}::int4, hashtext(${market}))`,
      );
      const [row] = await tx
        .select({
          market: marketPackVersion.marketCode,
          revision: marketPackVersion.revision,
          publishedAt: marketPackVersion.publishedAt,
          pack: marketPackVersion.pack,
        })
        .from(marketPackVersion)
        .where(eq(marketPackVersion.marketCode, market))
        .orderBy(desc(marketPackVersion.revision))
        .limit(1);
      const current: PackEnvelope | null = row
        ? { ...row, publishedAt: row.publishedAt.toISOString() }
        : null;

      const written = decide(current);
      if (written === null) return { current, written };

      await tx.insert(marketPack).values({ marketCode: written.market }).onConflictDoNothing();
      await tx.insert(marketPackVersion).values({
        marketCode: written.market,
        revision: written.revision,
        publishedAt: new Date(written.publishedAt),
        pack: written.pack,
      });
      return { current, written };
    });
  }
}
