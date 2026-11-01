import { createHmac, timingSafeEqual } from 'node:crypto';
import type {
  AddedToNextCharge,
  BillingGateway,
  GatewayAddOnRequest,
  GatewayCharge,
  GatewayCheckoutRequest,
  GatewayEvent,
  GatewayPlanRequest,
  GatewayRefundRequest,
  OpenedCheckout,
} from '@heliogrid/contracts';
import { type CollectionKind, minorUnits } from '@heliogrid/domain';
import { PinoLogger } from 'nestjs-pino';
import { z } from 'zod';
import { messageOf, millis, seconds } from './gateway-message.razorpay';
import { GatewayRefusal, type RazorpayKeys, RazorpayRest } from './rest-client.razorpay';

export type { RazorpayKeys } from './rest-client.razorpay';

/**
 * Razorpay — the IN reference implementation of the billing port (`M12-03`, `F1-43`). It and its
 * message reader (`gateway-message.razorpay.ts`) and REST client (`rest-client.razorpay.ts`) are the
 * only billing files that name a vendor. A monthly tier is a Razorpay subscription on its
 * plan object, whose hosted link establishes the mandate; a yearly one is a payment link
 * (`F1-40`). Every call is the REST API with the key pair; every message is verified against the
 * webhook secret before a byte of it is read.
 *
 * Razorpay's moments are unix SECONDS; the port's are milliseconds.
 */

/** A monthly subscription's charge count: Razorpay requires one. Ten years, renewed by reactivation after. */
const MONTHLY_CHARGE_COUNT = 120;

const opened = z.object({ id: z.string(), short_url: z.string().url() });
const plan = z.object({ id: z.string() });
const addOn = z.object({ id: z.string() });
const invoices = z.object({
  items: z.array(
    z.object({
      status: z.string(),
      payment_id: z.string().nullable(),
      amount_paid: z.number().int(),
      currency: z.string(),
      paid_at: z.number().int().nullable(),
      billing_end: z.number().int().nullable(),
    }),
  ),
});
const pageStatus = z.object({ status: z.string() });
const refundMade = z.object({ id: z.string() });
const refundsMade = z.object({ items: z.array(z.object({ id: z.string(), status: z.string() })) });
/** The statuses in which a page can take no more money. */
const closedStatuses: Readonly<Record<CollectionKind, readonly string[]>> = {
  mandate: ['cancelled', 'completed', 'expired'],
  invoice: ['cancelled', 'expired', 'paid'],
};
const paymentLink = z.object({
  currency: z.string(),
  payments: z
    .array(
      z.object({
        payment_id: z.string(),
        amount: z.number().int(),
        created_at: z.number().int(),
        status: z.string(),
      }),
    )
    .nullable(),
});

export class RazorpayBillingGateway implements BillingGateway {
  readonly provider = 'razorpay';

  private readonly rest: RazorpayRest;

  constructor(
    private readonly keys: RazorpayKeys,
    logger: PinoLogger,
  ) {
    logger.setContext(RazorpayBillingGateway.name);
    this.rest = new RazorpayRest(keys, logger);
  }

  async createPlan(request: GatewayPlanRequest): Promise<string> {
    const made = await this.rest.call('POST', '/plans', plan, {
      period: request.cycle,
      interval: 1,
      item: {
        name: `${request.tier} ${request.cycle}`,
        amount: request.amount,
        currency: request.currencyCode,
      },
    });
    return made.id;
  }

  async hasPlan(gatewayPlanRef: string): Promise<boolean> {
    try {
      await this.rest.call('GET', `/plans/${encodeURIComponent(gatewayPlanRef)}`, plan);
      return true;
    } catch (refused) {
      if (refused instanceof GatewayRefusal && refused.unknownId) {
        return false;
      }
      throw refused;
    }
  }

  async openCheckout(request: GatewayCheckoutRequest): Promise<OpenedCheckout> {
    const notes = { reference: request.reference };
    const expireBy = seconds(request.expiresAt);
    const made =
      request.route.collection === 'mandate'
        ? await this.rest.call('POST', '/subscriptions', opened, {
            plan_id: request.gatewayPlanRef,
            total_count: MONTHLY_CHARGE_COUNT,
            customer_notify: 1,
            expire_by: expireBy,
            ...(request.startsAt === null ? {} : { start_at: seconds(request.startsAt) }),
            notes,
          })
        : await this.rest.call('POST', '/payment_links', opened, {
            amount: request.amount,
            currency: request.currencyCode,
            reference_id: request.reference,
            expire_by: expireBy,
            notes,
          });
    return { gatewayRef: made.id, hostedUrl: made.short_url };
  }

