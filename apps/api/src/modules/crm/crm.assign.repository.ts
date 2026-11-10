import type { Assignee, BulkAssignResult, LeadDetail, MemberRef } from '@heliogrid/contracts';
import { type DbTransaction, lead, type TenantPool } from '@heliogrid/db';
import { assign, type LeadActRefusal, type LeadActResult } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, inArray, or, sql } from 'drizzle-orm';
import type { Act } from '../../common/auth/session-context';
import { TENANT_DB } from '../../common/db/tenant.token';
import {
  leadHoldersOf,
  memberRefOf,
  memberRefsOf,
  openLeadCountOf,
  openLeadCountsOf,
  overdueTaskCountsOf,
} from './crm.assign-load.repository';
import {
  type AssignNotice,
  assignedLeadColumns,
  noticeNewOwner,
  recordHandOver,
  taskHolderOf,
} from './crm.assignment.repository';
import { loadLeadDetail } from './crm.lead-detail.repository';
import { lockLead, lockLeads } from './crm.lead-lock.repository';
import { leadScopeAsSeenWhere, leadScopeWhere } from './crm.scope.repository';
import { lifecycleOf } from './internal/lead-lifecycle';
import type { LeadMoney } from './internal/lead-wire';
import type { LeadReader } from './internal/reader';

/** One assign as sent: to whom, the owner the screen showed, and why on a reassignment. */
export interface AssignOrder {
  readonly assigneeId: string;
  readonly expectedOwnerId: string | null;
  readonly reason: string | null;
}

/** A selection for one person; `reason` moves leads someone else owns too (`M02-30`). */
export interface BulkAssignOrder {
  readonly leadIds: readonly string[];
  readonly assigneeId: string;
  readonly reason: string | null;
}

/** A write's answer and the notices it wrote, whose pushes leave after the commit. */
interface Noticed {
  readonly notified: readonly string[];
}

export type AssignOutcome =
  | ({ readonly outcome: 'assigned'; readonly detail: LeadDetail } & Noticed)
  | { readonly outcome: 'not-found' }
  | { readonly outcome: 'assignee-unavailable' }
  | { readonly outcome: 'already-assigned'; readonly owner: MemberRef | null }
  | { readonly outcome: 'refused'; readonly refusal: LeadActRefusal };

export type BulkAssignAnswer =
  | ({ readonly outcome: 'done'; readonly results: BulkAssignResult[] } & Noticed)
  | { readonly outcome: 'assignee-unavailable' };

const ASSIGNEE_UNAVAILABLE = { outcome: 'assignee-unavailable' } as const;

/** One lead of a selection: domain's answer, or the owner it stays with on a send with no reason. */
type BulkDecision =
  | { readonly kind: 'decided'; readonly result: LeadActResult }
  | { readonly kind: 'kept'; readonly owner: MemberRef };

/** What became of one lead of a selection; nothing decided is a lead out of reach. */
function bulkResultOf(leadId: string, decision: BulkDecision | undefined): BulkAssignResult {
  if (decision === undefined) return { leadId, outcome: 'unavailable' };
  if (decision.kind === 'kept') {
    return { leadId, outcome: 'already_assigned', owner: decision.owner };
  }
  const { result } = decision;
  if (result.kind === 'moved') return { leadId, outcome: 'assigned' };
  return { leadId, outcome: result.refusal === 'already_owner' ? 'unchanged' : 'unavailable' };
}

/**
 * Assignment (`M02-27`…`M02-31`) on the runtime pool. Each act locks the leads it moves, so of two
 * people assigning one lead the second reads what the first wrote (`M02-67`).
 */
