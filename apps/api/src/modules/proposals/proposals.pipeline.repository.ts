import {
  acceptanceRecord,
  type DbTransaction,
  lead,
  project,
  proposal,
  proposalVersion,
} from '@heliogrid/db';
import {
  forecastStageOf,
  type LeadStage,
  minorUnits,
  type OpenProposalValue,
  PROPOSAL_STATUSES_ON_A_LINK,
  type ProposalVersionSnapshot,
  proposalStandingOf,
  type WonBasis,
  wonBasisOf,
} from '@heliogrid/domain';
import { versionSnapshotOf } from '@heliogrid/domain/server';
import {
  and,
  count,
  desc,
  eq,
  exists,
  inArray,
  isNotNull,
  isNull,
  not,
  type SQL,
  sql,
} from 'drizzle-orm';
import { versionOnLink } from '../../common/db/proposal-on-link.repository';

/*
 * What the deal's later steps read of its proposals (`M07-62`, `M13-03`), each on the CALLER's
 * transaction: the basis Mark won opens on, and what the open proposals are worth. Nothing here
 * weights or sums a figure — domain's `pipelineForecast` does.
 */

/** The version Mark won takes its value and its payment plan from (`M07-62`). */
export interface AcceptedVersion {
  readonly proposalId: string;
  readonly versionId: string;
  readonly version: number;
  readonly payableMinor: number;
  readonly snapshot: ProposalVersionSnapshot;
  readonly acceptedAt: Date;
}

export interface WonBasisOfLead {
  readonly basis: WonBasis;
  /** The accepted version behind the basis: the one that stands, or the earlier one a newer share left unanswered. */
  readonly accepted: AcceptedVersion | null;
}

/**
 * The basis Mark won opens on, read from the lead itself (`T-M06-025`): the lead's live proposal,
 * and the newest version of it the customer accepted. Only an acceptance of the latest shared
 * version pre-fills the win; the server refuses a value or a version that disagrees (`F4-04`).
 */
export async function wonBasisOfLead(
  tx: DbTransaction,
  tenantId: string,
  leadId: string,
): Promise<WonBasisOfLead> {
  const [live] = await tx
    .select({
      id: proposal.id,
      status: proposal.status,
      latestVersion: proposal.latestVersion,
      sharedVersion: proposal.sharedVersion,
      answer: proposal.answer,
    })
    .from(proposal)
    .where(
      and(
        eq(proposal.tenantId, tenantId),
        eq(proposal.leadId, leadId),
        inArray(proposal.status, [...PROPOSAL_STATUSES_ON_A_LINK]),
      ),
    )
    .orderBy(desc(proposal.sharedAt), desc(proposal.id))
    .limit(1);
  if (live === undefined) return { basis: { kind: 'no_acceptance' }, accepted: null };
  const [accepted] = await tx
    .select({
      proposalId: proposalVersion.proposalId,
      versionId: proposalVersion.id,
      version: proposalVersion.version,
      payableMinor: proposalVersion.payableMinor,
      snapshot: proposalVersion.snapshot,
      acceptedAt: acceptanceRecord.acceptedAt,
    })
    .from(acceptanceRecord)
    .innerJoin(proposalVersion, eq(proposalVersion.id, acceptanceRecord.proposalVersionId))
    .where(and(eq(acceptanceRecord.tenantId, tenantId), eq(acceptanceRecord.proposalId, live.id)))
    .orderBy(desc(proposalVersion.version))
    .limit(1);
  const basis = wonBasisOf(live, accepted?.version ?? null);
  const read =
    accepted === undefined ? null : { ...accepted, snapshot: versionSnapshotOf(accepted.snapshot) };
  return { basis, accepted: basis.kind === 'no_acceptance' ? null : read };
}

/**
 * Whether the proposal's deal is won: its lead has a project. Such a proposal is no longer open —
 * a version shared after Won waits only to be put in force, and the link serves the project, so
 * it is never opened or answered — whatever its status reads. Every open count reads this one
 * predicate: the forecast, the stage values, "not opened" and the list's chips.
 */
export function dealWon(tx: DbTransaction): SQL {
  return exists(
    tx
      .select({ id: project.id })
      .from(project)
      .where(and(eq(project.tenantId, proposal.tenantId), eq(project.leadId, proposal.leadId))),
  );
}

/**
 * Which proposals the forecast and the stage values count — the one predicate both read: each
 * lead's live proposal that is shared or accepted, at its latest SHARED version, on a lead not yet
 * won. A snoozed or dormant lead's proposal counts: it is still open on the customer's link and can
 * still be accepted (`T-M13-007`: "each open proposal"). `leads` narrows it to a reader's leads.
 */
