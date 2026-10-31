import { DOCUMENT_RENDER_QUEUE, invoiceDocumentWorkflow } from '@heliogrid/contracts/workflows';
import type { TemporalWorkerRegistration } from '../../common/temporal/temporal.tokens';
import * as bundledWorkflows from '../../worker.workflows';
import { documentRenderActivities } from './documents.activities';
import * as documentsWorkflows from './documents.workflows';

/** The name check — `platform.public.ts` says why a rename must fail to compile. */
documentsWorkflows satisfies Record<typeof invoiceDocumentWorkflow.name, unknown>;
// And the bundle's one entry re-exports it: an area left out there starts, then fails every task.
bundledWorkflows satisfies Record<typeof invoiceDocumentWorkflow.name, unknown>;

/** The invoice PDF's sequence alone: its page and attach steps run in the api. */
export const invoiceDocumentWorkerRegistration: TemporalWorkerRegistration = {
  taskQueue: invoiceDocumentWorkflow.taskQueue,
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