@Injectable()
export class CrmAssignRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  /** The people a lead can go to, each with their open leads and overdue tasks now. */
  async assignees(tenantId: string, now: Date): Promise<Assignee[]> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const holders = await leadHoldersOf(tx, tenantId);
      const ids = holders.map((holder) => holder.userId);
      const open = await openLeadCountsOf(tx, tenantId, ids);
      const overdue = await overdueTaskCountsOf(tx, tenantId, ids, now);
      return holders.map((holder) => ({
        ...holder,
        openCount: open.get(holder.userId) ?? 0,
        overdueCount: overdue.get(holder.userId) ?? 0,
      }));
    });
  }

  /**
   * One lead, compare-and-set on the owner the screen showed. A lead already the assignee's answers
   * as it stands — a retried tap lands where the first one did — and one someone else took first
   * answers who holds it. A lead only the screen's owner reaches (`leadScopeAsSeenWhere`) is out
   * of the reader's scope now, so it answers who holds it and nothing more.
   */
  async assign(
    reader: LeadReader,
    leadId: string,
    order: AssignOrder,
    notice: AssignNotice,
    money: LeadMoney,
    act: Act,
  ): Promise<AssignOutcome> {
    const { tenantId } = reader;
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const [assignee] = await leadHoldersOf(tx, tenantId, order.assigneeId);
      if (assignee === undefined) return ASSIGNEE_UNAVAILABLE;
      await lockLead(tx, tenantId, leadId);
      const [target] = await reachedLeads(tx, reader, [leadId], order.expectedOwnerId);
      if (target === undefined) return { outcome: 'not-found' };
      if (!target.inScope) {
        return { outcome: 'already-assigned', owner: await memberRefOf(tx, target.ownerId) };
      }
      const detail = async () => {
        const read = await loadLeadDetail(tx, reader, leadId, money);
        if (read === null) throw new Error(`lead ${leadId} vanished inside its own transaction`);
        return read;
      };
      if (target.ownerId === assignee.userId) {
        return { outcome: 'assigned', detail: await detail(), notified: [] };
      }
      if (target.ownerId !== order.expectedOwnerId) {
        return { outcome: 'already-assigned', owner: await memberRefOf(tx, target.ownerId) };
      }
      const result = assign(lifecycleOf(target), assignee.userId);
      if (result.kind === 'refused') return { outcome: 'refused', refusal: result.refusal };
      await recordHandOver(
        tx,
        {
          tenantId,
          leadId,
          customerId: target.customerId,
          result,
          from: await memberRefOf(tx, target.ownerId),
          to: assignee,
          openCount: await openLeadCountOf(tx, tenantId, assignee.userId),
          reason: order.reason,
          taskHolderId: taskHolderOf(target),
        },
        act,
      );
      const notified = await noticeNewOwner(tx, tenantId, assignee, [leadId], notice, act);
      return { outcome: 'assigned', detail: await detail(), notified };
    });
  }

  /**
   * A selection to one person, each lead on its own (`M02-29`): the leads are locked in id order —
   * so two bulk assigns never deadlock — and each in the reader's scope is answered with domain's
   * decision; a lead gone or out of scope is unavailable. A send without a reason gives only
   * unassigned leads: one someone else holds stays theirs and names them — one taken while the
   * inbox showed it too, though the taking moved it out of the reader's scope — so it never fails
   * the rest. The new owner is told once for the batch.
   */
  async bulkAssign(
    reader: LeadReader,
    order: BulkAssignOrder,
    notice: AssignNotice,
    act: Act,
  ): Promise<BulkAssignAnswer> {
    const { tenantId } = reader;
    const leadIds = [...new Set(order.leadIds)];
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const [assignee] = await leadHoldersOf(tx, tenantId, order.assigneeId);
      if (assignee === undefined) return ASSIGNEE_UNAVAILABLE;
      await lockLeads(tx, tenantId, leadIds);
      const locked = await reachedLeads(tx, reader, leadIds, null);
      const owners = await memberRefsOf(
        tx,
        locked.flatMap((target) => (target.ownerId === null ? [] : [target.ownerId])),
      );
      const ownerOf = (target: (typeof locked)[number]) => {
        if (target.ownerId === null) return null;
        const owner = owners.get(target.ownerId);
        if (owner === undefined)
          throw new Error(`lead ${target.id} names an owner with no account`);
        return owner;
      };
      const decide = (target: (typeof locked)[number]): BulkDecision => {
        const owner = ownerOf(target);
        if (!target.inScope) {
          if (owner === null) throw new Error(`lead ${target.id} reached out of scope unowned`);
          return { kind: 'kept', owner };
        }
        const result = assign(lifecycleOf(target), assignee.userId);
        if (result.kind === 'moved' && owner !== null && order.reason === null) {
          return { kind: 'kept', owner };
        }
        return { kind: 'decided', result };
      };
      const decided = new Map(
        locked.map((target) => [target.id, { target, decision: decide(target) }]),
      );
      const handed = leadIds.flatMap((leadId) => {
        const one = decided.get(leadId);
        return one?.decision.kind === 'decided' && one.decision.result.kind === 'moved'
          ? [{ target: one.target, result: one.decision.result }]
          : [];
      });
      for (const { target, result } of handed) {
        await recordHandOver(
          tx,
          {
            tenantId,
            leadId: target.id,
            customerId: target.customerId,
            result,
            from: ownerOf(target),
            to: assignee,
            openCount: await openLeadCountOf(tx, tenantId, assignee.userId),
            reason: order.reason,
            taskHolderId: taskHolderOf(target),
          },
          act,
        );
      }
      const given = handed.map(({ target }) => target.id);
      return {
        outcome: 'done',
        results: leadIds.map((leadId) => bulkResultOf(leadId, decided.get(leadId)?.decision)),
        notified: await noticeNewOwner(tx, tenantId, assignee, given, notice, act),
      };
    });
  }
}

/**
 * The locked leads this reader reaches — in their scope, or as their screen showed them
 * (`leadScopeAsSeenWhere`) — each saying which. Read after `lockLeads`, never in the lock's own
 * statement: there the scope's read of who was assigned the lead would miss the assign that held
 * the lock, and the loser of a race would read a lead it cannot see instead of who won.
 */
function reachedLeads(
  tx: DbTransaction,
  reader: LeadReader,
  leadIds: readonly string[],
  seenOwnerId: string | null,
) {
  const inScope = leadScopeWhere(reader.scope, reader.actorId);
  return tx
    .select({ ...assignedLeadColumns, inScope: sql<boolean>`${inScope}` })
    .from(lead)
    .where(
      and(
        eq(lead.tenantId, reader.tenantId),
        inArray(lead.id, [...leadIds]),
        or(inScope, leadScopeAsSeenWhere(reader.scope, reader.actorId, seenOwnerId)),
      ),
    )
    .orderBy(asc(lead.id));
}
