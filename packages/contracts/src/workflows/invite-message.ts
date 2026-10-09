import { z } from 'zod';
import { defineWorkflow, type WorkflowResult } from './registry';

/**
 * The team invite's text (`M01-12`): started from the outbox event the send commits with, so a
 * text leaves only for an invite the store holds. Its id is the INVITATION's, not the event's, so
 * however often the event is dispatched an invite gets one run.
 *
 * The input is ids only (`infra/temporal/README.md` §4): the link's secret is made again from the
 * invitation id inside the step, never carried here. The worker holds the sequence; the step runs
 * in the api, beside the invitation's tables.
 */
export const inviteMessageWorkflow = defineWorkflow({
  name: 'inviteMessage',
  taskQueue: 'heliogrid-team',
  input: z.object({
    eventId: z.string().uuid(),
    tenantId: z.string().uuid(),
    invitationId: z.string().uuid(),
  }),
  result: z.object({ sent: z.boolean() }),
  signals: {},
  queries: {},
  workflowId: (input) => `invite-message-${input.invitationId}`,
});

/** What the step is told: whose invite, by id. */
export interface InviteMessageStepInput {
  readonly tenantId: string;
  readonly invitationId: string;
}

/** Whether a text left: an invite no longer pending — withdrawn, answered, run out — gets none. */
export type InviteMessageStepResult = WorkflowResult<typeof inviteMessageWorkflow>;

/**
 * The step, as both processes see it: the workflow (worker) calls it by NAME and the api registers
 * it by name, so a renamed step is a compile error on both sides.
 */
export interface InviteMessageActivities {
  sendInviteMessage(input: InviteMessageStepInput): Promise<InviteMessageStepResult>;
}
