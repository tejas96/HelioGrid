import { z } from 'zod';
import { defineWorkflow, type TaskQueue, type WorkflowResult } from './registry';

/**
 * An invoice's PDF (`M12-44`): started from the outbox event its issue commits with, so the PDF is
 * made only for an invoice the store holds, and never inside the charge — a render that fails or
 * takes seconds can never roll back a payment. Its id is the INVOICE's, so however often the event
 * is dispatched an invoice gets one run.
 *
 * Three steps. The api writes the page from what the invoice stored at issue, in the company's
 * language (the worker may not import `i18n`); the worker turns the page into a PDF on its own
 * queue; the api stores the PDF and points the invoice at it, once. Ids only in the input
 * (`infra/temporal/README.md` §4); the page and the PDF pass only between steps.
 */
export const invoiceDocumentWorkflow = defineWorkflow({
  name: 'invoiceDocument',
  taskQueue: 'heliogrid-billing-documents',
  input: z.object({
    eventId: z.string().uuid(),
    tenantId: z.string().uuid(),
    invoiceId: z.string().uuid(),
  }),
  result: z.object({ attached: z.boolean() }),
  signals: {},
  queries: {},
  workflowId: (input) => `invoice-document-${input.invoiceId}`,
});

/** Whose invoice, by id. */
export interface InvoiceDocumentStepInput {
  readonly tenantId: string;
  readonly invoiceId: string;
}

/** The page to render; `null` when the invoice already has its PDF, so nothing is made again. */
export type InvoiceDocumentPage = { readonly html: string } | null;

/** The rendered PDF, base64: a Temporal payload is JSON, which carries no raw bytes. */
export interface RenderedDocument {
  readonly pdfBase64: string;
}

/** Whether this run pointed the invoice at its PDF; `false`: an earlier run already had. */
export type InvoiceDocumentStepResult = WorkflowResult<typeof invoiceDocumentWorkflow>;

/**
 * The api's two steps, as both processes see them: the workflow (worker) calls them by NAME and
 * the api registers them by name, so a renamed step is a compile error on both sides.
 */
export interface InvoiceDocumentActivities {
  invoiceDocumentPage(input: InvoiceDocumentStepInput): Promise<InvoiceDocumentPage>;
  attachInvoicePdf(
    input: InvoiceDocumentStepInput & RenderedDocument,
  ): Promise<InvoiceDocumentStepResult>;
}

/**
 * The renderer's queue. Only the worker polls it — it alone carries Chromium — and every document
 * the suite renders shares it, so a slow render waits behind other renders, never behind billing.
 */
export const DOCUMENT_RENDER_QUEUE = 'heliogrid-documents' satisfies TaskQueue;

/**
 * The one document renderer (`03-tech-stack.md` §16, `F3-15`): a whole HTML page in, a PDF out.
 * It shapes every script the suite writes — Devanagari conjuncts included — which is why it is a
 * browser engine. A document is its page; the renderer adds nothing to it.
 */
export interface DocumentRenderActivities {
  renderPdf(input: { readonly html: string }): Promise<RenderedDocument>;
}
