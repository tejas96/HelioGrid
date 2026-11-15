import {
  type FieldSetEnvelope,
  type InputPins,
  PROPOSAL_ANSWERS,
  PROPOSAL_STATUSES,
  SAVED_PART_KINDS,
  SHARE_CHANNELS,
  VERSION_TRIGGERS,
  type VersionSnapshotEnvelope,
} from '@heliogrid/domain';
import { sql } from 'drizzle-orm';
import {
  type AnyPgColumn,
  bigint,
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { uuidv7 } from '../uuid';
import { creationKeyColumns } from './creation-key';
import { userAccount } from './identity';
import { lead } from './lead';
import { tenant } from './tenant';

/** pgEnums hand-mirror domain's tuples (invariant `enum-parity` proves each pair equal). */
export const proposalStatus = pgEnum('proposal_status', PROPOSAL_STATUSES);
export const proposalAnswer = pgEnum('proposal_answer', PROPOSAL_ANSWERS);
export const versionTrigger = pgEnum('version_trigger', VERSION_TRIGGERS);
export const shareChannel = pgEnum('share_channel', SHARE_CHANNELS);
export const savedPartKind = pgEnum('saved_part_kind', SAVED_PART_KINDS);

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

/**
 * The one commercial document on a lead (`M06-01`, `M06-45`). Its eleven-step field set is ONE value
 * (`field_set`) — components, payment parts and timeline included — edited on `revision`, which
 * every commit carries back and a stale one is refused on (`M06-25`). The status moves by acts,
 * never by edits. The number comes from the company's counter at the first Generate and is null
 * until then (`M06-44`): an abandoned draft burns none.
 *
 * `latest_version`, `shared_version`, `shared_at`, `answer`, `answered_at`, `opened_at` and
 * `payable_minor` are the position its lists and the forecast read in one row, each rewritten only
 * by the act that appends its record — a version, a share, the link's event, a commit — never by a
 * job (`lead.last_activity_at`'s rule). `counted_at` is when it used one of the plan's proposals: at
 * its first Generate, never at draft creation (`T-M06-028`).
 *
 * A lead holds one draft that was never generated (`T-M06-001`). Starting carries its retry key
 * (`F4-07`). Tenant-scoped, all four always: SELECT, INSERT, UPDATE for `app_user`, and DELETE for
 * a draft nobody was ever shown — discarded before its first Generate.
 */
export const proposal = pgTable(
  'proposal',
  {
    id: id(),
    tenantId: tenantId(),
    leadId: uuid('lead_id')
      .notNull()
      .references(() => lead.id),
    number: integer('number'),
    status: proposalStatus('status').notNull(),
    quickMode: boolean('quick_mode').notNull(),
    revision: integer('revision').notNull(),
    /** Read through `fieldSetOf`, written through `fieldSetEnvelopeOf` (`@heliogrid/domain/server`). */
    fieldSet: jsonb('field_set').$type<FieldSetEnvelope>().notNull(),
    payableMinor: bigint('payable_minor', { mode: 'number' }),
    latestVersion: integer('latest_version'),
    sharedVersion: integer('shared_version'),
    sharedAt: instant('shared_at'),
    /** The first open of the version the link serves, since it was shared (`F5-27`). */
    openedAt: instant('opened_at'),
    answer: proposalAnswer('answer'),
    answeredAt: instant('answered_at'),
    duplicatedFrom: uuid('duplicated_from').references((): AnyPgColumn => proposal.id),
    countedAt: instant('counted_at'),
    createdAt: instant('created_at').notNull(),
    createdBy: person('created_by').notNull(),
    updatedAt: instant('updated_at').notNull(),
    updatedBy: person('updated_by').notNull(),
    ...creationKeyColumns(),
  },
  (table) => [
    index('proposal_tenant_lead_idx').on(table.tenantId, table.leadId),
    /** The list, newest change first, and each filter chip's count. */
    index('proposal_tenant_status_idx').on(table.tenantId, table.status, table.updatedAt.desc()),
    /** *Same as {customer}*: the person's own recent proposals. */
    index('proposal_tenant_creator_idx').on(
      table.tenantId,
      table.createdBy,
      table.updatedAt.desc(),
    ),
    uniqueIndex('proposal_tenant_number_key')
      .on(table.tenantId, table.number)
      .where(sql`${table.number} is not null`),
    uniqueIndex('proposal_one_draft_per_lead_key')
      .on(table.tenantId, table.leadId)
      .where(sql`${table.status} = 'draft' and ${table.latestVersion} is null`),
    uniqueIndex('proposal_tenant_creation_key')
      .on(table.tenantId, table.creationKey)
      .where(sql`${table.creationKey} is not null`),
    check('proposal_revision_counts', sql`${table.revision} >= 0`),
    check('proposal_number_counts', sql`${table.number} >= 1`),
    // A number and a version arrive together, at the first Generate.
    check(
      'proposal_numbered_when_generated',
      sql`(${table.number} is null) = (${table.latestVersion} is null)`,
    ),
    check(
      'proposal_versions_in_order',
      sql`${table.latestVersion} >= 1 and ${table.sharedVersion} >= 1 and ${table.sharedVersion} <= ${table.latestVersion}`,
    ),
    check(
      'proposal_share_is_whole',
      sql`(${table.sharedVersion} is null) = (${table.sharedAt} is null)`,
    ),
    check(
      'proposal_answer_is_whole',
      sql`(${table.answer} is null) = (${table.answeredAt} is null) and (${table.answer} is null or ${table.sharedVersion} is not null)`,
    ),
    // A draft was never shared: sharing is the act that leaves the status.
    check(
      'proposal_draft_is_unshared',
      sql`${table.status} <> 'draft' or ${table.sharedVersion} is null`,
    ),
  ],
);

/**
 * One generated version (`M06-42`, `M06-43`): the field set, the lead's and the company's facts and
 * the computed value set, frozen whole in `snapshot` — its component and payment rows with it, so
 * nothing else can write them. `pins` is what it was computed from (`F8-14`), never updated.
 * `payable_minor` repeats the snapshot's payable for the sums a list and the forecast take. The
 * change note is asked from the second version on. Its PDF is a file stored against it, so no row
 * here is ever changed to point at one.
 *
 * Generate carries its retry key: one version and one number however often it is sent (`M06-44`).
 * Tenant-scoped, all four always, and APPEND-ONLY: SELECT and INSERT alone for `app_user`
 * (`append-only-ledgers.ts`).
 */
export const proposalVersion = pgTable(
  'proposal_version',
  {
    id: id(),
    tenantId: tenantId(),
    proposalId: uuid('proposal_id')
      .notNull()
      .references(() => proposal.id),
    version: integer('version').notNull(),
    /** Read through `versionSnapshotOf`, written through `versionSnapshotEnvelopeOf`; rows live forever. */
    snapshot: jsonb('snapshot').$type<VersionSnapshotEnvelope>().notNull(),
    pins: jsonb('pins').$type<InputPins>().notNull(),
    currencyCode: text('currency_code').notNull(),
    payableMinor: bigint('payable_minor', { mode: 'number' }).notNull(),
    trigger: versionTrigger('trigger').notNull(),
    changeNote: text('change_note'),
    generatedAt: instant('generated_at').notNull(),
    generatedBy: person('generated_by').notNull(),
    ...creationKeyColumns(),
  },
  (table) => [
    uniqueIndex('proposal_version_tenant_proposal_version_key').on(
      table.tenantId,
      table.proposalId,
      table.version,
    ),
    uniqueIndex('proposal_version_tenant_creation_key')
      .on(table.tenantId, table.creationKey)
      .where(sql`${table.creationKey} is not null`),
    check('proposal_version_counts', sql`${table.version} >= 1`),
    check('proposal_version_payable_above_zero', sql`${table.payableMinor} > 0`),
    check('proposal_version_currency_is_iso', sql`${table.currencyCode} ~ '^[A-Z]{3}$'`),
    check(
      'proposal_version_first_is_first',
      sql`(${table.version} = 1) = (${table.trigger} = 'first_generate')`,
    ),
    check(
      'proposal_version_change_is_noted',
      sql`${table.version} = 1 or char_length(btrim(${table.changeNote})) >= 1`,
    ),
  ],
);

/**
 * Each tap that marked a proposal shared (`M06-53`): which version, by which of the two acts, by
 * whom. A tap, never a delivery (`F5-28`). Tenant-scoped, all four always, and APPEND-ONLY.
 */
export const proposalShare = pgTable(
  'proposal_share',
  {
    id: id(),
    tenantId: tenantId(),
    proposalId: uuid('proposal_id')
      .notNull()
      .references(() => proposal.id),
    version: integer('version').notNull(),
    channel: shareChannel('channel').notNull(),
    sharedAt: instant('shared_at').notNull(),
    sharedBy: person('shared_by').notNull(),
  },
  (table) => [
    index('proposal_share_tenant_proposal_idx').on(
      table.tenantId,
      table.proposalId,
      table.sharedAt,
    ),
    check('proposal_share_version_counts', sql`${table.version} >= 1`),
  ],
);

/**
 * The company's saved parts (`M06-28`, `T-M06-034`): cable, electrical and structure — brand,
 * specification, warranty and one line for the customer. No price, no count, no stock. `match_key`
 * is the brand and specification with case and spaces gone, so the same part typed two ways is one
 * part. Archived, it leaves the pickers; a proposal's line holds its own copy either way.
 *
 * Tenant-scoped, all four always: SELECT, INSERT and UPDATE for `app_user`.
 */
export const savedPart = pgTable(
  'saved_part',
  {
    id: id(),
    tenantId: tenantId(),
    kind: savedPartKind('kind').notNull(),
    brand: text('brand').notNull(),
    specification: text('specification').notNull(),
    warranty: text('warranty'),
    description: text('description'),
    matchKey: text('match_key').notNull(),
    archivedAt: instant('archived_at'),
    createdAt: instant('created_at').notNull(),
    createdBy: person('created_by').notNull(),
    updatedAt: instant('updated_at').notNull(),
    updatedBy: person('updated_by').notNull(),
    ...creationKeyColumns(),
  },
  (table) => [
    index('saved_part_tenant_kind_idx').on(table.tenantId, table.kind, table.brand),
    uniqueIndex('saved_part_tenant_kind_match_key')
      .on(table.tenantId, table.kind, table.matchKey)
      .where(sql`${table.archivedAt} is null`),
    uniqueIndex('saved_part_tenant_creation_key')
      .on(table.tenantId, table.creationKey)
      .where(sql`${table.creationKey} is not null`),
    check(
      'saved_part_words_given',
      sql`char_length(btrim(${table.brand})) >= 1 and char_length(btrim(${table.specification})) >= 1 and char_length(${table.matchKey}) >= 1`,
    ),
  ],
);
