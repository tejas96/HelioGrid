import type { StartProposal } from '@heliogrid/contracts';
import { customer, type DbTransaction, lead, proposal, userAccount } from '@heliogrid/db';
import type {
  DealSegment,
  MinorUnits,
  ProposalActRefusal,
  ProposalFieldSet,
  UiLanguage,
} from '@heliogrid/domain';
import { sameContent } from '@heliogrid/domain';
import { fieldSetEnvelopeOf, minorUnitsToDecimal } from '@heliogrid/domain/server';
import { and, eq, isNull } from 'drizzle-orm';
import type { Act } from '../../common/auth/session-context';
import type { CreationKey } from '../../common/creation-key';
import { memberAct, recordAuditEntry } from '../audit/audit.public';
import { type LeadMoney, type LeadReader, memberNameOf } from '../crm/crm.public';
import { proposalInScope } from './proposals.facts.repository';

/*
 * The pieces of a draft's writes (`T-M06-032`), each run inside the write's own transaction after
 * its lead is held: what a start finds and inserts, what a commit records, and what a reader who
 * lost the lead is told.
 */

export type StartOutcome =
  | { readonly outcome: 'created' | 'resumed' | 'replayed'; readonly proposalId: string }
  | { readonly outcome: 'key-reused' }
  | { readonly outcome: 'not-found' | 'copy-not-found' }
  | { readonly outcome: 'refused'; readonly refusal: ProposalActRefusal };

export type CommitOutcome =
  | { readonly outcome: 'saved' | 'unchanged' | 'not-found' }
  | { readonly outcome: 'stale'; readonly revision: number }
  | {
      readonly outcome: 'lead-moved';
      readonly revision: number;
      readonly movedTo: { readonly userId: string; readonly name: string } | null;
    };

/**
 * A copy's field set (`M06-48`): every step as its source holds it, components included — but not
 * what the energy source answered for the other site, nor the month figures typed for it.
 */
export function copied(source: ProposalFieldSet): ProposalFieldSet {
  return {
    ...source,
    performance: {
      ...source.performance,
      yieldPerKwp: null,
      source: null,
      grain: null,
      editedMonthlyKwh: null,
      editedAtCapacityKw: null,
    },
  };
}

/** A retry of the same start (`F4-07`): the draft an earlier send with this key made. */
export async function startedWith(
  tx: DbTransaction,
  tenantId: string,
  key: CreationKey,
): Promise<StartOutcome | null> {
  const [made] = await tx
    .select({ id: proposal.id, fingerprint: proposal.creationFingerprint })
    .from(proposal)
    .where(and(eq(proposal.tenantId, tenantId), eq(proposal.creationKey, key.key)));
  if (made === undefined) return null;
  return made.fingerprint === key.fingerprint
    ? { outcome: 'replayed', proposalId: made.id }
    : { outcome: 'key-reused' };
}

/**
 * The lead is out of the reader's reach (`M06-25`): a person who worked on this draft is told who
 * holds the lead now, and the draft stays with the lead; anyone else reads no such proposal.
 */
export async function movedAway(
  tx: DbTransaction,
  reader: LeadReader,
  proposalId: string,
): Promise<CommitOutcome> {
  const [own] = await tx
    .select({
      revision: proposal.revision,
      createdBy: proposal.createdBy,
      updatedBy: proposal.updatedBy,
      ownerId: lead.ownerUserId,
      ownerName: memberNameOf(userAccount),
    })
    .from(proposal)
    .innerJoin(lead, and(eq(lead.id, proposal.leadId), eq(lead.tenantId, proposal.tenantId)))
    .leftJoin(userAccount, eq(userAccount.id, lead.ownerUserId))
    .where(and(eq(proposal.tenantId, reader.tenantId), eq(proposal.id, proposalId)));
  const worked =
    own !== undefined && (own.createdBy === reader.actorId || own.updatedBy === reader.actorId);
  if (!worked) return { outcome: 'not-found' };
  return {
    outcome: 'lead-moved',
    revision: own.revision,
    movedTo: own.ownerId === null ? null : { userId: own.ownerId, name: own.ownerName ?? '' },
  };
}

