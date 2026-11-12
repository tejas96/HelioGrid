import {
  PAYMENT_ENTRY_KINDS,
  PAYMENT_REASON_LIMIT,
  PAYMENT_REFERENCE_LIMIT,
  PAYMENT_REFUSALS,
  SCHEDULE_SOURCES,
  TRANCHE_STATES,
} from '@heliogrid/domain';
import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { payToSchema } from '../collections-settings';
import {
  amountSchema,
  createHeadersSchema,
  extensibleEnum,
  nonNegativeAmountSchema,
  uuidSchema,
} from '../common';
import { capturedAtSchema, memberRefSchema } from '../crm/schemas';
import { errorEnvelopeWithFacts, keyReusedEnvelope, unauthenticatedEnvelope } from '../error';
import { fileDownloadSchema } from '../file';
import { calendarDateSchema } from '../tenant-settings';
import { projectMoneySchema } from './money';
import { moneyDueQuerySchema, moneyDueSchema } from './money-due';
import { projectNotFound } from './projects';
import { projectParamsSchema, projectStageReadSchema } from './schemas';

const c = initContract();

/*
 * A project's money (`M11`). The customer pays the company straight — its UPI ID or its bank
 * account — and a person records it (owner ruling 2026-11-11): no link, no confirmation, nothing
 * sent by the product. Every figure is the server's (`F4-04`), as a decimal string in the
 * company's currency; a screen renders it.
 */

export const trancheStateSchema = z.enum(TRANCHE_STATES);
export const paymentEntryKindSchema = z.enum(PAYMENT_ENTRY_KINDS);
export const scheduleSourceSchema = z.enum(SCHEDULE_SOURCES);
export const paymentRefusalSchema = z.enum(PAYMENT_REFUSALS);

/** One part of the schedule (`M11-52`): its state, what it asks, what came in and what is left. */
export const projectPartSchema = z.object({
  id: uuidSchema,
  position: z.number().int().positive(),
  label: z.string(),
  share: z.string(),
  amount: nonNegativeAmountSchema,
  dueOnStage: projectStageReadSchema,
  state: extensibleEnum(TRANCHE_STATES),
  received: amountSchema,
  outstanding: nonNegativeAmountSchema,
  /** What came in above the part's amount — stated, never moved (`M11-36`). */
  extra: nonNegativeAmountSchema,
  dueOn: calendarDateSchema.nullable(),
  waived: z
    .object({ by: memberRefSchema, at: z.string().datetime(), reason: z.string() })
    .nullable(),
  lastShared: z.object({ by: memberRefSchema, at: z.string().datetime() }).nullable(),
});
export type ProjectPart = z.infer<typeof projectPartSchema>;

/** One ledger entry (`M11-41`, `M11-42`): what came in, against which part, how, and who said so. */
export const projectPaymentEntrySchema = z.object({
  id: uuidSchema,
  partId: uuidSchema,
  kind: extensibleEnum(PAYMENT_ENTRY_KINDS),
  amount: amountSchema,
  /** The market pack's mode key; the device shows the pack's word for it. */
  mode: z.string().nullable(),
  reference: z.string().nullable(),
  receivedOn: calendarDateSchema.nullable(),
  /** `RCPT-0187`; a reversal has none. */
  receiptNumber: z.string().nullable(),
  /** The receipt photo, stored against the payment once it was saved (`M11-37`). */
  fileId: uuidSchema.nullable(),
  recordedAt: z.string().datetime(),
  recordedBy: memberRefSchema,
  /** A reversal's payment, and its reason. */
  reversesId: uuidSchema.nullable(),
  reason: z.string().nullable(),
  /** This payment was reversed (`M11-47`): both rows stay, and the totals show it. */
  reversed: z.boolean(),
});
export type ProjectPaymentEntry = z.infer<typeof projectPaymentEntrySchema>;

