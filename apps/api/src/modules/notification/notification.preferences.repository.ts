import { notificationPreference, type TenantPool } from '@heliogrid/db';
import type { NotificationTypeGroup } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { TENANT_DB } from '../../common/db/tenant.token';

/** One stored mute, exactly as the table holds it. The RULE that reads it lives in the service. */
export interface StoredPreference {
  readonly group: NotificationTypeGroup;
  readonly pushMuted: boolean;
}

/**
 * A person's own push mutes, inside their own company (`F6-15`).
 *
 * The runtime pool under the table's policy, with BOTH predicates in the query as well — tenancy
 * is defence in depth, and the user predicate is what makes "own" mean own rather than the
 * company's. A person with no rows has muted nothing, which is the default and needs no writing.
 */
@Injectable()
export class NotificationPreferencesRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  async mutedGroups(tenantId: string, userRef: string): Promise<StoredPreference[]> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const rows = await tx
        .select({
          group: notificationPreference.typeGroup,
          pushMuted: notificationPreference.pushMuted,
        })
        .from(notificationPreference)
        .where(
          and(
            eq(notificationPreference.tenantId, tenantId),
            eq(notificationPreference.userRef, userRef),
          ),
        );
      return rows;
    });
  }

  /**
   * Writes one group's setting, over the unique key that makes a person's row per group the only
   * one there can be. An upsert rather than a read-then-write: two devices switching the same
   * group at once settle on one row instead of racing to insert two.
   */
  async setMuted(
    tenantId: string,
    userRef: string,
    group: NotificationTypeGroup,
    pushMuted: boolean,
  ): Promise<void> {
    await this.db.withTenantTransaction(tenantId, async (tx) => {
      await tx
        .insert(notificationPreference)
        .values({ tenantId, userRef, typeGroup: group, pushMuted })
        .onConflictDoUpdate({
          target: [
            notificationPreference.tenantId,
            notificationPreference.userRef,
            notificationPreference.typeGroup,
          ],
          set: { pushMuted },
        });
    });
  }
}
