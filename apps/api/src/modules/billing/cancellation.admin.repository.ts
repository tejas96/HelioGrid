import { type Db, subscription, subscriptionStateHistory, tenant } from '@heliogrid/db';
import type { BillingCycle, BillingState, CancellationReason, Tier } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { ADMIN_DB } from '../../common/db/admin.token';
import { recordAuditEntry } from '../audit/audit.public';

/** The row an Owner's billing act starts from: the company's latest subscription. */
export interface ActedOn {
  readonly subscriptionId: string;
  readonly state: BillingState;
  readonly tier: Tier | null;
  readonly cycle: BillingCycle | null;
  readonly gatewayRef: string | null;
  readonly paidPeriodEnd: number | null;
  readonly marketCode: string;
}

/** Who acted, and when. */
export interface OwnerAct {
  readonly actorUserId: string;
  readonly now: number;
}

/**
 * Cancellation's writes (`M12-50`). The subscription is written on the admin path, as every
 * billing move is (`app_user` holds SELECT alone); each statement still names the company.
 */
@Injectable()
export class CancellationAdminRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(ADMIN_DB) private readonly db: Db) {}

  /** The company's latest subscription, or `null` when it holds none. */
  async actedOn(tenantId: string): Promise<ActedOn | null> {
    const [row] = await this.db
      .select({
        subscriptionId: subscription.id,
        state: subscription.state,
        tier: subscription.tier,
        cycle: subscription.cycle,
        gatewayRef: subscription.gatewayRef,
        paidPeriodEnd: subscription.paidPeriodEnd,
        marketCode: tenant.marketCode,
      })
      .from(subscription)
      .innerJoin(tenant, eq(tenant.id, subscription.tenantId))
      .where(eq(subscription.tenantId, tenantId))
      .orderBy(desc(subscription.createdAt), desc(subscription.id))
      .limit(1);
    if (row === undefined) return null;
    return { ...row, paidPeriodEnd: row.paidPeriodEnd?.getTime() ?? null };
  }

  /**
   * Moves the row from `active` to `cancelled` with its reason, its history and its audit entry,
   * holding the row `FOR UPDATE`, as a charge does. Answers the paid period's end it runs to;
   * `null` when the row is no longer `active` — a second press, or a charge failure in between.
   */
  async cancel(
    tenantId: string,
    subscriptionId: string,
    reason: CancellationReason | null,
    act: OwnerAct,
  ): Promise<number | null> {
    return this.db.transaction(async (tx) => {
      const [held] = await tx
        .select({ state: subscription.state, paidPeriodEnd: subscription.paidPeriodEnd })
        .from(subscription)
        .where(and(eq(subscription.tenantId, tenantId), eq(subscription.id, subscriptionId)))
        .for('update');
      if (held?.state !== 'active' || held.paidPeriodEnd === null) return null;
      const at = new Date(act.now);
      await tx
        .update(subscription)
        .set({ state: 'cancelled', stateEnteredAt: at, cancellationReason: reason })
        .where(eq(subscription.id, subscriptionId));
      await tx.insert(subscriptionStateHistory).values({
        tenantId,
        subscriptionId,
        state: 'cancelled',
        cause: 'cancelled',
        enteredAt: at,
      });
      await recordAuditEntry(tx, {
        tenantId,
        eventType: 'billing.subscription_cancelled',
        actorKind: 'tenant_user',
        actorRef: act.actorUserId,
        occurredAt: at,
        blocked: false,
        subjectKind: 'subscription',
        subjectRef: subscriptionId,
        changePayload: null,
      });
      return held.paidPeriodEnd.getTime();
    });
  }
}
