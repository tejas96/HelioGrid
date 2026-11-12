import { z } from 'zod';
import type { RenderedDocument } from './invoice-document';
import { defineWorkflow, type WorkflowResult } from './registry';

/**
 * A payment's receipt PDF (`M11-41`, `M11-45`): made the first time someone asks for it, then kept
 * on the payment and handed out again. Its id is the PAYMENT's, so however often it is asked for,
 * a payment gets one run and one PDF.
 *
 * Three steps, as an invoice's: the api writes the page from the ledger as it stood when the
 * payment was recorded, in the customer's language; the worker prints it on the renderer's queue;
 * the api keeps the PDF against the payment. Ids only in the input (`infra/temporal/README.md` §4).
 */
export const paymentReceiptWorkflow = defineWorkflow({
  name: 'paymentReceipt',
  taskQueue: 'heliogrid-projects',
  input: z.object({
    tenantId: z.string().uuid(),
    entryId: z.string().uuid(),
  }),
  /** The kept PDF; null when the payment is gone or is no payment (a reversal has no receipt). */
  result: z.object({ fileId: z.string().uuid().nullable() }),
  signals: {},
  queries: {},
  workflowId: (input) => `payment-receipt-${input.entryId}`,
});

/** Whose payment, by id. */
export interface PaymentReceiptStepInput {
  readonly tenantId: string;
  readonly entryId: string;
}

/** The page to print; the PDF already kept, so nothing is made again; or null: no such payment. */
export type PaymentReceiptPage =
  | { readonly kind: 'page'; readonly html: string }
  | { readonly kind: 'kept'; readonly fileId: string }
  | null;

export type PaymentReceiptStepResult = WorkflowResult<typeof paymentReceiptWorkflow>;

/**
 * The api's two steps, as both processes see them: the workflow (worker) calls them by NAME and
 * the api registers them by name, so a renamed step is a compile error on both sides.
 */
export interface PaymentReceiptActivities {
  paymentReceiptPage(input: PaymentReceiptStepInput): Promise<PaymentReceiptPage>;
  keepPaymentReceipt(
    input: PaymentReceiptStepInput & RenderedDocument,
  ): Promise<PaymentReceiptStepResult>;
}
