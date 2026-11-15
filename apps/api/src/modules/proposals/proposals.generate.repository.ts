import { type DbTransaction, proposal, proposalVersion, type TenantPool } from '@heliogrid/db';
import {
  type FormatPack,
  type GenerateVerdict,
  type InputPins,
  isClosed,
  type ProposalActRefusal,
  type ProposalFieldSet,
} from '@heliogrid/domain';
import { proposalNumberOf } from '@heliogrid/domain/server';
import { Inject, Injectable } from '@nestjs/common';
import { and, count, eq, gte } from 'drizzle-orm';
import type { Act } from '../../common/auth/session-context';
import type { CreationKey } from '../../common/creation-key';
import { TENANT_DB } from '../../common/db/tenant.token';
import { lockCounter, nextNumber } from '../../common/db/tenant-counter.repository';
import {
  type LeadMoney,
  type LeadReader,
  type LockedLead,
  lockLeadInScope,
} from '../crm/crm.public';
import type { LiveDocument } from './internal/document-wire';
import {
  type DealRecord,
  dealOf,
  leadIdOfProposal,
  type NamedPerson,
  type ProposalRecord,
  personNamed,
  proposalInScope,
} from './proposals.facts.repository';
import { type FrozenVersion, writeVersion } from './proposals.version-write.repository';

export type GenerateOutcome =
  | {
      readonly outcome: 'done' | 'replayed';
      readonly version: number;
      readonly number: string;
    }
  | { readonly outcome: 'key-reused' }
  | { readonly outcome: 'not-found' | 'note-missing' }
  | { readonly outcome: 'stale'; readonly revision: number }
  | { readonly outcome: 'refused'; readonly refusal: ProposalActRefusal }
  | { readonly outcome: 'not-ready'; readonly verdict: GenerateVerdict }
  | {
      readonly outcome: 'over-limit';
      readonly resetsAt: Date;
      /** "40 of 40" (`T-M06-028`): the cycle's count and its limit, said to every reader. */
      readonly used: number;
      readonly limit: number;
    };

/** What one Generate carries beyond the proposal's id. */
export interface GenerateAsk {
  readonly revision: number;
  readonly changeNote: string | null;
  readonly belowCostConfirmed: boolean;
  readonly capturedAt: Date;
}

/** What Generate needs from outside its transaction: the plan, the money scale and the freeze. */
export interface GenerateContext {
  readonly money: LeadMoney;
  readonly formats: FormatPack;
  /** This cycle's proposals: its limit — `null` for none — and the day the count began. */
  readonly allowance: {
    readonly limit: number | null;
    readonly from: Date;
    readonly resetsAt: Date;
  };
  readonly pins: InputPins;
  /** The document as Generate freezes it, with the one checklist's verdict over it (`M06-23`). */
  freeze(
    fields: ProposalFieldSet,
    deal: DealRecord,
    by: NamedPerson,
  ): { readonly document: LiveDocument; readonly verdict: GenerateVerdict };
}

/**
 * Generate (`M06-23`, `M06-42`, `M06-44`): the one checklist, then a version frozen whole. The
 * first takes the proposal's number from the company's counter, held for the transaction, so two
 * people generating at once take turns and never collide; it is also when the proposal counts
 * against the plan (`T-M06-028`). One retry key makes one version and one number.
 */
@Injectable()
export class ProposalsGenerateRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  generate(
    reader: LeadReader,
    proposalId: string,
    ask: GenerateAsk,
    key: CreationKey | null,
    act: Act,
    context: GenerateContext,
  ): Promise<GenerateOutcome> {
    const { tenantId } = reader;
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const admitted = await admit(tx, reader, proposalId, ask, key);
      if ('outcome' in admitted) return admitted;
      const { stored, locked, leadId } = admitted;
      const deal = await dealOf(tx, tenantId, leadId, context.formats);
      const by = await personNamed(tx, act.actorUserId);
      const { document, verdict } = context.freeze(stored.fieldSet, deal, by);
      const money = moneyToFreeze(document, verdict, ask.belowCostConfirmed);
      if (money === null) return { outcome: 'not-ready', verdict };
      const version = (stored.latestVersion ?? 0) + 1;
      if (version > 1 && ask.changeNote === null) return { outcome: 'note-missing' };
      // The company's counter is held from here: first Generates take turns on it (`M06-44`).
      await lockCounter(tx, tenantId, 'proposal');
      const used =
        stored.countedAt === null ? await overLimit(tx, tenantId, context.allowance) : null;
      if (used !== null) {
        return { outcome: 'over-limit', resetsAt: context.allowance.resetsAt, ...used };
      }
      const number = stored.number ?? (await nextNumber(tx, tenantId, 'proposal'));
      const frozen: FrozenVersion = {
        proposalId,
        leadId,
        customerId: locked.customerId,
        version,
        number,
        first: stored.number === null,
        countedAt: stored.countedAt,
        snapshot: { ...document, money },
        pins: context.pins,
        changeNote: version === 1 ? null : ask.changeNote,
        capturedAt: ask.capturedAt,
        minorUnitDigits: context.money.minorUnitDigits,
      };
      await writeVersion(tx, tenantId, frozen, key, act);
      return { outcome: 'done', version, number: proposalNumberOf(number) };
    });
  }
}

