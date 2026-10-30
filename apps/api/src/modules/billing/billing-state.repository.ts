import { subscription, type TenantPool } from '@heliogrid/db';
import type { SubscriptionClock } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import { TENANT_DB } from '../../common/db/tenant.token';

/**
 * The read the billing gate makes on a mutation whose row can pause: the company's newest
 * subscription row, by `subscription_tenant_created_idx`, on the tenant pool.
 */
@Injectable()
export class BillingStateRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  async clockOf(tenantId: string): Promise<SubscriptionClock | null> {
    const [row] = await this.db.withTenantTransaction(tenantId, (tx) =>
      tx
        .select({
          state: subscription.state,
          stateEnteredAt: subscription.stateEnteredAt,
          trialEndsAt: subscription.trialEndsAt,
          paidPeriodEnd: subscription.paidPeriodEnd,
        })
        .from(subscription)
        .where(eq(subscription.tenantId, tenantId))
        .orderBy(desc(subscription.createdAt))
        .limit(1),
    );
    if (row === undefined) return null;
    return {
      state: row.state,
      stateEnteredAt: row.stateEnteredAt.getTime(),
      trialEndsAt: row.trialEndsAt?.getTime() ?? null,
      paidPeriodEnd: row.paidPeriodEnd?.getTime() ?? null,
    };
  }
}
