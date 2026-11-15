import { z } from 'zod';
import type { SignedUpload } from '../ports/object-store';
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
  /**
   * A page the web draws from the product's own parts, printed as it stands: the proposal document
   * has one renderer, so its PDF cannot differ from its preview or the customer's link (`F5-38`).
   * The browser may load from `origins` alone — the web and the api — and every other request is
   * refused. It prints once the page marks itself ready (`PRINT_READY_ATTRIBUTE`), never before, and
   * fails at once on a page that answers an error or marks itself refused (`PRINT_REFUSED_ATTRIBUTE`).
   * Its bytes go to the store through `put`, never into the answer: a proposal with its pictures
   * prints at megabytes, past what a Temporal payload may carry.
   */
  renderPagePdf(input: PageToPrint): Promise<PrintedDocument>;
}

/**
 * A page to print: its address, the only origins its requests may reach, and the store's signed
 * address its PDF is PUT to (sent from the renderer's own process, never from the page).
 */
export interface PageToPrint {
  readonly url: string;
  readonly origins: readonly string[];
  readonly put: SignedUpload;
}

/** What the renderer PUT, for the keep step to check the store against. */
export interface PrintedDocument {
  readonly byteSize: number;
  /** Base64 SHA-256 of the bytes PUT. */
  readonly checksumSha256: string;
}

/** The attribute a print page sets on its root element once every page of the document is drawn. */
export const PRINT_READY_ATTRIBUTE = 'data-print-ready';

/**
 * The attribute a print page sets on its root element at once when its read is refused — a grant
 * expired or not its own — so the renderer fails the print now instead of waiting out its timeout,
 * and never keeps an empty page as the PDF.
 */
export const PRINT_REFUSED_ATTRIBUTE = 'data-print-refused';