function openProposalsWhere(tx: DbTransaction, tenantId: string, leads: SQL | undefined) {
  return and(
    eq(proposal.tenantId, tenantId),
    inArray(proposal.status, ['shared', 'accepted']),
    not(dealWon(tx)),
    leads,
  );
}

const onItsLead = and(eq(lead.id, proposal.leadId), eq(lead.tenantId, proposal.tenantId));
const onSharedVersion = and(
  eq(proposalVersion.proposalId, proposal.id),
  eq(proposalVersion.tenantId, proposal.tenantId),
  eq(proposalVersion.version, versionOnLink),
);
const summedPayable = sql<string>`coalesce(sum(${proposalVersion.payableMinor}), 0)`;

/**
 * The open proposals the forecast weighs (`M13-03`, `T-M13-007`), grouped by where they stand and
 * summed in the database; domain's `pipelineForecast` alone weighs them.
 */
export async function openProposalValues(
  tx: DbTransaction,
  tenantId: string,
  leads?: SQL,
): Promise<readonly OpenProposalValue[]> {
  const opened = sql<boolean>`${proposal.openedAt} is not null`;
  const changeAsked = sql<boolean>`${proposal.answer} is not distinct from 'negotiate'`;
  const rows = await tx
    .select({ status: proposal.status, opened, changeAsked, n: count(), payable: summedPayable })
    .from(proposal)
    .innerJoin(lead, onItsLead)
    .innerJoin(proposalVersion, onSharedVersion)
    .where(openProposalsWhere(tx, tenantId, leads))
    .groupBy(proposal.status, opened, changeAsked);
  return rows.flatMap((row): OpenProposalValue[] => {
    const stage = forecastStageOf(
      proposalStandingOf({
        status: row.status,
        generated: true,
        opened: row.opened,
        changeAsked: row.changeAsked,
        won: false,
      }),
    );
    return stage === null ? [] : [{ stage, count: row.n, value: minorUnits(Number(row.payable)) }];
  });
}

/** The open proposals at one funnel stage: how many, and their latest shared payables summed. */
export interface OpenProposalStageValue {
  readonly stage: LeadStage;
  readonly count: number;
  readonly payableMinor: number;
}

/**
 * What each funnel stage's open proposals are worth (`M13-14`): the same proposals the forecast
 * weighs, by their lead's stage, summed in the database.
 */
export async function openProposalStageValues(
  tx: DbTransaction,
  tenantId: string,
  leads?: SQL,
): Promise<readonly OpenProposalStageValue[]> {
  const rows = await tx
    .select({ stage: lead.stage, n: count(), payable: summedPayable })
    .from(proposal)
    .innerJoin(lead, onItsLead)
    .innerJoin(proposalVersion, onSharedVersion)
    .where(openProposalsWhere(tx, tenantId, leads))
    .groupBy(lead.stage);
  return rows.map((row) => ({ stage: row.stage, count: row.n, payableMinor: Number(row.payable) }));
}

/** A shared proposal its customer has not opened — what the owner's "what needs you" lists (`M13-15`). */
export interface UnopenedProposal {
  readonly proposalId: string;
  readonly leadId: string;
  readonly sharedAt: Date;
}

/**
 * The shared proposals nobody has opened: how many, and the one waiting longest. One leaves when
 * its link is first opened, or when its deal is won (`dealWon`). Counted, never listed — a company's whole backlog is never read.
 */
export async function unopenedProposals(
  tx: DbTransaction,
  tenantId: string,
  leads?: SQL,
): Promise<{ readonly count: number; readonly oldest: UnopenedProposal | null }> {
  const onLead = and(eq(lead.id, proposal.leadId), eq(lead.tenantId, proposal.tenantId));
  const waiting = and(
    eq(proposal.tenantId, tenantId),
    eq(proposal.status, 'shared'),
    isNotNull(proposal.sharedAt),
    isNull(proposal.openedAt),
    isNull(proposal.answer),
    not(dealWon(tx)),
    leads,
  );
  const [counted] = await tx
    .select({ n: count() })
    .from(proposal)
    .innerJoin(lead, onLead)
    .where(waiting);
  const [oldest] = await tx
    .select({ proposalId: proposal.id, leadId: proposal.leadId, sharedAt: proposal.sharedAt })
    .from(proposal)
    .innerJoin(lead, onLead)
    .where(waiting)
    .orderBy(proposal.sharedAt, proposal.id)
    .limit(1);
  return {
    count: counted?.n ?? 0,
    oldest:
      oldest === undefined || oldest.sharedAt === null
        ? null
        : { proposalId: oldest.proposalId, leadId: oldest.leadId, sharedAt: oldest.sharedAt },
  };
}
