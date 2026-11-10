import type { Contact, ContactRoleLabel, Customer, DedupeMatchWire } from '@heliogrid/contracts';
import {
  contact,
  contactRoleLabel,
  customer,
  type DbTransaction,
  type TenantPool,
} from '@heliogrid/db';
import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, sql } from 'drizzle-orm';
import type { Act } from '../../common/auth/session-context';
import { type CreationKey, type Keyed, replayOf } from '../../common/creation-key';
import { lockCreationKey } from '../../common/db/creation-key-lock';
import { TENANT_DB } from '../../common/db/tenant.token';
import { contactColumns, contactOf, customerRecordOf } from './crm.customer-record.repository';
import {
  customerInScope,
  lockCustomers,
  lockPhone,
  phoneMatchOf,
} from './crm.customers.repository';
import type { LeadReader } from './internal/reader';

/** A contact as typed, the number pack-normalised; `roleLabelId: null` is no label. */
export interface ContactInput {
  readonly name: string;
  readonly phoneE164: string;
  readonly roleLabelId: string | null;
}

/** A contact's write refused: not one the reader may touch, or a number someone already holds. */
export type ContactRefusal =
  | { readonly outcome: 'not-found' }
  | { readonly outcome: 'taken'; readonly facts: DedupeMatchWire };

export type ContactOutcome<Done> = Done | ContactRefusal;

const NOT_FOUND = { outcome: 'not-found' } as const;

/**
 * A customer's contacts and the company's role labels (`M02-34`) on the runtime pool. A contact's
 * number joins the dedupe (`M02-02`), so it is saved under the same per-number lock a capture takes
 * and refused when anyone already holds it.
 */
