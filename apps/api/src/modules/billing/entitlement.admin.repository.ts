import {
  type Db,
  type DbTransaction,
  entitlement,
  entitlementOverride,
  subscription,
  tenant,
} from '@heliogrid/db';
import {
  type Entitlement,
  type EntitlementKey,
  type EntitlementSource,
  LIVE_BILLING_STATES,
  storedLimit,
  type Tier,
  withCredits,
} from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import { ADMIN_DB } from '../../common/db/admin.token';

/** The book's limits for a tier, or for the trial (`null`), in the company's market. */
export type LimitsFor = (tier: Tier | null) => Entitlement[];

/**
 * `M12-16` — a company's limits rewritten on the caller's transaction: the book's limits for its
 * tier, with every goodwill credit issued on this subscription added (`M12-19`). The caller holds
 * the subscription row, so two recomputes never interleave.
 */
export async function recomputeEntitlements(
  tx: DbTransaction,
  input: {
    readonly tenantId: string;
    readonly subscriptionId: string;
    readonly base: readonly Entitlement[];
    readonly now: number;
  },
): Promise<void> {
  const credits = await tx
    .select({ key: entitlementOverride.entitlementKey, amount: entitlementOverride.credit })
    .from(entitlementOverride)
    .where(
      and(
        eq(entitlementOverride.tenantId, input.tenantId),
        eq(entitlementOverride.subscriptionId, input.subscriptionId),
        eq(entitlementOverride.kind, 'goodwill_credit'),
      ),
    );
  const limits = withCredits(
    input.base,
    credits.map((credit) => ({
      // The table's check makes both set on every goodwill credit.
      key: credit.key as EntitlementKey,
      amount: credit.amount ?? 0,
    })),
  );
  const recomputedAt = new Date(input.now);
  await tx
    .insert(entitlement)
    .values(
      limits.map((one) => {
        const stored = storedLimit(one.limit);
        return {
          tenantId: input.tenantId,
          entitlementKey: one.key,
          limitKind: stored.kind,
          limitValue: stored.value,
          source: one.source,
          recomputedAt,
        };
      }),
    )
    .onConflictDoUpdate({
      target: [entitlement.tenantId, entitlement.entitlementKey],
      set: {
        limitKind: sql`excluded.limit_kind`,
        limitValue: sql`excluded.limit_value`,
        source: sql`excluded.source`,
        recomputedAt: sql`excluded.recomputed_at`,
      },
    });
}

/**
 * The timers' repair, which crosses tenants: each row is read again under its subscription's
 * `FOR UPDATE` lock, as the charge holds it, before it is recomputed.
 */
@Injectable()
export class EntitlementAdminRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(ADMIN_DB) private readonly db: Db) {}

  /**
   * Live subscriptions whose limits were never written (a company made before this release, or
   * signed up by an older api while it rolled), or that still hold the trial's after conversion.
   * Walks the live partial index — one row per company — and stops at `limit`.
   */
  async needingRecompute(limit: number): Promise<{ subscriptionId: string; marketCode: string }[]> {
    return this.db
      .select({ subscriptionId: subscription.id, marketCode: tenant.marketCode })
      .from(subscription)
      .innerJoin(tenant, eq(tenant.id, subscription.tenantId))
      .where(
        and(
          inArray(subscription.state, [...LIVE_BILLING_STATES]),
          sql`(not exists (select 1 from ${entitlement} where ${entitlement.tenantId} = ${subscription.tenantId})
            or (${subscription.tier} is not null and exists (select 1 from ${entitlement}
              where ${entitlement.tenantId} = ${subscription.tenantId} and ${entitlement.source} = 'trial')))`,
        ),
      )
      .orderBy(asc(subscription.id))
      .limit(limit);
  }

  /** The repair of one row, read again under its lock. `false`: nothing was left to do. */
  async recompute(subscriptionId: string, limitsFor: LimitsFor, now: number): Promise<boolean> {
    return this.db.transaction(async (tx) => {
      const [held] = await tx
        .select({ id: subscription.id, tenantId: subscription.tenantId, tier: subscription.tier })
        .from(subscription)
        .where(
          and(
            eq(subscription.id, subscriptionId),
            inArray(subscription.state, [...LIVE_BILLING_STATES]),
          ),
        )
        .for('update');
      if (held === undefined) return false;
      const stale =
        !(await holdsLimits(tx, held.tenantId, null)) ||
        (held.tier !== null && (await holdsLimits(tx, held.tenantId, 'trial')));
      if (!stale) return false;
      await recomputeEntitlements(tx, {
        tenantId: held.tenantId,
        subscriptionId: held.id,
        base: limitsFor(held.tier),
        now,
      });
      return true;
    });
  }

  /** The market a company's book is read in, or `null` for no such company. */
  async marketOf(tenantId: string): Promise<string | null> {
    const [row] = await this.db
      .select({ marketCode: tenant.marketCode })
      .from(tenant)
      .where(eq(tenant.id, tenantId))
      .limit(1);
    return row?.marketCode ?? null;
  }
}

/** Whether the company holds any limit — of this source, when one is named. */
async function holdsLimits(
  tx: DbTransaction,
  tenantId: string,
  source: EntitlementSource | null,
): Promise<boolean> {
  const [any] = await tx
    .select({ key: entitlement.entitlementKey })
    .from(entitlement)
    .where(
      and(
        eq(entitlement.tenantId, tenantId),
        source === null ? undefined : eq(entitlement.source, source),
      ),
    )
    .limit(1);
  return any !== undefined;
}
