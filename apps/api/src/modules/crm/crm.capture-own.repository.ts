import { type DbTransaction, lead } from '@heliogrid/db';
import { assign } from '@heliogrid/domain';
import { and, eq } from 'drizzle-orm';
import type { Act } from '../../common/auth/session-context';
import { memberRefOf, openLeadCountOf } from './crm.assign-load.repository';
import { assignedLeadColumns, recordHandOver } from './crm.assignment.repository';
import type { MadeLead } from './crm.new-lead.repository';
import { lifecycleOf } from './internal/lead-lifecycle';

/**
 * *New proposal*'s capture (`T-M06-001` ruling): the lead is its maker's from its first moment, in
 * the capture's own transaction — so a Sales Executive, whose reach is their own leads, opens the
 * builder on it at once. Recorded as any assignment is (`recordHandOver`): the trail row, the
 * timeline entry; no notice, since the new owner is the one acting.
 */
export async function takeOnCapture(
  tx: DbTransaction,
  tenantId: string,
  made: MadeLead,
  act: Act,
): Promise<void> {
  const [target] = await tx
    .select(assignedLeadColumns)
    .from(lead)
    .where(and(eq(lead.tenantId, tenantId), eq(lead.id, made.leadId)));
  if (target === undefined) throw new Error(`lead ${made.leadId} vanished inside its capture`);
  const result = assign(lifecycleOf(target), act.actorUserId);
  if (result.kind === 'refused') throw new Error(`a new lead refused its maker: ${result.refusal}`);
  const to = await memberRefOf(tx, act.actorUserId);
  if (to === null) throw new Error(`the capturer ${act.actorUserId} is not a member`);
  await recordHandOver(
    tx,
    {
      tenantId,
      leadId: made.leadId,
      customerId: made.customerId,
      result,
      from: null,
      to,
      openCount: await openLeadCountOf(tx, tenantId, act.actorUserId),
      reason: null,
      taskHolderId: act.actorUserId,
    },
    act,
  );
}
