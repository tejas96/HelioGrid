import type { LeadDetail } from '@heliogrid/contracts';
import { type DbTransaction, lead, project, proposal, userAccount } from '@heliogrid/db';
import {
  can,
  draftProgress,
  liveOnItsLead,
  minorUnits,
  PROPOSAL_STATUSES_ON_A_LINK,
  PROPOSAL_TASK_PROVENANCES,
  type ProposalDealFacts,
  proposalStandingOf,
  statusWhenLeadCloses,
} from '@heliogrid/domain';
import { fieldSetOf, minorUnitsToDecimal, proposalNumberOf } from '@heliogrid/domain/server';
import { and, desc, eq, inArray, ne } from 'drizzle-orm';
import { payableOnLink, versionOnLink } from '../../common/db/proposal-on-link.repository';
import { memberNameOf } from './crm.lead-columns.repository';
import { closeTasksRaisedBy } from './crm.raised-tasks.repository';
import { recordActivity } from './crm.timeline.repository';
import { type LeadMoney, memberRefOf } from './internal/lead-wire';
import type { LeadReader } from './internal/reader';

type LeadProposals = NonNullable<LeadDetail['proposals']>;

/** What the section reads of its lead: who the customer is, whether it is closed, and its site. */
export interface ProposalsLead {
  readonly leadId: string;
  readonly customerId: string;
  readonly closed: boolean;
  readonly deal: Pick<ProposalDealFacts, 'siteAddress' | 'area'>;
}

/**
 * The lead's proposals section (`M06-02`, `M06-25`, `M06-58`): its proposals newest first, each
 * with where it stands and — for a draft — how many of the eleven steps are complete; whether the
 * reader may start or withdraw one; and the live proposal another lead of the same customer holds.
 */
export async function leadProposalsOf(
  tx: DbTransaction,
  reader: LeadReader,
  of: ProposalsLead,
  money: LeadMoney,
): Promise<LeadProposals> {
  const { tenantId } = reader;
  const rows = await tx
    .select({
      id: proposal.id,
      number: proposal.number,
      status: proposal.status,
      latestVersion: proposal.latestVersion,
      versionOnLink,
      openedAt: proposal.openedAt,
      answer: proposal.answer,
      fieldSet: proposal.fieldSet,
      payableMinor: payableOnLink,
      createdBy: proposal.createdBy,
      creatorName: memberNameOf(userAccount),
      createdAt: proposal.createdAt,
      updatedAt: proposal.updatedAt,
    })
    .from(proposal)
    .leftJoin(userAccount, eq(userAccount.id, proposal.createdBy))
    .where(and(eq(proposal.tenantId, tenantId), eq(proposal.leadId, of.leadId)))
    .orderBy(desc(proposal.updatedAt), desc(proposal.id));
  const won = rows.length === 0 ? false : await isWon(tx, tenantId, of.leadId);
  const deal: ProposalDealFacts = {
    segment: null,
    sanctionedLoadKw: null,
    supplyPhase: null,
    monthlyBill: null,
    clientName: null,
    clientPhoneValid: true,
    ...of.deal,
  };
  return {
    items: rows
      .map((stored) => ({ ...stored, fieldSet: fieldSetOf(stored.fieldSet) }))
      .map((row) => ({
        id: row.id,
        number: row.number === null ? null : proposalNumberOf(row.number),
        // The version whose price the row shows: the one on the customer's link (`M06-45`).
        version: row.versionOnLink,
        standing: proposalStandingOf({
          status: row.status,
          generated: row.latestVersion !== null,
          opened: row.openedAt !== null,
          changeAsked: row.answer === 'negotiate',
          won,
        }),
        // Done and default both count: the templates only tell those two apart (`draftProgress`).
        progress: draftProgress({ fields: row.fieldSet, deal, templates: row.fieldSet }),
        capacityKw: row.fieldSet.system.capacityKw,
        payable:
          row.payableMinor === null
            ? null
            : minorUnitsToDecimal(minorUnits(row.payableMinor), money.minorUnitDigits),
        madeBy: memberRefOf(row.createdBy, row.creatorName),
        madeAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
        live: liveOnItsLead(row.status, won),
      })),
    canStart: !of.closed && can(reader.roles, 'proposals.create_edit_proposals'),
    canWithdraw: can(reader.roles, 'proposals.send_proposals'),
    sibling: await siblingOf(tx, tenantId, of),
  };
}

/** Whether the lead's deal was won: its project exists (`M07-62`). */
async function isWon(tx: DbTransaction, tenantId: string, leadId: string): Promise<boolean> {
  const [made] = await tx
    .select({ id: project.id })
    .from(project)
    .where(and(eq(project.tenantId, tenantId), eq(project.leadId, leadId)))
    .limit(1);
  return made !== undefined;
}

/** A proposal on a link that ANOTHER lead of this customer holds (`M06-58`, `T-M06-025`). */
export async function siblingOf(
  tx: DbTransaction,
  tenantId: string,
  of: Pick<ProposalsLead, 'leadId' | 'customerId'>,
): Promise<LeadProposals['sibling']> {
  const [other] = await tx
    .select({ leadId: proposal.leadId, proposalId: proposal.id, number: proposal.number })
    .from(proposal)
    .innerJoin(lead, and(eq(lead.id, proposal.leadId), eq(lead.tenantId, proposal.tenantId)))
    .where(
      and(
        eq(proposal.tenantId, tenantId),
        eq(lead.customerId, of.customerId),
        ne(proposal.leadId, of.leadId),
        inArray(proposal.status, [...PROPOSAL_STATUSES_ON_A_LINK]),
      ),
    )
    .orderBy(desc(proposal.updatedAt), desc(proposal.id))
    .limit(1);
  if (other === undefined) return null;
  return {
    leadId: other.leadId,
    proposalId: other.proposalId,
    number: other.number === null ? null : proposalNumberOf(other.number),
  };
}

/**
 * A lead marked lost, disqualified or junk takes its proposals off the customer's link (`M06-45`):
 * each one a link served reads withdrawn — its link then shows the no-longer-active page with a
 * person to call — and says so on the timeline. A draft stays a draft: no link was minted for it.
 */
export async function withdrawProposalsOfClosedLead(
  tx: DbTransaction,
  closed: { readonly tenantId: string; readonly customerId: string; readonly leadId: string },
  capturedAt: Date,
): Promise<void> {
  const { tenantId, leadId } = closed;
  const live = await tx
    .select({ id: proposal.id, number: proposal.number, status: proposal.status })
    .from(proposal)
    .where(
      and(
        eq(proposal.tenantId, tenantId),
        eq(proposal.leadId, leadId),
        inArray(proposal.status, [...PROPOSAL_STATUSES_ON_A_LINK]),
      ),
    );
  for (const one of live) {
    await tx
      .update(proposal)
      .set({ status: statusWhenLeadCloses(one.status) })
      .where(and(eq(proposal.tenantId, tenantId), eq(proposal.id, one.id)));
    await recordActivity(tx, {
      tenantId,
      customerId: closed.customerId,
      leadId,
      kind: 'proposal_withdrawn',
      body: {
        proposalId: one.id,
        number: one.number === null ? null : proposalNumberOf(one.number),
        cause: 'lead_closed',
      },
      actor: { kind: 'system' },
      capturedAt,
    });
  }
  if (live.length > 0) await closeTasksRaisedBy(tx, tenantId, leadId, PROPOSAL_TASK_PROVENANCES);
}
