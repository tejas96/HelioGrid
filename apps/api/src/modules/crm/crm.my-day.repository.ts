import type { MyDay, MyDayItem } from '@heliogrid/contracts';
import {
  customer,
  type DbTransaction,
  lead,
  type TenantPool,
  task,
  tenant,
  userAccount,
} from '@heliogrid/db';
import {
  MY_DAY_ITEMS_MAX,
  type MyDayDay,
  myDayBandOf,
  myDayDayOf,
  nextUpOf,
} from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, gte, lt, type SQL, sql } from 'drizzle-orm';
import { TENANT_DB } from '../../common/db/tenant.token';
import { leadCustomerJoin, leadOwner, leadSummaryColumns } from './crm.lead-columns.repository';
import { activeLead, leadScopeWhere } from './crm.scope.repository';
import { taskAssigneeJoin, taskOfRow, taskWireColumns } from './crm.tasks.repository';
import { type LeadMoney, leadSummaryOf } from './internal/lead-wire';
import type { LeadReader } from './internal/reader';

/** The lead's task join: the task's own lead in its own company; a task with no lead joins none. */
const taskLeadJoin = and(eq(lead.id, task.leadId), eq(lead.tenantId, task.tenantId));

/**
 * The address of the visit a site-visit task stands for: the lead's booking no reschedule replaced.
 * Every other task kind has no place.
 */
const visitPlace = sql<string | null>`case when ${task.kind} = 'site_visit' then (
  select booked.address from lead_visit_booking booked
  where booked.tenant_id = ${task.tenantId} and booked.lead_id = ${task.leadId}
    and not exists (select 1 from lead_visit_booking replacing
      where replacing.tenant_id = booked.tenant_id and replacing.rescheduled_from_id = booked.id)
  order by booked.created_at desc, booked.id desc limit 1) end`;

/** A count over the matched rows, as a number. */
const countWhere = (condition: SQL) =>
  sql<number>`count(*) filter (where ${condition})`.mapWith(Number);

export type MyDayRead = Omit<MyDay, 'currencyCode'>;

/**
 * My Day (`M07-01`…`M07-04`) on the runtime pool: the reader's own open tasks on leads their scope
 * reaches and that are active — a snoozed, dormant or closed lead's tasks wait for it to return
 * (`M02-58`). One transaction reads the company's clock, the items and the whole counts, each
 * under the SAME predicate, which leads with the `(tenant, assignee, status, due)` index's columns.
 */
@Injectable()
export class CrmMyDayRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  read(reader: LeadReader, now: number, money: LeadMoney): Promise<MyDayRead> {
    const { tenantId, actorId } = reader;
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const timeZone = await timeZoneOf(tx, tenantId);
      const day = myDayDayOf(now, timeZone);
      const visibleActiveLead = and(activeLead, leadScopeWhere(reader.scope, actorId));
      const mineOpenThisWeek = and(
        eq(task.tenantId, tenantId),
        eq(task.assigneeUserId, actorId),
        eq(task.status, 'open'),
        lt(task.dueAt, new Date(day.weekEnds)),
        visibleActiveLead,
      );
      const rows = await tx
        .select({
          task: taskWireColumns,
          lead: leadSummaryColumns,
          doNotCallSetAt: customer.doNotCallSetAt,
          wrongNumberAt: customer.wrongNumberAt,
          visitPlace,
        })
        .from(task)
        .innerJoin(lead, taskLeadJoin)
        .innerJoin(customer, leadCustomerJoin)
        .leftJoin(leadOwner, eq(leadOwner.id, lead.ownerUserId))
        .innerJoin(userAccount, taskAssigneeJoin)
        .where(mineOpenThisWeek)
        .orderBy(asc(task.dueAt), asc(task.id))
        .limit(MY_DAY_ITEMS_MAX);
      const items = rows.map((row): MyDayItem => {
        const band = myDayBandOf(row.task.dueAt.getTime(), day);
        if (band === null) throw new Error(`task ${row.task.id} is past the week it was read in`);
        return {
          task: taskOfRow({ ...row.task, leadId: row.lead.id }),
          band,
          lead: leadSummaryOf(row.lead, money),
          canDial: row.doNotCallSetAt === null && row.wrongNumberAt === null,
          visitPlace: row.visitPlace,
        };
      });
      const next = nextUpOf(
        rows.map((row) => ({ id: row.task.id, dueAt: row.task.dueAt.getTime() })),
        day,
      );
      return {
        today: day.today,
        timeZone,
        nextTaskId: next?.id ?? null,
        items,
        counts: await countsOf(tx, day, mineOpenThisWeek, {
          tenantId,
          actorId,
          visibleLead: leadScopeWhere(reader.scope, actorId),
        }),
      };
    });
  }
}

async function timeZoneOf(tx: DbTransaction, tenantId: string): Promise<string> {
  const [own] = await tx
    .select({ timeZone: tenant.timezone })
    .from(tenant)
    .where(eq(tenant.id, tenantId));
  if (own === undefined) throw new Error(`no company ${tenantId} to read My Day for`);
  return own.timeZone;
}

/**
 * The whole counts: the open bands under the items' own predicate, and what the reader ticked
 * done since today began on a lead they can see.
 */
async function countsOf(
  tx: DbTransaction,
  day: MyDayDay,
  mineOpenThisWeek: SQL | undefined,
  done: { readonly tenantId: string; readonly actorId: string; readonly visibleLead: SQL },
): Promise<MyDay['counts']> {
  const now = new Date(day.now);
  const todayEnds = new Date(day.todayEnds);
  const [open] = await tx
    .select({
      overdue: countWhere(sql`${task.dueAt} < ${now.toISOString()}`),
      today: countWhere(
        sql`${task.dueAt} >= ${now.toISOString()} and ${task.dueAt} < ${todayEnds.toISOString()}`,
      ),
      week: countWhere(sql`${task.dueAt} >= ${todayEnds.toISOString()}`),
    })
    .from(task)
    .innerJoin(lead, taskLeadJoin)
    .where(mineOpenThisWeek);
  const [ticked] = await tx
    .select({ doneToday: sql<number>`count(*)`.mapWith(Number) })
    .from(task)
    .innerJoin(lead, taskLeadJoin)
    .where(
      and(
        eq(task.tenantId, done.tenantId),
        eq(task.assigneeUserId, done.actorId),
        eq(task.status, 'done'),
        gte(task.doneAt, new Date(day.todayBegan)),
        done.visibleLead,
      ),
    );
  return {
    overdue: open?.overdue ?? 0,
    today: open?.today ?? 0,
    week: open?.week ?? 0,
    doneToday: ticked?.doneToday ?? 0,
  };
}
