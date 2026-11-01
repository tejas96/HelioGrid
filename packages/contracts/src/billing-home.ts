import {
  BILLING_NOTICES,
  BILLING_PHASES,
  INVOICE_STATUSES,
  SUBSCRIPTION_CAUSES,
} from '@heliogrid/domain';
import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import {
  billingCycleSchema,
  billingStateSchema,
  collectionKindSchema,
  tierSchema,
} from './billing';
import {
  amountSchema,
  currencyCodeSchema,
  extensibleEnum,
  paginated,
  paginationQuerySchema,
  uuidSchema,
} from './common';
import { packLabelSchema } from './document-content';
import { baseError, errorEnvelope, unauthenticatedEnvelope } from './error';
import { fileDownloadSchema } from './file';
import { limitSchema } from './pricing';

const c = initContract();
const instant = z.string().datetime();

/**
 * Where a company's subscription stands, with no amount (`M12-56`: seeing state is everyone's,
 * money is the Owner's). The phase is `billingPhaseAt`'s; each date is set only in the phase that
 * has it. The shell's strip and chip read this route too (`T-SHELL-006`).
 */
export const billingStandingSchema = z
  .object({
    state: billingStateSchema,
    phase: z.enum(BILLING_PHASES),
    /** Null on a trial: it has every plan's capability and no plan (`M12-52`). */
    tier: tierSchema.nullable(),
    cycle: billingCycleSchema.nullable(),
    collection: collectionKindSchema.nullable(),
    stateEnteredAt: instant,
    trialEndsAt: instant.nullable(),
    /** `past_due`: the moment the per-use features pause (`M12-06`). */
    pausesAt: instant.nullable(),
    /** `past_due`: the moment the row halts unpaid. */
    graceEndsAt: instant.nullable(),
    /** The paid period's end: the next bill, a cancelled row's last day, or when it ended. */
    paidPeriodEnd: instant.nullable(),
  })
  .strict();
export type BillingStanding = z.infer<typeof billingStandingSchema>;

/**
 * What a list price bills: the price alone while the platform is not registered for the scheme's
 * tax (`F1-29`), else its tax and the total beside it — the working `How it is worked out` shows.
 */
const saleSchema = z
  .object({
    list: amountSchema,
    taxRateBasisPoints: z.number().int().nonnegative().nullable(),
    tax: amountSchema.nullable(),
    total: amountSchema,
  })
  .strict();

/** A plan's published limits, or the trial's caps, as the pricing page prints them (`M12-55`). */
const includesSchema = z
  .object({
    designCeilingKw: limitSchema,
    proposalsPerMonth: limitSchema,
    activeProjects: limitSchema,
    voiceMinutesIncluded: limitSchema,
    voiceMinuteRate: amountSchema.nullable(),
    storageGb: limitSchema,
  })
  .strict();

/** One meter this cycle: voice in minutes, storage in bytes against a limit in bytes. */
const meterSchema = z
  .object({
    meter: z.enum(['voice_minutes', 'storage']),
    used: z.number().int().nonnegative(),
    included: z.number().int().nonnegative().nullable(),
  })
  .strict();

/** An invoice or a credit note, as a row of the invoices list (`M12-46`). */
const documentRowSchema = z
  .object({
    id: uuidSchema,
    document: z.enum(['invoice', 'credit_note']),
    number: z.string(),
    /** An invoice's status; null on a credit note, which has none. */
    status: extensibleEnum(INVOICE_STATUSES).nullable(),
    issuedAt: instant,
    tier: tierSchema,
    cycle: billingCycleSchema,
    total: amountSchema,
    /** False until the document's PDF is made (`T-M12-012d`): no PDF act is offered before. */
    hasPdf: z.boolean(),
  })
  .strict();

/** The Owner's billing home (`SCR-M12-02`). Every amount is worked out by the server (`F4-04`). */
export const billingHomeSchema = z
  .object({
    standing: billingStandingSchema,
    currencyCode: currencyCodeSchema,
    /** The scheme's tax name once the platform is registered for it, else null (`F1-29`). */
    taxScheme: z.string().nullable(),
    /** The price list's date: the pack revision that published it (`F1-25`). */
    priceListPublishedAt: instant,
    plan: z
      .object({
        listPrice: amountSchema.nullable(),
        nextBill: z.object({ at: instant, sale: saleSchema }).strict().nullable(),
      })
      .strict(),
    includes: includesSchema,
    usage: z.array(meterSchema).max(2),
    method: z
      .object({
        standing: z.enum(['live', 'ended', 'none']),
        /** The rail's name as the pack gives it; null on a link, or a pack revision without it. */
        label: packLabelSchema.nullable(),
        /** The gateway's own page for the live mandate (`M12-10`). */
        manageUrl: z.string().url().nullable(),
      })
      .strict(),
    /** A charge that failed and is still owed, and the page that pays it. */
    due: z
      .object({
        sale: saleSchema,
        failedAt: instant,
        invoiceNumber: z.string().nullable(),
        payUrl: z.string().url().nullable(),
      })
      .strict()
      .nullable(),
    /** A yearly renewal's open invoice and its payment link (`T-M12-012c`). */
    renewal: z
      .object({
        invoiceId: uuidSchema,
        number: z.string(),
        sale: saleSchema,
        dueAt: instant,
        payUrl: z.string().url(),
      })
      .strict()
      .nullable(),
    /** Open only in the first paid cycle's window (`M12-47`). */
    refund: z.object({ closesAt: instant, amount: amountSchema }).strict().nullable(),
    /** A dead row's way back: its own plan again (`M12-08`). Null on an expired trial. */
    reactivation: z
      .object({
        tier: tierSchema,
        cycle: billingCycleSchema,
        sale: saleSchema,
        startsAt: instant.nullable(),
      })
      .strict()
      .nullable(),
    invoices: z
      .object({ latest: z.array(documentRowSchema).max(3), totalCount: z.number().int() })
      .strict(),
    cancellable: z.boolean(),
    salesContact: z.string().email().nullable(),
  })
  .strict();
