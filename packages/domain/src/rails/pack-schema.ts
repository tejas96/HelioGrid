import { z } from 'zod';
import { packAmount } from '../market/stored-values';
import type { BillingCycle, PaymentRailsPack, RailCapability, TierBand } from './pack';

const route = z.discriminatedUnion('collection', [
  z.object({
    collection: z.literal('mandate'),
    primary: z.string(),
    fallbacks: z.array(z.string()),
  }),
  z.object({ collection: z.literal('invoice') }),
]);
const cycles = z.object({ monthly: route, yearly: route } satisfies Record<
  BillingCycle,
  z.ZodTypeAny
>);
const adapters = z.array(z.string());

/** `pack.payment-rails` as a row stores it, validated whole and re-minted (`T-FCORE-017`). */
export const PAYMENT_RAILS_PACK_SCHEMA: z.ZodType<PaymentRailsPack, z.ZodTypeDef, unknown> =
  z.object({
    mandateTypes: z.array(z.object({ type: z.string(), perDebitCap: packAmount.nullable() })),
    ladder: z.object({ self_serve: cycles, enterprise: cycles } satisfies Record<
      TierBand,
      z.ZodTypeAny
    >),
    paymentModes: z.array(z.object({ mode: z.string(), manual: z.boolean() })),
    adapters: z.object({
      subscription_billing: adapters,
      payment_links: adapters,
      otp_delivery: adapters,
      telephony: adapters,
    } satisfies Record<RailCapability, z.ZodTypeAny>),
    localisation: z.discriminatedUnion('imposed', [
      z.object({ imposed: z.literal(false) }),
      z.object({
        imposed: z.literal(true),
        regime: z.string(),
        satisfiedBy: z.literal('aggregator_holds_instruments'),
      }),
    ]),
  });
