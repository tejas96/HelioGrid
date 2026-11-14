import { type DbTransaction, proposal, proposalVersion } from '@heliogrid/db';
import {
  answerProposal,
  type Freshness,
  type LeadLifecycle,
  type MarketPack,
  PROPOSAL_STATUSES_ON_A_LINK,
  type ProposalActResult,
  type ProposalAnswer,
  type ProposalStatus,
  type ProposalVersionSnapshot,
  UNCHECKED,
} from '@heliogrid/domain';
import { proposalNumberOf, versionSnapshotOf } from '@heliogrid/domain/server';
import { and, desc, eq, inArray, isNotNull, isNull } from 'drizzle-orm';
import { recordLeadMoves } from '../crm/crm.public';
import { latestFreshness } from './proposals.track-wire';

/*
 * What the customer's link reads and writes of a proposal (`M06-45`, `F5-40`, `F5-43`, `F5-47`),
 * each on the CALLER's transaction. The link module holds the token, the events and the acceptance
 * record; the status machine, the served version and the lead's stage are this module's.
 */

const servedColumns = {
  proposalId: proposal.id,
  leadId: proposal.leadId,
  number: proposal.number,
  status: proposal.status,
  answer: proposal.answer,
  answeredAt: proposal.answeredAt,
  sharedAt: proposal.sharedAt,
  openedAt: proposal.openedAt,
  versionId: proposalVersion.id,
  version: proposalVersion.version,
  snapshot: proposalVersion.snapshot,
  generatedAt: proposalVersion.generatedAt,
  payableMinor: proposalVersion.payableMinor,
  pins: proposalVersion.pins,
};

type ServedRow = NonNullable<Awaited<ReturnType<typeof servedRow>>>;

/** One version as a link or a print page reads it: frozen, with its proposal's number. */
export type ServedVersion = Omit<ServedRow, 'number' | 'snapshot'> & {
  readonly number: string;
  readonly snapshot: ProposalVersionSnapshot;
};

const named = (row: ServedRow): ServedVersion => ({
  ...row,
  snapshot: versionSnapshotOf(row.snapshot),
  number: proposalNumberOf(row.number ?? 0),
});

async function servedRow(tx: DbTransaction, tenantId: string, leadId: string) {
  const [row] = await tx
    .select(servedColumns)
    .from(proposal)
    .innerJoin(
      proposalVersion,
      and(
        eq(proposalVersion.proposalId, proposal.id),
        eq(proposalVersion.tenantId, proposal.tenantId),
        eq(proposalVersion.version, proposal.sharedVersion),
      ),
    )
    .where(
      and(
        eq(proposal.tenantId, tenantId),
        eq(proposal.leadId, leadId),
        inArray(proposal.status, [...PROPOSAL_STATUSES_ON_A_LINK]),
      ),
    )
    .orderBy(desc(proposal.sharedAt), desc(proposal.id))
    .limit(1);
  return row ?? null;
}

/**
 * The version the lead's link serves (`F5-40`): the LATEST SHARED version of its live proposal —
 * one only generated is invisible to the customer — or `null` where no proposal is live: the lead
 * was closed, the proposal withdrawn, or a reopened lead has none yet (`T-F5-004`).
 */
export async function servedVersionOf(
  tx: DbTransaction,
  tenantId: string,
  leadId: string,
): Promise<ServedVersion | null> {
  const row = await servedRow(tx, tenantId, leadId);
  return row === null ? null : named(row);
}

/** One version by its id — the print page's read, after its grant was checked. */
export async function versionById(
  tx: DbTransaction,
  tenantId: string,
  versionId: string,
): Promise<ServedVersion | null> {
  const [row] = await tx
    .select(servedColumns)
    .from(proposalVersion)
    .innerJoin(proposal, eq(proposal.id, proposalVersion.proposalId))
    .where(and(eq(proposalVersion.tenantId, tenantId), eq(proposalVersion.id, versionId)));
  return row === undefined ? null : named(row);
}

