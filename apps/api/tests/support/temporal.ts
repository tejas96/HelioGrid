import { WorkflowExecutionAlreadyStartedError } from '@temporalio/client';
import type { TemporalConnection } from '../../src/common/temporal/temporal.client';
import { TemporalGateway } from '../../src/common/temporal/temporal.gateway';

/**
 * Temporal's client, recording what the gateway asked of it. `alreadyStarted` answers as the
 * server does for an id whose run has finished under `REJECT_DUPLICATE`; a start of an id in
 * `unreachableFor` fails as a lost connection does.
 */
export function aRecordingTemporal(
  answer: 'accepted' | 'alreadyStarted' = 'accepted',
  unreachableFor: readonly string[] = [],
) {
  const starts: Array<Record<string, unknown>> = [];
  const client = {
    workflow: {
      start: async (type: string, options: Record<string, unknown>) => {
        if (unreachableFor.includes(String(options.workflowId))) throw new Error('unreachable');
        starts.push(options);
        if (answer === 'alreadyStarted') {
          throw new WorkflowExecutionAlreadyStartedError(
            'already started',
            String(options.workflowId),
            type,
          );
        }
        return { workflowId: options.workflowId };
      },
      getHandle: (workflowId: string) => ({ workflowId }),
    },
  };
  const connection = { client: async () => client } as unknown as TemporalConnection;
  return {
    gateway: new TemporalGateway(connection),
    starts,
    startedIds: () => starts.map((options) => options.workflowId),
  };
}
