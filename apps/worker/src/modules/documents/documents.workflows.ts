import type {
  CreditNoteDocumentActivities,
  CreditNoteDocumentStepResult,
  creditNoteDocumentWorkflow,
  DOCUMENT_RENDER_QUEUE,
  DocumentRenderActivities,
  HandoverPackActivities,
  HandoverPackStepResult,
  handoverPackWorkflow,
  InvoiceDocumentActivities,
  InvoiceDocumentStepResult,
  invoiceDocumentWorkflow,
  WorkflowInput,
} from '@heliogrid/contracts/workflows';
import { proxyActivities } from '@temporalio/workflow';

/**
 * DETERMINISTIC CODE — replayed from history (`platform.workflows.ts` says what that forbids).
 *
 * The page and the attach run in the api, beside the invoice tables, typed against the contract
 * type-only; the render runs here, on the renderer's own queue.
 */
const { invoiceDocumentPage, attachInvoicePdf } = proxyActivities<InvoiceDocumentActivities>({
  // One read or one store write; a step still running after this is stuck.
  startToCloseTimeout: '1 minute',
  // Unbounded on purpose: the invoice and its payment are already committed, so a store or
  // database outage only delays the PDF, and the run waits it out.
  retry: { initialInterval: '10 seconds', maximumInterval: '10 minutes' },
});

const { creditNotePage, attachCreditNotePdf } = proxyActivities<CreditNoteDocumentActivities>({
  startToCloseTimeout: '1 minute',
  // As the invoice's: the refund is committed, so an outage only delays the PDF.
  retry: { initialInterval: '10 seconds', maximumInterval: '10 minutes' },
});

/** The literal the contract names; a renamed queue fails to compile here. */
const RENDER_QUEUE: typeof DOCUMENT_RENDER_QUEUE = 'heliogrid-documents';

const { renderPdf } = proxyActivities<DocumentRenderActivities>({
  taskQueue: RENDER_QUEUE,
  // A cold Chromium starts in seconds and an invoice renders in under one.
  startToCloseTimeout: '2 minutes',
  retry: { initialInterval: '10 seconds', maximumInterval: '10 minutes' },
});

/** The exported name IS the workflow type; `documents.public.ts` asserts it equals the contract's. */
export async function invoiceDocument(
  input: WorkflowInput<typeof invoiceDocumentWorkflow>,
): Promise<InvoiceDocumentStepResult> {
  const invoice = { tenantId: input.tenantId, invoiceId: input.invoiceId };
  const page = await invoiceDocumentPage(invoice);
  if (page === null) return { attached: false };
  const { pdfBase64 } = await renderPdf({ html: page.html });
  return attachInvoicePdf({ ...invoice, pdfBase64 });
}

/** A credit note's PDF (`M12-47`): its page, the render, the attach — as an invoice's. */
export async function creditNoteDocument(
  input: WorkflowInput<typeof creditNoteDocumentWorkflow>,
): Promise<CreditNoteDocumentStepResult> {
  const note = { tenantId: input.tenantId, creditNoteId: input.creditNoteId };
  const page = await creditNotePage(note);
  if (page === null) return { attached: false };
  const { pdfBase64 } = await renderPdf({ html: page.html });
  return attachCreditNotePdf({ ...note, pdfBase64 });
}

const { makeHandoverPack } = proxyActivities<HandoverPackActivities>({
  // Reads every file of the pack from the store and writes the PDF: a large pack takes a while.
  startToCloseTimeout: '5 minutes',
  // Unbounded on purpose: the handover is committed, so an outage only delays the pack.
  retry: { initialInterval: '10 seconds', maximumInterval: '10 minutes' },
});

/** A project's handover pack (`M08-46`): one step in the api, beside the project's files. */
export async function handoverPack(
  input: WorkflowInput<typeof handoverPackWorkflow>,
): Promise<HandoverPackStepResult> {
  return makeHandoverPack({ tenantId: input.tenantId, projectId: input.projectId });
}
