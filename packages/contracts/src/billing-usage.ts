import { USAGE_STEPS } from '@heliogrid/domain';
import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { billingStandingSchema } from './billing-home';
import {
  amountSchema,
  currencyCodeSchema,
  extensibleEnum,
  paginated,
  paginationQuerySchema,
} from './common';
import { baseError, errorEnvelope, unauthenticatedEnvelope } from './error';
import { limitSchema } from './pricing';

const c = initContract();
const instant = z.string().datetime();

/** Where one meter stands this cycle (`USAGE_STEPS`); each date is set only on the step that has it. */
const usageStepSchema = z
  .object({
    step: extensibleEnum(USAGE_STEPS),
    pausesAt: instant.nullable(),
    resetsAt: instant.nullable(),
  })
  .strict();

/** A capped count this cycle against the company's limit; `null` where no limit row stands. */
const countedSchema = z
  .object({
    used: z.number().int().nonnegative(),
    limit: limitSchema.nullable(),
    usage: usageStepSchema,
  })
  .strict();

/**
 * The Owner's usage this cycle (`SCR-M12-04`): every figure the rollup the gates and the invoice
 * read (`M12-34`), against the company's limits as the gates hold them, support grants included.
 * Every amount is worked out by the server (`F4-04`).
 */
export const billingUsageSchema = z
  .object({
    standing: billingStandingSchema,
    currencyCode: currencyCodeSchema,
    /** The price list's date: the pack revision that published it (`F1-25`). */
    priceListPublishedAt: instant,
    /** The window every count covers, and the moment the counts reset (`M12-30`). */
    cycle: z.object({ from: instant, resetsAt: instant }).strict(),
    proposals: countedSchema,
    activeProjects: countedSchema,
    designCeilingKw: limitSchema.nullable(),
    voice: z
      .object({
        /** Billed minutes, rounded down once on the cycle's total (`billedQuantityOf`). */
        usedMinutes: z.number().int().nonnegative(),
        limit: limitSchema.nullable(),
        /** The book's published rate a minute; null on a trial, which pays nothing (`M12-52`). */
        rate: amountSchema.nullable(),
        /** The add-on this cycle's minutes owe so far, as the sweep reckons it; null while none. */
        soFar: amountSchema.nullable(),
        usage: usageStepSchema,
      })
      .strict(),
    storage: z
      .object({
        /** The latest nightly gauge, in bytes; null before the company's first night. */
        usedBytes: z.number().int().nonnegative().nullable(),
        takenAt: instant.nullable(),
        limitGb: limitSchema.nullable(),
        usage: usageStepSchema,
      })
      .strict(),
    /** Sign-in codes sent for the company this cycle: tracked, never billed (`M12-33`). */
    otpCodes: z.number().int().nonnegative(),
    /** Extra charges so far and the payment that carries them; null on a trial or with none. */
    extraCharges: z.object({ total: amountSchema, billsOn: instant }).strict().nullable(),
  })
  .strict();
export type BillingUsage = z.infer<typeof billingUsageSchema>;

/** The meters a cap or a pause can stand on; the V2 meters join with their modules. */
export const USAGE_SIGNAL_METERS = [
  'proposals',
  'active_projects',
  'voice_minutes',
  'storage',
] as const;
export type UsageSignalMeter = (typeof USAGE_SIGNAL_METERS)[number];

/** Which meter is at its cap or paused, with no figure (`M12-56`): what any member may see. */
export const billingUsageSignalsSchema = z
  .object({
    signals: z
      .array(
        z
          .object({
            meter: extensibleEnum(USAGE_SIGNAL_METERS),
            usage: usageStepSchema,
          })
          .strict(),
      )
      .max(4),
  })
  .strict();
export type BillingUsageSignals = z.infer<typeof billingUsageSignalsSchema>;

/** The meters whose events the ledger panel lists (`M12-36`). */
export const USAGE_EVENT_METERS = ['voice_minutes', 'otp_delivery'] as const;
export type UsageEventMeter = (typeof USAGE_EVENT_METERS)[number];

export const billingUsageEventsQuerySchema = paginationQuerySchema.extend({
  meter: z.enum(USAGE_EVENT_METERS),
});
export type BillingUsageEventsQuery = z.infer<typeof billingUsageEventsQuerySchema>;

/** One ledger row of this cycle: when, how much in the meter's ledger unit, and who caused it. */
const usageEventSchema = z
  .object({
    id: z.string().uuid(),
    occurredAt: instant,
    /** Voice in seconds, a code as 1 (`METER_UNITS`). */
    quantity: z.number().int().positive(),
    /** The person a code signed in, by name; null where the event names no person. */
    person: z.string().nullable(),
  })
  .strict();
export const billingUsageEventsSchema = paginated(usageEventSchema).extend({
  /** The window the events cover — the same cycle the usage figures cover. */
  cycle: z.object({ from: instant, resetsAt: instant }).strict(),
});
export type BillingUsageEvents = z.infer<typeof billingUsageEventsSchema>;
export type BillingUsageEvent = z.infer<typeof usageEventSchema>;

const notFound = errorEnvelope(baseError('NOT_FOUND'));

/**
 * What the usage screen reads (`SCR-M12-04`). Every route is a read, so no billing state refuses
 * one (`BM-32`). `signals` answers any member; the figures and the events are the Owner's (`M12-36`).
 */
export const billingUsageContract = c.router({
  usage: {
    method: 'GET',
    path: '/billing/usage',
    summary: 'This cycle’s usage against the company’s limits, and extra charges so far',
    responses: { 200: billingUsageSchema, 401: unauthenticatedEnvelope, 404: notFound },
  },
  signals: {
    method: 'GET',
    path: '/billing/usage/signals',
    summary: 'Which meters are at their cap or paused, with no figure',
    responses: { 200: billingUsageSignalsSchema, 401: unauthenticatedEnvelope, 404: notFound },
  },
  events: {
    method: 'GET',
    path: '/billing/usage/events',
    query: billingUsageEventsQuerySchema,
    summary: 'One meter’s ledger events this cycle, newest first',
    responses: { 200: billingUsageEventsSchema, 401: unauthenticatedEnvelope, 404: notFound },
  },
});
