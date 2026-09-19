import { notificationSettings, type TenantPool } from '@heliogrid/db';
import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { TENANT_DB } from '../../common/db/tenant.token';

/** The window as the table holds it — `HH:MM:SS`, or null where no row exists. */
export interface StoredQuietHours {
  readonly start: string | null;
  readonly end: string | null;
}

/**
 * The company's own quiet window (`F6-14`).
 *
 * No row is the MARKET's default, resolved by the service from the pack — so a company that has
 * never set a window stores nothing, and no number is written here.
 */
@Injectable()
export class QuietHoursRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  async read(tenantId: string): Promise<StoredQuietHours> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const [row] = await tx
        .select({
          start: notificationSettings.quietHoursStart,
          end: notificationSettings.quietHoursEnd,
        })
        .from(notificationSettings)
        .where(eq(notificationSettings.tenantId, tenantId));
      return row ?? { start: null, end: null };
    });
  }

  /** An upsert over the one row per company: two devices setting it at once settle on one. */
  async save(tenantId: string, window: { start: string; end: string }): Promise<StoredQuietHours> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const values = { quietHoursStart: window.start, quietHoursEnd: window.end };
      const [row] = await tx
        .insert(notificationSettings)
        .values({ tenantId, ...values })
        .onConflictDoUpdate({ target: notificationSettings.tenantId, set: values })
        .returning({
          start: notificationSettings.quietHoursStart,
          end: notificationSettings.quietHoursEnd,
        });
      return row ?? { start: null, end: null };
    });
  }
}
