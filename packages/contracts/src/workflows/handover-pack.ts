import { z } from 'zod';
import { defineWorkflow, type WorkflowResult } from './registry';

/**
 * A project's handover pack (`M08-46`, `M08-48`): one PDF of every done checklist row's file and
 * every other file shown to the customer, made after the handover commits — never inside it, so
 * a slow store or a large file can never roll back the handover. Its id is the PROJECT's, so
 * however often the event is dispatched a project gets one pack.
 *
 * One step, in the api beside the project tables: the files' bytes never cross a Temporal payload
 * (a pack is megabytes; a payload is not). Ids only in the input (`infra/temporal/README.md` §4).
 */
export const handoverPackWorkflow = defineWorkflow({
  name: 'handoverPack',
  taskQueue: 'heliogrid-projects',
  input: z.object({
    eventId: z.string().uuid(),
    tenantId: z.string().uuid(),
    projectId: z.string().uuid(),
  }),
  result: z.object({ attached: z.boolean() }),
  signals: {},
  queries: {},
  workflowId: (input) => `handover-pack-${input.projectId}`,
});

/** Whose pack, by id. */
export interface HandoverPackStepInput {
  readonly tenantId: string;
  readonly projectId: string;
}

/** Whether this run put the pack on the project; `false`: an earlier run already had. */
export type HandoverPackStepResult = WorkflowResult<typeof handoverPackWorkflow>;

/**
 * The api's one step, as both processes see it: the workflow (worker) calls it by NAME and the
 * api registers it by name, so a renamed step is a compile error on both sides.
 */
export interface HandoverPackActivities {
  makeHandoverPack(input: HandoverPackStepInput): Promise<HandoverPackStepResult>;
}
