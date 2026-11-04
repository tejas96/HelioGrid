import { billingCheckout, type Db, subscriptionPayment } from '@heliogrid/db';
import {
  type ChargeSucceeded,
  LIVE_BILLING_STATES,
  type MarketPack,
  type MinorUnits,
} from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { ADMIN_DB } from '../../common/db/admin.token';
import { lockSubscription } from './charge-standing.admin.repository';
import type { PlanChangePaid } from './collected-on.admin.repository';
import type { LimitsFor } from './entitlement.admin.repository';
import { issueInvoice } from './invoice.admin.repository';
import {
  collectionOf,
  mandateToEnd,
  markMandateEnding,
  movePlan,
} from './plan-move.admin.repository';

/** What an upgrade's paid page came to. `recorded` names the mandate the change must now end. */
export type UpgradePaid =
  | { readonly kind: 'recorded'; readonly invoiced: MinorUnits; readonly mandate: string | null }
  | { readonly kind: 'duplicate' }
  | { readonly kind: 'refused'; readonly reason: string }
  /** The row left the plan or the period the charge was priced on: the money is no row's. */
  | { readonly kind: 'moved' };

const LIVE: ReadonlySet<string> = new Set(LIVE_BILLING_STATES);

/**
 * An upgrade's part-cycle page paid (`M12-48`), in one transaction under the row's lock: the
 * payment, the row moved wholly onto the plan it paid toward — its paid period's end kept — its
 * limits rewritten at once (`M12-16`), the one-time `proration` invoice whose one line is the
 * charge (`M12-44`), the page closed, and audit `billing.plan_changed`. The gateway's messages
 * cross every company, so this rides the admin pool.
 */
@Injectable()
export class PlanChangePaidAdminRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(ADMIN_DB) private readonly db: Db) {}

  async recordPaid(
    charge: Omit<ChargeSucceeded, 'paysThrough'>,
    page: PlanChangePaid,
    on: { readonly pack: MarketPack; readonly limitsFor: LimitsFor; readonly recordedAt: number },
  ): Promise<UpgradePaid> {
    return this.db.transaction(async (tx) => {
      const held = await lockSubscription(tx, charge.subscriptionId);
      if (held === null)
        return { kind: 'refused', reason: `no subscription ${charge.subscriptionId}` };
      if (held.currencyCode !== charge.currencyCode) {
        return {
          kind: 'refused',
          reason: `a charge in ${charge.currencyCode} on a company billed in ${held.currencyCode}`,
        };
      }
      const periodEnd = held.paidPeriodEnd;
      if (!LIVE.has(held.state) || held.replaced || periodEnd === null) {
        return {
          kind: 'refused',
          reason: 'an upgrade page was paid on a row that no longer lives',
        };
      }
      const closePage = () =>
        tx
          .update(billingCheckout)
          .set({ closedAt: new Date(on.recordedAt) })
          .where(and(eq(billingCheckout.id, page.checkoutId), isNull(billingCheckout.closedAt)));
      // Priced on another plan or period, the charge would buy days at a rate no longer true.
      if (held.planPriceId !== page.fromPlanPriceId || periodEnd !== page.pricedThrough) {
        await closePage();
        return { kind: 'moved' };
      }
      // The charge pays toward the period already running, so it buys no day past its end.
      const [paid] = await tx
        .insert(subscriptionPayment)
        .values({
          tenantId: held.tenantId,
          subscriptionId: held.id,
          gatewayChargeRef: charge.chargeRef,
          amountMinor: charge.amount,
          currencyCode: charge.currencyCode,
          paysThrough: new Date(periodEnd),
          occurredAt: new Date(charge.occurredAt),
          recordedAt: new Date(on.recordedAt),
        })
        .onConflictDoNothing({ target: subscriptionPayment.gatewayChargeRef })
        .returning({ id: subscriptionPayment.id });
      if (paid === undefined) return { kind: 'duplicate' };
      await closePage();
      await movePlan(
        tx,
        held,
        {
          tier: page.tier,
          cycle: page.cycle,
          planPriceId: page.planPriceId,
          collection: collectionOf(on.pack, page.tier, page.cycle),
        },
        { limitsFor: on.limitsFor, actorUserId: page.openedBy, now: on.recordedAt },
      );
      const mandate = mandateToEnd(held);
      // Marked here, with the move, so a second message never asks for it twice; the gateway is
      // told after the commit, and a gateway that did not confirm is alerted.
      if (mandate !== null) await markMandateEnding(tx, held.id, on.recordedAt);
      // The series row is taken last, so other charges in the market wait on it as briefly as can be.
      const invoiced = await issueInvoice(
        tx,
        {
          tenantId: held.tenantId,
          subscriptionId: held.id,
          planPriceId: page.planPriceId,
          paysThrough: periodEnd,
          issuedAt: on.recordedAt,
          pack: on.pack,
          addOns: [],
          proration: page.chargeMinor,
        },
        { kind: 'payment', paymentId: paid.id },
      );
      return { kind: 'recorded', invoiced, mandate };
    });
  }
}
