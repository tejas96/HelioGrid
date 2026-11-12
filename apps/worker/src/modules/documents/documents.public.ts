import {
  type creditNoteDocumentWorkflow,
  DOCUMENT_RENDER_QUEUE,
  handoverPackWorkflow,
  invoiceDocumentWorkflow,
  type paymentReceiptWorkflow,
} from '@heliogrid/contracts/workflows';
import type { TemporalWorkerRegistration } from '../../common/temporal/temporal.tokens';
import * as bundledWorkflows from '../../worker.workflows';
import { documentRenderActivities } from './documents.activities';
import * as documentsWorkflows from './documents.workflows';

/** The name check — `platform.public.ts` says why a rename must fail to compile. */
type DocumentWorkflowName =
  | typeof invoiceDocumentWorkflow.name
  | typeof creditNoteDocumentWorkflow.name
  | typeof handoverPackWorkflow.name
  | typeof paymentReceiptWorkflow.name;
documentsWorkflows satisfies Record<DocumentWorkflowName, unknown>;
// And the bundle's one entry re-exports it: an area left out there starts, then fails every task.
bundledWorkflows satisfies Record<DocumentWorkflowName, unknown>;

/** The invoice and credit note PDFs' sequences alone: their page and attach steps run in the api. */
export const invoiceDocumentWorkerRegistration: TemporalWorkerRegistration = {
  taskQueue: invoiceDocumentWorkflow.taskQueue,
};

/**
 * A project's handover pack and a payment's receipt: their steps run in the api, beside the
 * project's files and ledger, on this one queue.
 */
export const handoverPackWorkerRegistration: TemporalWorkerRegistration = {
  taskQueue: handoverPackWorkflow.taskQueue,
};

/**
 * Renders one machine runs at once (`07-integrations.md` §10): each holds a Chromium page of
 * 300–500 MB, beside every billing workflow this process also runs.
 */
const RENDERS_AT_ONCE = 2;

/** The renderer's queue: only this process polls it, since only its image carries Chromium. */
export const documentRenderWorkerRegistration: TemporalWorkerRegistration = {
  taskQueue: DOCUMENT_RENDER_QUEUE,
  activities: documentRenderActivities,
  maxConcurrentActivities: RENDERS_AT_ONCE,
};
