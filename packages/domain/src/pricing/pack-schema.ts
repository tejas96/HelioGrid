import { z } from 'zod';
import type { Meter } from '../commerce/meters';
import type { CountedCreation, Tier } from '../commerce/tiers';
import { packAmount, packCount, packWhole } from '../market/stored-values';
import { BILLING_CYCLES, type BillingCycle } from '../rails/pack';
import type { PriceBookPack } from './pack';

const cycle = z.enum(BILLING_CYCLES);
const limit = z.union([packCount, z.literal('unlimited'), z.literal('custom')]);
/** Every meter but storage, which is a standing allowance rather than a per-cycle bundle. */
const meterBundles = z.object({
  voice_minutes: limit,
  ai_roof_detections: limit,
  marketing_sends: limit,
  tracked_field_seats: limit,
} satisfies Record<Exclude<Meter, 'storage'>, z.ZodTypeAny>);
const cogs = z.object({ amount: packAmount, source: z.string() });

const price = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('listed'),
    perCycle: z.object({ monthly: packAmount, yearly: packAmount } satisfies Record<
      BillingCycle,
      z.ZodTypeAny
    >),
  }),
  z.object({ kind: z.literal('anchored'), from: packAmount, per: cycle, contract: cycle }),
]);
const bookRow = z
  .object({
    price,
    capacity: z.object({
      designCeilingKw: limit,
      creationsPerCycle: z.object({ proposals: limit, active_projects: limit } satisfies Record<
        CountedCreation,
        z.ZodTypeAny
      >),
      meterBundles,
      storageGb: limit,
    }),
  })
  .nullable();

const overage = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('per_unit'),
    rate: packAmount,
    worstCaseCogs: cogs,
    draft: z.boolean(),
  }),
  z.object({
    kind: z.literal('per_channel'),
    channels: z.array(
      z.object({
        channel: z.string(),
        billableUnit: z.string(),
        rate: packAmount,
        worstCaseCogs: cogs,
      }),
    ),
    draft: z.boolean(),
  }),
  z.object({ kind: z.literal('ceiling') }),
]);

/** `pack.price-book` as a row stores it, validated whole and re-minted (`T-FCORE-017`). */
export const PRICE_BOOK_PACK_SCHEMA: z.ZodType<PriceBookPack, z.ZodTypeDef, unknown> = z.object({
  tiers: z.object({
    starter: bookRow,
    growth: bookRow,
    pro: bookRow,
    enterprise: bookRow,
  } satisfies Record<Tier, z.ZodTypeAny>),
  overage: z.object({
    voice_minutes: overage,
    ai_roof_detections: overage,
    storage: overage,
    marketing_sends: overage,
    tracked_field_seats: overage,
  } satisfies Record<Meter, z.ZodTypeAny>),
  trialCaps: z.object({ meterBundles, storageGb: limit }),
  benchmarks: z.array(
    z.object({
      competitor: z.string(),
      source: z.string(),
      readOn: z.string(),
      rungs: z.array(
        z.object({
          label: z.string(),
          price: packAmount,
          cycle,
          designCeilingKw: packCount,
          proposalsPerCycle: packWhole.nullable(),
        }),
      ),
    }),
  ),
  priceProtectionMonths: packWhole,
});
