import {
  billingCheckout,
  type Db,
  planPrice,
  subscription,
  subscriptionInvoice,
  tenant,
  uuidv7,
} from '@heliogrid/db';
import {
  type BillingCycle,
  ENTITLEMENT_BUFFER_DAYS,
  type MinorUnits,
  MS_PER_DAY,
  OVERAGE_SETTLE_DAYS,
  type Tier,
} from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, isNotNull, lte, sql } from 'drizzle-orm';
import { ADMIN_DB } from '../../common/db/admin.token';
import { lockSubscription } from './charge-standing.admin.repository';
import { type InvoiceFor, issueInvoice, workOutInvoice } from './invoice.admin.repository';
import { addOnsForLink } from './overage-invoicing.admin.repository';

/** A live row a payment link collects, whose paid period has closed with no renewal raised. */
export interface RenewalDue {
  readonly tenantId: string;
  readonly subscriptionId: string;
  readonly marketCode: string;
  readonly currencyCode: string;
  readonly tier: Tier;
  readonly cycle: BillingCycle;
  readonly planPriceId: string;
  readonly gatewayPlanRef: string;
  readonly paidPeriodEnd: number;
}

/** Where a raise run stands in the queue: the last row it read. */
export type RenewalCursor = Pick<RenewalDue, 'paidPeriodEnd' | 'subscriptionId'>;

/** A row past its renewal's due moment with no renewal raised. */
export interface RenewalUnraised {
  readonly subscriptionId: string;
  readonly paidPeriodEnd: number;
}

/** A renewal invoice still unpaid at its due moment. */
export interface RenewalUnpaid {
  readonly invoiceId: string;
  readonly subscriptionId: string;
  readonly dueAt: number;
}

/** The renewal link's invoice, worked out before the link opens: its link is opened for `total`. */
export interface RenewalDraft {
  readonly invoice: InvoiceFor;
  readonly total: MinorUnits;
}

/** The renewal link at the gateway that its invoice is issued with. */
export interface RenewalLink {
  readonly invoiceId: string;
  readonly gatewayRef: string;
  readonly hostedUrl: string;
  readonly dueAt: number;
}

/**
 * The yearly renewal's reads and writes (`M12-11`), across every company, so on the admin pool. A
 * renewal is an invoice raised with its own payment link, one per period
 * (`subscription_invoice_renewal_key`).
 */
