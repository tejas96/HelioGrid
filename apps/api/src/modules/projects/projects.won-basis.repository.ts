import type { SignedProposalProof } from '@heliogrid/contracts';
import {
  type DbTransaction,
  projectDocument,
  type TenantPool,
  trancheTemplate,
  trancheTemplateLine,
} from '@heliogrid/db';
import {
  basisPoints,
  isTrancheDueStage,
  type ProposalVersionSnapshot,
  type SchedulePart,
  type ScheduleTerm,
  type WonBasis,
} from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';
import { TENANT_DB } from '../../common/db/tenant.token';
import { findLeadInScope, type LeadReader, siblingProposalOf } from '../crm/crm.public';
import { type AcceptanceProof, acceptanceProofOf } from '../customer-link/customer-link.public';
import { type AcceptedVersion, versionById, wonBasisOfLead } from '../proposals/proposals.public';

/*
 * What Mark won takes from a lead's proposal (`M07-62`, `T-M06-025`): the accepted version's value
 * and plan, or why the value is typed. The server finds the version from the lead itself — no
 * device names one (`F4-04`).
 */

/** The company's default payment terms, in order — what a deal won with no accepted proposal is split by. */
export async function defaultTermsOf(
  tx: DbTransaction,
  tenantId: string,
): Promise<readonly ScheduleTerm[]> {
  const lines = await tx
    .select({
      label: trancheTemplateLine.label,
      share: trancheTemplateLine.shareBasisPoints,
      dueOnStage: trancheTemplateLine.dueOnStage,
    })
    .from(trancheTemplateLine)
    .innerJoin(
      trancheTemplate,
      and(
        eq(trancheTemplate.id, trancheTemplateLine.trancheTemplateId),
        eq(trancheTemplate.tenantId, tenantId),
      ),
    )
    .where(
      and(
        eq(trancheTemplateLine.tenantId, tenantId),
        eq(trancheTemplate.isDefault, true),
        eq(trancheTemplate.archived, false),
      ),
    )
    .orderBy(asc(trancheTemplateLine.position));
  return lines.map((line) => ({
    label: line.label,
    share: basisPoints(line.share),
    // A line saved before its stage was checked falls due at Won, never strands its money.
    dueOnStage: isTrancheDueStage(line.dueOnStage) ? line.dueOnStage : 'won',
  }));
}

/** A version's own payment plan with its amounts — the rows the customer agreed to. */
export function planOfVersion(snapshot: ProposalVersionSnapshot): readonly SchedulePart[] {
  return snapshot.money.tranches ?? [];
}

/** What *Mark won* opens on, read from the lead itself. */
export interface WonBasisFacts {
  readonly basis: WonBasis;
  readonly accepted: (AcceptedVersion & { readonly number: string }) | null;
  readonly acceptance: AcceptanceProof | null;
  /** The company's default terms — the plan where no accepted version fills it. */
  readonly defaultTerms: readonly ScheduleTerm[];
  readonly sibling: {
    readonly leadId: string;
    readonly proposalId: string;
    readonly number: string | null;
  } | null;
}

/** The accepted version with its proposal's number, or `null` where none stands behind the basis. */
async function numbered(
  tx: DbTransaction,
  tenantId: string,
  accepted: AcceptedVersion | null,
): Promise<WonBasisFacts['accepted']> {
  if (accepted === null) return null;
  const version = await versionById(tx, tenantId, accepted.versionId);
  return version === null ? null : { ...accepted, number: version.number };
}

/**
 * The version this Won stands on (`T-M06-025`): the one the customer accepted, where it is the
 * latest shared — and then the typed value must be its payable, to the minor unit (`F4-04`).
 */
export async function acceptedFor(
  tx: DbTransaction,
  tenantId: string,
  leadId: string,
  typed: number,
): Promise<AcceptedVersion | null | 'value-differs'> {
  const { basis, accepted } = await wonBasisOfLead(tx, tenantId, leadId);
  if (basis.kind !== 'accepted_version' || accepted === null) return null;
  return typed === accepted.payableMinor ? accepted : 'value-differs';
}

