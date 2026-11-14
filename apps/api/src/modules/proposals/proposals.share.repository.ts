import { type DbTransaction, proposal, proposalShare, type TenantPool } from '@heliogrid/db';
import {
  PROPOSAL_TASK_PROVENANCES,
  type ProposalActRefusal,
  type ProposalStatusFacts,
  type ShareChannel,
  shareProposal,
  withdrawProposal,
} from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import type { Act } from '../../common/auth/session-context';
import { TENANT_DB } from '../../common/db/tenant.token';
import { memberAct, recordAuditEntry } from '../audit/audit.public';
import {
  closeTasksRaisedBy,
  type LeadReader,
  lockLeadInScope,
  personOf,
  recordActivity,
} from '../crm/crm.public';
import {
  leadIdOfProposal,
  type ProposalRecord,
  proposalInScope,
} from './proposals.facts.repository';
import { ProposalLinksRegistry } from './proposals.links.repository';
import {
  anotherIsLive,
  followUp,
  moveLead,
  numberOf,
  takeItsPlace,
} from './proposals.share-effects.repository';

export type ShareOutcome =
  /** `followUpAt` is `null` when the share raised no follow-up (a version already answered). */
  | { readonly outcome: 'shared'; readonly followUpAt: Date | null }
  | { readonly outcome: 'not-found' }
  | { readonly outcome: 'refused'; readonly refusal: ProposalActRefusal };

export type WithdrawOutcome =
  | { readonly outcome: 'withdrawn' | 'not-found' }
  | { readonly outcome: 'refused'; readonly refusal: ProposalActRefusal };

/** What one share carries. */
export interface ShareAsk {
  readonly channel: ShareChannel;
  readonly capturedAt: Date;
  /** When the follow-up falls due (`M06-55`): two days after this share. */
  readonly followUpAt: Date;
  /** Why the newest version may not go out, as its own pins read now (`F8-17`); `null` lets it. */
  blockedBy(stored: ProposalRecord): ProposalActRefusal | null;
}

export function statusFactsOf(stored: ProposalRecord): ProposalStatusFacts {
  return {
    status: stored.status,
    latestVersion: stored.latestVersion,
    sharedVersion: stored.sharedVersion,
    answer: stored.answer,
  };
}

/**
 * Sharing and withdrawing (`M06-45`, `M06-53`, `M06-55`, `M06-58`): each a person's act, decided by
 * domain's status machine and written with everything it sets moving — the lead's stage, the older
 * proposal it replaces, the customer's link on the first share, the follow-up task, the timeline
 * and the audit entry — in one transaction. A share is a tap, never a delivery.
 */
@Injectable()
export class ProposalsShareRepository {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(TENANT_DB) private readonly db: TenantPool,
    @Inject(ProposalLinksRegistry) private readonly links: ProposalLinksRegistry,
  ) {}

  share(reader: LeadReader, proposalId: string, ask: ShareAsk, act: Act): Promise<ShareOutcome> {
    const { tenantId } = reader;
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const held = await this.heldFor(tx, reader, proposalId);
      if (held === null) return { outcome: 'not-found' };
      const { locked, stored } = held;
      const result = shareProposal(statusFactsOf(stored), locked.lifecycle);
      if (result.kind === 'refused') return { outcome: 'refused', refusal: result.refusal };
      const goesLive = result.next.sharedVersion !== stored.sharedVersion;
      const blocked = goesLive ? ask.blockedBy(stored) : null;
      if (blocked !== null) return { outcome: 'refused', refusal: blocked };
      const version = result.next.sharedVersion;
      if (version === null) throw new Error('a share left its proposal with no shared version');
      const now = new Date(act.now);
      await takeItsPlace(tx, tenantId, stored, result, goesLive, act);
      await tx.insert(proposalShare).values({
        tenantId,
        proposalId,
        version,
        channel: ask.channel,
        sharedAt: now,
        sharedBy: act.actorUserId,
      });
      await moveLead(tx, locked, result, act, ask.capturedAt);
      // Every share, not the first alone: a customer whose link was revoked is minted a new one.
      await this.links.mintForCustomer(
        tx,
        { tenantId, leadId: locked.leadId, customerId: locked.customerId },
        { userId: act.actorUserId, at: now },
      );
      // A share again of a version the customer already answered chases nobody (`M06-55`).
      if (result.raisesTask !== null) await followUp(tx, locked, ask.followUpAt, act);
      await recordAuditEntry(
        tx,
        memberAct(
          'proposals.proposal_shared',
          tenantId,
          { kind: 'proposal', ref: proposalId },
          act,
        ),
      );
      await recordActivity(tx, {
        tenantId,
        customerId: locked.customerId,
        leadId: locked.leadId,
        kind: 'proposal_shared',
        body: { proposalId, number: numberOf(stored), version, channel: ask.channel },
        actor: personOf(act),
        capturedAt: ask.capturedAt,
      });
      return { outcome: 'shared', followUpAt: result.raisesTask === null ? null : ask.followUpAt };
    });
  }

  /** A person withdraws their proposal (`M06-58`): nothing withdraws by itself, and the lead does not move. */
  withdraw(
    reader: LeadReader,
    proposalId: string,
    capturedAt: Date,
    act: Act,
  ): Promise<WithdrawOutcome> {
    const { tenantId } = reader;
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const held = await this.heldFor(tx, reader, proposalId);
      if (held === null) return { outcome: 'not-found' };
      const { locked, stored } = held;
      const result = withdrawProposal(statusFactsOf(stored), locked.lifecycle);
      if (result.kind === 'refused') return { outcome: 'refused', refusal: result.refusal };
      const now = new Date(act.now);
      await tx
        .update(proposal)
        .set({ status: result.next.status, updatedAt: now, updatedBy: act.actorUserId })
        .where(and(eq(proposal.tenantId, tenantId), eq(proposal.id, proposalId)));
      if (result.closesFollowUp && !(await anotherIsLive(tx, tenantId, stored))) {
        await closeTasksRaisedBy(tx, tenantId, locked.leadId, PROPOSAL_TASK_PROVENANCES);
      }
      await recordAuditEntry(
        tx,
        memberAct(
          'proposals.proposal_withdrawn',
          tenantId,
          { kind: 'proposal', ref: proposalId },
          act,
        ),
      );
      await recordActivity(tx, {
        tenantId,
        customerId: locked.customerId,
        leadId: locked.leadId,
        kind: 'proposal_withdrawn',
        body: { proposalId, number: numberOf(stored), cause: 'person' },
        actor: personOf(act),
        capturedAt,
      });
      return { outcome: 'withdrawn' };
    });
  }

  /** The lead locked, then its proposal — the order every proposal write takes them in. */
  private async heldFor(tx: DbTransaction, reader: LeadReader, proposalId: string) {
    const leadId = await leadIdOfProposal(tx, reader.tenantId, proposalId);
    if (leadId === null) return null;
    const locked = await lockLeadInScope(tx, reader, leadId);
    if (locked === null) return null;
    const stored = await proposalInScope(tx, reader, proposalId, true);
    return stored === null ? null : { locked, stored };
  }
}
