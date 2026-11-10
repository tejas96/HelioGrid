import type { Customer, MergeCustomers, MergePreview } from '@heliogrid/contracts';
import {
  contact,
  customer,
  type DbTransaction,
  duplicateLink,
  lead,
  referral,
  type TenantPool,
} from '@heliogrid/db';
import {
  type MergedPrimary,
  type MergeField,
  type MergePlan,
  mergeDifferences,
  planMerge,
} from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull, ne, or } from 'drizzle-orm';
import type { Act } from '../../common/auth/session-context';
import { TENANT_DB } from '../../common/db/tenant.token';
import { memberAct, recordAuditEntry } from '../audit/audit.public';
import { customerRecordOf } from './crm.customer-record.repository';
import { currentLeadOf } from './crm.customers.repository';
import {
  type MergeBlock,
  type MergeSideRow,
  mergeMovesOf,
  mergePairOf,
} from './crm.merge-pair.repository';
import { recordActivity } from './crm.timeline.repository';
import type { LeadReader } from './internal/reader';

/** What a merge came to: done, or the reason it did not run. */
export type MergeOutcome =
  | { readonly kind: 'not-found' }
  | { readonly kind: 'blocked'; readonly block: MergeBlock }
  | { readonly kind: 'needs_picks'; readonly unpicked: readonly MergeField[] }
  | { readonly kind: 'merged'; readonly survivor: Customer; readonly leadId: string };

/** Each differing field as the compare step shows both sides; a primary contact by its name. */
const SHOWN: Readonly<Record<MergeField, (side: MergeSideRow) => string | null>> = {
  name: (side) => side.storedName,
  city: (side) => side.city,
  primary_contact: (side) => side.primaryContactName,
};

const BLOCKED: Omit<MergePreview, 'blocked' | 'heldBy'> = {
  survivor: null,
  loser: null,
  differences: [],
  moves: null,
};

const shownCustomer = (side: MergeSideRow) => ({
  customerId: side.customerId,
  name: side.storedName,
  phoneE164: side.phoneE164,
  city: side.city,
});

/** Customer merge (`M02-59`…`M02-63`) on the runtime pool. */
@Injectable()
export class CrmMergeRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  /** What a merge would ask and move, or why it cannot run; `null` when either is not found. */
  async preview(
    reader: LeadReader,
    pair: { readonly survivorId: string; readonly loserId: string },
  ): Promise<MergePreview | null> {
    return this.db.withTenantTransaction(reader.tenantId, async (tx) => {
      const read = await mergePairOf(tx, reader, pair, false);
      if (read.kind === 'not-found') return null;
      if (read.kind === 'blocked') return { blocked: read.block, heldBy: read.heldBy, ...BLOCKED };
      const { survivor, loser } = read;
      return {
        blocked: null,
        heldBy: null,
        survivor: shownCustomer(survivor),
        loser: shownCustomer(loser),
        differences: mergeDifferences(survivor, loser).map((field) => ({
          field,
          survivor: SHOWN[field](survivor),
          loser: SHOWN[field](loser),
        })),
        moves: await mergeMovesOf(tx, reader.tenantId, loser.customerId),
      };
    });
  }

  async merge(reader: LeadReader, input: MergeCustomers, act: Act): Promise<MergeOutcome> {
    return this.db.withTenantTransaction(reader.tenantId, (tx) =>
      mergeCustomers(tx, reader, input, act),
    );
  }
}

/**
 * The merge, in the caller's transaction: both customers held, every differing field picked, then
 * every row naming the loser re-pointed, the loser left as a tombstone, and one timeline entry and
 * one audit entry naming each choice. It writes only domain's `MERGE_WRITE_SET`.
 */
export async function mergeCustomers(
  tx: DbTransaction,
  reader: LeadReader,
  input: MergeCustomers,
  act: Act,
): Promise<MergeOutcome> {
  const read = await mergePairOf(tx, reader, input, true);
  if (read.kind !== 'pair') return read;
  const planned = planMerge(read.survivor, read.loser, input.picks);
  if (planned.kind === 'refused') {
    if (planned.refusal === 'same_customer') throw new Error('the contract refuses a self-merge');
    return { kind: 'blocked', block: planned.refusal };
  }
  if (planned.kind === 'needs_picks') return planned;
  const { plan } = planned;
  await foldLoserIn(tx, reader.tenantId, plan, act);
  await recordActivity(tx, {
    tenantId: reader.tenantId,
    customerId: plan.survivorId,
    leadId: null,
    kind: 'customer_merged',
    body: { survivorId: plan.survivorId, mergedId: plan.loserId, choices: [...plan.choices] },
    actor: { kind: 'person', userId: act.actorUserId },
    capturedAt: new Date(input.capturedAt),
  });
  await recordAuditEntry(tx, {
    ...memberAct(
      'crm.customers_merged',
      reader.tenantId,
      { kind: 'customer', ref: plan.survivorId },
      act,
    ),
    changePayload: { mergedId: plan.loserId, choices: plan.choices },
  });
  const survivor = await customerRecordOf(tx, reader, plan.survivorId);
  const leadId = await currentLeadOf(tx, reader.tenantId, plan.survivorId);
  if (survivor === null || leadId === null) throw new Error('the merged survivor has no lead');
  return { kind: 'merged', survivor, leadId };
}

