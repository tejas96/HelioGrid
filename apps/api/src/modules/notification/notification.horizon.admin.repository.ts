import { type Db, notification } from '@heliogrid/db';
import { Inject, Injectable } from '@nestjs/common';
import { inArray, lt } from 'drizzle-orm';
import { ADMIN_DB } from '../../common/db/admin.token';

/**
 * The centre's horizon, enforced on the rows themselves (`F6-19`): every company's notices
 * emitted before it are deleted, on the ADMIN pool — the path that crosses companies and owns the
 * table, since no grant lets `app_user` delete a notice. Nothing is lost: the inbox is an inbox, and
 * every fact lives on its record's timeline.
 */
@Injectable()
export class NotificationHorizonAdminRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(ADMIN_DB) private readonly db: Db) {}

  /** Deletes at most `limit` notices emitted before `horizon`, and answers how many went. */
  async purgeBefore(horizon: Date, limit: number): Promise<number> {
    const past = this.db
      .select({ id: notification.id })
      .from(notification)
      .where(lt(notification.emittedAt, horizon))
      .limit(limit);
    const purged = await this.db
      .delete(notification)
      .where(inArray(notification.id, past))
      .returning({ id: notification.id });
    return purged.length;
  }
}