/** The signed-proposal row stands done at Won on an accepted version: the acceptance is its proof (`F5-46`). */
export async function markSignedProposalDone(
  tx: DbTransaction,
  tenantId: string,
  projectId: string,
  acceptedAt: Date,
): Promise<void> {
  await tx
    .update(projectDocument)
    .set({ state: 'done', reason: null, changedAt: acceptedAt, changedBy: null })
    .where(
      and(
        eq(projectDocument.tenantId, tenantId),
        eq(projectDocument.projectId, projectId),
        eq(projectDocument.rowKey, SIGNED_PROPOSAL_ROW),
        eq(projectDocument.state, 'pending'),
      ),
    );
}

/** The checklist row an accepted proposal proves. A market whose checklist has no such row marks none. */
const SIGNED_PROPOSAL_ROW = 'signed_proposal';

/**
 * A newer version put in force (`M08-50`): the person's record that the customer agreed is the
 * signed-proposal row's proof from now on, with who recorded it and when.
 */
export async function markSignedProposalPutInForce(
  tx: DbTransaction,
  tenantId: string,
  projectId: string,
  by: { readonly userId: string; readonly at: Date },
): Promise<void> {
  await tx
    .update(projectDocument)
    .set({ state: 'done', reason: null, changedAt: by.at, changedBy: by.userId })
    .where(
      and(
        eq(projectDocument.tenantId, tenantId),
        eq(projectDocument.projectId, projectId),
        eq(projectDocument.rowKey, SIGNED_PROPOSAL_ROW),
      ),
    );
}

/** What the signed-proposal row's proof stands on: the version in force and its acceptance, if any. */
export interface SignedProposalBasis {
  readonly version: number;
  readonly acceptance: AcceptanceProof | null;
}

export async function signedProposalBasisOf(
  tx: DbTransaction,
  tenantId: string,
  inForce: { readonly versionId: string; readonly version: number } | null,
): Promise<SignedProposalBasis | null> {
  if (inForce === null) return null;
  return {
    version: inForce.version,
    acceptance: await acceptanceProofOf(tx, tenantId, inForce.versionId),
  };
}

/**
 * The signed-proposal row's proof (`F5-46`, `T-M06-025`): the customer's Accept on its link, or —
 * where the version in force was never accepted on a link — the act that put it in force, when the
 * row says it was recorded. Every other row, and a row a deal won with nothing accepted, has none.
 */
export function signedProposalProofOf(
  document: { readonly row: string; readonly state: string; readonly changedAt: Date },
  basis: SignedProposalBasis | null,
): SignedProposalProof | null {
  if (document.row !== SIGNED_PROPOSAL_ROW || document.state !== 'done' || basis === null) {
    return null;
  }
  const { acceptance, version } = basis;
  return acceptance === null
    ? { version, linkLabel: null, at: document.changedAt.toISOString(), act: 'put_in_force' }
    : {
        version,
        linkLabel: acceptance.linkLabel,
        at: acceptance.acceptedAt.toISOString(),
        act: 'accepted',
      };
}

@Injectable()
export class ProjectsWonBasisRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  /** The basis of a lead the reader may see; `null` answers 404. */
  wonBasis(reader: LeadReader, leadId: string): Promise<WonBasisFacts | null> {
    const { tenantId } = reader;
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const found = await findLeadInScope(tx, reader, leadId);
      if (found === null) return null;
      const { basis, accepted } = await wonBasisOfLead(tx, tenantId, leadId);
      return {
        basis,
        accepted: await numbered(tx, tenantId, accepted),
        acceptance:
          accepted === null ? null : await acceptanceProofOf(tx, tenantId, accepted.versionId),
        defaultTerms: await defaultTermsOf(tx, tenantId),
        sibling: await siblingProposalOf(tx, tenantId, { leadId, customerId: found.customerId }),
      };
    });
  }
}
