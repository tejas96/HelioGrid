import { type DbTransaction, proposal } from '@heliogrid/db';
import { PROPOSAL_STATUSES_ON_A_LINK, type ProposalActResult } from '@heliogrid/domain';
import { proposalNumberOf } from '@heliogrid/domain/server';
import { and, eq, inArray, ne } from 'drizzle-orm';
import type { Act } from '../../common/auth/session-context';
import {
  activeMemberOf,
  type LockedLead,
  moveTaskDue,
  openTaskRaisedBy,
  personOf,
  raiseTask,
  recordLeadMoves,
} from '../crm/crm.public';
import { companyOwner, type ProposalRecord } from './proposals.facts.repository';

/*
 * What a share or a withdrawal sets moving beside its own row (`M06-45`, `M06-55`, `M06-58`): the
 * older proposal it replaces, the lead's stage, and the one follow-up task — each inside the act's
 * transaction, after the lead and the proposal are held.
 */

export const numberOf = (stored: ProposalRecord): string | null =>
  stored.number === null ? null : proposalNumberOf(stored.number);

/**
 * The proposal as the share leaves it (`M06-45`): its newest version the one the customer reads,
 * with no open and no answer yet, and every other proposal of the lead replaced by it.
 */
export async function takeItsPlace(
  tx: DbTransaction,
  tenantId: string,
  stored: ProposalRecord,
  result: Extract<ProposalActResult, { kind: 'moved' }>,
  goesLive: boolean,
  act: Act,
): Promise<void> {
  const now = new Date(act.now);
  if (goesLive) {
    await tx
      .update(proposal)
      .set({
        status: result.next.status,
        sharedVersion: result.next.sharedVersion,
        sharedAt: now,
        openedAt: null,
        answer: null,
        answeredAt: null,
        updatedAt: now,
        updatedBy: act.actorUserId,
      })
      .where(and(eq(proposal.tenantId, tenantId), eq(proposal.id, stored.id)));
  }
  if (result.supersedesOthers) await supersedeOthers(tx, tenantId, stored);
}

/** A newer proposal went live: every other one on the lead that a link served is replaced (`M06-45`). */
async function supersedeOthers(
  tx: DbTransaction,
  tenantId: string,
  stored: ProposalRecord,
): Promise<void> {
  await tx
    .update(proposal)
    .set({ status: 'superseded' })
    .where(
      and(
        eq(proposal.tenantId, tenantId),
        eq(proposal.leadId, stored.leadId),
        ne(proposal.id, stored.id),
        inArray(proposal.status, [...PROPOSAL_STATUSES_ON_A_LINK]),
      ),
    );
}

/** Whether another proposal on the lead is still with the customer — its follow-up then stays. */
export async function anotherIsLive(
  tx: DbTransaction,
  tenantId: string,
  stored: ProposalRecord,
): Promise<boolean> {
  const [other] = await tx
    .select({ id: proposal.id })
    .from(proposal)
    .where(
      and(
        eq(proposal.tenantId, tenantId),
        eq(proposal.leadId, stored.leadId),
        ne(proposal.id, stored.id),
        inArray(proposal.status, [...PROPOSAL_STATUSES_ON_A_LINK]),
      ),
    )
    .limit(1);
  return other !== undefined;
}

/** What the act did to its lead: woken if parked, moved forward where it was behind (`M06-45`). */
export async function moveLead(
  tx: DbTransaction,
  locked: LockedLead,
  result: Extract<ProposalActResult, { kind: 'moved' }>,
  act: Act,
  capturedAt: Date,
): Promise<void> {
  if (result.lead.transitions.length === 0) return;
  await recordLeadMoves(
    tx,
    locked,
    {
      kind: 'moved',
      next: result.lead.lead,
      transitions: result.lead.transitions,
      raisesTask: null,
    },
    personOf(act),
    capturedAt,
  );
}

/**
 * The one open proposal follow-up of the lead (`M06-55`): raised by the first share, moved by a
 * later one, and always with who holds the lead now — the EPC Owner when it has no active owner.
 */
export async function followUp(
  tx: DbTransaction,
  locked: LockedLead,
  dueAt: Date,
  act: Act,
): Promise<void> {
  const { tenantId, leadId } = locked;
  const assigneeUserId = await holderOf(tx, locked, act);
  const open = await openTaskRaisedBy(tx, tenantId, leadId, ['proposal_shared']);
  if (open !== null) {
    await moveTaskDue(tx, tenantId, open.id, { dueAt, assigneeUserId });
    return;
  }
  await raiseTask(tx, {
    tenantId,
    leadId,
    assigneeUserId,
    kind: 'follow_up',
    provenance: 'proposal_shared',
    dueAt,
    raisedBy: act.actorUserId,
    at: new Date(act.now),
  });
}

/** Who a proposal task goes to (`M06-55`): the lead's owner while active, else the EPC Owner, else who acted. */
export async function holderOf(tx: DbTransaction, locked: LockedLead, act: Act): Promise<string> {
  const owner = locked.lifecycle.ownerId;
  if (owner !== null && (await activeMemberOf(tx, locked.tenantId, owner)) !== null) return owner;
  return (await companyOwner(tx, locked.tenantId))?.userId ?? act.actorUserId;
}
