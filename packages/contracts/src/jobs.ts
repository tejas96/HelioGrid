import { z } from 'zod';
import { uuidSchema } from './common';

/**
 * Typed BullMQ job payloads (apps/api/CLAUDE.md): every job has a schema here and an
 * idempotency key; handlers must be idempotent — a retried job never double-applies.
 * Queue names are namespaced `heliogrid.<area>`; job names dot-namespaced within.
 */

/** Envelope every producer wraps its payload in. */
export function jobEnvelope<T extends z.ZodTypeAny>(payload: T) {
  return z.object({
    /** Producer-supplied; duplicate applies are no-ops (usage_events pattern). */
    idempotencyKey: z.string().min(8),
    tenantId: uuidSchema,
    payload,
  });
}

/**
 * Registered job names — extended by each module's slice with its first worker.
 * The time-based product rules (proposal-unopened-3d, task-overdue-2d, snooze wake,
 * 24h-unassigned escalation, dormant-30d) land with their owning modules' tracks.
 */
export const jobNames = z.enum(['platform.healthcheck']);
export type JobName = z.infer<typeof jobNames>;

export const jobPayloadSchemas = {
  'platform.healthcheck': jobEnvelope(z.object({ emittedAt: z.string().datetime() })),
} as const satisfies Record<JobName, z.ZodTypeAny>;
