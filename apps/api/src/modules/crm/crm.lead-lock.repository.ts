import type { LeadDetail } from '@heliogrid/contracts';
import { customer, type DbTransaction, lead, tenant } from '@heliogrid/db';
import { type CalendarDate, type LeadLifecycle, localDate } from '@heliogrid/domain';
import { and, asc, eq, inArray } from 'drizzle-orm';
import type { Act } from '../../common/auth/session-context';
import { loadLeadDetail } from './crm.lead-detail.repository';
import { leadScopeWhere } from './crm.scope.repository';
import {
  type ActivityActorRef,
  leadLifecycleColumns,
  type MovedLead,
} from './crm.timeline.repository';
import { type LeadLifecycleRow, lifecycleOf } from './internal/lead-lifecycle';
import type { LeadMoney } from './internal/lead-wire';
import type { LeadReader } from './internal/reader';

/*
 * The lead an act works on (`M02-41`…`M02-56`): LOCKED for the rest of the caller's transaction,
 * then read in the reader's scope, so two acts on one lead apply one after the other and each
 * decides on what the other left.
 *
 * Every write takes its locks in ONE order — leads (by id), then customers (by id); `lockCustomers`
 * holds a customer's leads before the customer, as a merge does. Taken in opposite orders, a merge
 * and a lead's edit each hold what the other waits for, and the database kills one as a deadlock.
 */

/** A lead locked for an act: its machines' columns, who it belongs to and its company's clock. */
export interface LockedLead extends MovedLead {
  readonly lifecycle: LeadLifecycle;
  /** The IANA zone every 09:00 and calling window of this company reads (`F1-10`). */
  readonly timeZone: string;
  /** Whether a person may dial the customer's number — no do-not-call, no wrong number (`M02-44`). */
  readonly canDial: boolean;
  readonly lastActivityAt: Date;
}

/**
 * Holds one lead of this company until the transaction ends — the FIRST lock a write on a lead
 * takes. Whatever the write reads about the lead it reads after this: a lead a merge re-pointed
 * while the write waited is then read on its survivor, never answered as not found.
 */
export function lockLead(tx: DbTransaction, tenantId: string, leadId: string): Promise<void> {
  return lockLeads(tx, tenantId, [leadId]);
}

/**
 * Holds these leads of this company until the transaction ends, in id order, so two writes over
 * overlapping leads never deadlock. A lock's own read re-checks only the locked row as the winner
 * left it, and reads every other table as of before the wait — so scope, and anything else read
 * about the leads, is read after this, in a statement of its own.
 */
export async function lockLeads(
  tx: DbTransaction,
  tenantId: string,
  leadIds: readonly string[],
): Promise<void> {
  if (leadIds.length === 0) return;
  await tx
    .select({ id: lead.id })
    .from(lead)
    .where(and(eq(lead.tenantId, tenantId), inArray(lead.id, [...leadIds])))
    .orderBy(asc(lead.id))
    .for('update');
}

/** The lead in this company and the reader's scope, locked; `null` answers 404 (RFC decision 9). */
export async function lockLeadInScope(
  tx: DbTransaction,
  reader: LeadReader,
  leadId: string,
): Promise<LockedLead | null> {
  await lockLead(tx, reader.tenantId, leadId);
  const [row] = await tx
    .select({
      leadId: lead.id,
      customerId: lead.customerId,
      lastActivityAt: lead.lastActivityAt,
      timeZone: tenant.timezone,
      doNotCallSetAt: customer.doNotCallSetAt,
      wrongNumberAt: customer.wrongNumberAt,
      ...leadLifecycleColumns,
    })
    .from(lead)
    .innerJoin(tenant, eq(tenant.id, lead.tenantId))
    .innerJoin(
      customer,
      and(eq(customer.id, lead.customerId), eq(customer.tenantId, lead.tenantId)),
    )
    .where(
      and(
        eq(lead.tenantId, reader.tenantId),
        eq(lead.id, leadId),
        leadScopeWhere(reader.scope, reader.actorId),
      ),
    );
  if (row === undefined) return null;
  return lockedLeadOf(reader.tenantId, row);
}

/** The columns `lockLeadInScope` reads, as the act sees them. */
export function lockedLeadOf(
  tenantId: string,
  row: LeadLifecycleRow & {
    leadId: string;
    customerId: string;
    lastActivityAt: Date;
    timeZone: string;
    doNotCallSetAt: Date | null;
    wrongNumberAt: Date | null;
  },
): LockedLead {
  return {
    tenantId,
    leadId: row.leadId,
    customerId: row.customerId,
    lifecycle: lifecycleOf(row),
    timeZone: row.timeZone,
    canDial: row.doNotCallSetAt === null && row.wrongNumberAt === null,
    lastActivityAt: row.lastActivityAt,
  };
}

/** The lead's company's day at the act's moment — the day a snooze or a no-call spell counts from. */
export function todayOf(locked: Pick<LockedLead, 'timeZone'>, act: Act): CalendarDate {
  return localDate(act.now, locked.timeZone);
}

/** The acting person, as the timeline and the funnel history name them. */
export function personOf(act: Act): ActivityActorRef {
  return { kind: 'person', userId: act.actorUserId };
}

/** The lead as the act left it, read on the act's own transaction for its answer. */
export async function detailAfterAct(
  tx: DbTransaction,
  reader: LeadReader,
  leadId: string,
  money: LeadMoney,
): Promise<LeadDetail> {
  const detail = await loadLeadDetail(tx, reader, leadId, money);
  if (detail === null) throw new Error(`lead ${leadId} vanished inside its own transaction`);
  return detail;
}
