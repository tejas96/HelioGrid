import {
  customer,
  type DbTransaction,
  lead,
  leadStageTransition,
  project,
  projectBlocker,
  task,
} from '@heliogrid/db';
import {
  type CalendarDate,
  type LeadStage,
  UNASSIGNED_ESCALATES_AFTER_MS,
} from '@heliogrid/domain';
import { and, asc, count, eq, isNull, lt, min, type SQL, sql } from 'drizzle-orm';
import { activeLead, leadCustomerJoin } from '../crm/crm.public';

/*
 * "What needs you" (`M13-15`) on the caller's transaction: each item a bounded read — a count, an
 * oldest row, or the top three — under the reader's lead or project predicate and the tenant.
 */

/**
 * Leads with no owner past a day (`M02-50`'s rule, without its once-only notice mark): how many,
 * and the oldest one's wait in created-at order.
 */
export async function unassignedOf(
  tx: DbTransaction,
  tenantId: string,
  scope: SQL,
  now: number,
): Promise<{ count: number; oldest: Date | null }> {
  const [row] = await tx
    .select({ count: count(), oldest: min(lead.createdAt) })
    .from(lead)
    .where(
      and(
        eq(lead.tenantId, tenantId),
        isNull(lead.ownerUserId),
        isNull(lead.lifecycleState),
        lt(lead.createdAt, new Date(now - UNASSIGNED_ESCALATES_AFTER_MS)),
        scope,
      ),
    );
  return { count: row?.count ?? 0, oldest: row?.oldest ?? null };
}

/** Projects waiting on the company itself: how many, and the one waiting since longest. */
export async function blockedOnUsOf(
  tx: DbTransaction,
  tenantId: string,
  scope: SQL | undefined,
): Promise<{
  count: number;
  oldest: { projectId: string; name: string | null; startedOn: CalendarDate } | null;
}> {
  const [row] = await tx
    .select({
      total: sql<number>`(count(*) over ())::int`,
      projectId: project.id,
      name: customer.name,
      startedOn: projectBlocker.startedOn,
    })
    .from(projectBlocker)
    .innerJoin(
      project,
      and(eq(project.id, projectBlocker.projectId), eq(project.tenantId, projectBlocker.tenantId)),
    )
    .innerJoin(
      customer,
      and(eq(customer.id, project.customerId), eq(customer.tenantId, project.tenantId)),
    )
    .where(
      and(
        eq(projectBlocker.tenantId, tenantId),
        eq(projectBlocker.party, 'company'),
        isNull(projectBlocker.endedAt),
        scope,
      ),
    )
    .orderBy(asc(projectBlocker.startedOn), asc(projectBlocker.openedAt), asc(projectBlocker.id))
    .limit(1);
  if (row === undefined) return { count: 0, oldest: null };
  const { total, ...oldest } = row;
  return { count: total, oldest };
}

/** How many leads "waiting longest" names (`M13-25`): the top few, never a threshold. */
const WAITING_SHOWN = 3;

/**
 * The active leads waiting longest in their current funnel stage: since the last funnel move into
 * that stage, else since the lead was made — a parking spell never restarts the count (`M13-22`).
 */
export async function waitingLongestOf(
  tx: DbTransaction,
  tenantId: string,
  scope: SQL,
): Promise<{ leadId: string; name: string | null; stage: LeadStage; since: Date }[]> {
  const enteredStage = sql<Date>`coalesce((select max(${leadStageTransition.movedAt}) from ${leadStageTransition} where ${leadStageTransition.tenantId} = ${lead.tenantId} and ${leadStageTransition.leadId} = ${lead.id} and ${leadStageTransition.moveKind} = 'funnel_stage' and ${leadStageTransition.toStage} = ${lead.stage}), ${lead.createdAt})`;
  const rows = await tx
    .select({ leadId: lead.id, name: customer.name, stage: lead.stage, since: enteredStage })
    .from(lead)
    .innerJoin(customer, leadCustomerJoin)
    .where(and(eq(lead.tenantId, tenantId), activeLead, scope))
    .orderBy(asc(enteredStage), asc(lead.id))
    .limit(WAITING_SHOWN);
  // A raw subquery's timestamp arrives as text: the driver maps only typed columns.
  return rows.map((row) => ({ ...row, since: new Date(row.since) }));
}

/** The reader's own open tasks past due on active leads they may see (`M13-10`'s edge case). */
export async function myOverdueTasksOf(
  tx: DbTransaction,
  tenantId: string,
  actorId: string,
  scope: SQL,
  now: number,
): Promise<number> {
  const [row] = await tx
    .select({ count: count() })
    .from(task)
    .innerJoin(lead, and(eq(lead.id, task.leadId), eq(lead.tenantId, task.tenantId)))
    .where(
      and(
        eq(task.tenantId, tenantId),
        eq(task.assigneeUserId, actorId),
        eq(task.status, 'open'),
        lt(task.dueAt, new Date(now)),
        activeLead,
        scope,
      ),
    );
  return row?.count ?? 0;
}
