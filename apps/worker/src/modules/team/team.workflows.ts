import type {
  InviteMessageActivities,
  InviteMessageStepResult,
  inviteMessageWorkflow,
  WorkflowInput,
} from '@heliogrid/contracts/workflows';
import { proxyActivities } from '@temporalio/workflow';

/**
 * DETERMINISTIC CODE — replayed from history (`platform.workflows.ts` says what that forbids).
 *
 * The step is typed against the contract, type-only: it runs in the api, beside the invitation's
 * tables, and this process never loads its implementation.
 */
const { sendInviteMessage } = proxyActivities<InviteMessageActivities>({
  // One read and one carrier call; a step still running after this is stuck.
  startToCloseTimeout: '30 seconds',
  // Bounded, about two and a half minutes in all: a carrier still refusing after that refuses the
  // number, and the invite stays pending for the owner to withdraw and send again.
  retry: { initialInterval: '10 seconds', maximumAttempts: 5 },
});

/** The exported name IS the workflow type; `team.public.ts` asserts it equals the contract's. */
export async function inviteMessage(
  input: WorkflowInput<typeof inviteMessageWorkflow>,
): Promise<InviteMessageStepResult> {
  return sendInviteMessage({ tenantId: input.tenantId, invitationId: input.invitationId });
}
