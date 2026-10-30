import { createHmac, timingSafeEqual } from 'node:crypto';
import {
  type BillingGateway,
  currencyCodeSchema,
  type GatewayCharge,
  type GatewayCheckoutRequest,
  type GatewayEvent,
  type GatewayPlanRequest,
  type OpenedCheckout,
} from '@heliogrid/contracts';
import { type CollectionKind, minorUnits } from '@heliogrid/domain';
import { PinoLogger } from 'nestjs-pino';
import { z } from 'zod';

/**
 * The secret the development adapter's messages are signed with. Not a secret: this adapter is
 * never bound in production (`billing.module.ts`), and a test or a person driving the app signs a
 * message with it to stand in for the gateway.
 */
export const DEVELOPMENT_WEBHOOK_SECRET = 'heliogrid-development-billing-gateway';

/** The header a development message carries its signature in. */
export const DEVELOPMENT_SIGNATURE_HEADER = 'x-billing-signature';

/** The signature a development message carries: hex HMAC-SHA256 of the raw body. */
export function developmentSignature(rawBody: string | Uint8Array): string {
  return createHmac('sha256', DEVELOPMENT_WEBHOOK_SECRET).update(rawBody).digest('hex');
}

const amountSchema = z.number().int().nonnegative();
const chargeSchema = z.object({
  gatewayRef: z.string().min(1),
  chargeRef: z.string().min(1),
  occurredAt: z.number().int(),
  paysThrough: z.number().int().nullable(),
  amount: amountSchema,
  currencyCode: currencyCodeSchema,
});
/** A development message is the port's own event, as JSON. */
const developmentEventSchema = z.discriminatedUnion('kind', [
  z.object({ eventRef: z.string().min(1), kind: z.literal('charged'), charge: chargeSchema }),
  z.object({
    eventRef: z.string().min(1),
    kind: z.literal('charge_failed'),
    gatewayRef: z.string().min(1),
    occurredAt: z.number().int(),
  }),
  z.object({
    eventRef: z.string().min(1),
    kind: z.enum(['paused', 'resumed']),
    gatewayRef: z.string().min(1),
  }),
  z.object({ eventRef: z.string().min(1), kind: z.literal('other'), type: z.string() }),
]);

/**
 * The gateway on a machine with no gateway account, CI included: it opens no real page, writes
 * what it would have done to the log, and reads messages signed with the development secret. The
 * charges it reports to the reconcile are the ones `collect` was told, so the whole path runs.
 */
export class DevelopmentBillingGateway implements BillingGateway {
  readonly provider = 'development';
  private readonly collected = new Map<string, GatewayCharge[]>();

  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(DevelopmentBillingGateway.name);
  }

  async createPlan(request: GatewayPlanRequest): Promise<string> {
    const ref = `dev_plan_${request.tier}_${request.cycle}_${request.amount}`;
    this.logger.info({ ...request, ref }, 'development gateway: plan object');
    return ref;
  }

  async openCheckout(request: GatewayCheckoutRequest): Promise<OpenedCheckout> {
    const gatewayRef = `dev_${request.route.collection}_${request.checkoutId}`;
    this.logger.info(
      { checkoutId: request.checkoutId, collection: request.route.collection, gatewayRef },
      'development gateway: hosted checkout opened',
    );
    return { gatewayRef, hostedUrl: `https://development-checkout.invalid/${gatewayRef}` };
  }

  async closeCheckout(collection: CollectionKind, gatewayRef: string): Promise<void> {
    this.logger.info({ collection, gatewayRef }, 'development gateway: hosted checkout closed');
  }

  readEvent(rawBody: Uint8Array, headers: Readonly<Record<string, string>>): GatewayEvent | null {
    const signature = headers[DEVELOPMENT_SIGNATURE_HEADER];
    if (signature === undefined || !signatureHolds(rawBody, signature)) return null;
    const parsed = developmentEventSchema.safeParse(parseJson(rawBody));
    // Signed but not a message this adapter knows: its signature is unique to its body.
    if (!parsed.success) return { eventRef: signature, kind: 'other', type: 'unreadable' };
    const event = parsed.data;
    if (event.kind !== 'charged') return event;
    return { ...event, charge: { ...event.charge, amount: minorUnits(event.charge.amount) } };
  }

  async chargesOn(_collection: CollectionKind, gatewayRef: string): Promise<GatewayCharge[]> {
    return this.collected.get(gatewayRef) ?? [];
  }

  /** A charge this gateway collected, as the reconcile will find it. Development and tests only. */
  collect(charge: GatewayCharge): void {
    this.collected.set(charge.gatewayRef, [
      ...(this.collected.get(charge.gatewayRef) ?? []),
      charge,
    ]);
  }
}

function signatureHolds(rawBody: Uint8Array, signature: string): boolean {
  const expected = Buffer.from(developmentSignature(rawBody), 'hex');
  const given = Buffer.from(signature, 'hex');
  return given.length === expected.length && timingSafeEqual(given, expected);
}

function parseJson(rawBody: Uint8Array): unknown {
  try {
    return JSON.parse(Buffer.from(rawBody).toString('utf8'));
  } catch {
    return null;
  }
}
