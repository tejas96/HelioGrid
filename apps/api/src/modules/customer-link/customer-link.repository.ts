import type { CustomerLink, CustomerLinks, MintLink } from '@heliogrid/contracts';
import {
  contact,
  customerLink,
  type DbTransaction,
  linkToken,
  type TenantPool,
} from '@heliogrid/db';
import { can } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import type { Act } from '../../common/auth/session-context';
import { type CreationKey, type Keyed, replayOf } from '../../common/creation-key';
import { lockCreationKey } from '../../common/db/creation-key-lock';
import { TENANT_DB } from '../../common/db/tenant.token';
import { type LeadReader, lockLeadOfCompany } from '../crm/crm.public';
import { leadWasShared } from '../proposals/proposals.public';
import {
  issueToken,
  type LinkActor,
  type LinkedLead,
  liveTokenOf,
  mintLink,
  recordLinkChange,
} from './customer-link.mint.repository';
import { CustomerProjectsRegistry } from './customer-link.projects.repository';
import { contactsOf, leadInReach, linkById, linksOfLead } from './customer-link.read.repository';

/** A link with the token its address is made from. */
export interface AddressedLink {
  readonly link: CustomerLink;
  readonly tokenId: string;
}

export type LinkOutcome<Row> =
  | { readonly outcome: 'done'; readonly row: Row }
  | { readonly outcome: 'not-found' }
  | { readonly outcome: 'refused'; readonly refusal: 'not_shared' | 'already_revoked' };

const NOT_FOUND = { outcome: 'not-found' } as const;
const refused = (refusal: 'not_shared' | 'already_revoked') =>
  ({ outcome: 'refused', refusal }) as const;

const actorOf = (act: Act): LinkActor => ({ userId: act.actorUserId, at: new Date(act.now) });

/**
 * The company's side of a deal's links (`F5-26`, `F5-30`, `T-M06-020`): the list, a named link for
 * another contact, a rename, a new address and the kill switch — each on a lead the member reaches,
 * each change audited and on the lead's timeline. A link never mints before the deal was shared
 * (`F5-20`), and a revoke is whole and at once (`F5-76`).
 */
