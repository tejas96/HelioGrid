import { customerLink, type DbTransaction } from '@heliogrid/db';
import {
  LINK_CEILINGS,
  type NotificationType,
  type ProposalActRefusal,
  type UiLanguage,
  wokenByCustomer,
} from '@heliogrid/domain';
import { and, eq } from 'drizzle-orm';
import { recordAuditEntry } from '../audit/audit.public';
import { type LockedLead, lockLeadOfCompany, recordLeadMoves } from '../crm/crm.public';
import {
  type NoticeWords,
  recipientsFor,
  recordNotificationsTo,
  type TenantQuietHours,
} from '../notification/notification.public';
import type { CustomerProjectsRegistry } from './customer-link.projects.repository';
import type { PresentedToken } from './customer-link.token.admin.repository';
import { type LinkVisit, visitOf } from './customer-link.visit.repository';

/*
 * What every act of a customer on their link shares (`F5-31`, `F5-78`), on the act's own
 * transaction: the lead held before anything is read, the reasons an act is not taken, and the
 * audit entry and notice it leaves — attributed to the link and its contact, never to a user.
 */

/** A notice's words per language and the clock its push is held against, rendered before the write. */
export interface LinkNotice {
  readonly wordsIn: (language: UiLanguage) => NoticeWords;
  readonly quietHours: TenantQuietHours;
}

export type LinkActRefusal = ProposalActRefusal | 'link_off' | 'ceiling_met';

/** How a customer's act ended: written, with the notices whose pushes follow; refused; or no link. */
export type LinkActOutcome =
  | { readonly outcome: 'done'; readonly notified: readonly string[] }
  | { readonly outcome: 'refused'; readonly refusal: LinkActRefusal }
  | { readonly outcome: 'gone' };

/** The link's row is gone: the act answers as an unknown token does. */
export const gone = () => ({ outcome: 'gone' }) as const;
export const refused = (refusal: LinkActRefusal) => ({ outcome: 'refused', refusal }) as const;
/** The customer as a timeline's actor: no account, so the entry's body names the link (`F5-31`). */
export const customerActor = () => ({ kind: 'customer' }) as const;

/** The link's deal, held: the lead locked first, then everything read after the lock (`crm` lock order). */
export interface HeldVisit {
  readonly visit: LinkVisit;
  readonly locked: LockedLead;
}

export async function heldVisit(
  tx: DbTransaction,
  token: PresentedToken,
  projects: CustomerProjectsRegistry,
  now: number,
): Promise<HeldVisit | null> {
  const [link] = await tx
    .select({ leadId: customerLink.leadId })
    .from(customerLink)
    .where(and(eq(customerLink.tenantId, token.tenantId), eq(customerLink.id, token.linkId)));
  if (link === undefined) return null;
  const locked = await lockLeadOfCompany(tx, token.tenantId, link.leadId);
  const visit = await visitOf(tx, token, projects, now);
  return locked === null || visit === null ? null : { visit, locked };
}

export const leadOf = (visit: LinkVisit) => ({
  tenantId: visit.tenantId,
  customerId: visit.customerId,
  leadId: visit.leadId,
});
export const viaOf = (visit: LinkVisit) => ({
  linkLabel: visit.label,
  contactName: visit.contactName,
});

/** The served version an entry names; an act that reached here without one is a broken read. */
export function versionOf(visit: LinkVisit) {
  if (visit.served === null) throw new Error(`link ${visit.linkId} serves no version`);
  const { proposalId, number, version } = visit.served;
  return { proposalId, number, version };
}

/**
 * Why a respond act is not taken before anything is read of the proposal (`F5-21`, `F5-78`): the
 * link does not serve, the phase grants no answer, or the link's hourly ceiling is met. A question
 * and a call request are open in every phase; an answer only while the phase grants `respond`.
 */
export function respondRefusal(visit: LinkVisit, act: 'respond' | 'ask'): LinkActRefusal | null {
  if (visit.serving.kind !== 'serves') return 'link_off';
  if (act === 'respond' && !visit.serving.rights.includes('respond')) return 'link_off';
  return visit.respondsInWindow >= LINK_CEILINGS.respondsPerHour ? 'ceiling_met' : null;
}

/** A customer who writes in wakes a snoozed lead, so the call it raises is never hidden (`M02-51`). */
export async function wakeParked(tx: DbTransaction, locked: LockedLead, at: Date): Promise<void> {
  if (locked.lifecycle.state !== 'snoozed') return;
  await recordLeadMoves(tx, locked, wokenByCustomer(locked.lifecycle), customerActor(), at);
}

type CustomerAuditEvent =
  | 'customer_link.opened'
  | 'customer_link.accepted'
  | 'customer_link.negotiation_requested'
  | 'customer_link.declined';

/**
 * The audit entry of a customer's act (`F5-31`, `F5-79`): its actor is the link — which names its
 * contact — never a user. An answer's subject is the proposal it was given on; an open's, the link.
 */
export function auditCustomerAct(
  tx: DbTransaction,
  visit: LinkVisit,
  eventType: CustomerAuditEvent,
  at: Date,
  proposalId?: string,
): Promise<void> {
  return recordAuditEntry(tx, {
    tenantId: visit.tenantId,
    eventType,
    actorKind: 'customer_link',
    actorRef: visit.linkId,
    occurredAt: at,
    blocked: false,
    subjectKind: proposalId === undefined ? 'customer_link' : 'proposal',
    subjectRef: proposalId ?? visit.linkId,
    changePayload: null,
  });
}

/**
 * The notice of a customer's act, to whoever its registered rules name — the person the page names
 * standing as the subject's owner (`T-F5-001`), who is told whatever their own lead scope is: the
 * customer's page already names them. `about` is the record the notice opens.
 */
export async function notifyAbout(
  tx: DbTransaction,
  visit: LinkVisit,
  type: Extract<
    NotificationType,
    | 'proposal_opened'
    | 'proposal_accepted'
    | 'proposal_declined'
    | 'negotiation_requested'
    | 'customer_question'
    | 'customer_call_requested'
  >,
  about: { readonly kind: 'proposal' | 'lead'; readonly ref: string },
  notice: LinkNotice,
  at: Date,
): Promise<string[]> {
  const recipients = await recipientsFor(
    tx,
    visit.tenantId,
    type,
    { ownerUserId: visit.person?.userId ?? null, assigneeUserId: null, awaits: null },
    async () => true,
  );
  return recordNotificationsTo(
    tx,
    recipients,
    {
      tenantId: visit.tenantId,
      type,
      subjectKind: about.kind,
      subjectRef: about.ref,
      emittedAt: at,
    },
    notice.wordsIn,
    notice.quietHours,
  );
}
