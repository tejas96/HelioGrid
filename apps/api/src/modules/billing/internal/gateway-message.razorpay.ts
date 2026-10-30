import type { GatewayCharge, GatewayEvent } from '@heliogrid/contracts';
import { minorUnits } from '@heliogrid/domain';
import { z } from 'zod';

/**
 * Razorpay's webhook body, read as the port's event. Only the adapter calls this, and only after
 * the message's signature holds (`billing-gateway.razorpay.ts`). Razorpay's moments are unix
 * SECONDS; the port's are milliseconds.
 */

const MS_PER_SECOND = 1000;
export const seconds = (value: number): number => Math.floor(value / MS_PER_SECOND);
export const millis = (value: number): number => value * MS_PER_SECOND;

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

/** One signed message. A body this cannot read is `other`, never applied by guess. */
export function messageOf(eventRef: string, rawBody: Uint8Array): GatewayEvent {
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