/** The lead's one draft that was never generated (`T-M06-001`), if it holds one. */
export async function openDraftOf(
  tx: DbTransaction,
  tenantId: string,
  leadId: string,
): Promise<string | null> {
  const [open] = await tx
    .select({ id: proposal.id })
    .from(proposal)
    .where(
      and(
        eq(proposal.tenantId, tenantId),
        eq(proposal.leadId, leadId),
        eq(proposal.status, 'draft'),
        isNull(proposal.latestVersion),
      ),
    );
  return open?.id ?? null;
}

/**
 * What a new draft is seeded for: the lead's segment, which picks its incentive default, and its
 * customer's language, which the document is written in (`T-M06-017`) — so the company's unsaved
 * terms and phases are filled in the words the customer will read.
 */
export interface DraftSeedFacts {
  readonly segment: DealSegment | null;
  readonly preferredLanguage: UiLanguage | null;
}

export async function seedFactsOf(
  tx: DbTransaction,
  tenantId: string,
  leadId: string,
): Promise<DraftSeedFacts> {
  const [deal] = await tx
    .select({ segment: lead.segment, preferredLanguage: customer.preferredLanguage })
    .from(lead)
    .innerJoin(
      customer,
      and(eq(customer.id, lead.customerId), eq(customer.tenantId, lead.tenantId)),
    )
    .where(and(eq(lead.tenantId, tenantId), eq(lead.id, leadId)));
  return { segment: deal?.segment ?? null, preferredLanguage: deal?.preferredLanguage ?? null };
}

/**
 * What this start begins from: the templates' fill for the lead's segment, or — for a copy — every
 * step of the proposal it names, in the mode that one was built in (`T-M06-001`, `M06-48`). `null`
 * when the reader cannot see the proposal to copy.
 */
export async function beginOf(
  tx: DbTransaction,
  reader: LeadReader,
  leadId: string,
  body: StartProposal,
  seed: (facts: DraftSeedFacts) => Promise<ProposalFieldSet>,
): Promise<DraftStart | null> {
  if (body.copyOf === null) {
    return {
      quickMode: body.quickMode,
      fieldSet: await seed(await seedFactsOf(tx, reader.tenantId, leadId)),
      duplicatedFrom: null,
    };
  }
  const source = await proposalInScope(tx, reader, body.copyOf);
  if (source === null) return null;
  return {
    quickMode: source.quickMode,
    fieldSet: copied(source.fieldSet),
    duplicatedFrom: source.id,
  };
}

/** What a new draft starts with: the templates' fill, or its source's steps. */
export interface DraftStart {
  readonly quickMode: boolean;
  readonly fieldSet: ProposalFieldSet;
  readonly duplicatedFrom: string | null;
}

export async function insertDraft(
  tx: DbTransaction,
  on: { readonly tenantId: string; readonly leadId: string },
  begin: DraftStart,
  key: CreationKey | null,
  act: Act,
): Promise<string> {
  const now = new Date(act.now);
  const [made] = await tx
    .insert(proposal)
    .values({
      ...on,
      ...begin,
      fieldSet: fieldSetEnvelopeOf(begin.fieldSet),
      status: 'draft',
      revision: 0,
      createdAt: now,
      createdBy: act.actorUserId,
      updatedAt: now,
      updatedBy: act.actorUserId,
      creationKey: key?.key,
      creationFingerprint: key?.fingerprint,
    })
    .returning({ id: proposal.id });
  if (made === undefined) throw new Error('the proposal insert returned no row');
  return made.id;
}

type Discount = ProposalFieldSet['system']['discount'];

/** A discount typed or changed at step 3 is on the record with its amount (`M06-56`). */
export async function recordDiscount(
  tx: DbTransaction,
  on: { readonly tenantId: string; readonly proposalId: string },
  typed: { readonly before: Discount; readonly after: Discount },
  discount: MinorUnits | null,
  money: LeadMoney,
  act: Act,
): Promise<void> {
  if (typed.after === null || discount === null || sameContent(typed.before, typed.after)) return;
  await recordAuditEntry(tx, {
    ...memberAct(
      'proposals.discount_applied',
      on.tenantId,
      { kind: 'proposal', ref: on.proposalId },
      act,
    ),
    changePayload: {
      version: null,
      amount: minorUnitsToDecimal(discount, money.minorUnitDigits),
      currencyCode: money.currencyCode,
    },
  });
}
