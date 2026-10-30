import type { AddedToNextCharge } from '@heliogrid/contracts';
import {
  billingCheckout,
  type Db,
  type DbTransaction,
  overageAddOn,
  planPrice,
  subscription,
  subscriptionPayment,
  tenant,
} from '@heliogrid/db';
import {
  type AddOnVerdict,
  type BilledLedgerMeter,
  type BillingCycle,
  type MinorUnits,
  MS_PER_DAY,
  minorUnits,
  OVERAGE_REACH_DAYS,
  OVERAGE_SETTLE_DAYS,
  type OverageAddOn,
  type Tier,
} from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, gt, inArray, isNull, lte, sql } from 'drizzle-orm';
import { ADMIN_DB } from '../../common/db/admin.token';
import { atNoGateway } from './overage-invoicing.admin.repository';

/** One closed mandate period waiting to be reckoned: the payment that paid for it, and its span. */
export interface PeriodDue {
  readonly paymentId: string;
  readonly tenantId: string;
  readonly subscriptionId: string;
  readonly marketCode: string;
  readonly from: Date;
  readonly to: Date;
}

/** One reckoned add-on waiting for its mandate, with what the cap is judged by. */
export interface AddOnWaiting {
  readonly id: string;
  readonly subscriptionId: string;
  readonly meter: BilledLedgerMeter;
  readonly amount: MinorUnits;
  readonly marketCode: string;
  readonly currencyCode: string;
  readonly tier: Tier;
  readonly cycle: BillingCycle;
  readonly gatewayRef: string;
  /** What the gateway collects for the plan on each debit. */
  readonly planAmount: MinorUnits;
  /** When a run last left it `pending`; `null` until then. */
  readonly triedAt: Date | null;
}

/**
 * The overage sweep's reads and writes (`M12-35`), across every company, so on the admin pool. A
 * period is the stretch between two distinct `pays_through` ends of one subscription; a mandate
 * period is one whose subscription's checkout opened a mandate.
 */
