import { type DbTransaction, lead, monthlyTarget, project } from '@heliogrid/db';
import {
  LEAD_STAGES,
  type LeadStage,
  LOST_REASONS,
  type LostReason,
  type MinorUnits,
  minorUnits,
} from '@heliogrid/domain';
import { and, count, eq, gte, isNull, lt, ne, type SQL, sql } from 'drizzle-orm';

/*
 * The figures the owner dashboard and the monthly summary share (`M13-14`, `M13-21`), each on the
 * caller's transaction and naming its tenant: one formula per figure, whoever reads it. A scope
 * argument is the reader's predicate — `undefined` for the whole company.
 */

/** Deals won in `[from, to)`: the projects Mark won started then, a cancelled one never counted (`M13-04`). */
export async function wonIn(
  tx: DbTransaction,
  tenantId: string,
  scope: SQL | undefined,
  span: { readonly from: Date; readonly to: Date },
): Promise<{ count: number; amountMinor: MinorUnits }> {
  const [row] = await tx
    .select({
      count: count(),
      amount: sql<string>`coalesce(sum(${project.finalValueMinor}), 0)`,
    })
    .from(project)
    .where(
      and(
        eq(project.tenantId, tenantId),
        ne(project.stage, 'cancelled'),
        gte(project.createdAt, span.from),
        lt(project.createdAt, span.to),
        scope,
      ),
    );
  return { count: row?.count ?? 0, amountMinor: minorUnits(Number(row?.amount ?? 0)) };
}

/**
 * The deals won since `from` and not cancelled: how many, and the LOW median of their final values
 * (`M13-18`) — `percentile_disc(0.5)` picks the lower middle of an even count, so no amount is
 * split or rounded. One row comes back however many deals the window holds.
 */
export async function wonSince(
  tx: DbTransaction,
  tenantId: string,
  scope: SQL | undefined,
  from: Date,
): Promise<{ count: number; medianMinor: MinorUnits | null }> {
  const [row] = await tx
    .select({
      count: count(),
      median: sql<
        string | null
      >`percentile_disc(0.5) within group (order by ${project.finalValueMinor})`,
    })
    .from(project)
    .where(
      and(
        eq(project.tenantId, tenantId),
        ne(project.stage, 'cancelled'),
        gte(project.createdAt, from),
        scope,
      ),
    );
  const median = row?.median ?? null;
  return {
    count: row?.count ?? 0,
    medianMinor: median === null ? null : minorUnits(Number(median)),
  };
}

/**
 * Leads closed lost in `[from, to)` and lost still, counted by reason in the vocabulary's order,
 * zeros left out. The close stays on the record through a reopen (`M02-56`), so `closed_as` alone
 * would count a lead that came back — or came back and was won — as lost too (`M07-65`).
 */
export async function lostIn(
  tx: DbTransaction,
  tenantId: string,
  scope: SQL,
  span: { readonly from: Date; readonly to?: Date },
): Promise<{ reason: LostReason; count: number }[]> {
  const rows = await tx
    .select({ reason: lead.lostReason, count: count() })
    .from(lead)
    .where(
      and(
        eq(lead.tenantId, tenantId),
        eq(lead.closedAs, 'lost'),
        eq(lead.lifecycleState, 'lost'),
        gte(lead.closedAt, span.from),
        span.to === undefined ? undefined : lt(lead.closedAt, span.to),
        scope,
      ),
    )
    .groupBy(lead.lostReason);
  const byReason = new Map(rows.map((row) => [row.reason, row.count]));
  return LOST_REASONS.flatMap((reason) => {
    const counted = byReason.get(reason) ?? 0;
    return counted === 0 ? [] : [{ reason, count: counted }];
  });
}

/** The open leads by funnel stage, every stage before won in order, zeros kept (`M13-14`). */
export async function pipelineOf(
  tx: DbTransaction,
  tenantId: string,
  scope: SQL,
): Promise<{ stage: LeadStage; count: number }[]> {
  const rows = await tx
    .select({ stage: lead.stage, count: count() })
    .from(lead)
    .where(
      and(eq(lead.tenantId, tenantId), isNull(lead.lifecycleState), ne(lead.stage, 'won'), scope),
    )
    .groupBy(lead.stage);
  const byStage = new Map(rows.map((row) => [row.stage, row.count]));
  return LEAD_STAGES.filter((stage) => stage !== 'won').map((stage) => ({
    stage,
    count: byStage.get(stage) ?? 0,
  }));
}

/** The company's target for the month starting `firstDay`, or `null` when none is set (`M13-17`). */
export async function targetOf(
  tx: DbTransaction,
  tenantId: string,
  firstDay: string,
): Promise<MinorUnits | null> {
  const [row] = await tx
    .select({ amountMinor: monthlyTarget.amountMinor })
    .from(monthlyTarget)
    .where(and(eq(monthlyTarget.tenantId, tenantId), eq(monthlyTarget.month, firstDay)));
  return row === undefined ? null : minorUnits(row.amountMinor);
}
