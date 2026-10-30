import { createHmac, timingSafeEqual } from 'node:crypto';
import type {
  BillingGateway,
  GatewayCharge,
  GatewayCheckoutRequest,
  GatewayEvent,
  GatewayPlanRequest,
  OpenedCheckout,
} from '@heliogrid/contracts';
import { type CollectionKind, minorUnits } from '@heliogrid/domain';
import { PinoLogger } from 'nestjs-pino';
import { z } from 'zod';

/**
 * Razorpay — the IN reference implementation of the billing port (`M12-03`, `F1-43`), and the one
 * file in the billing module that names a vendor. A monthly tier is a Razorpay subscription on its
 * plan object, whose hosted link establishes the mandate; a yearly one is a payment link
 * (`F1-40`). Every call is the REST API with the key pair; every message is verified against the
 * webhook secret before a byte of it is read.
 *
 * Razorpay's moments are unix SECONDS; the port's are milliseconds.
 */

const API = 'https://api.razorpay.com/v1';
/** A gateway call that has not answered by now has failed; the caller says so and nothing is kept. */
const CALL_TIMEOUT_MS = 10_000;
/** A monthly subscription's charge count: Razorpay requires one. Ten years, renewed by reactivation after. */
const MONTHLY_CHARGE_COUNT = 120;

export interface RazorpayKeys {
  readonly keyId: string;
  readonly keySecret: string;
  readonly webhookSecret: string;
}

const MS_PER_SECOND = 1000;
const seconds = (value: number): number => Math.floor(value / MS_PER_SECOND);
const millis = (value: number): number => value * MS_PER_SECOND;

