import { customer, type DbTransaction, lead } from '@heliogrid/db';
import type { DealSegment, LeadSource } from '@heliogrid/domain';
import type { Act } from '../../common/auth/session-context';
import type { CreationKey } from '../../common/creation-key';
import { recordActivity } from './crm.timeline.repository';

/** What a new customer and their first lead are made of; the number already pack-normalised. */
export interface NewLead {
  readonly tenantId: string;
  readonly phoneE164: string;
  readonly name: string | null;
  readonly city: string | null;
  readonly segment: DealSegment | null;
  /** The tenant currency's minor unit; null where nothing names the bill. */
  readonly monthlyBillMinor: number | null;
  readonly source: LeadSource;
  /** The "came from" of a referrer who is not a customer (`M02-16`). */
  readonly referredByName: string | null;
  /** When the device — or the import — captured it: shown, never sorted by (`F4-19`). */
  readonly capturedAt: Date;
  readonly key: CreationKey | null;
}

/** The customer and the lead a capture made. */
export interface MadeLead {
  readonly customerId: string;
  readonly leadId: string;
}

/**
 * A new customer and their lead, waiting unassigned at `new` (`M02-50`), and its creation on the
 * timeline — on the caller's transaction, which holds the number's lock (`lockPhone`). Every way a
 * lead is created writes it here: quick add, a referral, an import row.
 */
export async function writeNewLead(tx: DbTransaction, input: NewLead, act: Act): Promise<MadeLead> {
  const { tenantId } = input;
  const now = new Date(act.now);
  const [made] = await tx
    .insert(customer)
    .values({
      tenantId,
      phoneE164: input.phoneE164,
      name: input.name,
      city: input.city,
      createdAt: now,
      createdBy: act.actorUserId,
    })
    .returning({ id: customer.id });
  if (made === undefined) throw new Error('the customer insert returned no row');
  const [written] = await tx
    .insert(lead)
    .values({
      tenantId,
      customerId: made.id,
      source: input.source,
      segment: input.segment,
      stage: 'new',
      monthlyBillMinor: input.monthlyBillMinor,
      referredByName: input.referredByName,
      lastActivityAt: now,
      capturedAt: input.capturedAt,
      createdAt: now,
      createdBy: act.actorUserId,
      creationKey: input.key?.key,
      creationFingerprint: input.key?.fingerprint,
    })
    .returning({ id: lead.id });
  if (written === undefined) throw new Error('the lead insert returned no row');
  await recordActivity(tx, {
    tenantId,
    customerId: made.id,
    leadId: written.id,
    actor: { kind: 'person', userId: act.actorUserId },
    capturedAt: input.capturedAt,
    kind: 'lead_created',
    body: { source: input.source, segment: input.segment },
  });
  return { customerId: made.id, leadId: written.id };
}
