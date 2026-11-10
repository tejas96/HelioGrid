import {
  CATALOG_IMPORT_FILE_NAME_MAX,
  IMPORT_DUPLICATE_CHOICES,
  type ImportSheet,
  type LeadImportCells,
  type LeadImportMapping,
} from '@heliogrid/domain';
import { sql } from 'drizzle-orm';
import {
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
import { activity } from './activity';
import { catalogImportStatus, catalogImportUnreadableReason } from './catalog-import';
import { creationKeyColumns } from './creation-key';
import { customer } from './customer';
import { file } from './file';
import { userAccount } from './identity';
import { lead } from './lead';
import { tenant } from './tenant';

/** pgEnum hand-mirrors domain's tuple (invariant `enum-parity`). */
export const importDuplicateChoice = pgEnum('import_duplicate_choice', IMPORT_DUPLICATE_CHOICES);

/**
 * Why a row cannot land, as the column holds them: the set grows, so a reader meets a problem it may
 * not know and the contract reads each as an open enum.
 */
export type LeadImportProblemsEnvelope = readonly string[];

const instant = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

/**
 * One spreadsheet of leads being imported (`M02-18`…`M02-21`). One import family, lifted and never
 * copied (RFC decision 16): the job walks the catalog import's state machine on those same two
 * types, and its mapping, revision and runner behave as `catalogImportJob`'s. The duplicate choice
 * belongs to the run and is set with it.
 *
 * Tenant-scoped, all four always. SELECT, INSERT and UPDATE for `app_user`: a job moves through its
 * states and is kept, so "where did these leads come from" always answers.
 */
export const leadImport = pgTable(
  'lead_import',
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
    status: catalogImportStatus('status').notNull(),
    unreadableReason: catalogImportUnreadableReason('unreadable_reason'),
    fileName: text('file_name').notNull(),
    savedAt: instant('saved_at'),
    sheets: jsonb('sheets').$type<readonly ImportSheet[]>(),
    /** What the person confirmed in the columns step; set from the first mapping on. */
    mapping: jsonb('mapping').$type<LeadImportMapping>(),
    /** Raised by every confirmed mapping, so a pass started for an older one writes nothing. */
    mappingRevision: integer('mapping_revision').notNull().default(0),
    duplicateChoice: importDuplicateChoice('duplicate_choice'),
    runAt: instant('run_at'),
    runBy: uuid('run_by').references(() => userAccount.id),
    startedBy: uuid('started_by')
      .notNull()
      .references(() => userAccount.id),
    createdAt: instant('created_at').notNull(),
    updatedAt: instant('updated_at').notNull(),
    ...creationKeyColumns(),
  },
  (table) => [
    index('lead_import_tenant_created_idx').on(table.tenantId, table.createdAt.desc()),
    uniqueIndex('lead_import_tenant_creation_key')
      .on(table.tenantId, table.creationKey)
      .where(sql`${table.creationKey} is not null`),
    check(
      'lead_import_file_name_length',
      sql`char_length(${table.fileName}) between 1 and ${sql.raw(String(CATALOG_IMPORT_FILE_NAME_MAX))}`,
    ),
    check(
      'lead_import_unreadable_has_reason',
      sql`(${table.status} = 'unreadable') = (${table.unreadableReason} is not null)`,
    ),
    check(
      'lead_import_matched_has_mapping',
      sql`${table.status} not in ('matching', 'previewed', 'running', 'completed') or ${table.mapping} is not null`,
    ),
    // A run names when, who and the duplicate choice; a job never run names none of them.
    check(
      'lead_import_run_is_whole',
      sql`(${table.status} in ('running', 'completed')) = (${table.runAt} is not null) and (${table.runAt} is null) = (${table.runBy} is null) and (${table.runAt} is null) = (${table.duplicateChoice} is null)`,
    ),
  ],
);

/**
 * One filled row of a lead import's sheet. Its verdict is what it names, so no outcome is stored:
 * problems (why it cannot land, `M02-21`), the customer its number met or the earlier row of the file
 * with that number (a duplicate), or neither (a new lead). The run's result likewise: the lead it
 * landed, the enquiry it logged on the existing record (`M02-20`), or neither (skipped). Counts are
 * read off the rows; a landed row is never rolled back.
 *
 * Tenant-scoped, all four always. DELETE as well as SELECT, INSERT and UPDATE for `app_user`: a new
 * mapping's pass replaces the rows of the one it supersedes, before anything runs.
 */
export const leadImportRow = pgTable(
  'lead_import_row',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id),
    importId: uuid('import_id')
      .notNull()
      .references(() => leadImport.id),
    /** The sheet's own row number, the one the person sees in their file. */
    rowNumber: integer('row_number').notNull(),
    cells: jsonb('cells').$type<LeadImportCells>().notNull(),
    /** The row's number as the pass normalised it; null when it could not be read. */
    phoneE164: text('phone_e164'),
    problems: jsonb('problems').$type<LeadImportProblemsEnvelope>().notNull(),
    duplicateOfCustomerId: uuid('duplicate_of_customer_id').references(() => customer.id),
    repeatsRow: integer('repeats_row'),
    leadId: uuid('lead_id').references(() => lead.id),
    enquiryActivityId: uuid('enquiry_activity_id').references(() => activity.id),
    /** When the run took the row; null until it has. */
    ranAt: instant('ran_at'),
    createdAt: instant('created_at').notNull(),
    updatedAt: instant('updated_at').notNull(),
  },
  (table) => [
    uniqueIndex('lead_import_row_tenant_import_row_key').on(
      table.tenantId,
      table.importId,
      table.rowNumber,
    ),
    /** The pass's in-file repeats and the duplicate join, by number. */
    index('lead_import_row_tenant_import_phone_idx').on(
      table.tenantId,
      table.importId,
      table.phoneE164,
    ),
    /** The run's next rows (`ran_at is null`, in row order). */
    index('lead_import_row_tenant_import_ran_idx').on(
      table.tenantId,
      table.importId,
      table.ranAt,
      table.rowNumber,
    ),
    check('lead_import_row_number_positive', sql`${table.rowNumber} >= 1`),
    check(
      'lead_import_row_repeats_an_earlier_row',
      sql`${table.repeatsRow} >= 1 and ${table.repeatsRow} < ${table.rowNumber}`,
    ),
    check('lead_import_row_problems_are_a_list', sql`jsonb_typeof(${table.problems}) = 'array'`),
    check(
      'lead_import_row_rejected_lands_nothing',
      sql`jsonb_array_length(${table.problems}) = 0 or (${table.duplicateOfCustomerId} is null and ${table.repeatsRow} is null and ${table.leadId} is null and ${table.enquiryActivityId} is null)`,
    ),
    check(
      'lead_import_row_duplicate_lands_no_lead',
      sql`(${table.duplicateOfCustomerId} is null and ${table.repeatsRow} is null) or ${table.leadId} is null`,
    ),
    check(
      'lead_import_row_enquiry_only_on_a_duplicate',
      sql`${table.enquiryActivityId} is null or ${table.duplicateOfCustomerId} is not null or ${table.repeatsRow} is not null`,
    ),
    check(
      'lead_import_row_result_needs_the_run',
      sql`${table.ranAt} is not null or (${table.leadId} is null and ${table.enquiryActivityId} is null)`,
    ),
  ],
);