export type BillingHome = z.infer<typeof billingHomeSchema>;

export const billingDocumentsQuerySchema = paginationQuerySchema.extend({
  /** A number, or part of one. */
  q: z.string().trim().max(40).optional(),
  status: z.enum(['paid', 'failed']).optional(),
});
export type BillingDocumentsQuery = z.infer<typeof billingDocumentsQuerySchema>;

export const billingDocumentsSchema = paginated(documentRowSchema).extend({
  currencyCode: currencyCodeSchema,
  /** Each chip's count under the same search (`SCR-M12-02` decision 12). */
  counts: z.object({ all: z.number().int(), paid: z.number().int(), failed: z.number().int() }),
});
export type BillingDocuments = z.infer<typeof billingDocumentsSchema>;
export type BillingDocumentRow = z.infer<typeof documentRowSchema>;

/** One told notice of the dunning ladder or a trial nudge (`M12-39`), and what cleared it. */
const reminderSchema = z
  .object({
    id: uuidSchema,
    notice: extensibleEnum(BILLING_NOTICES),
    firedAt: instant,
    clearedAt: instant.nullable(),
    paidAt: instant.nullable(),
  })
  .strict();

export const billingRemindersSchema = paginated(reminderSchema).extend({
  /** The notice the ladder tells next, shown as upcoming. */
  next: z
    .object({ notice: extensibleEnum(BILLING_NOTICES), dueAt: instant })
    .strict()
    .nullable(),
});
export type BillingReminders = z.infer<typeof billingRemindersSchema>;

/** Every state the company's subscriptions entered, in the order they happened (§M12.2). */
const historyEntrySchema = z
  .object({
    id: uuidSchema,
    state: billingStateSchema,
    cause: extensibleEnum(SUBSCRIPTION_CAUSES),
    enteredAt: instant,
  })
  .strict();
export const billingHistorySchema = paginated(historyEntrySchema);
export type BillingHistory = z.infer<typeof billingHistorySchema>;

const notFound = errorEnvelope(baseError('NOT_FOUND'));

/**
 * What Billing reads (`SCR-M12-02`). Every route is a read, so no billing state ever refuses one
 * (`BM-32`, `M12-46`). `standing` answers any member; the rest are the Owner's (`M12-56`).
 */
export const billingHomeContract = c.router({
  standing: {
    method: 'GET',
    path: '/billing/standing',
    summary: 'Where the company subscription stands, with no amount',
    responses: { 200: billingStandingSchema, 401: unauthenticatedEnvelope, 404: notFound },
  },
  home: {
    method: 'GET',
    path: '/billing/home',
    summary: 'The Owner billing home: plan, usage, method, what is owed and the latest invoices',
    responses: { 200: billingHomeSchema, 401: unauthenticatedEnvelope, 404: notFound },
  },
  documents: {
    method: 'GET',
    path: '/billing/documents',
    query: billingDocumentsQuerySchema,
    summary: 'Every invoice and credit note, newest first',
    responses: { 200: billingDocumentsSchema, 401: unauthenticatedEnvelope },
  },
  reminders: {
    method: 'GET',
    path: '/billing/reminders',
    query: paginationQuerySchema,
    summary: 'Every payment reminder told, newest first, and the next one due',
    responses: { 200: billingRemindersSchema, 401: unauthenticatedEnvelope },
  },
  history: {
    method: 'GET',
    path: '/billing/history',
    query: paginationQuerySchema,
    summary: 'Every subscription state entered, newest first',
    responses: { 200: billingHistorySchema, 401: unauthenticatedEnvelope },
  },
});

/**
 * An invoice's or a credit note's PDF, signed for a moment (`M12-46`): its own router, since the
 * PDFs are kept by the file module, which the billing module cannot import. 404 while the PDF is
 * not made, or for another company's document.
 */
export const billingDocumentContract = c.router({
  documentDownload: {
    method: 'GET',
    path: '/billing/documents/:id/download-url',
    pathParams: z.object({ id: uuidSchema }),
    summary: 'A short-lived link to an invoice or credit note PDF',
    responses: { 200: fileDownloadSchema, 401: unauthenticatedEnvelope, 404: notFound },
  },
});
