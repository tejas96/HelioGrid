import { type DbTransaction, proposal, proposalVersion } from '@heliogrid/db';
import type { InputPins, ProposalVersionSnapshot } from '@heliogrid/domain';
import {
  minorUnitsToDecimal,
  proposalNumberOf,
  versionSnapshotEnvelopeOf,
} from '@heliogrid/domain/server';
import { and, eq } from 'drizzle-orm';
import type { Act } from '../../common/auth/session-context';
import type { CreationKey } from '../../common/creation-key';
import { memberAct, recordAuditEntry } from '../audit/audit.public';
import { personOf, recordActivity } from '../crm/crm.public';

/** One version as Generate decided it: what is frozen, under which number, for which lead. */
export interface FrozenVersion {
  readonly proposalId: string;
  readonly leadId: string;
  readonly customerId: string;
  readonly version: number;
  readonly number: number;
  /** The proposal's first Generate: the one that took its number (`M06-44`). */
  readonly first: boolean;
  /** When the proposal began to count against the plan; `null` until this Generate (`T-M06-028`). */
  readonly countedAt: Date | null;
  readonly snapshot: ProposalVersionSnapshot;
  readonly pins: InputPins;
  readonly changeNote: string | null;
  readonly capturedAt: Date;
  readonly minorUnitDigits: number;
}

/**
 * Writes one frozen version (`M06-42`): its row, the proposal's number and latest version, the
 * audit entries with who and the amount (`M06-56`), and the lead's timeline entry — inside the
 * transaction that holds the lead, the proposal and the company's counter.
 */
export async function writeVersion(
  tx: DbTransaction,
  tenantId: string,
  frozen: FrozenVersion,
  key: CreationKey | null,
  act: Act,
): Promise<void> {
  const { proposalId, version, number, snapshot } = frozen;
  const { money } = snapshot;
  const now = new Date(act.now);
  const [made] = await tx
    .insert(proposalVersion)
    .values({
      tenantId,
      proposalId,
      version,
      snapshot: versionSnapshotEnvelopeOf(snapshot),
      pins: frozen.pins,
      currencyCode: money.currency,
      payableMinor: money.payable,
      trigger: version === 1 ? 'first_generate' : 'regenerate',
      changeNote: frozen.changeNote,
      generatedAt: now,
      generatedBy: act.actorUserId,
      creationKey: key?.key,
      creationFingerprint: key?.fingerprint,
    })
    .returning({ id: proposalVersion.id });
  if (made === undefined) throw new Error('the version insert returned no row');
  await tx
    .update(proposal)
    .set({
      number,
      latestVersion: version,
      payableMinor: money.payable,
      countedAt: frozen.countedAt ?? now,
      updatedAt: now,
      updatedBy: act.actorUserId,
    })
    .where(and(eq(proposal.tenantId, tenantId), eq(proposal.id, proposalId)));
  const amount = {
    version,
    amount: minorUnitsToDecimal(money.payable, frozen.minorUnitDigits),
    currencyCode: money.currency,
  };
  if (frozen.first) {
    await recordAuditEntry(tx, {
      ...memberAct(
        'proposals.proposal_generated',
        tenantId,
        { kind: 'proposal', ref: proposalId },
        act,
      ),
      changePayload: amount,
    });
  }
  await recordAuditEntry(tx, {
    ...memberAct(
      'proposals.version_created',
      tenantId,
      { kind: 'proposal_version', ref: made.id },
      act,
    ),
    changePayload: amount,
  });
  await recordActivity(tx, {
    tenantId,
    customerId: frozen.customerId,
    leadId: frozen.leadId,
    kind: 'proposal_generated',
    body: { proposalId, number: proposalNumberOf(number), version, payable: amount.amount },
    actor: personOf(act),
    capturedAt: frozen.capturedAt,
  });
}