/**
 * Every row naming the loser moves to the survivor, which takes the picked name, city and primary.
 * The loser's primary is cleared FIRST: its key holds it to one of the loser's own contacts, which
 * are about to move. Bookings, tasks, files and notices name a lead and move with it unwritten.
 */
async function foldLoserIn(
  tx: DbTransaction,
  tenantId: string,
  plan: MergePlan,
  act: Act,
): Promise<void> {
  const at = new Date(act.now);
  const { survivorId, loserId } = plan;
  const ofCustomer = (id: string) => and(eq(customer.tenantId, tenantId), eq(customer.id, id));
  await tx.update(customer).set({ primaryContactId: null }).where(ofCustomer(loserId));
  await tx
    .update(contact)
    .set({ customerId: survivorId })
    .where(and(eq(contact.tenantId, tenantId), eq(contact.customerId, loserId)));
  const loserPhoneContactId = await addLoserPhoneContact(tx, tenantId, plan, act);
  await tx
    .update(customer)
    .set({
      name: plan.name.trim() === '' ? null : plan.name,
      city: plan.city,
      primaryContactId: primaryIdOf(plan.primary, loserPhoneContactId),
    })
    .where(ofCustomer(survivorId));
  await tx
    .update(lead)
    .set({ customerId: survivorId })
    .where(and(eq(lead.tenantId, tenantId), eq(lead.customerId, loserId)));
  await tx
    .update(referral)
    .set({ referringCustomerId: survivorId })
    .where(and(eq(referral.tenantId, tenantId), eq(referral.referringCustomerId, loserId)));
  await settleDuplicateLinks(tx, tenantId, plan, at);
  await tx
    .update(customer)
    .set({ mergedInto: survivorId, mergedAt: at, mergedBy: act.actorUserId })
    .where(ofCustomer(loserId));
}

/** The loser's own number as a contact on the survivor, so dedupe still finds it (decision 3). */
async function addLoserPhoneContact(
  tx: DbTransaction,
  tenantId: string,
  plan: MergePlan,
  act: Act,
): Promise<string | null> {
  if (plan.loserPhoneContact === null) return null;
  const [added] = await tx
    .insert(contact)
    .values({
      tenantId,
      customerId: plan.survivorId,
      name: plan.loserPhoneContact.name,
      phoneE164: plan.loserPhoneContact.phoneE164,
      createdAt: new Date(act.now),
      createdBy: act.actorUserId,
    })
    .returning({ id: contact.id });
  return added?.id ?? null;
}

function primaryIdOf(primary: MergedPrimary, loserPhoneContactId: string | null): string | null {
  if (primary.kind === 'contact') return primary.contactId;
  if (primary.kind === 'loser_phone_contact') return loserPhoneContactId;
  return null;
}

/**
 * The pair's own *Keep both* link is resolved — the merge settles it — and every other link of the
 * loser now names the survivor, so a duplicate kept beside a third customer stays shown.
 */
async function settleDuplicateLinks(
  tx: DbTransaction,
  tenantId: string,
  plan: MergePlan,
  at: Date,
): Promise<void> {
  const { survivorId, loserId } = plan;
  const ofTenant = eq(duplicateLink.tenantId, tenantId);
  await tx
    .update(duplicateLink)
    .set({ resolvedAt: at })
    .where(
      and(
        ofTenant,
        isNull(duplicateLink.resolvedAt),
        or(
          and(eq(duplicateLink.customerAId, survivorId), eq(duplicateLink.customerBId, loserId)),
          and(eq(duplicateLink.customerAId, loserId), eq(duplicateLink.customerBId, survivorId)),
        ),
      ),
    );
  await tx
    .update(duplicateLink)
    .set({ customerAId: survivorId })
    .where(
      and(
        ofTenant,
        eq(duplicateLink.customerAId, loserId),
        ne(duplicateLink.customerBId, survivorId),
      ),
    );
  await tx
    .update(duplicateLink)
    .set({ customerBId: survivorId })
    .where(
      and(
        ofTenant,
        eq(duplicateLink.customerBId, loserId),
        ne(duplicateLink.customerAId, survivorId),
      ),
    );
}
