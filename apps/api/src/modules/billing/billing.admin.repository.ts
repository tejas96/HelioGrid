import {
  type Db,
  type DbTransaction,
  subscription,
  subscriptionStateHistory,
  tenant,
} from '@heliogrid/db';
import {
  type BillingState,
  type Entitlement,
  type SubscriptionCause,
  type SubscriptionClock,
  trialEndsAtFor,
} from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, gte, isNull, lte, type SQL, sql } from 'drizzle-orm';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { ADMIN_DB } from '../../common/db/admin.token';
import { recomputeEntitlements } from './entitlement.admin.repository';

/** One subscription as the timers read it: who owns it, and what the clock needs. */
export interface TimedSubscription extends SubscriptionClock {
  readonly id: string;
  readonly tenantId: string;
}

/** One move of the machine: the state it leaves, the state it enters, why and from when. */
export interface SubscriptionMove {
  readonly from: BillingState;
  readonly to: BillingState;
  readonly cause: SubscriptionCause;
  readonly enteredAt: number;
}

/**
 * `M12-14`, `M12-52` — a company's trial, started in the transaction that creates it, so no
 * company is ever seen without a subscription, nor without the trial's limits (`M12-16`). No payment instrument and no gateway object: the
 * trial lives in the product alone until conversion.
 *
 * A company that already holds a live subscription keeps it: the one-live key turns a second start
 * into nothing, and the history row is written only for a trial this call started.
 */
export async function startTrial(
  tx: DbTransaction,
  input: {
    readonly tenantId: string;
    readonly now: number;
    /** The book's trial limits in the company's market. */
    readonly limits: readonly Entitlement[];
  },
): Promise<boolean> {
  const startedAt = new Date(input.now);
  const [started] = await tx
    .insert(subscription)
    .values({
      tenantId: input.tenantId,
      state: 'trialing',
      stateEnteredAt: startedAt,
      trialEndsAt: new Date(trialEndsAtFor(input.now)),
      createdAt: startedAt,
    })
    .onConflictDoNothing({
      target: subscription.tenantId,
      where: sql`${subscription.state} in ('trialing', 'active', 'past_due')`,
    })
    .returning({ id: subscription.id });
  if (!started) return false;
  await tx.insert(subscriptionStateHistory).values({
    tenantId: input.tenantId,
    subscriptionId: started.id,
    state: 'trialing',
    cause: 'trial_started',
    enteredAt: startedAt,
  });
  await recomputeEntitlements(tx, {
    tenantId: input.tenantId,
    subscriptionId: started.id,
    base: input.limits,
    now: input.now,
  });
  return true;
}

/**
 * The billing timers' reads and writes. They cross every company by nature, so they ride the admin
 * pool; each read is bounded and walks a partial index, oldest deadline first.
 */
@Injectable()
export class BillingAdminRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(ADMIN_DB) private readonly db: Db) {}

  /** Trials whose end has passed and that are still `trialing`. */
  async trialsEndedBy(now: number, limit: number): Promise<TimedSubscription[]> {
    const rows = await this.db
      .select(timedColumns())
      .from(subscription)
      .where(and(eq(subscription.state, 'trialing'), lte(subscription.trialEndsAt, new Date(now))))
      .orderBy(asc(subscription.trialEndsAt), asc(subscription.id))
      .limit(limit);
    return rows.map(toTimed);
  }

  /** `past_due` subscriptions that entered it at or before this moment. */
  async pastDueSince(enteredBy: number, limit: number): Promise<TimedSubscription[]> {
    const rows = await this.db
      .select(timedColumns())
      .from(subscription)
      .where(
        and(
          eq(subscription.state, 'past_due'),
          lte(subscription.stateEnteredAt, new Date(enteredBy)),
        ),
      )
      .orderBy(asc(subscription.stateEnteredAt), asc(subscription.id))
      .limit(limit);
    return rows.map(toTimed);
  }

  /**
   * Moves one subscription, and records it, only if it still stands where it was read — the same
   * state, entered at the same moment, with the same trial end: a retried step or two overlapping runs move a row once, and
   * a row that left and came back to the state since the read (paid, then failed again) is left to
   * its new deadline.
   */
  async move(row: TimedSubscription, move: SubscriptionMove): Promise<boolean> {
    return this.db.transaction(async (tx) => {
      const enteredAt = new Date(move.enteredAt);
      const [moved] = await tx
        .update(subscription)
        .set({ state: move.to, stateEnteredAt: enteredAt })
        .where(
          and(
            eq(subscription.id, row.id),
            eq(subscription.state, move.from),
            sameMoment(subscription.stateEnteredAt, row.stateEnteredAt),
            // A trial support extended since the read keeps its new end (`M12-52`).
            row.trialEndsAt === null
              ? isNull(subscription.trialEndsAt)
              : sameMoment(subscription.trialEndsAt, row.trialEndsAt),
          ),
        )
        .returning({ id: subscription.id });
      if (!moved) return false;
      await tx.insert(subscriptionStateHistory).values({
        tenantId: row.tenantId,
        subscriptionId: row.id,
        state: move.to,
        cause: move.cause,
        enteredAt,
      });
      return true;
    });
  }

  /**
   * Companies created since this moment that hold no subscription at all — signed up by an older
   * api while a release rolled. Bounded on both sides by the creation index.
   */
  async companiesWithoutSubscription(
    createdSince: number,
    now: number,
    limit: number,
  ): Promise<{ tenantId: string; marketCode: string }[]> {
    return this.db
      .select({ tenantId: tenant.id, marketCode: tenant.marketCode })
      .from(tenant)
      .leftJoin(subscription, eq(subscription.tenantId, tenant.id))
      .where(
        and(
          gte(tenant.createdAt, new Date(createdSince)),
          lte(tenant.createdAt, new Date(now)),
          isNull(subscription.id),
        ),
      )
      .orderBy(asc(tenant.createdAt), asc(tenant.id))
      .limit(limit);
  }

  async startTrialFor(
    tenantId: string,
    now: number,
    limits: readonly Entitlement[],
  ): Promise<boolean> {
    return this.db.transaction((tx) => startTrial(tx, { tenantId, now, limits }));
  }
}

/**
 * A stored moment equal to one read back. Compared to the millisecond: a JS Date holds no more,
 * and a row written by SQL's `now()` (migration 0034's trials) carries microseconds, so an exact
 * match would never move it.
 */
function sameMoment(column: AnyPgColumn, at: number): SQL {
  return sql`date_trunc('milliseconds', ${column}) = ${new Date(at).toISOString()}::timestamptz`;
}

function timedColumns() {
  return {
    id: subscription.id,
    tenantId: subscription.tenantId,
    state: subscription.state,
    stateEnteredAt: subscription.stateEnteredAt,
    trialEndsAt: subscription.trialEndsAt,
    paidPeriodEnd: subscription.paidPeriodEnd,
  };
}

function toTimed(row: {
  id: string;
  tenantId: string;
  state: BillingState;
  stateEnteredAt: Date;
  trialEndsAt: Date | null;
  paidPeriodEnd: Date | null;
}): TimedSubscription {
  return {
    id: row.id,
    tenantId: row.tenantId,
    state: row.state,
    stateEnteredAt: row.stateEnteredAt.getTime(),
    trialEndsAt: row.trialEndsAt?.getTime() ?? null,
    paidPeriodEnd: row.paidPeriodEnd?.getTime() ?? null,
  };
}
