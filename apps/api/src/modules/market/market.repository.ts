import { type Db, marketPackVersion } from '@heliogrid/db';
import type { PackEnvelope } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import { RUNTIME_DB } from '../../common/db/runtime.token';

/**
 * The tenant-side read of the pack tables. No tenant predicate, and that is correct: the pack
 * is readable global reference data — every tenant reads its market's pack and none owns it
 * (`F1-12`), which is why the runtime pool has SELECT here and nothing else.
 */
@Injectable()
export class MarketPackRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(RUNTIME_DB) private readonly db: Db) {}

  /**
   * The market's current revision, or null for a market with none. Ordered by the revision the
   * server assigned, never by `published_at`: that instant is the publishing machine's clock,
   * and a skewed clock must not make an older revision read as current. The primary key serves
   * this read; nothing sorts on the date here.
   */
  async currentEnvelope(marketCode: string): Promise<PackEnvelope | null> {
    const [row] = await this.db
      .select({
        market: marketPackVersion.marketCode,
        revision: marketPackVersion.revision,
        publishedAt: marketPackVersion.publishedAt,
        pack: marketPackVersion.pack,
      })
      .from(marketPackVersion)
      .where(eq(marketPackVersion.marketCode, marketCode))
      .orderBy(desc(marketPackVersion.revision))
      .limit(1);
    if (!row) return null;
    return { ...row, publishedAt: row.publishedAt.toISOString() };
  }
}
