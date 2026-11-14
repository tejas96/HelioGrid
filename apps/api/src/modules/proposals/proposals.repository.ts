import type { StartProposal } from '@heliogrid/contracts';
import { type DbTransaction, proposal, type TenantPool } from '@heliogrid/db';
import {
  type FormatPack,
  isClosed,
  type MinorUnits,
  type ProposalDealFacts,
  type ProposalFieldSet,
  sameContent,
} from '@heliogrid/domain';
import { fieldSetEnvelopeOf } from '@heliogrid/domain/server';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import type { Act } from '../../common/auth/session-context';
import type { CreationKey } from '../../common/creation-key';
import { TENANT_DB } from '../../common/db/tenant.token';
import {
  applyLeadEdit,
  type LeadFieldEdit,
  type LeadMoney,
  type LeadReader,
  leadWorkedOn,
  lockLeadInScope,
} from '../crm/crm.public';
import {
  beginOf,
  type CommitOutcome,
  type DraftSeedFacts,
  insertDraft,
  movedAway,
  openDraftOf,
  recordDiscount,
  type StartOutcome,
  startedWith,
} from './proposals.draft-writes.repository';
import { dealOf, leadIdOfProposal, proposalInScope } from './proposals.facts.repository';

export type { CommitOutcome, StartOutcome } from './proposals.draft-writes.repository';

/** What one commit changes: the steps, the lead's own facts, the Quick switch. */
export interface DraftChange {
  /** The stored field set with this commit's steps laid over it; absent leaves the steps alone. */
  readonly fields?: (stored: ProposalFieldSet) => ProposalFieldSet;
  readonly deal?: LeadFieldEdit;
  readonly quickMode?: boolean;
}

/** What a commit needs worked out for the row it writes: the server's own figures (`F4-04`). */
export interface DraftFigures {
  readonly money: LeadMoney;
  /** The company's market formats: how its customer's number is judged, how its money is scaled. */
  readonly formats: FormatPack;
  /** The payable and the discount of a field set on its lead, as domain computes them. */
  figuresOf(
    fields: ProposalFieldSet,
    deal: ProposalDealFacts,
  ): { readonly payable: MinorUnits | null; readonly discount: MinorUnits | null };
}

/**
 * A draft's writes on the runtime pool (`T-M06-032`, `M06-25`). Every write locks the lead first —
 * the one lock order every lead write takes — then the proposal, so two devices on one draft apply
 * one after the other and the later one is refused on its stale revision, never merged.
 */
@Injectable()
export class ProposalsRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  /**
   * Starts a proposal on the lead, or opens its draft again: a lead holds one draft that was never
   * generated (`T-M06-001`), and a closed lead none (`M06-45`). `seed` fills a new draft from the
   * company's templates; a copy takes every step of the proposal it names (`M06-48`).
   */
  start(
    reader: LeadReader,
    leadId: string,
    body: StartProposal,
    key: CreationKey | null,
    act: Act,
    seed: (facts: DraftSeedFacts) => Promise<ProposalFieldSet>,
  ): Promise<StartOutcome> {
    const { tenantId } = reader;
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const locked = await lockLeadInScope(tx, reader, leadId);
      if (locked === null) return { outcome: 'not-found' };
      const replay = key === null ? null : await startedWith(tx, tenantId, key);
      if (replay !== null) return replay;
      if (isClosed(locked.lifecycle)) return { outcome: 'refused', refusal: 'lead_closed' };
      const open = await openDraftOf(tx, tenantId, leadId);
      if (open !== null) return { outcome: 'resumed', proposalId: open };
      const begin = await beginOf(tx, reader, leadId, body, seed);
      if (begin === null) return { outcome: 'copy-not-found' };
      const proposalId = await insertDraft(tx, { tenantId, leadId }, begin, key, act);
      // A draft act is work on its lead: a dormant one returns to its stage (`M02-49`).
      await leadWorkedOn(tx, tenantId, locked.customerId, leadId);
      return { outcome: 'created', proposalId };
    });
  }

  /**
   * One commit (`M06-25`): refused on a stale revision; a lead the reader lost since they worked on
   * the draft answers who holds it now. A lead fact typed at a step is saved through the lead's own
   * edit path, each a timeline entry (`T-M06-032`). A commit equal to what is stored writes nothing.
   */
  commit(
    reader: LeadReader,
    proposalId: string,
    revision: number,
    change: DraftChange,
    capturedAt: Date,
    act: Act,
    figures: DraftFigures,
  ): Promise<CommitOutcome> {
    const { tenantId } = reader;
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const leadId = await leadIdOfProposal(tx, tenantId, proposalId);
      if (leadId === null) return { outcome: 'not-found' };
      const locked = await lockLeadInScope(tx, reader, leadId);
      if (locked === null) return movedAway(tx, reader, proposalId);
      const stored = await proposalInScope(tx, reader, proposalId, true);
      if (stored === null) return { outcome: 'not-found' };
      if (stored.revision !== revision) return { outcome: 'stale', revision: stored.revision };
      const fields = change.fields?.(stored.fieldSet) ?? stored.fieldSet;
      const quickMode = change.quickMode ?? stored.quickMode;
      const dealBefore = await dealOf(tx, tenantId, leadId, figures.formats);
      const dealAfter = await this.dealEdited(tx, reader, leadId, change, capturedAt, act, figures);
      const same =
        sameContent(fields, stored.fieldSet) &&
        quickMode === stored.quickMode &&
        sameContent(dealAfter.deal, dealBefore.deal);
      if (same) return { outcome: 'unchanged' };
      const { payable, discount } = figures.figuresOf(fields, dealAfter.deal);
      await tx
        .update(proposal)
        .set({
          fieldSet: fieldSetEnvelopeOf(fields),
          quickMode,
          revision: stored.revision + 1,
          payableMinor: payable,
          updatedAt: new Date(act.now),
          updatedBy: act.actorUserId,
        })
        .where(and(eq(proposal.tenantId, tenantId), eq(proposal.id, proposalId)));
      const typed = { before: stored.fieldSet.system.discount, after: fields.system.discount };
      await recordDiscount(tx, { tenantId, proposalId }, typed, discount, figures.money, act);
      await leadWorkedOn(tx, tenantId, locked.customerId, leadId);
      return { outcome: 'saved' };
    });
  }

  /** The lead's facts once the commit's own edit of them is saved — through the lead's edit path. */
  private async dealEdited(
    tx: DbTransaction,
    reader: LeadReader,
    leadId: string,
    change: DraftChange,
    capturedAt: Date,
    act: Act,
    figures: DraftFigures,
  ) {
    if (change.deal !== undefined) {
      await applyLeadEdit(tx, reader, leadId, change.deal, capturedAt, figures.money, act);
    }
    return dealOf(tx, reader.tenantId, leadId, figures.formats);
  }

  /** Discards a draft that was never generated; a generated proposal is withdrawn instead. */
  discard(
    reader: LeadReader,
    proposalId: string,
  ): Promise<'discarded' | 'not-found' | 'already-generated'> {
    const { tenantId } = reader;
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const leadId = await leadIdOfProposal(tx, tenantId, proposalId);
      if (leadId === null || (await lockLeadInScope(tx, reader, leadId)) === null) {
        return 'not-found';
      }
      const stored = await proposalInScope(tx, reader, proposalId, true);
      if (stored === null) return 'not-found';
      if (stored.latestVersion !== null) return 'already-generated';
      await tx
        .delete(proposal)
        .where(and(eq(proposal.tenantId, tenantId), eq(proposal.id, proposalId)));
      return 'discarded';
    });
  }
}
