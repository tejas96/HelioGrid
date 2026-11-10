import {
  crmDailySweep,
  type DbTransaction,
  lead,
  leadStageTransition,
  type TenantPool,
  tenant,
} from '@heliogrid/db';
import {
  type CalendarDate,
  DORMANT_AFTER_DAYS,
  dailySweepDue,
  flagDormant,
  type LeadActResult,
  localDate,
  MS_PER_DAY,
  resurface,
  type TaskProvenance,
  wake,
  wakeInstantOf,
} from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, asc, desc, eq, isNull, lte, max, ne, or, type SQL, sql } from 'drizzle-orm';
import { TENANT_DB } from '../../common/db/tenant.token';
import { raiseTask } from './crm.raised-tasks.repository';
import { leadLifecycleColumns, recordLeadMoves } from './crm.timeline.repository';
import {
  escalateUnassigned,
  type UnassignedNotice,
  waitingUnassignedWhere,
} from './crm.unassigned-notice.repository';
import { lifecycleOf } from './internal/lead-lifecycle';

/** One company's sweep: whether it ran this time, and the notices whose pushes leave after it. */
export interface TenantSweep {
  readonly swept: boolean;
  readonly notified: readonly string[];
}

const SYSTEM = { kind: 'system' } as const;
const NOT_SWEPT: TenantSweep = { swept: false, notified: [] };

/** The clock of one sweep: the instant, the company's day, and 09:00 on it. */
interface SweepClock {
  readonly tenantId: string;
  readonly now: number;
  readonly today: CalendarDate;
  readonly wakeAt: Date;
}

/**
 * The CRM's one timer for one company (`M02-49`…`M02-54`) on the runtime pool, in
 * ONE transaction: the day's claim, then each lead whose time has come — flagged dormant after
 * thirty quiet days, woken or resurfaced at 09:00 with a follow-up task, and an EPC Owner told,
 * once, of each lead left unassigned past a day. No state deletes a lead; the system acts. Every
 * lead any pass may move is locked first, in ONE id-ordered statement (`lockSweptLeads`), and the
 * passes work on those alone: locked set by set, the sweep would hold a later set's leads while a
 * bulk assign held an earlier set's, each waiting on the other.
 */
@Injectable()
export class CrmDailySweepRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  async sweep(tenantId: string, now: number, notice: UnassignedNotice): Promise<TenantSweep> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const clock = await claimToday(tx, tenantId, now);
      if (clock === null) return NOT_SWEPT;
      const held = await lockSweptLeads(tx, clock);
      await flagQuietLeads(tx, clock, held);
      await wakeDueLeads(tx, clock, held);
      await resurfaceDueLosses(tx, clock, held);
      return { swept: true, notified: await escalateUnassigned(tx, clock, notice, held) };
    });
  }
}

/**
 * The company's day, claimed — `null` before 09:00 on its clock, or when a sweep already claimed
 * today. The claim commits with the day's work, so a failed sweep leaves none and runs again.
 */
async function claimToday(
  tx: DbTransaction,
  tenantId: string,
  now: number,
): Promise<SweepClock | null> {
  const [company] = await tx
    .select({ timeZone: tenant.timezone, lastRun: max(crmDailySweep.localDate) })
    .from(tenant)
    .leftJoin(crmDailySweep, eq(crmDailySweep.tenantId, tenant.id))
    .where(eq(tenant.id, tenantId))
    .groupBy(tenant.timezone);
  if (company === undefined) throw new Error(`no company ${tenantId} to sweep`);
  if (!dailySweepDue(now, company.timeZone, company.lastRun)) return null;
  const today = localDate(now, company.timeZone);
  const claimed = await tx
    .insert(crmDailySweep)
    .values({ tenantId, localDate: today, ranAt: new Date(now) })
    .onConflictDoNothing()
    .returning({ localDate: crmDailySweep.localDate });
  if (claimed.length === 0) return null;
  return { tenantId, now, today, wakeAt: new Date(wakeInstantOf(today, company.timeZone)) };
}

/** Leads parked or worked on, by the columns domain's machines read. */
const sweptColumns = {
  leadId: lead.id,
  customerId: lead.customerId,
  ...leadLifecycleColumns,
};

/** Thirty days with no activity on an open stage (`M02-52`). */
function quietWhere(clock: SweepClock) {
  const quietSince = new Date(clock.now - DORMANT_AFTER_DAYS * MS_PER_DAY);
  return and(
    isNull(lead.lifecycleState),
    ne(lead.stage, 'won'),
    lte(lead.lastActivityAt, quietSince),
  );
}

/** Snoozed leads whose wake day is today or past — a missed sweep catches up (`M02-51`). */
function wakingWhere(clock: SweepClock) {
  return and(eq(lead.lifecycleState, 'snoozed'), lte(lead.snoozeWakeOn, clock.today));
}

/** Losses postponed to today or before (`M02-54`). */
function resurfacingWhere(clock: SweepClock) {
  return and(eq(lead.lifecycleState, 'lost'), lte(lead.resurfaceOn, clock.today));
}

