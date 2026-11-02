import {
  type Db,
  type DbTransaction,
  subscription,
  subscriptionPlanChange,
  tenant,
} from '@heliogrid/db';
import type {
  BillingCycle,
  BillingState,
  CollectionKind,
  ScheduledPlanChange,
  Tier,
} from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { ADMIN_DB } from '../../common/db/admin.token';
import { recordAuditEntry } from '../audit/audit.public';
import { type LockedSubscription, lockSubscription } from './charge-standing.admin.repository';
import type { LimitsFor } from './entitlement.admin.repository';
import {
  mandateToEnd,
  markMandateEnding,
  movePlan,
  type PlanMove,
  settleScheduled,
} from './plan-move.admin.repository';

/** A company's latest subscription as the plan screen's acts read it. */
export interface PlanStanding {
  readonly subscriptionId: string;
  readonly state: BillingState;
  readonly trialEndsAt: number | null;
  readonly paidPeriodEnd: number | null;
  readonly tier: Tier | null;
  readonly cycle: BillingCycle | null;
  readonly planPriceId: string | null;
  readonly marketCode: string;
  readonly currencyCode: string;
}

/** A change waiting for the paid period's end (`M12-49`, `M12-12`). */
export interface ScheduledChange {
  readonly id: string;
  readonly kind: ScheduledPlanChange;
  readonly toPlanPriceId: string;
  readonly toCollection: CollectionKind;
  readonly effectiveAt: number;
  readonly previewDigest: string;
}

/** What an act confirmed: the row on the plan it previewed, at the period end it previewed. */
interface Confirmed {
  readonly tenantId: string;
  readonly subscriptionId: string;
  readonly fromPlanPriceId: string | null;
  readonly paidPeriodEnd: number;
  readonly actorUserId: string;
  readonly now: number;
  /** Asks the gateway to stop the row's mandate at its cycle's end; throws when it did not answer. */
  readonly endMandate: (gatewayRef: string) => Promise<void>;
}

/**
 * The plan screen's acts (`SCR-M12-03`). `app_user` holds SELECT alone on the change table and
 * the timers write it across companies, so every write is on the admin path, and every read here
 * carries the company's own predicate. Each act holds the subscription row `FOR UPDATE`, so two
 * presses, a charge and the timers find it where the one before left it. A row that moved since
 * its preview answers `moved` and nothing is written.
 */
