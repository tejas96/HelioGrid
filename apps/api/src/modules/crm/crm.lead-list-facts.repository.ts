import type { LeadListRow, LeadPipeline } from '@heliogrid/contracts';
import { type DbTransaction, lead, task } from '@heliogrid/db';
import { LEAD_STAGES, type TaskKind } from '@heliogrid/domain';
import { count, inArray, isNull, or, type SQL, sql } from 'drizzle-orm';
import { type LeadMoney, type LeadSummaryRow, leadSummaryOf } from './internal/lead-wire';

/*
 * What the Leads list (`SCR-M02-03`) reads beyond a lead summary: each row's wake day, failed tries
 * and next step, and the pipeline the list sits in — counted in the list's own transaction.
 */

/** The soonest-due open task as one JSON value, read per row through `task_tenant_lead_idx`. */
const nextOpenTask = sql<{ kind: TaskKind; title: string | null; dueAt: string } | null>`(
  select json_build_object('kind', ${task.kind}, 'title', ${task.title}, 'dueAt', ${task.dueAt})
  from ${task}
  where ${task.tenantId} = ${lead.tenantId} and ${task.leadId} = ${lead.id}
    and ${task.status} = 'open'
  order by ${task.dueAt}, ${task.id}
  limit 1
)`;

/** The columns a list row adds to `leadSummaryColumns`. */
export const leadListFactColumns = {
  wakeOn: lead.snoozeWakeOn,
  unansweredCalls: lead.unansweredCalls,
  nextTask: nextOpenTask,
};

export interface LeadListFactRow extends LeadSummaryRow {
  readonly wakeOn: string | null;
  readonly unansweredCalls: number;
  readonly nextTask: { kind: TaskKind; title: string | null; dueAt: string } | null;
}

/** A list row on the wire; the task's moment as the API states every instant, in UTC. */
export function leadListRowOf(row: LeadListFactRow, money: LeadMoney): LeadListRow {
  return {
    ...leadSummaryOf(row, money),
    wakeOn: row.wakeOn,
    unansweredCalls: row.unansweredCalls,
    nextTask:
      row.nextTask === null
        ? null
        : {
            kind: row.nextTask.kind,
            title: row.nextTask.title,
            dueAt: new Date(row.nextTask.dueAt).toISOString(),
          },
  };
}

/** The leads the pipeline counts: the list's open work — active and snoozed — and the dormant beside it. */
export const pipelineStateWhere: SQL | undefined = or(
  isNull(lead.lifecycleState),
  inArray(lead.lifecycleState, ['snoozed', 'dormant']),
);

/**
 * The pipeline under `where` (the tenant, the reader's scope and the owner filter): each stage's
 * active and snoozed leads in funnel order, a stage with none left out, and the dormant leads.
 */
export async function readPipeline(
  tx: DbTransaction,
  where: SQL | undefined,
): Promise<LeadPipeline> {
  const groups = await tx
    .select({
      stage: lead.stage,
      open: count(sql`case when ${lead.lifecycleState} is distinct from 'dormant' then 1 end`),
      dormant: count(sql`case when ${lead.lifecycleState} = 'dormant' then 1 end`),
    })
    .from(lead)
    .where(where)
    .groupBy(lead.stage);
  return {
    byStage: LEAD_STAGES.flatMap((stage) => {
      const open = groups.find((group) => group.stage === stage)?.open ?? 0;
      return open === 0 ? [] : [{ stage, count: open }];
    }),
    dormant: groups.reduce((sum, group) => sum + group.dormant, 0),
  };
}