@Injectable()
export class RenewalAdminRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(ADMIN_DB) private readonly db: Db) {}

  /** The renewal invoice's id, made before its link opens: the gateway carries it on the link. */
  newId(): string {
    return uuidv7();
  }

  /**
   * Live rows a payment link collects whose paid period closed and settled, with no renewal for
   * the next one — oldest first after `after`, on `subscription_renewal_due_idx`. The same sweep
   * step reckons a period's overage just before, so the link carries it; overage reckoned after
   * the link went out waits for the next one.
   */
  async due(now: number, limit: number, after: RenewalCursor | null): Promise<RenewalDue[]> {
    const rows = await this.db
      .select({
        tenantId: subscription.tenantId,
        subscriptionId: subscription.id,
        marketCode: tenant.marketCode,
        currencyCode: tenant.currencyCode,
        tier: subscription.tier,
        cycle: subscription.cycle,
        planPriceId: planPrice.id,
        gatewayPlanRef: planPrice.gatewayPlanRef,
        paidPeriodEnd: subscription.paidPeriodEnd,
      })
      .from(subscription)
      .innerJoin(tenant, eq(tenant.id, subscription.tenantId))
      .innerJoin(planPrice, eq(planPrice.id, subscription.planPriceId))
      .innerJoin(billingCheckout, eq(billingCheckout.gatewayRef, subscription.gatewayRef))
      .where(
        and(
          awaitingRenewal(new Date(now - OVERAGE_SETTLE_DAYS * MS_PER_DAY)),
          after === null
            ? undefined
            : sql`(${subscription.paidPeriodEnd}, ${subscription.id}) > (${new Date(after.paidPeriodEnd).toISOString()}::timestamptz, ${after.subscriptionId}::uuid)`,
        ),
      )
      .orderBy(asc(subscription.paidPeriodEnd), asc(subscription.id))
      .limit(limit);
    return rows.flatMap(({ tier, cycle, paidPeriodEnd, ...row }) =>
      // A converted row always carries all three (`subscription_plan_whole`).
      tier === null || cycle === null || paidPeriodEnd === null
        ? []
        : [{ ...row, tier, cycle, paidPeriodEnd: paidPeriodEnd.getTime() }],
    );
  }

  /**
   * Live rows a payment link collects whose renewal is past its due moment with no link raised —
   * the gateway would not open one, or the pack no longer sells the period by link. Unpaid all the
   * same, each is a failed charge at that moment (`M12-05`), so none keeps its service for free
   * or holds the renewal queue's head. Oldest first, on `subscription_renewal_due_idx`.
   */
  async unraised(now: number, limit: number): Promise<RenewalUnraised[]> {
    const rows = await this.db
      .select({ subscriptionId: subscription.id, paidPeriodEnd: subscription.paidPeriodEnd })
      .from(subscription)
      .innerJoin(billingCheckout, eq(billingCheckout.gatewayRef, subscription.gatewayRef))
      .where(awaitingRenewal(new Date(now - ENTITLEMENT_BUFFER_DAYS * MS_PER_DAY)))
      .orderBy(asc(subscription.paidPeriodEnd), asc(subscription.id))
      .limit(limit);
    return rows.flatMap(({ subscriptionId, paidPeriodEnd }) =>
      paidPeriodEnd === null ? [] : [{ subscriptionId, paidPeriodEnd: paidPeriodEnd.getTime() }],
    );
  }

  /**
   * The renewal invoice as it would issue now — the plan and every add-on the link takes — and
   * its total, the amount the link is opened for. Commits only the move of add-ons still on a
   * cancelled mandate back to `pending`.
   */
  async draft(invoice: Omit<InvoiceFor, 'addOns'>): Promise<RenewalDraft> {
    return this.db.transaction(async (tx) => {
      const whole = { ...invoice, addOns: await addOnsForLink(tx, invoice) };
      const worked = await workOutInvoice(tx, whole);
      return { invoice: whole, total: worked.totalAmount };
    });
  }

  /**
   * Issues the drafted invoice with its link. `raced`: another run raised this period's renewal
   * first, so this link must take no money. The row's lock serialises the two, so the check holds.
   * Throws — writing nothing — when the invoice no longer comes to the link's amount or an add-on
   * moved since the draft.
   */
  async issue(draft: RenewalDraft, link: RenewalLink): Promise<'issued' | 'raced'> {
    const { tenantId, subscriptionId, paysThrough } = draft.invoice;
    return this.db.transaction(async (tx) => {
      await lockSubscription(tx, subscriptionId);
      const [taken] = await tx
        .select({ id: subscriptionInvoice.id })
        .from(subscriptionInvoice)
        .where(
          and(
            eq(subscriptionInvoice.tenantId, tenantId),
            eq(subscriptionInvoice.subscriptionId, subscriptionId),
            eq(subscriptionInvoice.paysThrough, new Date(paysThrough)),
            isNotNull(subscriptionInvoice.gatewayRef),
          ),
        )
        .limit(1);
      if (taken !== undefined) return 'raced';
      const total = await issueInvoice(tx, draft.invoice, { kind: 'link', ...link });
      if (total !== draft.total) {
        throw new Error(`renewal ${link.invoiceId} comes to ${total}, its link to ${draft.total}`);
      }
      return 'issued';
    });
  }

  /** Renewals still `issued` whose due moment has passed, oldest first, on `subscription_invoice_due_idx`. */
  async unpaid(now: number, limit: number): Promise<RenewalUnpaid[]> {
    const rows = await this.db
      .select({
        invoiceId: subscriptionInvoice.id,
        subscriptionId: subscriptionInvoice.subscriptionId,
        dueAt: subscriptionInvoice.dueAt,
      })
      .from(subscriptionInvoice)
      .where(
        and(
          eq(subscriptionInvoice.status, 'issued'),
          lte(subscriptionInvoice.dueAt, new Date(now)),
        ),
      )
      .orderBy(asc(subscriptionInvoice.dueAt), asc(subscriptionInvoice.id))
      .limit(limit);
    return rows.flatMap(({ dueAt, ...row }) =>
      // An `issued` invoice always holds its link (`subscription_invoice_link_whole`).
      dueAt === null ? [] : [{ ...row, dueAt: dueAt.getTime() }],
    );
  }
}

/**
 * A live row a payment link collects (its converting checkout's rail), its paid period ended by
 * `endedBy`, and no renewal raised for the period after it. The caller joins `billing_checkout`.
 */
function awaitingRenewal(endedBy: Date) {
  return and(
    isNotNull(subscription.gatewayRef),
    eq(subscription.state, 'active'),
    lte(subscription.paidPeriodEnd, endedBy),
    eq(billingCheckout.collection, 'invoice'),
    sql`not exists (
      select 1 from ${subscriptionInvoice}
      where ${subscriptionInvoice.tenantId} = ${subscription.tenantId}
        and ${subscriptionInvoice.subscriptionId} = ${subscription.id}
        and ${subscriptionInvoice.gatewayRef} is not null
        and ${subscriptionInvoice.paysThrough} > ${subscription.paidPeriodEnd})`,
  );
}
