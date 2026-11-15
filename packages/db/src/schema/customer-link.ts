import {
  ACCEPTANCE_CHALLENGES,
  DEVICE_CLASSES,
  LINK_EVENT_TYPES,
  LINK_PHASES,
  LINK_SCOPES,
  LINK_SECTIONS,
  LINK_STATUSES,
} from '@heliogrid/domain';
import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { uuidv7 } from '../uuid';
import { creationKeyColumns } from './creation-key';
import { contact } from './customer';
import { userAccount } from './identity';
import { lead } from './lead';
import { proposal, proposalVersion } from './proposal';
import { task } from './task';
import { tenant } from './tenant';

/** pgEnums hand-mirror domain's tuples (invariant `enum-parity` proves each pair equal). */
export const linkStatus = pgEnum('link_status', LINK_STATUSES);
export const linkScope = pgEnum('link_scope', LINK_SCOPES);
export const linkPhase = pgEnum('link_phase', LINK_PHASES);
export const linkEventType = pgEnum('link_event_type', LINK_EVENT_TYPES);
export const deviceClass = pgEnum('device_class', DEVICE_CLASSES);
export const linkSection = pgEnum('link_section', LINK_SECTIONS);
export const acceptanceChallenge = pgEnum('acceptance_challenge', ACCEPTANCE_CHALLENGES);

const instant = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });
const id = () =>
  uuid('id')
    .primaryKey()
    .$defaultFn(() => uuidv7());
const tenantId = () =>
  uuid('tenant_id')
    .notNull()
    .references(() => tenant.id);
const person = (name: string) => uuid(name).references(() => userAccount.id);
const linkId = () =>
  uuid('link_id')
    .notNull()
    .references(() => customerLink.id);

/**
 * One named link to a deal (`F5-19`, `F5-26`): the customer's own, minted by the first share
 * (`F5-20`), or one a person named for another contact. It holds a lead and nothing else of the
 * deal — the phase is read from the deal's state on every open, never stored — and no expiry: a
 * view scope is permanent until revoked (`F5-22`). Its address is a `link_token`'s; a link may
 * have several, each individually revocable.
 *
 * A live link is one per named contact per deal, and one for the customer. Tenant-scoped, all four always: SELECT, INSERT and UPDATE
 * (the label, the revoke) for `app_user`.
 */
export const customerLink = pgTable(
  'customer_link',
  {
    id: id(),
    tenantId: tenantId(),
    leadId: uuid('lead_id')
      .notNull()
      .references(() => lead.id),
    /** Who it was minted for; null names no contact — the customer's own, or someone the record does not hold. */
    contactId: uuid('contact_id').references(() => contact.id),
    /** The customer's own link, minted by the first share; a later share reuses only this one. */
    forCustomer: boolean('for_customer').notNull().default(false),
    label: text('label').notNull(),
    status: linkStatus('status').notNull(),
    scopes: linkScope('scopes').array().notNull(),
    mintedAt: instant('minted_at').notNull(),
    mintedBy: person('minted_by').notNull(),
    revokedAt: instant('revoked_at'),
    revokedBy: person('revoked_by'),
    ...creationKeyColumns(),
  },
  (table) => [
    index('customer_link_tenant_lead_idx').on(table.tenantId, table.leadId),
    uniqueIndex('customer_link_one_per_contact_key')
      .on(table.tenantId, table.leadId, table.contactId)
      .where(sql`${table.status} = 'active' and ${table.contactId} is not null`),
    uniqueIndex('customer_link_one_for_the_customer_key')
      .on(table.tenantId, table.leadId)
      .where(sql`${table.status} = 'active' and ${table.forCustomer}`),
    uniqueIndex('customer_link_tenant_creation_key')
      .on(table.tenantId, table.creationKey)
      .where(sql`${table.creationKey} is not null`),
    check('customer_link_label_given', sql`char_length(btrim(${table.label})) >= 1`),
    check('customer_link_scopes_given', sql`cardinality(${table.scopes}) >= 1`),
    check(
      'customer_link_revoke_is_whole',
      sql`(${table.status} = 'revoked') = (${table.revokedAt} is not null) and (${table.revokedAt} is null) = (${table.revokedBy} is null)`,
    ),
  ],
);

/**
 * One address of a link (`F5-21`, `F5-75`): the hash of its secret, never the secret. A re-mint
 * adds a token and both serve until one is revoked (`F5-22`); a revoked one is dead at once
 * (`F5-76`). The public route finds the token by its hash before it knows a company, on the admin
 * path, so the hash is unique across the whole table.
 *
 * Tenant-scoped, all four always: SELECT, INSERT and UPDATE (the revoke) for `app_user`.
 */
export const linkToken = pgTable(
  'link_token',
  {
    id: id(),
    tenantId: tenantId(),
    linkId: linkId(),
    tokenHash: text('token_hash').notNull(),
    mintedAt: instant('minted_at').notNull(),
    mintedBy: person('minted_by').notNull(),
    revokedAt: instant('revoked_at'),
    revokedBy: person('revoked_by'),
  },
  (table) => [
    index('link_token_tenant_link_idx').on(table.tenantId, table.linkId),
    uniqueIndex('link_token_hash_key').on(table.tokenHash),
    check(
      'link_token_revoke_is_whole',
      sql`(${table.revokedAt} is null) = (${table.revokedBy} is null)`,
    ),
  ],
);