/** A part's pay request: the UPI request for exactly what it owes, its note, and the message. */
export const payRequestSchema = z.object({
  partId: uuidSchema,
  amount: nonNegativeAmountSchema,
  /** `upi://pay?…`, or null where the company has no UPI ID or the amount is over the limit. */
  upiUri: z.string().nullable(),
  /** Above the market's UPI limit the sheet opens on bank transfer and says why. */
  overUpiLimit: z.boolean(),
  /** What both bank statements show: `PRJ-0042 · Part 2`. */
  note: z.string(),
  /** The message in the customer's language, with the amount and how to pay. */
  message: z.object({ language: z.string(), text: z.string() }),
  /**
   * The message opened in the customer's chat, to their number, ready to send (`M11-26`); null
   * where the market names no chat app.
   */
  chatUri: z.string().nullable(),
});
export type PayRequest = z.infer<typeof payRequestSchema>;

/** What the reader may do here (`F2.M11.*`). */
export const paymentActsSchema = z.object({
  record: z.boolean(),
  waive: z.boolean(),
  share: z.boolean(),
});

/** The payments screen (`SCR-M11-02`): the whole schedule, the ledger and the requests. */
export const projectPaymentsSchema = z.object({
  projectId: uuidSchema,
  number: z.string(),
  name: z.string().nullable(),
  stage: projectStageReadSchema,
  today: calendarDateSchema,
  money: projectMoneySchema,
  /** Empty when the company had no payment terms at Mark won (`M11-15`). */
  parts: z.array(projectPartSchema),
  entries: z.array(projectPaymentEntrySchema),
  payTo: payToSchema,
  /** One per part that still owes money, due first. */
  requests: z.array(payRequestSchema),
  /** The market pack's modes a payment may be recorded as (`M11-35`). */
  modes: z.array(z.string()),
  acts: paymentActsSchema,
});
export type ProjectPayments = z.infer<typeof projectPaymentsSchema>;

/** A recording's answer: the screen as it now stands and the payment it wrote, for its photo. */
export const recordedPaymentSchema = projectPaymentsSchema.extend({ recordedId: uuidSchema });
export type RecordedPayment = z.infer<typeof recordedPaymentSchema>;

export const PAYMENT_ACT_REFUSED = 'PAYMENT_ACT_REFUSED' as const;
export const paymentActRefusedEnvelope = errorEnvelopeWithFacts(
  z.literal(PAYMENT_ACT_REFUSED),
  z.object({
    refusal: extensibleEnum(PAYMENT_REFUSALS),
    /** For `reference_used`: the receipt that already carries the reference. */
    receiptNumber: z.string().nullable(),
  }),
);

const reasonSchema = z.string().trim().min(1).max(PAYMENT_REASON_LIMIT);

/** Recording money that arrived (`M11-33`, `M11-34`): the amount is filled with what is left. */
export const recordPaymentSchema = z
  .object({
    partId: uuidSchema,
    amount: nonNegativeAmountSchema,
    mode: z.string().min(1).max(40),
    reference: z.string().trim().max(PAYMENT_REFERENCE_LIMIT).nullable(),
    receivedOn: calendarDateSchema,
    capturedAt: capturedAtSchema,
  })
  .strict();
export type RecordPayment = z.infer<typeof recordPaymentSchema>;

export const reversePaymentSchema = z
  .object({ reason: reasonSchema, capturedAt: capturedAtSchema })
  .strict();
export const waivePartSchema = z
  .object({ reason: reasonSchema, capturedAt: capturedAtSchema })
  .strict();
export const shareRequestSchema = z.object({ capturedAt: capturedAtSchema }).strict();

export const partParamsSchema = projectParamsSchema.extend({ partId: uuidSchema });
export const entryParamsSchema = projectParamsSchema.extend({ entryId: uuidSchema });

/** The receipt as text to share, in the customer's language (`M11-41`). */
export const paymentReceiptSchema = z.object({
  receiptNumber: z.string(),
  language: z.string(),
  text: z.string(),
});
export type PaymentReceipt = z.infer<typeof paymentReceiptSchema>;

