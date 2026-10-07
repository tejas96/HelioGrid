import {
  CATALOG_IMPORT_CONFLICT_ANSWERS,
  CATALOG_IMPORT_ENTRY_POINTS,
  CATALOG_IMPORT_FILE_NAME_MAX,
  CATALOG_IMPORT_ROW_OUTCOMES,
  CATALOG_IMPORT_STATES,
  CATALOG_IMPORT_UNREADABLE_REASONS,
  type CatalogImportCells,
  type CatalogImportMapping,
  type CatalogImportSheet,
  type ImportAttention,
} from '@heliogrid/domain';
import { sql } from 'drizzle-orm';
import {
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
import { catalogItem } from './catalog-platform';
import { tenantCatalogItem } from './catalog-tenant';
import { creationKeyColumns } from './creation-key';
import { file } from './file';
import { userAccount } from './identity';
import { tenant } from './tenant';

/** pgEnums hand-mirror domain's tuples (invariant `enum-parity`). */
export const catalogImportStatus = pgEnum('catalog_import_status', CATALOG_IMPORT_STATES);
export const catalogImportEntryPoint = pgEnum(
  'catalog_import_entry_point',
  CATALOG_IMPORT_ENTRY_POINTS,
);
export const catalogImportUnreadableReason = pgEnum(
  'catalog_import_unreadable_reason',
  CATALOG_IMPORT_UNREADABLE_REASONS,
);
export const catalogImportRowOutcome = pgEnum(
  'catalog_import_row_outcome',
  CATALOG_IMPORT_ROW_OUTCOMES,
);
export const catalogImportConflictAnswer = pgEnum(
  'catalog_import_conflict_answer',
  CATALOG_IMPORT_CONFLICT_ANSWERS,
);

const instant = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

/**
 * One spreadsheet import (`T-M01-030`, `M01-41`): the stored price list it reads and where the job
 * is. The file's name and saved date are what the device's picker gave — the store keeps neither —
 * and `sheets` is what the read step counted in the file, null until it has read it.
 *
 * Tenant-scoped, all four always. SELECT, INSERT and UPDATE for `app_user`: a job moves through its
 * states and is kept — nothing purges a report (`M01-41`: kept and re-openable).
 */
export const catalogImportJob = pgTable(
  'catalog_import_job',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id),
    fileId: uuid('file_id')
      .notNull()
      .references(() => file.id),
    entryPoint: catalogImportEntryPoint('entry_point').notNull(),
    status: catalogImportStatus('status').notNull(),
    unreadableReason: catalogImportUnreadableReason('unreadable_reason'),
    fileName: text('file_name').notNull(),
    savedAt: instant('saved_at'),
    sheets: jsonb('sheets').$type<readonly CatalogImportSheet[]>(),
    /** What the person confirmed in step 2; set from the first mapping on. */
    mapping: jsonb('mapping').$type<CatalogImportMapping>(),
    /** Raised by every confirmed mapping, so a pass started for an older one writes nothing. */
    mappingRevision: integer('mapping_revision').notNull().default(0),
    startedBy: uuid('started_by')
      .notNull()
      .references(() => userAccount.id),
    createdAt: instant('created_at').notNull(),
    updatedAt: instant('updated_at').notNull(),
    ...creationKeyColumns(),
  },
  (table) => [
    index('catalog_import_job_tenant_created_idx').on(table.tenantId, table.createdAt.desc()),
    uniqueIndex('catalog_import_job_tenant_creation_key')
      .on(table.tenantId, table.creationKey)
      .where(sql`${table.creationKey} is not null`),
    check(
      'catalog_import_job_file_name_length',
      sql`char_length(${table.fileName}) between 1 and ${sql.raw(String(CATALOG_IMPORT_FILE_NAME_MAX))}`,
    ),
    // A reason without the state, or the state without its reason, is a job step 1 cannot explain.
    check(
      'catalog_import_job_unreadable_has_reason',
      sql`(${table.status} = 'unreadable') = (${table.unreadableReason} is not null)`,
    ),
    // A job past its mapping matches, previews and runs by it; without one there is nothing to run.
    check(
      'catalog_import_job_matched_has_mapping',
      sql`${table.status} not in ('matching', 'previewed', 'running', 'completed') or ${table.mapping} is not null`,
    ),
  ],
);

/**
 * One filled row of an import's sheet and the matching pass's verdict on it (`T-M01-030d`): its
 * cells, what the person answered, and what the pass made of it — the outcome, why it needs
 * attention, and the item it matched. The counts are read off these rows, never stored.
 *
 * Tenant-scoped, all four always. DELETE as well as SELECT, INSERT and UPDATE for `app_user`: a new
 * mapping's pass replaces the rows of the one it supersedes, before anything is run.
 */
export const catalogImportRow = pgTable(
  'catalog_import_row',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id),
    jobId: uuid('job_id')
      .notNull()
      .references(() => catalogImportJob.id),
    /** The sheet's own row number, the one the person sees in their file. */
    rowNumber: integer('row_number').notNull(),
    cells: jsonb('cells').$type<CatalogImportCells>().notNull(),
    fix: jsonb('fix').$type<CatalogImportCells>().notNull(),
    leftOut: boolean('left_out').notNull(),
    answer: catalogImportConflictAnswer('answer'),
    outcome: catalogImportRowOutcome('outcome').notNull(),
    /** Empty unless the outcome is `needs_attention`; each reason is parsed by the contract. */
    attention: jsonb('attention').$type<readonly ImportAttention[]>().notNull(),
    catalogItemId: uuid('catalog_item_id').references(() => catalogItem.id),
    tenantCatalogItemId: uuid('tenant_catalog_item_id').references(() => tenantCatalogItem.id),
    createdAt: instant('created_at').notNull(),
    updatedAt: instant('updated_at').notNull(),
  },
  (table) => [
    uniqueIndex('catalog_import_row_tenant_job_row_key').on(
      table.tenantId,
      table.jobId,
      table.rowNumber,
    ),
    index('catalog_import_row_tenant_job_outcome_idx').on(
      table.tenantId,
      table.jobId,
      table.outcome,
      table.rowNumber,
    ),
    check('catalog_import_row_number_positive', sql`${table.rowNumber} >= 1`),
    // The item a match names is the one its outcome writes to; any other outcome names none.
    check(
      'catalog_import_row_match_names_its_item',
      sql`(${table.outcome} = 'price_override') = (${table.catalogItemId} is not null) and (${table.outcome} = 'own_item_price') = (${table.tenantCatalogItemId} is not null)`,
    ),
  ],
);