/**
 * What happened on a link (`F5-27`, `F5-29`): opened, a section viewed, accepted, a change asked,
 * declined — the link, the moment and a device class, and never a network address. An answer names
 * the version it was given on and carries the customer's own words where they wrote some. The
 * trailing-hour view and respond ceilings are counts over these rows (`F5-78`).
 *
 * Tenant-scoped, all four always, and APPEND-ONLY: SELECT and INSERT alone for `app_user`.
 */
export const linkEvent = pgTable(
  'link_event',
  {
    id: id(),
    tenantId: tenantId(),
    linkId: linkId(),
    eventType: linkEventType('event_type').notNull(),
    occurredAt: instant('occurred_at').notNull(),
    /** The version the page was serving; null in the phases after Won. */
    proposalVersion: integer('proposal_version'),
    deviceClass: deviceClass('device_class'),
    section: linkSection('section'),
    durationSeconds: integer('duration_seconds'),
    words: text('words'),
  },
  (table) => [
    index('link_event_tenant_link_idx').on(table.tenantId, table.linkId, table.occurredAt),
    check(
      'link_event_open_names_its_device',
      sql`(${table.eventType} = 'opened') = (${table.deviceClass} is not null)`,
    ),
    check(
      'link_event_view_is_whole',
      sql`(${table.eventType} = 'section_viewed') = (${table.section} is not null) and (${table.section} is null) = (${table.durationSeconds} is null) and ${table.durationSeconds} > 0`,
    ),
    check(
      'link_event_answer_names_its_version',
      sql`${table.eventType} not in ('accepted', 'negotiate_requested', 'declined') or ${table.proposalVersion} is not null`,
    ),
    check(
      'link_event_words_only_on_an_answer',
      sql`${table.words} is null or ${table.eventType} in ('negotiate_requested', 'declined')`,
    ),
  ],
);

/**
 * The acceptance (`F5-43`, `F5-46`): written once, when the customer taps Accept — the link, its
 * contact, the version the server checked as current, whether a challenge ran (off in V1), the
 * network address and the user agent of that one moment. One per version; nothing here is ever
 * collected while the customer only reads (`F5-29`).
 *
 * Tenant-scoped, all four always, and APPEND-ONLY: SELECT and INSERT alone for `app_user`.
 */
export const acceptanceRecord = pgTable(
  'acceptance_record',
  {
    id: id(),
    tenantId: tenantId(),
    linkId: linkId(),
    tokenId: uuid('token_id')
      .notNull()
      .references(() => linkToken.id),
    /** The link's own contact at that moment; absent exactly where the link's is. */
    contactId: uuid('contact_id').references(() => contact.id),
    proposalId: uuid('proposal_id')
      .notNull()
      .references(() => proposal.id),
    proposalVersionId: uuid('proposal_version_id')
      .notNull()
      .references(() => proposalVersion.id),
    challenge: acceptanceChallenge('challenge').notNull(),
    networkAddress: text('network_address').notNull(),
    userAgent: text('user_agent').notNull(),
    acceptedAt: instant('accepted_at').notNull(),
  },
  (table) => [
    index('acceptance_record_tenant_proposal_idx').on(table.tenantId, table.proposalId),
    uniqueIndex('acceptance_record_one_per_version_key').on(
      table.tenantId,
      table.proposalVersionId,
    ),
  ],
);

/**
 * A question the customer asked on their link (`F5-52`, `F5-53`): their words, untouched, and the
 * phase they asked in. Stored is received — the page shows it so for the life of the link; the
 * reply is a call, so no answer is ever stored. `task_id` is the call task it raised.
 *
 * Tenant-scoped, all four always, and APPEND-ONLY: SELECT and INSERT alone for `app_user`.
 */
export const customerQuestion = pgTable(
  'customer_question',
  {
    id: id(),
    tenantId: tenantId(),
    linkId: linkId(),
    leadId: uuid('lead_id')
      .notNull()
      .references(() => lead.id),
    phase: linkPhase('phase').notNull(),
    questionText: text('question_text').notNull(),
    askedAt: instant('asked_at').notNull(),
    taskId: uuid('task_id').references(() => task.id),
  },
  (table) => [
    index('customer_question_tenant_link_idx').on(table.tenantId, table.linkId, table.askedAt),
    check('customer_question_words_given', sql`char_length(btrim(${table.questionText})) >= 1`),
  ],
);

/**
 * A call the customer asked for (`F5-54`): the request is their timestamped consent to be called —
 * the time they named, where they named one, and the lawful moment the call falls due.
 *
 * Tenant-scoped, all four always, and APPEND-ONLY: SELECT and INSERT alone for `app_user`.
 */
export const callbackRequest = pgTable(
  'callback_request',
  {
    id: id(),
    tenantId: tenantId(),
    linkId: linkId(),
    leadId: uuid('lead_id')
      .notNull()
      .references(() => lead.id),
    phase: linkPhase('phase').notNull(),
    requestedAt: instant('requested_at').notNull(),
    namedAt: instant('named_at'),
    dueAt: instant('due_at').notNull(),
    taskId: uuid('task_id').references(() => task.id),
  },
  (table) => [
    index('callback_request_tenant_link_idx').on(table.tenantId, table.linkId, table.requestedAt),
  ],
);
