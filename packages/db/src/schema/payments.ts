import { PAYMENT_ENTRY_KINDS, SCHEDULE_SOURCES } from '@heliogrid/domain';
import { sql } from 'drizzle-orm';
import {
  type AnyPgColumn,
  bigint,
  check,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { uuidv7 } from '../uuid';
import { creationKeyColumns } from './creation-key';
import { file } from './file';
import { userAccount } from './identity';
import { project, projectStage } from './project';
import { tenant } from './tenant';

/** pgEnums hand-mirror domain's tuples (invariant `enum-parity` proves each pair equal). */
export const scheduleSource = pgEnum('schedule_source', SCHEDULE_SOURCES);
export const paymentEntryKind = pgEnum('payment_entry_kind', PAYMENT_ENTRY_KINDS);

const instant = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });
const day = (name: string) => date(name, { mode: 'string' });

/**
 * One part of a project's price (`M11-09`, `M11-13`): its label, share and amount, made once when
 * the schedule is made — at Mark won from the company's payment terms (ruling 2026-11-10) — and
 * never re-typed. Its state, what is still owed and since when are READ from the ledger and the
 * stage history, never stored (`M11-10`). A waiver is the one change: terminal, with its reason
 * and who (`M11-49`).
 *
 * Tenant-scoped, all four always: SELECT, INSERT and UPDATE (the waiver) for `app_user`.
 */
export const projectTranche = pgTable(
  'project_tranche',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id),
    projectId: uuid('project_id')
      .notNull()
      .references(() => project.id),
    position: smallint('position').notNull(),
    label: text('label').notNull(),
    shareBasisPoints: integer('share_basis_points').notNull(),
    amountMinor: bigint('amount_minor', { mode: 'number' }).notNull(),
    dueOnStage: projectStage('due_on_stage').notNull(),
    source: scheduleSource('source').notNull(),
    createdAt: instant('created_at').notNull(),
    waivedAt: instant('waived_at'),
    waivedBy: uuid('waived_by').references(() => userAccount.id),
    waiveReason: text('waive_reason'),
  },
  (table) => [
    uniqueIndex('project_tranche_tenant_project_position_key').on(
      table.tenantId,
      table.projectId,
      table.position,
    ),
    check('project_tranche_position_counts', sql`${table.position} >= 1`),
    check('project_tranche_share_is_a_share', sql`${table.shareBasisPoints} between 0 and 10000`),
    check('project_tranche_amount_not_negative', sql`${table.amountMinor} >= 0`),
    check('project_tranche_due_on_a_chain_stage', sql`${table.dueOnStage} <> 'cancelled'`),
    check(
      'project_tranche_waiver_is_whole',
      sql`(${table.waivedAt} is null) = (${table.waivedBy} is null) and (${table.waivedAt} is null) = (${table.waiveReason} is null)`,
    ),
  ],
);

/**
 * The payments ledger (`M11-40`): every payment a person recorded and every reversal of one, never
 * edited and never deleted. A payment carries its mode, the bank's reference and its key (spaces
 * and dashes gone, so one UTR typed two ways is one payment), the day the money arrived, its
 * receipt photo and its receipt number. A reversal is a negative entry pointing at the payment it
 * takes back, with its reason (`M11-46`) — at most one per payment.
 *
 * Recording carries its retry key, so a retried send finds the entry the first one made (`F4-07`).
 *
 * Tenant-scoped, all four always, and APPEND-ONLY: SELECT and INSERT alone for `app_user`
 * (`append-only-ledgers.ts`).
 */
export const projectPayment = pgTable(
  'project_payment',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id),
    projectId: uuid('project_id')
      .notNull()
      .references(() => project.id),
    trancheId: uuid('tranche_id')
      .notNull()
      .references(() => projectTranche.id),
    kind: paymentEntryKind('kind').notNull(),
    amountMinor: bigint('amount_minor', { mode: 'number' }).notNull(),
    mode: text('mode'),
    reference: text('reference'),
    referenceKey: text('reference_key'),
    receivedOn: day('received_on'),
    fileId: uuid('file_id').references(() => file.id),
    receiptNumber: integer('receipt_number'),
    reversesId: uuid('reverses_id').references((): AnyPgColumn => projectPayment.id),
    reason: text('reason'),
    recordedAt: instant('recorded_at').notNull(),
    recordedBy: uuid('recorded_by')
      .notNull()
      .references(() => userAccount.id),
    ...creationKeyColumns(),
  },
  (table) => [
    index('project_payment_tenant_project_idx').on(
      table.tenantId,
      table.projectId,
      table.recordedAt,
    ),
    index('project_payment_tenant_reference_idx')
      .on(table.tenantId, table.referenceKey)
      .where(sql`${table.referenceKey} is not null`),
    uniqueIndex('project_payment_one_reversal_key')
      .on(table.tenantId, table.reversesId)
      .where(sql`${table.reversesId} is not null`),
    uniqueIndex('project_payment_tenant_receipt_key')
      .on(table.tenantId, table.receiptNumber)
      .where(sql`${table.receiptNumber} is not null`),
    uniqueIndex('project_payment_tenant_creation_key')
      .on(table.tenantId, table.creationKey)
      .where(sql`${table.creationKey} is not null`),
    check(
      'project_payment_is_whole',
      sql`(${table.kind} = 'payment' and ${table.amountMinor} > 0 and ${table.mode} is not null and ${table.receivedOn} is not null and ${table.receiptNumber} is not null and ${table.reversesId} is null)
        or (${table.kind} = 'reversal' and ${table.amountMinor} < 0 and ${table.reversesId} is not null and ${table.reason} is not null and ${table.receiptNumber} is null)`,
    ),
    check(
      'project_payment_reference_has_its_key',
      sql`(${table.reference} is null) = (${table.referenceKey} is null)`,
    ),
  ],
);

/**
 * Each time a person shared the request for a part (ruling 2026-11-10: nobody asks twice). It
 * records the tap that handed the message to the phone's share sheet or the clipboard — never a
 * delivery, which only the person's own app knows.
 *
 * Tenant-scoped, all four always, and APPEND-ONLY: SELECT and INSERT alone for `app_user`.
 */
export const trancheRequestShare = pgTable(
  'tranche_request_share',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id),
    trancheId: uuid('tranche_id')
      .notNull()
      .references(() => projectTranche.id),
    sharedAt: instant('shared_at').notNull(),
    sharedBy: uuid('shared_by')
      .notNull()
      .references(() => userAccount.id),
  },
  (table) => [
    index('tranche_request_share_tenant_tranche_idx').on(
      table.tenantId,
      table.trancheId,
      table.sharedAt,
    ),
  ],
);

/**
 * How the company's customers pay it (`SCR-M11-04`): its own UPI ID and the name a UPI app shows.
 * The bank account is the business profile's, never a second copy. One row per company, changed
 * by its owner alone — a changed UPI ID sends every later payment somewhere new.
 *
 * Tenant-scoped, all four always: SELECT, INSERT and UPDATE for `app_user`.
 */
export const collectionsSettings = pgTable('collections_settings', {
  tenantId: uuid('tenant_id')
    .primaryKey()
    .references(() => tenant.id),
  upiId: text('upi_id'),
  payeeName: text('payee_name'),
  updatedAt: instant('updated_at').notNull(),
  updatedBy: uuid('updated_by')
    .notNull()
    .references(() => userAccount.id),
});
