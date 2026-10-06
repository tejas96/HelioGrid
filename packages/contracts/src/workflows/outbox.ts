import { z } from 'zod';
import { platformHealthcheckWorkflow } from './platform';
import { defineWorkflow, type WorkflowDefinition, type WorkflowResult } from './registry';

/**
 * The outbox sweep — the second of the two dispatch paths (`infra/temporal/README.md` §5). A
 * product change writes its event in its own transaction; the api starts the workflow at once
 * after the commit, and this workflow, run by a Temporal Schedule every minute, starts every event
 * the fast path missed. A dispatcher that dies between the commit and the start costs a minute,
 * never the work and never a second run.
 *
 * Its one step runs in the API process, beside the outbox table and the gateway; the worker holds
 * only this sequence.
 */
export const outboxSweepWorkflow = defineWorkflow({
  name: 'outboxSweep',
  taskQueue: 'heliogrid-outbox',
  input: z.object({}),
  result: z.object({ dispatched: z.number().int().nonnegative() }),
  signals: {},
  queries: {},
  workflowId: () => 'outbox-sweep',
});

/** The schedule's permanent id: one per cluster, created by the api when it is absent. */
export const OUTBOX_SWEEP_SCHEDULE_ID = 'outbox-sweep';

/**
 * The sweep's step, as both processes see it. The workflow (worker) calls it by NAME and the api
 * registers it by name, so a renamed step is a compile error on both sides here rather than a
 * workflow that fails every task with "activity function not registered".
 */
export interface OutboxActivities {
  dispatchDueOutboxEvents(): Promise<WorkflowResult<typeof outboxSweepWorkflow>>;
}

/**
 * Every workflow an outbox event may start, by its permanent name. A row naming one this list
 * does not hold stays undispatched — the release that wrote it rolled back — and the sweep never
 * reads it.
 *
 * A stored event is parsed by its workflow's CURRENT input schema at dispatch, so a change to one
 * of these inputs must still parse every payload already stored, or it ships as expand, then
 * contract (`CLAUDE.md` §8).
 *
 * The platform healthcheck is here so the handoff is proven end to end before a product workflow
 * exists, the same reason it was the first workflow.
 */
const OUTBOX_WORKFLOWS: readonly WorkflowDefinition[] = [platformHealthcheckWorkflow];

export const OUTBOX_WORKFLOW_NAMES: readonly string[] = OUTBOX_WORKFLOWS.map(
  (definition) => definition.name,
);

export function outboxWorkflowNamed(name: string): WorkflowDefinition | undefined {
  return OUTBOX_WORKFLOWS.find((definition) => definition.name === name);
}