@Injectable()
export class CustomerLinkRepository {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(TENANT_DB) private readonly db: TenantPool,
    @Inject(CustomerProjectsRegistry) private readonly projects: CustomerProjectsRegistry,
  ) {}

  ofLead(reader: LeadReader, leadId: string): Promise<CustomerLinks | null> {
    const { tenantId } = reader;
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const lead = await leadInReach(tx, reader, leadId, this.projects);
      if (lead === null) return null;
      return {
        links: await linksOfLead(tx, tenantId, leadId),
        contacts: await contactsOf(tx, tenantId, lead.customerId),
        acts: {
          mint: can(reader.roles, 'customer_link.mint_customer_link'),
          revoke: can(reader.roles, 'customer_link.revoke_customer_link'),
        },
      };
    });
  }

  /**
   * A named link for another person, once any proposal on the deal was shared — even when the
   * customer's own link was since revoked; a person with a live link keeps it.
   */
  mint(
    reader: LeadReader,
    leadId: string,
    named: Pick<MintLink, 'label' | 'contactId'>,
    act: Act,
    key: CreationKey | null,
  ): Promise<LinkOutcome<Keyed<AddressedLink>>> {
    const { tenantId } = reader;
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      // Held first: two mints for one contact would both find no live link and both insert one.
      if ((await lockLeadOfCompany(tx, tenantId, leadId)) === null) return NOT_FOUND;
      const lead = await leadInReach(tx, reader, leadId, this.projects);
      if (lead === null) return NOT_FOUND;
      const again = key === null ? null : await this.replayed(tx, tenantId, key);
      if (again !== null) return again;
      if (!(await leadWasShared(tx, tenantId, leadId))) return refused('not_shared');
      const held = await this.heldBy(tx, lead, named.contactId);
      if (held === 'no-such-contact') return NOT_FOUND;
      const linkId = held ?? (await mintLink(tx, lead, { ...named, key }, actorOf(act))).linkId;
      const row = await this.addressed(tx, tenantId, linkId);
      if (row === null) throw new Error(`link ${linkId} has no live address after its mint`);
      return { outcome: 'done', row: { outcome: 'created', row } };
    });
  }

  /** What an earlier send with this retry key made, if one did; taken after the key's lock (`F4-07`). */
  private async replayed(
    tx: DbTransaction,
    tenantId: string,
    key: CreationKey,
  ): Promise<LinkOutcome<Keyed<AddressedLink>> | null> {
    await lockCreationKey(tx, key);
    const [made] = await tx
      .select({ id: customerLink.id, fingerprint: customerLink.creationFingerprint })
      .from(customerLink)
      .where(and(eq(customerLink.tenantId, tenantId), eq(customerLink.creationKey, key.key)));
    if (made === undefined) return null;
    const again = await this.addressed(tx, tenantId, made.id);
    return again === null
      ? refused('already_revoked')
      : { outcome: 'done', row: replayOf(again, made.fingerprint, key) };
  }

  /**
   * The live link a contact of this deal already holds, `null` for none, or that the contact is not
   * this customer's. A link for someone the record does not hold is always a new one (`F5-26`).
   */
  private async heldBy(
    tx: DbTransaction,
    lead: LinkedLead,
    contactId: string | null,
  ): Promise<string | null | 'no-such-contact'> {
    if (contactId === null) return null;
    const [known] = await tx
      .select({ id: contact.id })
      .from(contact)
      .where(
        and(
          eq(contact.tenantId, lead.tenantId),
          eq(contact.id, contactId),
          eq(contact.customerId, lead.customerId),
        ),
      );
    if (known === undefined) return 'no-such-contact';
    const [live] = await tx
      .select({ id: customerLink.id })
      .from(customerLink)
      .where(
        and(
          eq(customerLink.tenantId, lead.tenantId),
          eq(customerLink.leadId, lead.leadId),
          eq(customerLink.contactId, contactId),
          eq(customerLink.status, 'active'),
        ),
      );
    return live?.id ?? null;
  }

  private async addressed(
    tx: DbTransaction,
    tenantId: string,
    linkId: string,
  ): Promise<AddressedLink | null> {
    const found = await linkById(tx, tenantId, linkId);
    const tokenId = await liveTokenOf(tx, tenantId, linkId);
    return found === null || tokenId === null ? null : { link: found.link, tokenId };
  }

  /** One link on a lead the member reaches, with that lead; `null` answers 404. */
  private async reached(
    tx: DbTransaction,
    reader: LeadReader,
    linkId: string,
  ): Promise<{ readonly link: CustomerLink; readonly lead: LinkedLead } | null> {
    const found = await linkById(tx, reader.tenantId, linkId);
    if (found === null) return null;
    const lead = await leadInReach(tx, reader, found.leadId, this.projects);
    return lead === null ? null : { link: found.link, lead };
  }

  /** A live link's address, read again to copy it. */
  address(reader: LeadReader, linkId: string): Promise<LinkOutcome<AddressedLink>> {
    return this.db.withTenantTransaction(reader.tenantId, async (tx) => {
      const at = await this.reached(tx, reader, linkId);
      if (at === null) return NOT_FOUND;
      const row = await this.addressed(tx, reader.tenantId, linkId);
      return row === null || at.link.status !== 'active'
        ? refused('already_revoked')
        : { outcome: 'done', row };
    });
  }

  /** A rename; the same name again writes nothing. */
  relabel(
    reader: LeadReader,
    linkId: string,
    label: string,
    act: Act,
  ): Promise<CustomerLink | null> {
    const { tenantId } = reader;
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const at = await this.reached(tx, reader, linkId);
      if (at === null) return null;
      if (at.link.label === label) return at.link;
      await tx
        .update(customerLink)
        .set({ label })
        .where(and(eq(customerLink.tenantId, tenantId), eq(customerLink.id, linkId)));
      await recordLinkChange(tx, at.lead, { id: linkId, label }, 'relabelled', actorOf(act));
      return { ...at.link, label };
    });
  }

  /** A new address; the earlier ones keep serving unless they are turned off in the same act (`F5-22`). */
  remint(
    reader: LeadReader,
    linkId: string,
    revokeEarlier: boolean,
    act: Act,
  ): Promise<LinkOutcome<AddressedLink>> {
    const { tenantId } = reader;
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const at = await this.reached(tx, reader, linkId);
      if (at === null) return NOT_FOUND;
      if (at.link.status !== 'active') return refused('already_revoked');
      const by = actorOf(act);
      if (revokeEarlier) await revokeTokens(tx, tenantId, linkId, by);
      const tokenId = await issueToken(tx, tenantId, linkId, by);
      await recordLinkChange(tx, at.lead, at.link, 'reminted', by);
      return { outcome: 'done', row: { link: at.link, tokenId } };
    });
  }

  /** The kill switch (`F5-76`): the link and every address of it, at once; every other link keeps working. */
  revoke(reader: LeadReader, linkId: string, act: Act): Promise<LinkOutcome<CustomerLink>> {
    const { tenantId } = reader;
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const at = await this.reached(tx, reader, linkId);
      if (at === null) return NOT_FOUND;
      if (at.link.status !== 'active') return refused('already_revoked');
      const by = actorOf(act);
      await tx
        .update(customerLink)
        .set({ status: 'revoked', revokedAt: by.at, revokedBy: by.userId })
        .where(and(eq(customerLink.tenantId, tenantId), eq(customerLink.id, linkId)));
      await revokeTokens(tx, tenantId, linkId, by);
      await recordLinkChange(tx, at.lead, at.link, 'revoked', by);
      return {
        outcome: 'done',
        row: { ...at.link, status: 'revoked', revokedAt: by.at.toISOString() },
      };
    });
  }
}

/** Every address of the link that still serves is dead from this moment. */
async function revokeTokens(
  tx: DbTransaction,
  tenantId: string,
  linkId: string,
  by: LinkActor,
): Promise<void> {
  await tx
    .update(linkToken)
    .set({ revokedAt: by.at, revokedBy: by.userId })
    .where(
      and(
        eq(linkToken.tenantId, tenantId),
        eq(linkToken.linkId, linkId),
        isNull(linkToken.revokedAt),
      ),
    );
}
