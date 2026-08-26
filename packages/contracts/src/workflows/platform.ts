import { z } from 'zod';
import { defineWorkflow } from './registry';

/**
 * The platform healthcheck — the same fact the `platform.healthcheck` BullMQ job carried,
 * re-expressed as a workflow. It is deliberately the FIRST and only one: the cutover proves
 * the path end to end without a product module depending on an unproven mechanism.
 *
 * It is signal-driven on purpose. A workflow that completes instantly cannot be caught
 * mid-flight, and every durability proof needs one that is still running when a worker is
 * restarted or a certificate is rotated.
 */
export const platformHealthcheckWorkflow = defineWorkflow({
  // A valid JS identifier, and identical to the function the worker exports — Temporal
  // resolves a workflow by exported name. Grouping lives in the TASK QUEUE, not in a dotted
  // type name; a dotted name simply cannot be exported and fails at the first task.
  name: 'platformHealthcheck',
  taskQueue: 'heliogrid-platform',

  input: z.object({
    /**
     * The durable event this workflow was started FOR. It is the dedupe key, so it must be
     * stable across dispatcher retries — an outbox row id, never a fresh uuid per attempt.
     */
    eventId: z.string().min(8),
    emittedAt: z.string().datetime(),
  }),

  result: z.object({
    eventId: z.string(),
    beats: z.array(z.object({ key: z.string(), at: z.string().datetime() })),
  }),

  signals: {
    /** Ends the wait. Carries nothing: the fact of the signal IS the message. */
    finish: z.object({}),
  },

  queries: {
    /** Readable while the workflow is running — how a caller inspects progress. */
    beatsRecorded: z.number().int().nonnegative(),
  },

  workflowId: (input) => `platform.healthcheck-${input.eventId}`, // the ID may be dotted
});
