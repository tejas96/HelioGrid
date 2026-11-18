import { DESIGN_MOUNTS, DESIGN_STATUSES } from '@heliogrid/domain';
import { sql } from 'drizzle-orm';
import {
  type AnyPgColumn,
  boolean,
  check,
  index,
  integer,
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
 * The drawing itself is not here yet: the roof step adds the design document. Tenant-scoped, all
 * four always: SELECT, INSERT and UPDATE for `app_user`. No DELETE: nothing removes a design yet.
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
