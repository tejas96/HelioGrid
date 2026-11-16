import type { LeadDetail } from '@heliogrid/contracts';
import { customer, type DbTransaction, lead, type TenantPool, task } from '@heliogrid/db';
import {
  type CalendarDate,
  isClosed,
  type LeadActContext,
  type LeadActRefusal,
  type LeadActResult,
  type LeadLifecycle,
  REOPENED_FOLLOW_UP_AFTER_MS,
  TASK_KINDS,
} from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import type { Act } from '../../common/auth/session-context';
import { TENANT_DB } from '../../common/db/tenant.token';
import { memberAct, recordAuditEntry } from '../audit/audit.public';
import {
  detailAfterAct,
  type LockedLead,
  lockLeadInScope,
  personOf,
  todayOf,
} from './crm.lead-lock.repository';
import { withdrawProposalsOfClosedLead } from './crm.lead-proposals.repository';
import { activeMemberOf } from './crm.member-roles.repository';
import { cancelOpenTasks, raiseTask } from './crm.raised-tasks.repository';
import { recordActivity, recordLeadMoves } from './crm.timeline.repository';
import type { LeadMoney } from './internal/lead-wire';
import type { LeadReader } from './internal/reader';

/** One lifecycle act: domain's decision on the locked lead, and what follows a decision it allows. */
export interface LeadActPlan {
  decide(lead: LeadLifecycle, context: LeadActContext): LeadActResult;
  /** Written in the same transaction after the moves — a wrong number's block (`M02-44`). */
  readonly follows?: (tx: DbTransaction, locked: LockedLead, act: Act) => Promise<void>;
}

export type LeadActOutcome =
  | { readonly outcome: 'done'; readonly detail: LeadDetail }
  | { readonly outcome: 'refused'; readonly refusal: LeadActRefusal }
  | { readonly outcome: 'not-found' };

/**
 * The R9 acts and *Mark qualified* (`M02-45`, `M02-49`…`M02-56`) on the runtime pool: the lead is
 * locked, domain decides on what it finds, and the moves, their history and their timeline entries
 * commit together — or a refusal writes nothing.
 */
@Injectable()
export class CrmLifecycleRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  async act(
    reader: LeadReader,
    leadId: string,
    plan: LeadActPlan,
    capturedAt: Date,
    money: LeadMoney,
    act: Act,
  ): Promise<LeadActOutcome> {
    return this.db.withTenantTransaction(reader.tenantId, async (tx) => {
      const locked = await lockLeadInScope(tx, reader, leadId);
      if (locked === null) return { outcome: 'not-found' };
      const context = { today: todayOf(locked, act), at: act.now, by: act.actorUserId };
      const result = plan.decide(locked.lifecycle, context);
      if (result.kind === 'refused') return { outcome: 'refused', refusal: result.refusal };
      await recordLeadMoves(tx, locked, result, personOf(act), capturedAt);
      await plan.follows?.(tx, locked, act);
      // A lead that closes takes its proposals off the customer's link (`M06-45`), and its open
      // tasks — kept as history — so no one is reminded to work a lead that is out.
      if (isClosed(result.next) && !isClosed(locked.lifecycle)) {
        await withdrawProposalsOfClosedLead(tx, locked, capturedAt);
        await cancelOpenTasks(tx, locked.tenantId, [locked.leadId], TASK_KINDS);
      }
      return { outcome: 'done', detail: await detailAfterAct(tx, reader, leadId, money) };
    });
  }
}

/** Call tasks are dials; a number no one may dial has none left open (`M02-44`). */
const DIAL_TASKS = ['call'] as const;

/**
 * A wrong number (`M02-44`): every customer of this company holding the number — a duplicate kept
 * beside it shares it — is marked, so no lead of theirs offers a dial, and every call task still
 * open on those leads is cancelled, so none is scheduled either.
 */