@Injectable()
export class CrmContactsRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  async add(
    reader: LeadReader,
    customerId: string,
    input: ContactInput,
    act: Act,
    key: CreationKey | null,
  ): Promise<ContactOutcome<Keyed<Contact>>> {
    const { tenantId } = reader;
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      if (key !== null) {
        await lockCreationKey(tx, key);
        const [made] = await tx
          .select({ id: contact.id, fingerprint: contact.creationFingerprint })
          .from(contact)
          .where(and(eq(contact.tenantId, tenantId), eq(contact.creationKey, key.key)))
          .limit(1);
        if (made) return replayOf(await contactById(tx, tenantId, made.id), made.fingerprint, key);
      }
      await lockPhone(tx, tenantId, input.phoneE164);
      await lockCustomers(tx, tenantId, [customerId]);
      if (!(await customerInScope(tx, reader, customerId))) return NOT_FOUND;
      if (!(await labelHeld(tx, tenantId, input.roleLabelId))) return NOT_FOUND;
      const match = await phoneMatchOf(tx, reader, input.phoneE164);
      if (match !== null) return { outcome: 'taken', facts: match.facts };
      const [made] = await tx
        .insert(contact)
        .values({
          tenantId,
          customerId,
          ...input,
          createdAt: new Date(act.now),
          createdBy: act.actorUserId,
          creationKey: key?.key,
          creationFingerprint: key?.fingerprint,
        })
        .returning({ id: contact.id });
      if (made === undefined) throw new Error('the contact insert returned no row');
      return { outcome: 'created', row: await contactById(tx, tenantId, made.id) };
    });
  }

  /** A contact's facts changed; a new number is held to the dedupe as an added one is. */
  async edit(
    reader: LeadReader,
    contactId: string,
    edit: Partial<ContactInput>,
  ): Promise<ContactOutcome<{ readonly outcome: 'done'; readonly contact: Contact }>> {
    const { tenantId } = reader;
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const [stored] = await tx
        .select({ customerId: contact.customerId, phoneE164: contact.phoneE164 })
        .from(contact)
        .where(and(eq(contact.tenantId, tenantId), eq(contact.id, contactId)));
      if (stored === undefined || !(await customerInScope(tx, reader, stored.customerId))) {
        return NOT_FOUND;
      }
      if (edit.roleLabelId !== undefined && !(await labelHeld(tx, tenantId, edit.roleLabelId))) {
        return NOT_FOUND;
      }
      if (edit.phoneE164 !== undefined && edit.phoneE164 !== stored.phoneE164) {
        await lockPhone(tx, tenantId, edit.phoneE164);
        const match = await phoneMatchOf(tx, reader, edit.phoneE164);
        if (match !== null) return { outcome: 'taken', facts: match.facts };
      }
      if (Object.keys(edit).length > 0) {
        await tx
          .update(contact)
          .set(edit)
          .where(and(eq(contact.tenantId, tenantId), eq(contact.id, contactId)));
      }
      return { outcome: 'done', contact: await contactById(tx, tenantId, contactId) };
    });
  }

  /**
   * The one primary contact (`M02-34`): one of this customer's contacts, or `null` for the customer
   * themself. The same choice again writes nothing.
   */
  async setPrimary(
    reader: LeadReader,
    customerId: string,
    contactId: string | null,
  ): Promise<Customer | null> {
    const { tenantId } = reader;
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      await lockCustomers(tx, tenantId, [customerId]);
      if (!(await customerInScope(tx, reader, customerId))) return null;
      if (contactId !== null) {
        const [own] = await tx
          .select({ id: contact.id })
          .from(contact)
          .where(
            and(
              eq(contact.tenantId, tenantId),
              eq(contact.customerId, customerId),
              eq(contact.id, contactId),
            ),
          );
        if (own === undefined) return null;
      }
      await tx
        .update(customer)
        .set({ primaryContactId: contactId })
        .where(
          and(
            eq(customer.tenantId, tenantId),
            eq(customer.id, customerId),
            sql`${customer.primaryContactId} is distinct from ${contactId}`,
          ),
        );
      return customerRecordOf(tx, reader, customerId);
    });
  }

  /** The seeded labels first, in their seeded order, then the company's own as they were added. */
  async roleLabels(tenantId: string): Promise<ContactRoleLabel[]> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const rows = await tx
        .select({
          id: contactRoleLabel.id,
          seed: contactRoleLabel.seedKey,
          text: contactRoleLabel.label,
        })
        .from(contactRoleLabel)
        .where(eq(contactRoleLabel.tenantId, tenantId))
        .orderBy(
          sql`${contactRoleLabel.seedKey} nulls last`,
          asc(contactRoleLabel.createdAt),
          asc(contactRoleLabel.id),
        );
      return rows;
    });
  }

  /** A label of the company's own; the same text again answers the label it already has. */
  async addRoleLabel(
    tenantId: string,
    text: string,
    act: Act,
    key: CreationKey | null,
  ): Promise<Keyed<ContactRoleLabel>> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      if (key !== null) {
        await lockCreationKey(tx, key);
        const [made] = await tx
          .select({ id: contactRoleLabel.id, fingerprint: contactRoleLabel.creationFingerprint })
          .from(contactRoleLabel)
          .where(
            and(eq(contactRoleLabel.tenantId, tenantId), eq(contactRoleLabel.creationKey, key.key)),
          )
          .limit(1);
        if (made) return replayOf(await labelById(tx, tenantId, made.id), made.fingerprint, key);
      }
      await tx
        .insert(contactRoleLabel)
        .values({
          tenantId,
          label: text,
          createdAt: new Date(act.now),
          createdBy: act.actorUserId,
          creationKey: key?.key,
          creationFingerprint: key?.fingerprint,
        })
        .onConflictDoNothing();
      const [held] = await tx
        .select({ id: contactRoleLabel.id })
        .from(contactRoleLabel)
        .where(and(eq(contactRoleLabel.tenantId, tenantId), eq(contactRoleLabel.label, text)));
      if (held === undefined) throw new Error('the role label is neither added nor held');
      return { outcome: 'created', row: await labelById(tx, tenantId, held.id) };
    });
  }
}

/** No label, or a label this company holds. */
async function labelHeld(
  tx: DbTransaction,
  tenantId: string,
  labelId: string | null,
): Promise<boolean> {
  if (labelId === null) return true;
  const [held] = await tx
    .select({ id: contactRoleLabel.id })
    .from(contactRoleLabel)
    .where(and(eq(contactRoleLabel.tenantId, tenantId), eq(contactRoleLabel.id, labelId)));
  return held !== undefined;
}

async function labelById(
  tx: DbTransaction,
  tenantId: string,
  id: string,
): Promise<ContactRoleLabel> {
  const [label] = await tx
    .select({
      id: contactRoleLabel.id,
      seed: contactRoleLabel.seedKey,
      text: contactRoleLabel.label,
    })
    .from(contactRoleLabel)
    .where(and(eq(contactRoleLabel.tenantId, tenantId), eq(contactRoleLabel.id, id)));
  if (label === undefined) throw new Error(`role label ${id} vanished inside its own transaction`);
  return label;
}

async function contactById(tx: DbTransaction, tenantId: string, id: string): Promise<Contact> {
  const [row] = await tx
    .select(contactColumns)
    .from(contact)
    .leftJoin(
      contactRoleLabel,
      and(
        eq(contactRoleLabel.id, contact.roleLabelId),
        eq(contactRoleLabel.tenantId, contact.tenantId),
      ),
    )
    .where(and(eq(contact.tenantId, tenantId), eq(contact.id, id)));
  if (row === undefined) throw new Error(`contact ${id} vanished inside its own transaction`);
  return contactOf(row);
}
