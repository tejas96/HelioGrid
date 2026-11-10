import type { MemberRef } from '@heliogrid/contracts';
import { customer, type DbTransaction, lead, leadAssignment } from '@heliogrid/db';
import type { LeadActResult, UiLanguage } from '@heliogrid/domain';
import { and, eq } from 'drizzle-orm';
import type { Act } from '../../common/auth/session-context';
import {
  type NoticeWords,
  recipientsFor,
  recordNotificationsTo,
  type TenantQuietHours,
} from '../notification/notification.public';
import { leadCustomerJoin } from './crm.lead-columns.repository';
import { handOverOpenTasks } from './crm.raised-tasks.repository';
import { leadReadableBy } from './crm.scope.repository';
import { leadLifecycleColumns, recordActivity, recordLeadMoves } from './crm.timeline.repository';
import { lifecycleColumnsOf } from './internal/lead-lifecycle';

/*
 * One assignment's writes (`M02-30`, `M02-31`), on the caller's transaction: the owner, the
 * append-only trail with the assignee's load at that moment, the timeline entry, and the notice.
 */

/**
 * The lead row an assign locks: its anchor, who captured it, and the machine columns domain's
 * `assign` reads.
 */
export const assignedLeadColumns = {
  id: lead.id,
  customerId: lead.customerId,
  capturedBy: lead.createdBy,
  ...leadLifecycleColumns,
};

/**
 * Who holds a lead's calls and follow-ups: its owner, or — while it has none — the person who
 * captured it, whom its first call-back went to (`M02-15`).
 */
export function taskHolderOf(target: {
  readonly ownerId: string | null;
  readonly capturedBy: string;
}): string {
  return target.ownerId ?? target.capturedBy;
}

/** One lead handed to its new owner, as domain's `assign` decided it. */
export interface HandOver {
  readonly tenantId: string;
  readonly leadId: string;
  readonly customerId: string;
  readonly result: Extract<LeadActResult, { kind: 'moved' }>;
  readonly from: MemberRef | null;
  readonly to: MemberRef;
  /** The assignee's open leads just before this one reached them. */
  readonly openCount: number;
  readonly reason: string | null;
  /** Whose open calls and follow-ups on the lead move to the new owner (`taskHolderOf`). */
  readonly taskHolderId: string;
}

/**
 * Writes the lead as the act left it, any move the act made, one `lead_assignment` row (who, to
 * whom, when, the open count, why), the `assignment` entry the timeline shows, and the lead's open
 * calls and follow-ups handed to the new owner.
 */
export async function recordHandOver(
  tx: DbTransaction,
  handOver: HandOver,
  act: Act,
): Promise<void> {
  const { tenantId, leadId, customerId, result, from, to, openCount, reason, taskHolderId } =
    handOver;
  const at = new Date(act.now);
  const actor = { kind: 'person', userId: act.actorUserId } as const;
  await tx
    .update(lead)
    .set(lifecycleColumnsOf(result.next))
    .where(and(eq(lead.tenantId, tenantId), eq(lead.id, leadId)));
  await recordLeadMoves(tx, { tenantId, customerId, leadId }, result, actor);
  await tx.insert(leadAssignment).values({
    tenantId,
    leadId,
    assignedTo: to.userId,
    assignedBy: act.actorUserId,
    assignedAt: at,
    openCountSnapshot: openCount,
    reason,
  });
  await recordActivity(tx, {
    tenantId,
    customerId,
    leadId,
    kind: 'assignment',
    body: { from, to, openCount, reason },
    actor,
    capturedAt: at,
  });
  await handOverOpenTasks(tx, { tenantId, leadId, fromUserId: taskHolderId, toUserId: to.userId });
}

/** What one person was given: one lead as it reads in a list, or how many. */
export type GivenLeads =
  | { readonly name: string | null; readonly phoneE164: string }
  | { readonly count: number };

/** The `lead_assigned` words in every language, rendered by the service, and the push's clock. */
export interface AssignNotice {
  readonly wordsFor: (given: GivenLeads) => Promise<(language: UiLanguage) => NoticeWords>;
  readonly quietHours: TenantQuietHours;
}

/** How one lead reads in a notice: its customer's name, or its number while it has none. */
async function howLeadReads(tx: DbTransaction, tenantId: string, leadId: string) {
  const [found] = await tx
    .select({ name: customer.name, phoneE164: customer.phoneE164 })
    .from(lead)
    .innerJoin(customer, leadCustomerJoin)
    .where(and(eq(lead.tenantId, tenantId), eq(lead.id, leadId)));
  if (found === undefined) throw new Error(`lead ${leadId} vanished inside its own transaction`);
  return found;
}

/**
 * Tells the new owner — ONE notice for everything this act gave them (`F6-12`'s storm rule): the
 * lead by name when it is one, else the count. Its subject is the first lead given, so the notice
 * opens a real record (`F6-02`). Answers the notices' ids for the push after the commit.
 */
export async function noticeNewOwner(
  tx: DbTransaction,
  tenantId: string,
  owner: MemberRef,
  leadIds: readonly string[],
  notice: AssignNotice,
  act: Act,
): Promise<string[]> {
  const [subjectId] = leadIds;
  if (subjectId === undefined) return [];
  const given: GivenLeads =
    leadIds.length === 1 ? await howLeadReads(tx, tenantId, subjectId) : { count: leadIds.length };
  const recipients = await recipientsFor(
    tx,
    tenantId,
    'lead_assigned',
    { ownerUserId: owner.userId, assigneeUserId: null, awaits: null },
    leadReadableBy(tx, tenantId, subjectId),
  );
  return recordNotificationsTo(
    tx,
    recipients,
    {
      tenantId,
      type: 'lead_assigned',
      subjectKind: 'lead',
      subjectRef: subjectId,
      emittedAt: new Date(act.now),
    },
    await notice.wordsFor(given),
    notice.quietHours,
  );
}
