import type { LeadDetail, Task } from '@heliogrid/contracts';
import {
  customer,
  type DbTransaction,
  lead,
  leadFile,
  leadStageTransition,
  referral,
  task,
  userAccount,
} from '@heliogrid/db';
import { isClosedState, type LeadLifecycleState } from '@heliogrid/domain';
import { and, asc, count, eq, max } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { customerRecordOf } from './crm.customer-record.repository';
import {
  leadCustomerJoin,
  leadOwner,
  leadSummaryColumns,
  memberNameOf,
} from './crm.lead-columns.repository';
import { designCountOf } from './crm.lead-designs.repository';
import { projectOf } from './crm.lead-project.repository';
import { leadProposalsOf } from './crm.lead-proposals.repository';
import { visitOf } from './crm.lead-visit.repository';
import { leadScopeWhere } from './crm.scope.repository';
import { type LeadMoney, leadSummaryOf, memberRefOf } from './internal/lead-wire';
import type { LeadReader } from './internal/reader';
import { sitePinOf } from './internal/site-pin';

/*
 * One lead as Lead Detail shows it (`M02-32`), read on the caller's transaction so a write and the
 * answer it returns see the same rows.
 */

/** A lead the reader may act on: its id, its customer and its owner. */
export interface ScopedLead {
  readonly id: string;
  readonly customerId: string;
  readonly ownerUserId: string | null;
}

/**
 * The lead, when it is in this company AND in the reader's scope; `null` otherwise — another
 * company's lead and one outside the scope answer alike, as 404.
 */
export async function findLeadInScope(
  tx: DbTransaction,
  reader: LeadReader,
  leadId: string,
): Promise<ScopedLead | null> {
  const [found] = await tx
    .select({ id: lead.id, customerId: lead.customerId, ownerUserId: lead.ownerUserId })
    .from(lead)
    .where(
      and(
        eq(lead.tenantId, reader.tenantId),
        eq(lead.id, leadId),
        leadScopeWhere(reader.scope, reader.actorId),
      ),
    );
  return found ?? null;
}

const closer = alias(userAccount, 'lead_closer');
const referrer = alias(customer, 'referrer');
const assignee = alias(userAccount, 'task_assignee');

/**
 * Lead Detail's whole read. The caller has judged the scope (`findLeadInScope`) — or is answering
 * the person who just made the lead — so this reads the lead by tenant and id alone; `null` when
 * the company holds no such lead. Other customers it names are named only as the reader's scope
 * allows (`customerRecordOf`).
 */
export async function loadLeadDetail(
  tx: DbTransaction,
  reader: LeadReader,
  leadId: string,
  money: LeadMoney,
): Promise<LeadDetail | null> {
  const { tenantId } = reader;
  const [row] = await tx
    .select({
      ...leadSummaryColumns,
      roofOwnership: lead.roofOwnership,
      roofType: lead.roofType,
      shading: lead.shading,
      timeline: lead.buyingTimeline,
      decisionMaker: lead.decisionMaker,
      wakeOn: lead.snoozeWakeOn,
      resurfaceOn: lead.resurfaceOn,
      noCallUntil: lead.noCallUntil,
      closedAs: lead.closedAs,
      disqualifyReason: lead.disqualifyReason,
      lostReason: lead.lostReason,
      closedAt: lead.closedAt,
      closedBy: lead.closedBy,
      closerName: memberNameOf(closer),
      reopenCount: lead.reopenCount,
      unansweredCalls: lead.unansweredCalls,
      referredByName: lead.referredByName,
      doNotCallSetAt: customer.doNotCallSetAt,
      wrongNumberAt: customer.wrongNumberAt,
      siteAddress: lead.siteAddress,
      siteArea: lead.siteArea,
      siteDistrict: lead.siteDistrict,
      sanctionedLoadKw: lead.sanctionedLoadKw,
      supplyPhase: lead.supplyPhase,
      siteName: lead.siteName,
      siteLatitude: lead.siteLatitude,
      siteLongitude: lead.siteLongitude,
      siteUtility: lead.siteUtility,
    })
    .from(lead)
    .innerJoin(customer, leadCustomerJoin)
    .leftJoin(leadOwner, eq(leadOwner.id, lead.ownerUserId))
    .leftJoin(closer, eq(closer.id, lead.closedBy))
    .where(and(eq(lead.tenantId, tenantId), eq(lead.id, leadId)));
  if (row === undefined) return null;
  const record = await customerRecordOf(tx, reader, row.customerId);
  if (record === null) throw new Error(`lead ${leadId} names a customer its company lacks`);
  const area = row.siteArea === null ? null : { area: row.siteArea, district: row.siteDistrict };
  const proposals = await leadProposalsOf(
    tx,
    reader,
    {
      leadId,
      customerId: row.customerId,
      closed: isClosedState(row.state),
      deal: { siteAddress: row.siteAddress, area },
    },
    money,
  );
  return {
    currencyCode: money.currencyCode,
    lead: leadSummaryOf(row, money),
    customer: record,
    qualify: {
      roofOwnership: row.roofOwnership,
      roofType: row.roofType,
      shading: row.shading,
      timeline: row.timeline,
      decisionMaker: row.decisionMaker,
    },
    qualifiedAt: await qualifiedAtOf(tx, tenantId, leadId),
    lifecycle: {
      wakeOn: row.wakeOn,
      resurfaceOn: row.resurfaceOn,
      noCallUntil: row.noCallUntil,
      lastClose: lastCloseOf(row),
      reopenCount: row.reopenCount,
    },
    unansweredCalls: row.unansweredCalls,
    canDial: row.doNotCallSetAt === null && row.wrongNumberAt === null,
    cameFrom: await cameFromOf(tx, tenantId, leadId, row.referredByName),
    visit: await visitOf(tx, tenantId, leadId),
    openTasks: await openTasksOf(tx, tenantId, leadId),
    sections: {
      designs: await designCountOf(tx, tenantId, leadId),
      proposals: proposals.items.length,
      files: await filesOf(tx, tenantId, leadId),
    },
    project: await projectOf(tx, tenantId, leadId),
    site: {
      address: row.siteAddress,
      area,
      sanctionedLoadKw: row.sanctionedLoadKw,
      supplyPhase: row.supplyPhase,
      name: row.siteName,
      pin: sitePinOf(row.siteLatitude, row.siteLongitude),
      utilityOperator: row.siteUtility,
    },
    proposals,
  };
}

