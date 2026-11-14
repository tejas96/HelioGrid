import type { ActivityKind } from '@heliogrid/domain';
import { z } from 'zod';
import { uuidSchema } from '../common';
import { activityActorSchema } from './vocabulary';

/* What every timeline entry carries (`M02-35`), and how one kind's entry is declared. */

export const entryShape = {
  id: uuidSchema,
  leadId: uuidSchema.nullable(),
  /** Who did it (`M02-35`); `id` and `name` are null for the system. A name survives deactivation. */
  actor: z.object({
    kind: activityActorSchema,
    id: uuidSchema.nullable(),
    name: z.string().nullable(),
  }),
  /** When it happened by the device's clock — shown, never what orders the stream (`F4-19`). */
  capturedAt: z.string().datetime(),
  /** When the server applied it; the stream is ordered by apply, newest first. */
  appliedAt: z.string().datetime(),
};

/** One kind's entry: the shared facts, the kind, and the body that kind carries. */
export function entryOf<K extends ActivityKind, B extends z.ZodRawShape>(kind: K, body: B) {
  return z.object({ ...entryShape, kind: z.literal(kind), body: z.object(body) });
}
