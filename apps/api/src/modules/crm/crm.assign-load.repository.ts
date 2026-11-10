import type { MemberRef } from '@heliogrid/contracts';
import { type DbTransaction, lead, task, userAccount } from '@heliogrid/db';
import { isOpenLead, type TaskStatus } from '@heliogrid/domain';
import { and, count, eq, inArray, lt } from 'drizzle-orm';
import { activeMembersHolding, memberName } from './crm.member-roles.repository';

/*
 * Who a lead can go to, and the load beside each face (`M02-28`, RFC decision 10): read on the
 * caller's transaction, so an assignment's open-count snapshot and the write it records see the
 * same rows (`M02-30`).
 */

/**
 * The company's members who can hold a lead — active and holding `crm.add_edit_leads` — by name;
 * just the one named when `onlyUserId` is given.
 */
export function leadHoldersOf(
  tx: DbTransaction,
  tenantId: string,
  onlyUserId?: string,
): Promise<MemberRef[]> {
  return activeMembersHolding(tx, tenantId, 'crm.add_edit_leads', onlyUserId);
}

/**
 * Each member's open leads (domain's `isOpenLead`): their owned leads counted by stage and state on
 * the `(tenant, owner, state, stage)` index, and the groups domain calls open added up.
 */
export async function openLeadCountsOf(
  tx: DbTransaction,
  tenantId: string,
  memberIds: readonly string[],
): Promise<ReadonlyMap<string, number>> {
  const counts = new Map<string, number>();
  if (memberIds.length === 0) return counts;
  const groups = await tx
    .select({
      ownerId: lead.ownerUserId,
      state: lead.lifecycleState,
      stage: lead.stage,
      leads: count(),
    })
    .from(lead)
    .where(and(eq(lead.tenantId, tenantId), inArray(lead.ownerUserId, [...memberIds])))
    .groupBy(lead.ownerUserId, lead.lifecycleState, lead.stage);
  for (const group of groups) {
    if (group.ownerId === null || !isOpenLead(group)) continue;
    counts.set(group.ownerId, (counts.get(group.ownerId) ?? 0) + group.leads);
  }
  return counts;
}

/** One member's open leads at this moment — the snapshot an assignment records (`M02-30`). */
export async function openLeadCountOf(
  tx: DbTransaction,
  tenantId: string,
  memberId: string,
): Promise<number> {
  return (await openLeadCountsOf(tx, tenantId, [memberId])).get(memberId) ?? 0;
}

const OPEN: TaskStatus = 'open';

/**
 * Each member's overdue tasks: domain's `isOverdue` (`tasks/overdue.ts`) — open, due before now —
 * as the `(tenant, assignee, status, due)` index reads it in one range per member.
 */
export async function overdueTaskCountsOf(
  tx: DbTransaction,
  tenantId: string,
  memberIds: readonly string[],
  now: Date,
): Promise<ReadonlyMap<string, number>> {
  if (memberIds.length === 0) return new Map();
  const rows = await tx
    .select({ assigneeId: task.assigneeUserId, tasks: count() })
    .from(task)
    .where(
      and(
        eq(task.tenantId, tenantId),
        inArray(task.assigneeUserId, [...memberIds]),
        eq(task.status, OPEN),
        lt(task.dueAt, now),
      ),
    )
    .groupBy(task.assigneeUserId);
  return new Map(rows.map((row) => [row.assigneeId, row.tasks]));
}

/** The members these accounts name, as a CRM record names them; an id with no account is absent. */
export async function memberRefsOf(
  tx: DbTransaction,
  userIds: readonly string[],
): Promise<ReadonlyMap<string, MemberRef>> {
  if (userIds.length === 0) return new Map();
  const rows = await tx
    .select({ userId: userAccount.id, name: memberName })
    .from(userAccount)
    .where(inArray(userAccount.id, [...new Set(userIds)]));
  return new Map(rows.map((row) => [row.userId, row]));
}

/** The member an account names, or `null` where none is named. */
export async function memberRefOf(
  tx: DbTransaction,
  userId: string | null,
): Promise<MemberRef | null> {
  if (userId === null) return null;
  return (await memberRefsOf(tx, [userId])).get(userId) ?? null;
}