export async function blockWrongNumber(
  tx: DbTransaction,
  locked: LockedLead,
  act: Act,
): Promise<void> {
  const { tenantId } = locked;
  const [own] = await tx
    .select({ phoneE164: customer.phoneE164 })
    .from(customer)
    .where(and(eq(customer.tenantId, tenantId), eq(customer.id, locked.customerId)));
  if (own === undefined)
    throw new Error(`lead ${locked.leadId} names a customer its company lacks`);
  const holders = await tx
    .update(customer)
    .set({ wrongNumberAt: new Date(act.now) })
    .where(
      and(
        eq(customer.tenantId, tenantId),
        eq(customer.phoneE164, own.phoneE164),
        isNull(customer.wrongNumberAt),
      ),
    )
    .returning({ id: customer.id });
  const customerIds = [locked.customerId, ...holders.map((holder) => holder.id)];
  const leads = await tx
    .select({ id: lead.id })
    .from(lead)
    .where(and(eq(lead.tenantId, tenantId), inArray(lead.customerId, customerIds)));
  await cancelOpenTasks(
    tx,
    tenantId,
    leads.map((one) => one.id),
    DIAL_TASKS,
  );
}

/**
 * A snooze to a new day on a lead already snoozed (`M02-51`): the state stands, so the funnel's
 * history has no move to keep, but the timeline says the wake day moved and to when.
 */
export function wakeDayMoved(wakeOn: CalendarDate) {
  return async (tx: DbTransaction, locked: LockedLead, act: Act): Promise<void> => {
    if (locked.lifecycle.state !== 'snoozed') return;
    await recordActivity(tx, {
      tenantId: locked.tenantId,
      customerId: locked.customerId,
      leadId: locked.leadId,
      kind: 'state_change',
      body: {
        from: 'snoozed',
        to: 'snoozed',
        cause: 'manual',
        disqualifyReason: null,
        lostReason: null,
        wakeOn,
      },
      actor: personOf(act),
      capturedAt: new Date(act.now),
    });
  };
}

/**
 * A loss (`M07-63`) is audited (`F2-22`) with the loss or not at all; its open tasks are cancelled
 * as every close's are.
 */
export async function closeLost(tx: DbTransaction, locked: LockedLead, act: Act): Promise<void> {
  await recordAuditEntry(
    tx,
    memberAct('crm.lead_lost', locked.tenantId, { kind: 'lead', ref: locked.leadId }, act),
  );
}

/**
 * A reopen (`M02-56`) with no task left open — a loss cancelled them all (`M07-63`) — leaves the
 * lead one next step: a follow-up due now for its owner, or for whoever reopened an unowned lead,
 * so the lead never sits back in the funnel with nothing to do (`M07-06`'s "the next action must
 * already exist and be owned").
 */
export async function nextStepAfterReopen(
  tx: DbTransaction,
  locked: LockedLead,
  act: Act,
): Promise<void> {
  const [open] = await tx
    .select({ id: task.id })
    .from(task)
    .where(
      and(
        eq(task.tenantId, locked.tenantId),
        eq(task.leadId, locked.leadId),
        eq(task.status, 'open'),
      ),
    )
    .limit(1);
  if (open !== undefined) return;
  // A new lead no one owns goes back to the inbox: triage is its next step, and the person who
  // reopened it — an undone junk tap — takes no task for a lead that is not theirs.
  if (locked.lifecycle.ownerId === null && locked.lifecycle.stage === 'new') return;
  const at = new Date(act.now);
  // An owner who has left the company would hold a task no one sees; the person reopening takes it.
  const owner = locked.lifecycle.ownerId;
  const ownerActive = owner !== null && (await activeMemberOf(tx, locked.tenantId, owner)) !== null;
  await raiseTask(tx, {
    tenantId: locked.tenantId,
    leadId: locked.leadId,
    assigneeUserId: ownerActive ? owner : act.actorUserId,
    kind: 'follow_up',
    provenance: 'manual',
    dueAt: new Date(act.now + REOPENED_FOLLOW_UP_AFTER_MS),
    raisedBy: act.actorUserId,
    at,
  });
}
