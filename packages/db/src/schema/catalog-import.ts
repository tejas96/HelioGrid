import {
  CATALOG_IMPORT_ENTRY_POINTS,
  CATALOG_IMPORT_FILE_NAME_MAX,
  CATALOG_IMPORT_STATES,
  CATALOG_IMPORT_UNREADABLE_REASONS,
  type CatalogImportSheet,
} from '@heliogrid/domain';
import { sql } from 'drizzle-orm';
import {
  check,
  index,
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
  ],
);