@Injectable()
export class PlanChangeAdminRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(ADMIN_DB) private readonly db: Db) {}

  /** The company's latest subscription — its one live row, else its newest dead one (`M12-04`). */
  async standingOf(tenantId: string): Promise<PlanStanding | null> {
    const [row] = await this.db
      .select({
        subscriptionId: subscription.id,
        state: subscription.state,
        trialEndsAt: subscription.trialEndsAt,
        paidPeriodEnd: subscription.paidPeriodEnd,
        tier: subscription.tier,
        cycle: subscription.cycle,
        planPriceId: subscription.planPriceId,
        marketCode: tenant.marketCode,
        currencyCode: tenant.currencyCode,
      })
      .from(subscription)
      .innerJoin(tenant, eq(tenant.id, subscription.tenantId))
      .where(eq(subscription.tenantId, tenantId))
      .orderBy(desc(subscription.createdAt), desc(subscription.id))
      .limit(1);
    if (row === undefined) return null;
    return {
      ...row,
      trialEndsAt: row.trialEndsAt?.getTime() ?? null,
      paidPeriodEnd: row.paidPeriodEnd?.getTime() ?? null,
    };
  }

  async scheduledOf(tenantId: string, subscriptionId: string): Promise<ScheduledChange | null> {
    const [row] = await this.db
      .select({
        id: subscriptionPlanChange.id,
        kind: subscriptionPlanChange.kind,
        toPlanPriceId: subscriptionPlanChange.toPlanPriceId,
        toCollection: subscriptionPlanChange.toCollection,
        effectiveAt: subscriptionPlanChange.effectiveAt,
        previewDigest: subscriptionPlanChange.previewDigest,
      })
      .from(subscriptionPlanChange)
      .where(
        and(
          eq(subscriptionPlanChange.tenantId, tenantId),
          eq(subscriptionPlanChange.subscriptionId, subscriptionId),
          eq(subscriptionPlanChange.status, 'scheduled'),
        ),
      )
      .limit(1);
    return row === undefined ? null : { ...row, effectiveAt: row.effectiveAt.getTime() };
  }

  /**
   * A downgrade or a cycle switch, scheduled for the paid period's end (`M12-49`, `M12-12`). The
   * same pick on the same preview again writes nothing; another replaces the one scheduled. A
   * mandate is told to end at its cycle inside the transaction, so a gateway that did not answer
   * schedules nothing, and the mark keeps it from being told twice (`M12-57`).
   */
  async schedule(
    confirmed: Confirmed,
    change: Omit<ScheduledChange, 'id' | 'effectiveAt'>,
  ): Promise<'scheduled' | 'moved'> {
    return this.db.transaction(async (tx) => {
      const held = await lockSubscription(tx, confirmed.subscriptionId);
      if (held === null || !stillAsPreviewed(held, confirmed)) return 'moved';
      const [same] = await tx
        .select({ id: subscriptionPlanChange.id })
        .from(subscriptionPlanChange)
        .where(
          and(
            eq(subscriptionPlanChange.tenantId, held.tenantId),
            eq(subscriptionPlanChange.subscriptionId, held.id),
            eq(subscriptionPlanChange.status, 'scheduled'),
            eq(subscriptionPlanChange.toPlanPriceId, change.toPlanPriceId),
            eq(subscriptionPlanChange.previewDigest, change.previewDigest),
          ),
        )
        .limit(1);
      if (same !== undefined) return 'scheduled';
      const at = new Date(confirmed.now);
      await settleScheduled(tx, held, 'replaced', confirmed.now);
      await tx.insert(subscriptionPlanChange).values({
        tenantId: held.tenantId,
        subscriptionId: held.id,
        ...change,
        effectiveAt: new Date(confirmed.paidPeriodEnd),
        status: 'scheduled',
        scheduledBy: confirmed.actorUserId,
        createdAt: at,
      });
      await recordAuditEntry(tx, ownerAct('billing.plan_change_scheduled', held, confirmed));
      await this.endMandateOf(tx, held, confirmed);
      return 'scheduled';
    });
  }

  /** An upgrade that owes nothing today moves the row at once (`M12-48`). */
  async applyNow(
    confirmed: Confirmed,
    to: PlanMove,
    limitsFor: LimitsFor,
  ): Promise<'applied' | 'moved'> {
    return this.db.transaction(async (tx) => {
      const held = await lockSubscription(tx, confirmed.subscriptionId);
      if (held === null || !stillAsPreviewed(held, confirmed)) return 'moved';
      await movePlan(tx, held, to, {
        limitsFor,
        actorUserId: confirmed.actorUserId,
        now: confirmed.now,
      });
      await this.endMandateOf(tx, held, confirmed);
      return 'applied';
    });
  }

  /** `Keep <plan> instead` (`M12-49`): `false` when nothing was scheduled. */
  async withdraw(
    tenantId: string,
    subscriptionId: string,
    act: { readonly actorUserId: string; readonly now: number },
  ): Promise<boolean> {
    return this.db.transaction(async (tx) => {
      const held = await lockSubscription(tx, subscriptionId);
      if (held === null || held.tenantId !== tenantId) return false;
      const withdrawn = await settleScheduled(tx, held, 'withdrawn', act.now);
      if (withdrawn === null) return false;
      await recordAuditEntry(tx, ownerAct('billing.plan_change_withdrawn', held, { ...act }));
      return true;
    });
  }

  private async endMandateOf(
    tx: DbTransaction,
    held: LockedSubscription,
    confirmed: Confirmed,
  ): Promise<void> {
    const mandate = mandateToEnd(held);
    if (mandate === null) return;
    await markMandateEnding(tx, held.id, confirmed.now);
    await confirmed.endMandate(mandate);
  }
}

function stillAsPreviewed(held: LockedSubscription, confirmed: Confirmed): boolean {
  return (
    held.tenantId === confirmed.tenantId &&
    held.state === 'active' &&
    held.planPriceId === confirmed.fromPlanPriceId &&
    held.paidPeriodEnd === confirmed.paidPeriodEnd
  );
}

function ownerAct(
  eventType: 'billing.plan_change_scheduled' | 'billing.plan_change_withdrawn',
  held: { readonly id: string; readonly tenantId: string },
  act: { readonly actorUserId: string; readonly now: number },
) {
  return {
    tenantId: held.tenantId,
    eventType,
    actorKind: 'tenant_user' as const,
    actorRef: act.actorUserId,
    occurredAt: new Date(act.now),
    blocked: false,
    subjectKind: 'subscription' as const,
    subjectRef: held.id,
    changePayload: null,
  };
}
