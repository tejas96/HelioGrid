import type {
  DOCUMENT_RENDER_QUEUE,
  DocumentRenderActivities,
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
