import { type Db, marketPack, marketPackVersion } from '@heliogrid/db';
import type { PackEnvelope } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { ADMIN_DB } from '../../common/db/admin.token';

/**
 * The ONE writer of the pack tables (`F1-12`). It rides the admin pool because the pack is
 * platform-authored reference data that no tenant role may write: `app_user` holds SELECT
 * only, and the owner role writes through here alone, from the publish command.
 */
@Injectable()
export class MarketPackAdminRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(ADMIN_DB) private readonly db: Db) {}

  /** Records one published revision: the market row if it is the market's first, then the version. */
  async publish(envelope: PackEnvelope): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx.insert(marketPack).values({ marketCode: envelope.market }).onConflictDoNothing();
      await tx.insert(marketPackVersion).values({
        marketCode: envelope.market,
        revision: envelope.revision,
        publishedAt: new Date(envelope.publishedAt),
        pack: envelope.pack,
      });
    });
  }
}