  async addToNextCharge(request: GatewayAddOnRequest): Promise<AddedToNextCharge> {
    const path = `/subscriptions/${encodeURIComponent(request.gatewayRef)}/addons`;
    try {
      const made = await this.rest.call('POST', path, addOn, {
        item: {
          name: `${request.meter} overage`,
          amount: request.amount,
          currency: request.currencyCode,
        },
        quantity: 1,
        notes: { addon_id: request.addOnId },
      });
      return { kind: 'added', gatewayAddOnRef: made.id };
    } catch (failed) {
      // A 4xx says the request was refused and added nothing; a 5xx, a timeout or an unreadable
      // answer may have added it.
      if (failed instanceof GatewayRefusal && failed.refusedOutright) return { kind: 'refused' };
      throw failed;
    }
  }

  async closeCheckout(collection: CollectionKind, gatewayRef: string): Promise<void> {
    const page =
      collection === 'mandate'
        ? `/subscriptions/${encodeURIComponent(gatewayRef)}`
        : `/payment_links/${encodeURIComponent(gatewayRef)}`;
    try {
      // Cancelled now, never at the cycle's end: a page nobody authorised has no cycle to end.
      const body = collection === 'mandate' ? { cancel_at_cycle_end: 0 } : {};
      await this.rest.call('POST', `${page}/cancel`, z.unknown(), body);
    } catch (refused) {
      // Razorpay refuses to cancel a page that can take no more money, and a cancel whose answer
      // was lost may have landed: the page's own status says which.
      const { status } = await this.rest.call('GET', page, pageStatus);
      if (!closedStatuses[collection].includes(status)) throw refused;
    }
  }

  async cancelAtCycleEnd(gatewayRef: string): Promise<void> {
    const page = `/subscriptions/${encodeURIComponent(gatewayRef)}`;
    try {
      await this.rest.call('POST', `${page}/cancel`, z.unknown(), { cancel_at_cycle_end: 1 });
    } catch (refused) {
      // A mandate already ended refuses a second cancel; its own status says whether it renews.
      const { status } = await this.rest.call('GET', page, pageStatus);
      if (!closedStatuses.mandate.includes(status)) throw refused;
    }
  }

  async refund(request: GatewayRefundRequest): Promise<string> {
    const payment = `/payments/${encodeURIComponent(request.chargeRef)}`;
    try {
      const made = await this.rest.call('POST', `${payment}/refund`, refundMade, {
        amount: request.amount,
        notes: { reference: request.reference },
      });
      return made.id;
    } catch (refused) {
      // A refund whose answer was lost may have landed: Razorpay then refuses a second one, and
      // the payment's own refunds name it.
      if (!(refused instanceof GatewayRefusal && refused.refusedOutright)) throw refused;
      const { items } = await this.rest.call('GET', `${payment}/refunds`, refundsMade);
      const landed = items.find((made) => made.status !== 'failed');
      if (landed === undefined) throw refused;
      return landed.id;
    }
  }

  readEvent(rawBody: Uint8Array, headers: Readonly<Record<string, string>>): GatewayEvent | null {
    const signature = headers['x-razorpay-signature'];
    if (signature === undefined || !this.signatureHolds(rawBody, signature)) return null;
    const eventRef = headers['x-razorpay-event-id'] ?? signature;
    return messageOf(eventRef, rawBody);
  }

  async chargesOn(collection: CollectionKind, gatewayRef: string): Promise<GatewayCharge[]> {
    if (collection === 'mandate') {
      const query = `?subscription_id=${encodeURIComponent(gatewayRef)}&count=100`;
      const { items } = await this.rest.call('GET', `/invoices${query}`, invoices);
      return items.flatMap((invoice) =>
        invoice.status === 'paid' && invoice.payment_id !== null && invoice.paid_at !== null
          ? [
              {
                gatewayRef,
                chargeRef: invoice.payment_id,
                occurredAt: millis(invoice.paid_at),
                paysThrough: invoice.billing_end === null ? null : millis(invoice.billing_end),
                amount: minorUnits(invoice.amount_paid),
                currencyCode: invoice.currency,
              },
            ]
          : [],
      );
    }
    const link = await this.rest.call(
      'GET',
      `/payment_links/${encodeURIComponent(gatewayRef)}`,
      paymentLink,
    );
    return (link.payments ?? []).flatMap((payment) =>
      payment.status === 'captured'
        ? [
            {
              gatewayRef,
              chargeRef: payment.payment_id,
              occurredAt: millis(payment.created_at),
              paysThrough: null,
              amount: minorUnits(payment.amount),
              currencyCode: link.currency,
            },
          ]
        : [],
    );
  }

  private signatureHolds(rawBody: Uint8Array, signature: string): boolean {
    const expected = createHmac('sha256', this.keys.webhookSecret).update(rawBody).digest();
    const given = Buffer.from(signature, 'hex');
    return given.length === expected.length && timingSafeEqual(given, expected);
  }
}