/**
 * Locks every lead any pass may move, in one statement in id order — the order every write takes
 * (`lockLead`) — and answers the predicate that keeps each pass to them: a lead that comes due
 * while the sweep runs waits for the next one rather than being locked out of order.
 */
async function lockSweptLeads(tx: DbTransaction, clock: SweepClock): Promise<SQL> {
  const held = await tx
    .select({ id: lead.id })
    .from(lead)
    .where(
      and(
        eq(lead.tenantId, clock.tenantId),
        or(
          quietWhere(clock),
          wakingWhere(clock),
          resurfacingWhere(clock),
          waitingUnassignedWhere(clock),
        ),
      ),
    )
    .orderBy(asc(lead.id))
    .for('update');
  if (held.length === 0) return sql`false`;
  // One array parameter, however many leads: a list of parameters has a ceiling a big company meets.
  return sql`${lead.id} = any(${`{${held.map((row) => row.id).join(',')}}`}::uuid[])`;
}

/** Thirty quiet days on an open stage (`M02-52`): flagged, never deleted. */
async function flagQuietLeads(tx: DbTransaction, clock: SweepClock, held: SQL): Promise<void> {
  const quiet = await tx
    .select(sweptColumns)
    .from(lead)
    .where(and(eq(lead.tenantId, clock.tenantId), held, quietWhere(clock)))
    .orderBy(asc(lead.id));
  for (const row of quiet) {
    await recordLeadMoves(tx, movedOf(clock, row), flagDormant(lifecycleOf(row)), SYSTEM);
  }
}

/** Snoozed leads due, woken at 09:00 with a follow-up task (`M02-51`). */
async function wakeDueLeads(tx: DbTransaction, clock: SweepClock, held: SQL): Promise<void> {
  const due = await tx
    .select(sweptColumns)
    .from(lead)
    .where(and(eq(lead.tenantId, clock.tenantId), held, wakingWhere(clock)))
    .orderBy(asc(lead.id));
  for (const row of due) {
    const holder = row.ownerId ?? (await snoozedBy(tx, clock.tenantId, row.leadId));
    await returnWithTask(tx, clock, row, wake(lifecycleOf(row), clock.today), holder);
  }
}

/** Losses due, back at their stage with a follow-up task (`M02-54`). */
async function resurfaceDueLosses(tx: DbTransaction, clock: SweepClock, held: SQL): Promise<void> {
  const due = await tx
    .select(sweptColumns)
    .from(lead)
    .where(and(eq(lead.tenantId, clock.tenantId), held, resurfacingWhere(clock)))
    .orderBy(asc(lead.id));
  for (const row of due) {
    const holder = row.ownerId ?? row.closedBy;
    await returnWithTask(tx, clock, row, resurface(lifecycleOf(row), clock.today), holder);
  }
}

type SweptRow = { leadId: string; customerId: string } & Parameters<typeof lifecycleOf>[0];

function movedOf(clock: SweepClock, row: SweptRow) {
  return { tenantId: clock.tenantId, customerId: row.customerId, leadId: row.leadId };
}

/**
 * A lead back at its stage: its moves, a fresh quiet clock — the timer put it back in front of
 * someone — and the follow-up task the rule raises, due at 09:00 for its owner, else for the
 * person who parked it.
 */
async function returnWithTask(
  tx: DbTransaction,
  clock: SweepClock,
  row: SweptRow,
  result: LeadActResult,
  holder: string | null,
): Promise<void> {
  if (result.kind !== 'moved') return;
  await recordLeadMoves(tx, movedOf(clock, row), result, SYSTEM);
  await tx
    .update(lead)
    .set({ lastActivityAt: new Date(clock.now) })
    .where(and(eq(lead.tenantId, clock.tenantId), eq(lead.id, row.leadId)));
  if (result.raisesTask === null || holder === null) return;
  await raiseFollowUp(tx, clock, row.leadId, holder, result.raisesTask);
}

function raiseFollowUp(
  tx: DbTransaction,
  clock: SweepClock,
  leadId: string,
  holder: string,
  provenance: TaskProvenance,
) {
  return raiseTask(tx, {
    tenantId: clock.tenantId,
    leadId,
    assigneeUserId: holder,
    kind: 'follow_up',
    provenance,
    dueAt: clock.wakeAt,
    raisedBy: null,
    at: new Date(clock.now),
  });
}

/** Who snoozed the lead: the person behind its latest move into `snoozed`. */
async function snoozedBy(
  tx: DbTransaction,
  tenantId: string,
  leadId: string,
): Promise<string | null> {
  const [move] = await tx
    .select({ by: leadStageTransition.movedBy })
    .from(leadStageTransition)
    .where(
      and(
        eq(leadStageTransition.tenantId, tenantId),
        eq(leadStageTransition.leadId, leadId),
        eq(leadStageTransition.toState, 'snoozed'),
      ),
    )
    .orderBy(desc(leadStageTransition.movedAt))
    .limit(1);
  return move?.by ?? null;
}
