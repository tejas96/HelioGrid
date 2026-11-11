import { DOCUMENT_STATES, PROJECT_FILE_SLOTS } from '@heliogrid/domain';
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
import { file } from './file';
import { userAccount } from './identity';
import { project } from './project';
import { tenant } from './tenant';

/** pgEnums hand-mirror domain's tuples (invariant `enum-parity` proves each pair equal). */
export const projectDocumentState = pgEnum('project_document_state', DOCUMENT_STATES);
export const projectFileSlot = pgEnum('project_file_slot', PROJECT_FILE_SLOTS);

const instant = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

/**
 * One checklist row (`M08-30`, `M08-31` as ruled): seeded from the pack for the deal, in the pack's
 * order, and moved between waiting, done and not needed — *Not needed* with its reason.
 *
 * Tenant-scoped, all four always: SELECT, INSERT and UPDATE for `app_user`.
 */
export const projectDocument = pgTable(
  'project_document',
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
    rowKey: text('row_key').notNull(),
    position: integer('position').notNull(),
    state: projectDocumentState('state').notNull(),
    reason: text('reason'),
    changedAt: instant('changed_at').notNull(),
    changedBy: uuid('changed_by').references(() => userAccount.id),
  },
  (table) => [
    uniqueIndex('project_document_tenant_project_row_key').on(
      table.tenantId,
      table.projectId,
      table.rowKey,
    ),
    check(
      'project_document_reason_when_not_needed',
      sql`(${table.state} = 'not_needed') = (${table.reason} is not null)`,
    ),
  ],
);

/**
 * A file on a project (rulings 2026-11-10): a checklist row's document, an install step's photo, or
 * another file a person names. Files are kept: a replacement is a new row, and an earlier one stays
 * readable (`M08-31`). *Show to customer* puts an other file in the handover pack; it starts off.
 *
 * Tenant-scoped, all four always: SELECT, INSERT and UPDATE for `app_user`.
 */
export const projectFile = pgTable(
  'project_file',
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
    fileId: uuid('file_id')
      .notNull()
      .references(() => file.id),
    slot: projectFileSlot('slot').notNull(),
    /** The checklist row or install step the file belongs to; null for an other file. */
    slotKey: text('slot_key'),
    name: text('name').notNull(),
    shownToCustomer: boolean('shown_to_customer').notNull().default(false),
    addedAt: instant('added_at').notNull(),
    addedBy: uuid('added_by')
      .notNull()
      .references(() => userAccount.id),
  },
  (table) => [
    index('project_file_tenant_project_idx').on(table.tenantId, table.projectId, table.addedAt),
    uniqueIndex('project_file_tenant_file_key').on(table.tenantId, table.fileId),
    check('project_file_slot_key', sql`(${table.slot} = 'other') = (${table.slotKey} is null)`),
  ],
);