@Injectable()
export class OverageAdminRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(ADMIN_DB) private readonly db: Db) {}

  /**
   * Mandate periods closed and settled, still in reach, not yet reckoned — oldest first, on
   * `subscription_payment_overage_due_idx`. A period starts at the latest earlier end, or at its
   * payment for the subscription's first.
   */
  async periodsDue(now: number, limit: number): Promise<PeriodDue[]> {
    const earlier = sql<Date | null>`(
      select max(earlier.pays_through) from subscription_payment earlier
      where earlier.tenant_id = ${subscriptionPayment.tenantId}
        and earlier.subscription_id = ${subscriptionPayment.subscriptionId}
        and earlier.pays_through < ${subscriptionPayment.paysThrough})`.mapWith(
      subscriptionPayment.paysThrough,
    );
    const rows = await this.db
      .select({
        paymentId: subscriptionPayment.id,
        tenantId: subscriptionPayment.tenantId,
        subscriptionId: subscriptionPayment.subscriptionId,
        marketCode: tenant.marketCode,
        occurredAt: subscriptionPayment.occurredAt,
        to: subscriptionPayment.paysThrough,
        earlier,
      })
      .from(subscriptionPayment)
      .innerJoin(subscription, eq(subscription.id, subscriptionPayment.subscriptionId))
      .innerJoin(tenant, eq(tenant.id, subscriptionPayment.tenantId))
      .innerJoin(billingCheckout, eq(billingCheckout.gatewayRef, subscription.gatewayRef))
      .where(
        and(
          isNull(subscriptionPayment.overageReckonedAt),
          lte(subscriptionPayment.paysThrough, new Date(now - OVERAGE_SETTLE_DAYS * MS_PER_DAY)),
          gt(subscriptionPayment.paysThrough, new Date(now - OVERAGE_REACH_DAYS * MS_PER_DAY)),
          eq(billingCheckout.collection, 'mandate'),
        ),
      )
      .orderBy(asc(subscriptionPayment.paysThrough), asc(subscriptionPayment.id))
      .limit(limit);
    return rows.map(({ occurredAt, earlier: start, ...period }) => ({
      ...period,
      from: start ?? occurredAt,
    }));
  }

  /**
   * Marks the period reckoned and writes its add-ons, in one transaction. A period another run
   * reckoned first writes nothing; an add-on for a period already billed (a second payment for
   * the same span) is dropped by `overage_addon_period_key`. Answers the add-ons written.
   */
  async reckon(period: PeriodDue, addOns: readonly OverageAddOn[], at: number): Promise<number> {
    return this.db.transaction(async (tx) => {
      const [marked] = await tx
        .update(subscriptionPayment)
        .set({ overageReckonedAt: new Date(at) })
        .where(
          and(
            eq(subscriptionPayment.id, period.paymentId),
            isNull(subscriptionPayment.overageReckonedAt),
          ),
        )
        .returning({ id: subscriptionPayment.id });
      if (marked === undefined || addOns.length === 0) return 0;
      const written = await tx
        .insert(overageAddOn)
        .values(
          addOns.map((addOn) => ({
            tenantId: period.tenantId,
            subscriptionId: period.subscriptionId,
            paymentId: period.paymentId,
            meter: addOn.meter,
            windowFrom: period.from,
            windowTo: period.to,
            used: addOn.used,
            allowance: addOn.allowance,
            quantity: addOn.quantity,
            unitRateMinor: addOn.rate,
            amountMinor: addOn.amount,
            status: 'pending' as const,
            reckonedAt: new Date(at),
          })),
        )
        .onConflictDoNothing()
        .returning({ id: overageAddOn.id });
      return written.length;
    });
  }

  /**
   * Add-ons an `active` mandate can take now: its next debit is at least `leadMs` away, so the
   * gateway has them before it raises it. A subscription now collected by payment link holds its
   * add-ons for that link (part c). Rows never tried come first, then the longest untried: a row
   * that keeps waiting or being refused never holds the batch from another company's. Oldest first, on `overage_addon_pending_idx`; within a
   * period in the ledger's meter order, so the cap is judged the same way every run.
   */
  async waiting(now: number, leadMs: number, limit: number): Promise<AddOnWaiting[]> {
    const rows = await this.db
      .select({
        id: overageAddOn.id,
        subscriptionId: overageAddOn.subscriptionId,
        meter: overageAddOn.meter,
        amount: overageAddOn.amountMinor,
        marketCode: tenant.marketCode,
        currencyCode: tenant.currencyCode,
        tier: subscription.tier,
        cycle: subscription.cycle,
        gatewayRef: subscription.gatewayRef,
        planAmount: planPrice.collectedMinor,
        triedAt: overageAddOn.triedAt,
      })
      .from(overageAddOn)
      .innerJoin(subscription, eq(subscription.id, overageAddOn.subscriptionId))
      .innerJoin(tenant, eq(tenant.id, overageAddOn.tenantId))
      .innerJoin(planPrice, eq(planPrice.id, subscription.planPriceId))
      .innerJoin(billingCheckout, eq(billingCheckout.gatewayRef, subscription.gatewayRef))
      .where(
        and(
          eq(overageAddOn.status, 'pending'),
          lte(overageAddOn.reckonedAt, new Date(now)),
          eq(billingCheckout.collection, 'mandate'),
          eq(subscription.state, 'active'),
          gt(subscription.paidPeriodEnd, new Date(now + leadMs)),
        ),
      )
      .orderBy(
        sql`${overageAddOn.triedAt} asc nulls first`,
        asc(overageAddOn.reckonedAt),
        asc(overageAddOn.windowFrom),
        asc(overageAddOn.meter),
      )
      .limit(limit);
    return rows.flatMap(({ tier, cycle, gatewayRef, meter, amount, planAmount, ...row }) =>
      // A converted row always carries all three (`subscription_plan_whole`); the ledger's enum is
      // wider than the billed meters, and `overage_addon_billed_meter` holds the narrowing.
      tier === null || cycle === null || gatewayRef === null
        ? []
        : [
            {
              ...row,
              meter: meter as BilledLedgerMeter,
              amount: minorUnits(amount),
              planAmount: minorUnits(planAmount),
              tier,
              cycle,
              gatewayRef,
            },
          ],
    );
  }

  /**
   * Claims one `pending` row for the gateway: marks it `adding`, with the mandate, the amount and
   * the moment, and commits, before any call is made — so a row whose call ends unanswered is
   * never added blind again. The mandate's own lock serialises every claim on it, so two runs
   * never both fit under its cap; `judge` gets what already waits there. `null`: another run holds
   * or already moved the row.
   */
  async claim(
    addOn: AddOnWaiting,
    gatewayAmount: MinorUnits,
    at: number,
    judge: (waitingOnMandate: MinorUnits) => AddOnVerdict,
  ): Promise<AddOnVerdict | null> {
    return this.db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${`overage:${addOn.gatewayRef}`}))`,
      );
      const [held] = await tx
        .select({ id: overageAddOn.id })
        .from(overageAddOn)
        .where(and(eq(overageAddOn.id, addOn.id), eq(overageAddOn.status, 'pending')))
        .for('update', { skipLocked: true });
      if (held === undefined) return null;
      const verdict = judge(await waitingOn(tx, addOn.gatewayRef));
      if (verdict === 'wait') {
        await tx
          .update(overageAddOn)
          .set({ triedAt: new Date(at) })
          .where(eq(overageAddOn.id, addOn.id));
        return verdict;
      }
      await tx
        .update(overageAddOn)
        .set(
          verdict === 'over_cap'
            ? { status: 'over_cap' }
            : {
                status: 'adding',
                gatewayRef: addOn.gatewayRef,
                gatewayAmountMinor: gatewayAmount,
                addedAt: new Date(at),
              },
        )
        .where(eq(overageAddOn.id, addOn.id));
      return verdict;
    });
  }

  /**
   * The gateway's answer for a claimed row: `added` with its ref, or back to `pending` when
   * refused, behind every row not yet tried.
   */
  async settle(addOnId: string, answer: AddedToNextCharge, at: number): Promise<void> {
    await this.db
      .update(overageAddOn)
      .set(
        answer.kind === 'added'
          ? { status: 'added', gatewayAddOnRef: answer.gatewayAddOnRef }
          : { ...atNoGateway, status: 'pending', triedAt: new Date(at) },
      )
      .where(and(eq(overageAddOn.id, addOnId), eq(overageAddOn.status, 'adding')));
  }
}

/**
 * What the add-ons already on this mandate's next debit add to it, as the gateway collects them:
 * the added ones and the ones being added, since either may be on the debit.
 */
async function waitingOn(tx: DbTransaction, gatewayRef: string): Promise<MinorUnits> {
  const [row] = await tx
    .select({
      total: sql<number>`coalesce(sum(${overageAddOn.gatewayAmountMinor}), 0)`.mapWith(Number),
    })
    .from(overageAddOn)
    .where(
      and(
        eq(overageAddOn.gatewayRef, gatewayRef),
        inArray(overageAddOn.status, ['adding', 'added']),
      ),
    );
  return minorUnits(row?.total ?? 0);
}