const opened = z.object({ id: z.string(), short_url: z.string().url() });
const plan = z.object({ id: z.string() });
const paymentEntity = z.object({
  id: z.string(),
  amount: z.number().int(),
  currency: z.string(),
  created_at: z.number().int(),
});
const webhook = z.object({
  event: z.string(),
  created_at: z.number().int(),
  payload: z.record(z.object({ entity: z.record(z.unknown()) })),
});
const subscriptionEntity = z.object({ id: z.string(), current_end: z.number().int().nullable() });
const paymentLinkEntity = z.object({ id: z.string() });
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

  constructor(
    private readonly keys: RazorpayKeys,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(RazorpayBillingGateway.name);
  }

  async createPlan(request: GatewayPlanRequest): Promise<string> {
    const made = await this.call('POST', '/plans', plan, {
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

  async openCheckout(request: GatewayCheckoutRequest): Promise<OpenedCheckout> {
    const notes = { checkout_id: request.checkoutId };
    const expireBy = seconds(request.expiresAt);
    const made =
      request.route.collection === 'mandate'
        ? await this.call('POST', '/subscriptions', opened, {
            plan_id: request.gatewayPlanRef,
            total_count: MONTHLY_CHARGE_COUNT,
            customer_notify: 1,
            expire_by: expireBy,
            notes,
          })
        : await this.call('POST', '/payment_links', opened, {
            amount: request.amount,
            currency: request.currencyCode,
            reference_id: request.checkoutId,
            expire_by: expireBy,
            notes,
          });
    return { gatewayRef: made.id, hostedUrl: made.short_url };
  }

  async closeCheckout(collection: CollectionKind, gatewayRef: string): Promise<void> {
    const page =
      collection === 'mandate'
        ? `/subscriptions/${encodeURIComponent(gatewayRef)}`
        : `/payment_links/${encodeURIComponent(gatewayRef)}`;
    try {
      // Cancelled now, never at the cycle's end: a page nobody authorised has no cycle to end.
      const body = collection === 'mandate' ? { cancel_at_cycle_end: 0 } : {};
      await this.call('POST', `${page}/cancel`, z.unknown(), body);
    } catch (refused) {
      // Razorpay refuses to cancel a page that can take no more money, and a cancel whose answer
      // was lost may have landed: the page's own status says which.
      const { status } = await this.call('GET', page, pageStatus);
      if (!closedStatuses[collection].includes(status)) throw refused;
    }
  }

  readEvent(rawBody: Uint8Array, headers: Readonly<Record<string, string>>): GatewayEvent | null {
    const signature = headers['x-razorpay-signature'];
    if (signature === undefined || !this.signatureHolds(rawBody, signature)) return null;
    const eventRef = headers['x-razorpay-event-id'] ?? signature;
    const parsed = webhook.safeParse(parseJson(rawBody));
    if (!parsed.success) return { eventRef, kind: 'other', type: 'unreadable' };
    const { event, payload, created_at } = parsed.data;
    try {
      return eventOf(eventRef, event, payload, created_at);
    } catch {
      // A known event in a shape this adapter cannot read: never applied by guess. The reconcile
      // finds its charge from the gateway's own record.
      return { eventRef, kind: 'other', type: `unreadable ${event}` };
    }
  }

  async chargesOn(collection: CollectionKind, gatewayRef: string): Promise<GatewayCharge[]> {
    if (collection === 'mandate') {
      const query = `?subscription_id=${encodeURIComponent(gatewayRef)}&count=100`;
      const { items } = await this.call('GET', `/invoices${query}`, invoices);
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
    const link = await this.call(
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

  /** One REST call. Throws on a timeout, a refusal or an answer it cannot read; logs no body. */
  private async call<T>(
    method: 'GET' | 'POST',
    path: string,
    answer: z.ZodType<T>,
    body?: object,
  ): Promise<T> {
    const auth = Buffer.from(`${this.keys.keyId}:${this.keys.keySecret}`).toString('base64');
    // biome-ignore lint/style/noRestrictedGlobals: the ban is on calling OUR wire, which is packages/data's; this is an outbound call to a third party and no typed client exists for it
    const response = await fetch(`${API}${path}`, {
      method,
      headers: { authorization: `Basic ${auth}`, 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(CALL_TIMEOUT_MS),
    });
    if (!response.ok) {
      this.logger.warn(
        { method, path: path.split('?')[0], status: response.status },
        'gateway refused a call',
      );
      throw new Error(`the gateway answered ${response.status} to ${method} ${path.split('?')[0]}`);
    }
    return answer.parse(await response.json());
  }
}

/** One verified message, as the port's event. Throws when a known event's shape cannot be read. */
function eventOf(
  eventRef: string,
  event: string,
  payload: z.infer<typeof webhook>['payload'],
  createdAt: number,
): GatewayEvent {
  switch (event) {
    case 'subscription.charged': {
      const subscription = subscriptionEntity.parse(payload.subscription?.entity);
      const payment = paymentEntity.parse(payload.payment?.entity);
      return {
        eventRef,
        kind: 'charged',
        charge: chargeOf(subscription.id, payment, subscription.current_end),
      };
    }
    case 'payment_link.paid': {
      const link = paymentLinkEntity.parse(payload.payment_link?.entity);
      const payment = paymentEntity.parse(payload.payment?.entity);
      return { eventRef, kind: 'charged', charge: chargeOf(link.id, payment, null) };
    }
    case 'subscription.pending': {
      const subscription = subscriptionEntity.parse(payload.subscription?.entity);
      return {
        eventRef,
        kind: 'charge_failed',
        gatewayRef: subscription.id,
        occurredAt: millis(createdAt),
      };
    }
    case 'subscription.paused':
    case 'subscription.resumed': {
      const subscription = subscriptionEntity.parse(payload.subscription?.entity);
      const kind = event === 'subscription.paused' ? 'paused' : 'resumed';
      return { eventRef, kind, gatewayRef: subscription.id };
    }
    default:
      return { eventRef, kind: 'other', type: event };
  }
}

function chargeOf(
  gatewayRef: string,
  payment: z.infer<typeof paymentEntity>,
  periodEnd: number | null,
): GatewayCharge {
  return {
    gatewayRef,
    chargeRef: payment.id,
    occurredAt: millis(payment.created_at),
    paysThrough: periodEnd === null ? null : millis(periodEnd),
    amount: minorUnits(payment.amount),
    currencyCode: payment.currency,
  };
}

function parseJson(rawBody: Uint8Array): unknown {
  try {
    return JSON.parse(Buffer.from(rawBody).toString('utf8'));
  } catch {
    return null;
  }
}
