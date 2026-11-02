import { type Db, planPrice, subscriptionPlanChange, tenant } from '@heliogrid/db';
import {
  type BillingCycle,
  type CollectionKind,
  LIVE_BILLING_STATES,
  type Tier,
  type UiLanguage,
} from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, lte } from 'drizzle-orm';
import { ADMIN_DB } from '../../common/db/admin.token';
import {
  activeOwnersOf,
  type NoticeWords,
  recordNotificationsTo,
  type TenantQuietHours,
} from '../notification/notification.public';
import { lockSubscription } from './charge-standing.admin.repository';
import type { LimitsFor } from './entitlement.admin.repository';
import { movePlan, settleScheduled } from './plan-move.admin.repository';

/** A scheduled change whose paid period has ended (`M12-49`, `M12-12`). */
export interface DueChange {
  readonly id: string;
  readonly tenantId: string;
  readonly subscriptionId: string;
  readonly marketCode: string;
  readonly timezone: string;
  readonly toPlanPriceId: string;
  readonly tier: Tier;
  readonly cycle: BillingCycle;
  readonly toCollection: CollectionKind;
  readonly previewDigest: string;
  readonly scheduledBy: string;
}

/** The Owner's notice that the picture under a confirmed change moved (`M12-49`). */
export interface PictureMoved {
  readonly wordsIn: (language: UiLanguage) => NoticeWords;
  readonly quietHours: TenantQuietHours;
}

const LIVE: ReadonlySet<string> = new Set(LIVE_BILLING_STATES);

/**
 * The billing timers' half of a scheduled change, across every company, so on the admin pool:
 * the changes fallen due, and each one applied in one transaction under its row's lock.
 */
@Injectable()
export class PlanChangeBoundaryAdminRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(ADMIN_DB) private readonly db: Db) {}

  /** Changes due by `now`, oldest first, on `subscription_plan_change_due_idx`. */
  async due(now: number, limit: number): Promise<DueChange[]> {
    const rows = await this.db
      .select({
        id: subscriptionPlanChange.id,
        tenantId: subscriptionPlanChange.tenantId,
        subscriptionId: subscriptionPlanChange.subscriptionId,
        marketCode: tenant.marketCode,
        timezone: tenant.timezone,
        toPlanPriceId: subscriptionPlanChange.toPlanPriceId,
        tier: planPrice.tier,
        cycle: planPrice.cycle,
        toCollection: subscriptionPlanChange.toCollection,
        previewDigest: subscriptionPlanChange.previewDigest,
        scheduledBy: subscriptionPlanChange.scheduledBy,
      })
      .from(subscriptionPlanChange)
      .innerJoin(tenant, eq(tenant.id, subscriptionPlanChange.tenantId))
      .innerJoin(planPrice, eq(planPrice.id, subscriptionPlanChange.toPlanPriceId))
      .where(
        and(
          eq(subscriptionPlanChange.status, 'scheduled'),
          lte(subscriptionPlanChange.effectiveAt, new Date(now)),
        ),
      )
      .orderBy(asc(subscriptionPlanChange.effectiveAt), asc(subscriptionPlanChange.id))
      .limit(limit);
    return rows;
  }

  /**
   * Moves the row onto the scheduled plan and marks the change `applied`; a row no longer live
   * moves nothing, and its change is withdrawn. With `moved`, the Owners are told in the same
   * transaction. `null` when another run settled it first.
   */
  async apply(
    change: DueChange,
    on: {
      readonly limitsFor: LimitsFor;
      readonly now: number;
      readonly moved: PictureMoved | null;
    },
  ): Promise<{ readonly applied: boolean } | null> {
    return this.db.transaction(async (tx) => {
      const held = await lockSubscription(tx, change.subscriptionId);
      const [still] = await tx
        .select({ id: subscriptionPlanChange.id })
        .from(subscriptionPlanChange)
        .where(
          and(
            eq(subscriptionPlanChange.tenantId, change.tenantId),
            eq(subscriptionPlanChange.id, change.id),
            eq(subscriptionPlanChange.status, 'scheduled'),
          ),
        );
      if (held === null || still === undefined) return null;
      if (!LIVE.has(held.state) || held.replaced) {
        await settleScheduled(tx, held, 'withdrawn', on.now);
        return { applied: false };
      }
      await movePlan(
        tx,
        held,
        {
          tier: change.tier,
          cycle: change.cycle,
          planPriceId: change.toPlanPriceId,
          collection: change.toCollection,
        },
        {
          limitsFor: on.limitsFor,
          actorUserId: change.scheduledBy,
          now: on.now,
          applying: change.id,
        },
      );
      await settleScheduled(tx, held, 'applied', on.now);
      if (on.moved !== null) {
        await recordNotificationsTo(
          tx,
          await activeOwnersOf(tx, change.tenantId),
          {
            tenantId: change.tenantId,
            type: 'system',
            subjectKind: 'subscription',
            subjectRef: held.id,
            emittedAt: new Date(on.now),
          },
          on.moved.wordsIn,
          on.moved.quietHours,
        );
      }
      return { applied: true };
    });
  }
}