/**
 * Who may generate this proposal now, in the one lock order — its lead, then the proposal: a retry
 * answers what its first send made, a stale revision is refused, and a closed lead generates nothing.
 */
async function admit(
  tx: DbTransaction,
  reader: LeadReader,
  proposalId: string,
  ask: GenerateAsk,
  key: CreationKey | null,
): Promise<
  | GenerateOutcome
  | { readonly stored: ProposalRecord; readonly locked: LockedLead; readonly leadId: string }
> {
  const { tenantId } = reader;
  const leadId = await leadIdOfProposal(tx, tenantId, proposalId);
  if (leadId === null) return { outcome: 'not-found' };
  const locked = await lockLeadInScope(tx, reader, leadId);
  if (locked === null) return { outcome: 'not-found' };
  const replay = key === null ? null : await generatedWith(tx, tenantId, proposalId, key);
  if (replay !== null) return replay;
  const stored = await proposalInScope(tx, reader, proposalId, true);
  if (stored === null) return { outcome: 'not-found' };
  if (stored.revision !== ask.revision) return { outcome: 'stale', revision: stored.revision };
  if (isClosed(locked.lifecycle)) return { outcome: 'refused', refusal: 'lead_closed' };
  return { stored, locked, leadId };
}

/**
 * The money a version freezes, or `null` while Generate must wait (`M06-23`, `M06-37`): a block
 * stands, no price resolves, or the price loses money and the person has not said go on.
 */
function moneyToFreeze(
  document: LiveDocument,
  verdict: GenerateVerdict,
  belowCostConfirmed: boolean,
): LiveDocument['money'] {
  const unconfirmedLoss =
    !belowCostConfirmed && verdict.warnings.some((warn) => warn.check === 'below_cost');
  return verdict.canGenerate && !unconfirmedLoss ? document.money : null;
}

/**
 * This cycle's count and limit when its proposals are used up (`M06-26`), else `null`: counted after
 * the counter's lock, so two firsts cannot both pass.
 */
async function overLimit(
  tx: DbTransaction,
  tenantId: string,
  allowance: GenerateContext['allowance'],
): Promise<{ readonly used: number; readonly limit: number } | null> {
  if (allowance.limit === null) return null;
  const [counted] = await tx
    .select({ n: count() })
    .from(proposal)
    .where(and(eq(proposal.tenantId, tenantId), gte(proposal.countedAt, allowance.from)));
  const used = counted?.n ?? 0;
  return used >= allowance.limit ? { used, limit: allowance.limit } : null;
}

/**
 * A retry of the same Generate (`F4-07`): the version an earlier send with this key made — the same
 * request answered again, or, for another request under that key, the key's refusal.
 */
async function generatedWith(
  tx: DbTransaction,
  tenantId: string,
  proposalId: string,
  key: CreationKey,
): Promise<GenerateOutcome | null> {
  const [made] = await tx
    .select({
      proposalId: proposalVersion.proposalId,
      version: proposalVersion.version,
      fingerprint: proposalVersion.creationFingerprint,
      number: proposal.number,
    })
    .from(proposalVersion)
    .innerJoin(proposal, eq(proposal.id, proposalVersion.proposalId))
    .where(and(eq(proposalVersion.tenantId, tenantId), eq(proposalVersion.creationKey, key.key)));
  if (made === undefined) return null;
  if (
    made.fingerprint !== key.fingerprint ||
    made.proposalId !== proposalId ||
    made.number === null
  ) {
    return { outcome: 'key-reused' };
  }
  return { outcome: 'replayed', version: made.version, number: proposalNumberOf(made.number) };
}
