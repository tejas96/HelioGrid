import { z } from 'zod';
import { invoiceDocumentWorkflow, type RenderedDocument } from './invoice-document';
import { defineWorkflow, type WorkflowResult } from './registry';

/**
 * A credit note's PDF (`M12-47`), made as an invoice's is (`invoice-document.ts`): started from the
 * outbox event the refund commits with, on the invoice PDF's queue, rendered by the one renderer.
 * Its id is the CREDIT NOTE's, so a note gets one run however often its event is dispatched.
 */
export const creditNoteDocumentWorkflow = defineWorkflow({
  name: 'creditNoteDocument',
  taskQueue: invoiceDocumentWorkflow.taskQueue,
  input: z.object({
    eventId: z.string().uuid(),
    tenantId: z.string().uuid(),
    creditNoteId: z.string().uuid(),
  }),
  result: z.object({ attached: z.boolean() }),
  signals: {},
  queries: {},
  workflowId: (input) => `credit-note-document-${input.creditNoteId}`,
});

/** Whose credit note, by id. */
export interface CreditNoteDocumentStepInput {
  readonly tenantId: string;
  readonly creditNoteId: string;
}

/** The page to render; `null` when the note already has its PDF. */
export type CreditNoteDocumentPage = { readonly html: string } | null;

export type CreditNoteDocumentStepResult = WorkflowResult<typeof creditNoteDocumentWorkflow>;

/** The api's two steps, called by name from the worker and registered by name in the api. */
export interface CreditNoteDocumentActivities {
  creditNotePage(input: CreditNoteDocumentStepInput): Promise<CreditNoteDocumentPage>;
  attachCreditNotePdf(
    input: CreditNoteDocumentStepInput & RenderedDocument,
  ): Promise<CreditNoteDocumentStepResult>;
}
