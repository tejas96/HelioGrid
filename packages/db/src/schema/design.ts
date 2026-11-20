import { DESIGN_MOUNTS, DESIGN_STATUSES } from '@heliogrid/domain';
import { sql } from 'drizzle-orm';
import {
  type AnyPgColumn,
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
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
export const designMount = pgEnum('design_mount', DESIGN_MOUNTS);
export const designStatus = pgEnum('design_status', DESIGN_STATUSES);

const instant = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });
const person = (name: string) => uuid(name).references(() => userAccount.id);

/**
 * One design of the studio. `lead_id` is the one place a design points at the CRM: the site it is
 * made for is the lead's own (`lead.site_*`), read and written through the CRM module, and nothing
 * else of the lead is copied here.
 *
 * `ordinal` is the N of "Design N", counted per lead by the server under the lead's row lock, so
 * two people starting a design at once never share a number; a number is never used twice.
 * `mount` is where the panels go — the design's own fact, because one site can carry a roof design
 * and a ground design. At most one design of a lead is `recommended`. `duplicated_from` keeps a
 * copy's lineage. Creating one carries its retry key (`F4-07`).
 *
 * The drawing itself is the design document (`design_document`). Tenant-scoped, all four always:
 * SELECT, INSERT and UPDATE for `app_user`. No DELETE: nothing removes a design yet.
 */
export const design = pgTable(
  'design',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id),
    leadId: uuid('lead_id')
      .notNull()
      .references(() => lead.id),
    ordinal: integer('ordinal').notNull(),
    mount: designMount('mount').notNull(),
    status: designStatus('status').notNull(),
    recommended: boolean('recommended').notNull(),
    duplicatedFrom: uuid('duplicated_from').references((): AnyPgColumn => design.id),
    createdAt: instant('created_at').notNull(),
    createdBy: person('created_by').notNull(),
    updatedAt: instant('updated_at').notNull(),
    updatedBy: person('updated_by').notNull(),
    ...creationKeyColumns(),
  },
  (table) => [
    /** A lead's designs, newest change first. */
    index('design_tenant_lead_idx').on(table.tenantId, table.leadId, table.updatedAt.desc()),
    uniqueIndex('design_lead_ordinal_key').on(table.tenantId, table.leadId, table.ordinal),
    uniqueIndex('design_one_recommended_per_lead_key')
      .on(table.tenantId, table.leadId)
      .where(sql`${table.recommended}`),
    uniqueIndex('design_tenant_creation_key')
      .on(table.tenantId, table.creationKey)
      .where(sql`${table.creationKey} is not null`),
    check('design_ordinal_counts', sql`${table.ordinal} >= 1`),
  ],
);

/**
 * The design document's envelope: the shape version names how `body` reads; the whole is parsed by
 * the studio's own schema, never here.
 */
export interface DesignDocumentEnvelope {
  readonly schemaVersion: number;
}

/**
 * The design document: the whole drawing of one design, stored as one document and saved whole on
 * each change (`T-M05-002a`). `version` counts the saves — a save made over an older count is
 * refused, never merged (`F4-15`) — and 0 is a design whose turn was taken but nothing saved yet;
 * `saved_opening` is the studio opening that made the last save, so a save whose answer was lost
 * knows its own.
 * `editor_id` holds the design's turn to edit until `editor_until`: one editor at a time, and a
 * turn its studio stops renewing runs out by itself.
 *
 * Tenant-scoped, all four: SELECT, INSERT and UPDATE for `app_user`. No DELETE: a design is never
 * removed yet, and neither is its document.
 */
export const designDocument = pgTable(
  'design_document',
  {
    designId: uuid('design_id')
      .primaryKey()
      .references(() => design.id),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id),
    schemaVersion: integer('schema_version').notNull(),
    body: jsonb('body').$type<DesignDocumentEnvelope>().notNull(),
    version: integer('version').notNull(),
    savedAt: instant('saved_at'),
    savedBy: person('saved_by'),
    savedOpening: uuid('saved_opening'),
    editorId: person('editor_id'),
    editorUntil: instant('editor_until'),
  },
  (table) => [
    index('design_document_tenant_idx').on(table.tenantId, table.designId),
    check('design_document_body_is_object', sql`jsonb_typeof(${table.body}) = 'object'`),
    check('design_document_version_counts', sql`${table.version} >= 0`),
    check(
      'design_document_saved_whole',
      sql`(${table.savedAt} is null) = (${table.savedBy} is null)`,
    ),
    check(
      'design_document_turn_whole',
      sql`(${table.editorId} is null) = (${table.editorUntil} is null)`,
    ),
  ],
);
