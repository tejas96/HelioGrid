import type { DealSegment, DedupeMatchWire, LeadDetail } from '@heliogrid/contracts';
import {
  customer,
  type DbTransaction,
  duplicateLink,
  lead,
  referral,
  type TenantPool,
} from '@heliogrid/db';
import type { MessagingWindow } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import type { Act } from '../../common/auth/session-context';
import { type CreationKey, type Keyed, replayOf } from '../../common/creation-key';
import { lockCreationKey } from '../../common/db/creation-key-lock';
import { TENANT_DB } from '../../common/db/tenant.token';
import { memberAct, recordAuditEntry } from '../audit/audit.public';
import {
  currentLeadOf,
  customerInScope,
  lockCustomers,
  lockPhone,
  phoneMatchOf,
} from './crm.customers.repository';
import { loadLeadDetail } from './crm.lead-detail.repository';
import { type MadeLead, writeNewLead } from './crm.new-lead.repository';
import { raiseFirstCallBack } from './crm.raised-tasks.repository';
import { recordActivity } from './crm.timeline.repository';
import type { LeadMoney } from './internal/lead-wire';
import type { LeadReader } from './internal/reader';

/** What a quick add typed (`M02-01`), its number already pack-normalised (`M02-02`). */
export interface CaptureInput {
  readonly phoneE164: string;
  readonly name: string | null;
  readonly city: string | null;
  readonly segment: DealSegment | null;
  readonly capturedAt: Date;
  /** The existing customer who referred the lead (`M02-16`)… */
  readonly referrerId: string | null;
  /** …or the name typed for a referrer who is not one; at most one of the two is set. */
  readonly referredByName: string | null;
  /** Create anyway (`M02-12`): the customer the number met, and why both are kept. */
  readonly keepBoth: { readonly otherCustomerId: string; readonly reason: string } | null;
}

export type CaptureOutcome =
  | Keyed<LeadDetail>
  | { readonly outcome: 'duplicate'; readonly facts: DedupeMatchWire }
  | { readonly outcome: 'not-found' };

const NOT_FOUND = { outcome: 'not-found' } as const;

/** The customer a kept duplicate stands beside, and the reason it was kept. */
interface KeptBeside {
  readonly customerId: string;
  readonly reason: string;
}

/**
 * Capture's writes (`M02-01`…`M02-16`, `M02-66`) on the runtime pool: the number's lock, the
 * dedupe re-check and the new customer with its lead, in ONE transaction — so of two same-moment
 * saves of one number the second meets the first's record and writes nothing.
 */
@Injectable()
export class CrmCaptureRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  /** The live check (`M02-07`): what the number belongs to, as this reader's sheet shows it. */
  async match(reader: LeadReader, phoneE164: string): Promise<DedupeMatchWire | null> {
    return this.db.withTenantTransaction(reader.tenantId, async (tx) => {
      const match = await phoneMatchOf(tx, reader, phoneE164);
      return match?.facts ?? null;
    });
  }

  /**
   * A new customer and lead. A retry with its key answers the first lead (`F4-07`); a number
   * someone already holds answers the sheet's facts unless kept both beside that very customer,
   * whom the reader must be able to see — as they must the referrer. A lead captured outside the
   * calling window gets its first call-back, due at the window's next opening (`M02-15`).
   */
  async create(
    reader: LeadReader,
    input: CaptureInput,
    money: LeadMoney,
    act: Act,
    key: CreationKey | null,
    callBackWindow: MessagingWindow,
  ): Promise<CaptureOutcome> {
    const { tenantId } = reader;
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      if (key !== null) {
        await lockCreationKey(tx, key);
        const made = await leadMadeWith(tx, tenantId, key);
        if (made)
          return replayOf(await detailOf(tx, reader, made.id, money), made.fingerprint, key);
      }
      await lockPhone(tx, tenantId, input.phoneE164);
      const judged = await judgeCapture(tx, reader, input);
      if (judged.outcome !== 'save') return judged;
      const made = await writeCapture(tx, reader, input, act, key);
      if (judged.keptBeside !== null)
        await keepBoth(tx, reader, made, input, judged.keptBeside, act);
      await raiseFirstCallBack(tx, { ...made, tenantId, act, window: callBackWindow });
      return { outcome: 'created', row: await detailOf(tx, reader, made.leadId, money) };
    });
  }
}

/** The lead an earlier send with this key made, if one did. */
async function leadMadeWith(tx: DbTransaction, tenantId: string, key: CreationKey) {
  const [made] = await tx
    .select({ id: lead.id, fingerprint: lead.creationFingerprint })
    .from(lead)
    .where(and(eq(lead.tenantId, tenantId), eq(lead.creationKey, key.key)))
    .limit(1);
  return made ?? null;
}

/**
 * Whether the capture saves, under the number's lock and the named customers' (a merge of either
 * waits, or is seen done): a referrer the reader cannot see is not found; a number someone holds
 * meets the sheet — unless kept both beside one of its holders, whom the reader must be able to see.
 */
async function judgeCapture(
  tx: DbTransaction,
  reader: LeadReader,
  input: CaptureInput,
): Promise<
  | { readonly outcome: 'save'; readonly keptBeside: KeptBeside | null }
  | Exclude<CaptureOutcome, Keyed<LeadDetail>>