type LastClose = LeadDetail['lifecycle']['lastClose'];

/** The latest close, kept through a reopen (`M02-56`); the columns are whole or absent together. */
function lastCloseOf(row: {
  closedAs: LeadLifecycleState | null;
  disqualifyReason: NonNullable<LastClose>['disqualifyReason'];
  lostReason: NonNullable<LastClose>['lostReason'];
  closedAt: Date | null;
  closedBy: string | null;
  closerName: string | null;
}): LastClose {
  const state = row.closedAs;
  if (state === null || row.closedAt === null) return null;
  if (state !== 'disqualified' && state !== 'lost' && state !== 'junk') return null;
  return {
    state,
    disqualifyReason: row.disqualifyReason,
    lostReason: row.lostReason,
    at: row.closedAt.toISOString(),
    by: memberRefOf(row.closedBy, row.closerName),
  };
}

/** When the lead last entered `qualified` — the moment Mark qualified was pressed (`M02-45`). */
async function qualifiedAtOf(tx: DbTransaction, tenantId: string, leadId: string) {
  const [moved] = await tx
    .select({ at: max(leadStageTransition.movedAt) })
    .from(leadStageTransition)
    .where(
      and(
        eq(leadStageTransition.tenantId, tenantId),
        eq(leadStageTransition.leadId, leadId),
        eq(leadStageTransition.toStage, 'qualified'),
      ),
    );
  return moved?.at?.toISOString() ?? null;
}

/** The referrer: a customer's record, else the name typed for someone who is not one (`M02-16`). */
async function cameFromOf(
  tx: DbTransaction,
  tenantId: string,
  leadId: string,
  referredByName: string | null,
): Promise<LeadDetail['cameFrom']> {
  const [link] = await tx
    .select({ customerId: referral.referringCustomerId, name: referrer.name })
    .from(referral)
    .innerJoin(referrer, eq(referrer.id, referral.referringCustomerId))
    .where(and(eq(referral.tenantId, tenantId), eq(referral.referredLeadId, leadId)));
  if (link !== undefined) return link;
  return referredByName === null ? null : { customerId: null, name: referredByName };
}

/** The lead's open tasks, soonest due first; overdue is the screen's to derive (`tasks/overdue.ts`). */
/** The lead's open tasks, soonest due first — Lead Detail's list, and where a proposal finds its follow-up. */
export async function openTasksOf(
  tx: DbTransaction,
  tenantId: string,
  leadId: string,
): Promise<Task[]> {
  const rows = await tx
    .select({
      id: task.id,
      kind: task.kind,
      title: task.title,
      status: task.status,
      dueAt: task.dueAt,
      assigneeId: task.assigneeUserId,
      assigneeName: memberNameOf(assignee),
      provenance: task.provenance,
      doneAt: task.doneAt,
    })
    .from(task)
    .innerJoin(assignee, eq(assignee.id, task.assigneeUserId))
    .where(and(eq(task.tenantId, tenantId), eq(task.leadId, leadId), eq(task.status, 'open')))
    .orderBy(asc(task.dueAt), asc(task.id));
  return rows.map((row) => ({
    id: row.id,
    leadId,
    kind: row.kind,
    title: row.title,
    status: row.status,
    dueAt: row.dueAt.toISOString(),
    assignee: { userId: row.assigneeId, name: row.assigneeName ?? '' },
    provenance: row.provenance,
    doneAt: row.doneAt?.toISOString() ?? null,
  }));
}

/** The files put on the lead — the rows its Files section lists, so the count and the list agree. */
async function filesOf(tx: DbTransaction, tenantId: string, leadId: string): Promise<number> {
  const [counted] = await tx
    .select({ n: count() })
    .from(leadFile)
    .where(and(eq(leadFile.tenantId, tenantId), eq(leadFile.leadId, leadId)));
  return counted?.n ?? 0;
}
