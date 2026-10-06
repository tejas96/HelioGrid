import type { WorkflowDefinition, WorkflowInput } from '@heliogrid/contracts/workflows';
import { orchestrationOutbox, type TenantScopedDb } from '@heliogrid/db';
import { sql } from 'drizzle-orm';

/**
 * Writes one handoff to Temporal in the CALLER's transaction — the product change and its event
 * commit together or not at all (`infra/temporal/README.md` §5). Never a transaction of its own:
 * an event committed apart from its change is the dual write the outbox exists to prevent.
 *
 * The input is parsed against its workflow's contract here, where the caller still has a stack,
 * not at dispatch a minute later. Its `eventId` is the row's id and the stem of the workflow id.
 * The caller then hands that id to `OutboxDispatcher.dispatchNow` after its commit.
 */
export async function recordOutboxEvent<D extends WorkflowDefinition>(
  tx: TenantScopedDb,
  tenantId: string,
  definition: D,
  input: WorkflowInput<D> & { readonly eventId: string },
): Promise<void> {
  const payload = definition.input.parse(input);
  // RLS holds the ROW to the pinned tenant; this holds the WORKFLOW to it, since a durable run reads
  // its tenant from the input and never from the row.
  if ('tenantId' in payload && payload.tenantId !== tenantId) {
    throw new Error(`an outbox event for ${definition.name} names another tenant than its own`);
  }
  await tx.insert(orchestrationOutbox).values({
    id: input.eventId,
    tenantId,
    workflow: definition.name,
    payload,
    // The transaction's own clock, the one the sweep's grace is measured against.
    createdAt: sql`now()`,
  });
}
