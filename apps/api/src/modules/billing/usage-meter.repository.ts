import { usageRecordWorkflow } from '@heliogrid/contracts/workflows';
import type { TenantScopedDb } from '@heliogrid/db';
import { uuidv7 } from '@heliogrid/db/uuid';
import type { BilledLedgerMeter, CostLine, SubjectKind } from '@heliogrid/domain';
import { recordOutboxEvent } from '../../common/temporal/outbox.repository';

/**
 * One metered unit of work, as its producer knows it (`M12-33`). A billed meter says whether this
 * unit bills — a detection that returned nothing does not; a cost line never does, and the type
 * refuses one that claims to (`M12-37`).
 */
export type MeteredUnit = {
  readonly tenantId: string;
  readonly quantity: number;
  /** What the unit came from — the call, the detection, the send. */
  readonly subjectKind: SubjectKind;
  readonly subjectRef: string;
  /** Stable across every retry of the same unit: the call's id, a webhook's event id. */
  readonly idempotencyKey: string;
  readonly occurredAt: number;
} & (
  | { readonly meter: BilledLedgerMeter; readonly billable: boolean }
  | { readonly meter: CostLine; readonly billable: false }
);

/**
 * Meters a unit inside the producer's OWN transaction (`M12-18`): it writes the outbox event and
 * nothing else, so the act and its handoff commit together and the ledger row is written after,
 * by the `usageRecord` step — a failing ledger write never fails or delays the act. Returns the
 * event id; the producer's service hands it to `OutboxDispatcher.dispatchNow` after its commit.
 */
export async function meterUsage(tx: TenantScopedDb, unit: MeteredUnit): Promise<string> {
  const eventId = uuidv7();
  await recordOutboxEvent(tx, unit.tenantId, usageRecordWorkflow, {
    eventId,
    tenantId: unit.tenantId,
    meter: unit.meter,
    quantity: unit.quantity,
    billable: unit.billable,
    subjectKind: unit.subjectKind,
    subjectRef: unit.subjectRef,
    idempotencyKey: unit.idempotencyKey,
    occurredAt: new Date(unit.occurredAt).toISOString(),
  });
  return eventId;
}