/** Every status the lead's proposals hold — what the link-off page reads its reason from. */
export async function proposalStatusesOf(
  tx: DbTransaction,
  tenantId: string,
  leadId: string,
): Promise<readonly ProposalStatus[]> {
  const rows = await tx
    .select({ status: proposal.status })
    .from(proposal)
    .where(and(eq(proposal.tenantId, tenantId), eq(proposal.leadId, leadId)));
  return rows.map((row) => row.status);
}

/** Whether the served version's figures are still current (`F8-12`) — what Share reads of its version too. */
export function servedFigures(served: Pick<ServedVersion, 'pins'>, pack: MarketPack): Freshness {
  return latestFreshness(served, pack) ?? UNCHECKED;
}

/** Whether any proposal on the lead was ever shared — what a named link is minted after (`F5-20`). */
export async function leadWasShared(
  tx: DbTransaction,
  tenantId: string,
  leadId: string,
): Promise<boolean> {
  const [shared] = await tx
    .select({ id: proposal.id })
    .from(proposal)
    .where(
      and(
        eq(proposal.tenantId, tenantId),
        eq(proposal.leadId, leadId),
        isNotNull(proposal.sharedVersion),
      ),
    )
    .limit(1);
  return shared !== undefined;
}

/** The lead a customer's answer lands on, ALREADY LOCKED by the caller (`lockLead`). */
export interface AnsweredLead {
  readonly tenantId: string;
  readonly leadId: string;
  readonly customerId: string;
  readonly lifecycle: LeadLifecycle;
}

/**
 * The customer's one answer on a version (`M06-45`, `F5-43`, `F5-47`): domain decides — refused on
 * a version the link no longer serves, on one already answered, on a deal won or closed — and a
 * refusal writes nothing. An answer that stands sets the proposal's status and moves the lead as
 * the machine says (a Negotiate reads `negotiating`; an Accept never makes it won). The task it
 * raises and the follow-up it closes are in the result, for the caller to write with its own facts.
 */
export async function recordAnswer(
  tx: DbTransaction,
  lead: AnsweredLead,
  on: {
    readonly proposalId: string;
    readonly version: number;
    readonly answer: ProposalAnswer;
    /** The served version's figures as they stand (`servedFigures`). */
    readonly figures: Freshness;
    readonly at: Date;
  },
): Promise<ProposalActResult> {
  const { tenantId } = lead;
  const [stored] = await tx
    .select({
      status: proposal.status,
      latestVersion: proposal.latestVersion,
      sharedVersion: proposal.sharedVersion,
      answer: proposal.answer,
    })
    .from(proposal)
    .where(
      and(
        eq(proposal.tenantId, tenantId),
        eq(proposal.id, on.proposalId),
        eq(proposal.leadId, lead.leadId),
      ),
    )
    .for('update');
  if (stored === undefined) return { kind: 'refused', refusal: 'not_shared' };
  const result = answerProposal(stored, lead.lifecycle, on.answer, on.version, on.figures);
  if (result.kind === 'refused') return result;
  await tx
    .update(proposal)
    .set({ status: result.next.status, answer: on.answer, answeredAt: on.at, updatedAt: on.at })
    .where(and(eq(proposal.tenantId, tenantId), eq(proposal.id, on.proposalId)));
  if (result.lead.transitions.length > 0) {
    await recordLeadMoves(
      tx,
      lead,
      {
        kind: 'moved',
        next: result.lead.lead,
        transitions: result.lead.transitions,
        raisesTask: null,
      },
      { kind: 'system' },
      on.at,
    );
  }
  return result;
}

/**
 * The first open of the version the link serves (`F5-27`): stamped once, so "opened" is the
 * product's own evidence. `true` when this open was the first — the one that notifies the rep.
 */
export async function stampOpened(
  tx: DbTransaction,
  tenantId: string,
  on: { readonly proposalId: string; readonly version: number; readonly at: Date },
): Promise<boolean> {
  const stamped = await tx
    .update(proposal)
    .set({ openedAt: on.at })
    .where(
      and(
        eq(proposal.tenantId, tenantId),
        eq(proposal.id, on.proposalId),
        eq(proposal.sharedVersion, on.version),
        isNull(proposal.openedAt),
      ),
    )
    .returning({ id: proposal.id });
  return stamped.length > 0;
}