/** A payment's receipt PDF (`M11-41`): its link, or null while it is still being made. */
export const receiptPdfSchema = z.object({ download: fileDownloadSchema.nullable() });
export type ReceiptPdf = z.infer<typeof receiptPdfSchema>;

/** Whether a reference is already on a receipt that stands — said while it is typed (`M11-38`). */
export const referenceCheckQuerySchema = z.object({
  reference: z.string().trim().min(1).max(PAYMENT_REFERENCE_LIMIT),
});
export const referenceCheckSchema = z.object({ receiptNumber: z.string().nullable() });
export type ReferenceCheck = z.infer<typeof referenceCheckSchema>;

const answers = {
  200: projectPaymentsSchema,
  401: unauthenticatedEnvelope,
  404: projectNotFound,
  422: paymentActRefusedEnvelope,
} as const;

export const paymentsContract = c.router({
  moneyDue: {
    method: 'GET',
    path: '/payments/due',
    query: moneyDueQuerySchema,
    summary: 'Money due — every part due and unpaid that the reader may see, longest waiting first',
    responses: { 200: moneyDueSchema, 401: unauthenticatedEnvelope },
  },
  payments: {
    method: 'GET',
    path: '/projects/:id/payments',
    pathParams: projectParamsSchema,
    summary: 'A project’s schedule, ledger and pay requests (`SCR-M11-02`)',
    responses: { 200: projectPaymentsSchema, 401: unauthenticatedEnvelope, 404: projectNotFound },
  },
  record: {
    method: 'POST',
    path: '/projects/:id/payments',
    pathParams: projectParamsSchema,
    headers: createHeadersSchema,
    body: recordPaymentSchema,
    summary: 'Record money that arrived against a part (`M11-33`); a retry returns the first entry',
    responses: {
      201: recordedPaymentSchema,
      401: unauthenticatedEnvelope,
      404: projectNotFound,
      422: z.union([paymentActRefusedEnvelope, keyReusedEnvelope]),
    },
  },
  reverse: {
    method: 'POST',
    path: '/projects/:id/payments/:entryId/reverse',
    pathParams: entryParamsSchema,
    body: reversePaymentSchema,
    summary: 'Take a payment back with its reason — the original stays (`M11-46`)',
    responses: answers,
  },
  waive: {
    method: 'POST',
    path: '/projects/:id/parts/:partId/waive',
    pathParams: partParamsSchema,
    body: waivePartSchema,
    summary: 'Waive a part with its reason — terminal, never counted as collected (`M11-49`)',
    responses: answers,
  },
  shared: {
    method: 'POST',
    path: '/projects/:id/parts/:partId/shared',
    pathParams: partParamsSchema,
    body: shareRequestSchema,
    summary: 'Note that a person shared this part’s pay request — a tap, never a delivery',
    responses: answers,
  },
  receiptPdf: {
    method: 'GET',
    path: '/projects/:id/payments/:entryId/receipt-pdf',
    pathParams: entryParamsSchema,
    summary:
      'A payment’s receipt PDF in the customer’s language (`M11-41`): made on first ask, then kept; null while it is made',
    responses: { 200: receiptPdfSchema, 401: unauthenticatedEnvelope, 404: projectNotFound },
  },
  referenceCheck: {
    method: 'GET',
    path: '/payments/references',
    query: referenceCheckQuerySchema,
    summary: 'Whether a UTR or cheque number is already on a receipt that stands (`M11-38`)',
    responses: { 200: referenceCheckSchema, 401: unauthenticatedEnvelope },
  },
  receipt: {
    method: 'GET',
    path: '/projects/:id/payments/:entryId/receipt',
    pathParams: entryParamsSchema,
    summary: 'A payment’s receipt as text, in the customer’s language (`M11-41`)',
    responses: { 200: paymentReceiptSchema, 401: unauthenticatedEnvelope, 404: projectNotFound },
  },
});