> {
  const named = [input.referrerId, input.keepBoth?.otherCustomerId ?? null];
  await lockCustomers(
    tx,
    reader.tenantId,
    named.filter((id) => id !== null),
  );
  if (input.referrerId !== null && !(await customerInScope(tx, reader, input.referrerId))) {
    return NOT_FOUND;
  }
  const match = await phoneMatchOf(tx, reader, input.phoneE164);
  if (match === null) return { outcome: 'save', keptBeside: null };
  const keep = input.keepBoth;
  if (keep === null || !match.customerIds.includes(keep.otherCustomerId)) {
    return { outcome: 'duplicate', facts: match.facts };
  }
  if (!(await customerInScope(tx, reader, keep.otherCustomerId))) return NOT_FOUND;
  return { outcome: 'save', keptBeside: { customerId: keep.otherCustomerId, reason: keep.reason } };
}

async function detailOf(
  tx: DbTransaction,
  reader: LeadReader,
  leadId: string,
  money: LeadMoney,
): Promise<LeadDetail> {
  const detail = await loadLeadDetail(tx, reader, leadId, money);
  if (detail === null) throw new Error(`lead ${leadId} vanished inside its own transaction`);
  return detail;
}

/**
 * The customer and their lead, waiting unassigned at `new` (`M02-50`), its creation on the
 * timeline, and the referral on both records (`M02-16`).
 */
async function writeCapture(
  tx: DbTransaction,
  reader: LeadReader,
  input: CaptureInput,
  act: Act,
  key: CreationKey | null,
): Promise<MadeLead> {
  const { tenantId } = reader;
  const referred = input.referrerId !== null || input.referredByName !== null;
  const made = await writeNewLead(
    tx,
    {
      tenantId,
      phoneE164: input.phoneE164,
      name: input.name,
      city: input.city,
      segment: input.segment,
      monthlyBillMinor: null,
      source: referred ? 'referral' : 'quick_add',
      referredByName: input.referredByName,
      capturedAt: input.capturedAt,
      key,
    },
    act,
  );
  const by = {
    actor: { kind: 'person', userId: act.actorUserId },
    capturedAt: input.capturedAt,
  } as const;
  if (referred) await recordReferral(tx, { tenantId, ...made }, input, act, by);
  return made;
}

/** The referral on the referred lead's stream and, for a customer referrer, on theirs too. */
async function recordReferral(
  tx: DbTransaction,
  on: { tenantId: string; customerId: string; leadId: string },
  input: CaptureInput,
  act: Act,
  by: { actor: { kind: 'person'; userId: string }; capturedAt: Date },
): Promise<void> {
  const referrerId = input.referrerId;
  const referrerName =
    referrerId === null ? input.referredByName : await nameOf(tx, on.tenantId, referrerId);
  const body = { referrerCustomerId: referrerId, referrerName, referredLeadId: on.leadId };
  await recordActivity(tx, { ...on, ...by, kind: 'referral', body });
  if (referrerId === null) return;
  await tx.insert(referral).values({
    tenantId: on.tenantId,
    referringCustomerId: referrerId,
    referredLeadId: on.leadId,
    createdAt: new Date(act.now),
    createdBy: act.actorUserId,
  });
  await recordActivity(tx, {
    ...on,
    ...by,
    customerId: referrerId,
    leadId: null,
    kind: 'referral',
    body,
  });
}

async function nameOf(
  tx: DbTransaction,
  tenantId: string,
  customerId: string,
): Promise<string | null> {
  const [found] = await tx
    .select({ name: customer.name })
    .from(customer)
    .where(and(eq(customer.tenantId, tenantId), eq(customer.id, customerId)));
  return found?.name ?? null;
}

/**
 * Create anyway (`M02-12`): the two customers linked with the reason, the reason on both
 * customers' leads with who and when, and the act in the audit log naming the kept customer.
 */
async function keepBoth(
  tx: DbTransaction,
  reader: LeadReader,
  made: MadeLead,
  input: CaptureInput,
  kept: KeptBeside,
  act: Act,
): Promise<void> {
  const { tenantId } = reader;
  await tx.insert(duplicateLink).values({
    tenantId,
    customerAId: kept.customerId,
    customerBId: made.customerId,
    reason: kept.reason,
    createdAt: new Date(act.now),
    createdBy: act.actorUserId,
  });
  const by = {
    actor: { kind: 'person', userId: act.actorUserId },
    capturedAt: input.capturedAt,
  } as const;
  await recordActivity(tx, {
    tenantId,
    ...made,
    ...by,
    kind: 'duplicate_kept',
    body: { otherCustomerId: kept.customerId, reason: kept.reason },
  });
  await recordActivity(tx, {
    tenantId,
    customerId: kept.customerId,
    leadId: await currentLeadOf(tx, tenantId, kept.customerId),
    ...by,
    kind: 'duplicate_kept',
    body: { otherCustomerId: made.customerId, reason: kept.reason },
  });
  await recordAuditEntry(tx, {
    ...memberAct('crm.duplicate_kept', tenantId, { kind: 'customer', ref: made.customerId }, act),
    changePayload: { reason: kept.reason, keptBesideId: kept.customerId },
  });
}
