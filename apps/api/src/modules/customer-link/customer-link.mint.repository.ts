import { customer, customerLink, type DbTransaction, linkToken } from '@heliogrid/db';
import { uuidv7 } from '@heliogrid/db/uuid';
import { DEFAULT_LINK_SCOPES } from '@heliogrid/domain';
import { and, desc, eq, isNull } from 'drizzle-orm';
import type { CreationKey } from '../../common/creation-key';
import { recordAuditEntry } from '../audit/audit.public';
import { recordActivity } from '../crm/crm.public';
import { linkTokenHash, linkTokenSecret } from './internal/link-secret';

/*
 * How a link and its addresses come to exist (`F5-20`, `F5-22`, `F5-26`), each on the CALLER's
 * transaction: a share mints the customer's own link where none is live, a person names another for a second
 * contact, and a re-mint adds an address. Every mint is audited and joins the lead's timeline
 * (`F5-31`); the store holds a token's hash, never its secret (`F5-75`).
 */

/** Who acted, and when the server applied it. */
export interface LinkActor {
  readonly userId: string;
  readonly at: Date;
}

/** The lead a link is minted on. */
export interface LinkedLead {
  readonly tenantId: string;
  readonly leadId: string;
  readonly customerId: string;
}

/** A new address for a link: its token row, hashed. Answers the token's id — the address is made from it. */
export async function issueToken(
  tx: DbTransaction,
  tenantId: string,
  linkId: string,
  by: LinkActor,
): Promise<string> {
  const tokenId = uuidv7();
  await tx.insert(linkToken).values({
    id: tokenId,
    tenantId,
    linkId,
    tokenHash: linkTokenHash(linkTokenSecret(tokenId)),
    mintedAt: by.at,
    mintedBy: by.userId,
  });
  return tokenId;
}

/** The newest address of a link that still serves, or `null` once every one is turned off. */
export async function liveTokenOf(
  tx: DbTransaction,
  tenantId: string,
  linkId: string,
): Promise<string | null> {
  const [token] = await tx
    .select({ id: linkToken.id })
    .from(linkToken)
    .where(
      and(
        eq(linkToken.tenantId, tenantId),
        eq(linkToken.linkId, linkId),
        isNull(linkToken.revokedAt),
      ),
    )
    .orderBy(desc(linkToken.mintedAt), desc(linkToken.id))
    .limit(1);
  return token?.id ?? null;
}

/** What a link act writes beside its own row: the audit entry and the timeline entry (`F5-31`). */
export async function recordLinkChange(
  tx: DbTransaction,
  lead: LinkedLead,
  link: { readonly id: string; readonly label: string },
  change: 'minted' | 'reminted' | 'relabelled' | 'revoked',
  by: LinkActor,
): Promise<void> {
  if (change !== 'relabelled') {
    await recordAuditEntry(tx, {
      tenantId: lead.tenantId,
      eventType: `customer_link.${change}`,
      actorKind: 'tenant_user',
      actorRef: by.userId,
      occurredAt: by.at,
      blocked: false,
      subjectKind: 'customer_link',
      subjectRef: link.id,
      changePayload: null,
    });
  }
  await recordActivity(tx, {
    tenantId: lead.tenantId,
    customerId: lead.customerId,
    leadId: lead.leadId,
    kind: 'customer_link_changed',
    body: { linkId: link.id, label: link.label, change },
    actor: { kind: 'person', userId: by.userId },
    capturedAt: by.at,
  });
}

/** One named link with its first address (`F5-26`). Answers the link's and the token's ids. */
export async function mintLink(
  tx: DbTransaction,
  lead: LinkedLead,
  named: {
    readonly label: string;
    readonly contactId: string | null;
    /** A share's mint: the one live link a later share reuses. */
    readonly forCustomer?: boolean;
    readonly key?: CreationKey | null;
  },
  by: LinkActor,
): Promise<{ readonly linkId: string; readonly tokenId: string }> {
  const [link] = await tx
    .insert(customerLink)
    .values({
      tenantId: lead.tenantId,
      leadId: lead.leadId,
      contactId: named.contactId,
      forCustomer: named.forCustomer ?? false,
      label: named.label,
      status: 'active',
      scopes: [...DEFAULT_LINK_SCOPES],
      mintedAt: by.at,
      mintedBy: by.userId,
      creationKey: named.key?.key,
      creationFingerprint: named.key?.fingerprint,
    })
    .returning({ id: customerLink.id });
  if (link === undefined) throw new Error('the link insert returned no row');
  const tokenId = await issueToken(tx, lead.tenantId, link.id, by);
  await recordLinkChange(tx, lead, { id: link.id, label: named.label }, 'minted', by);
  return { linkId: link.id, tokenId };
}

/** The customer's own live link on a lead — the one a share minted — or `null`. */
export async function customersLinkOf(
  tx: DbTransaction,
  tenantId: string,
  leadId: string,
): Promise<{ readonly id: string } | null> {
  const [own] = await tx
    .select({ id: customerLink.id })
    .from(customerLink)
    .where(
      and(
        eq(customerLink.tenantId, tenantId),
        eq(customerLink.leadId, leadId),
        eq(customerLink.forCustomer, true),
        eq(customerLink.status, 'active'),
      ),
    )
    .limit(1);
  return own ?? null;
}

/**
 * A share's mint (`F5-20`): the customer's own link, named for them — a lead that holds a live one
 * keeps it, so a later share mints nothing until that one is revoked.
 */
export async function mintForCustomer(
  tx: DbTransaction,
  lead: LinkedLead,
  by: LinkActor,
): Promise<void> {
  if ((await customersLinkOf(tx, lead.tenantId, lead.leadId)) !== null) return;
  const [who] = await tx
    .select({ name: customer.name, phoneE164: customer.phoneE164 })
    .from(customer)
    .where(and(eq(customer.tenantId, lead.tenantId), eq(customer.id, lead.customerId)));
  if (who === undefined) throw new Error(`lead ${lead.leadId} names no customer of its company`);
  await mintLink(
    tx,
    lead,
    { label: who.name ?? who.phoneE164, contactId: null, forCustomer: true },
    by,
  );
}
