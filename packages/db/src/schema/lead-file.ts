import { index, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { uuidv7 } from '../uuid';
import { file } from './file';
import { userAccount } from './identity';
import { lead } from './lead';
import { tenant } from './tenant';

const instant = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

/**
 * A file on a lead (`M02-32`): a customer's bill, a roof photo, named by who added it. The project
 * won from the lead shows them too (ruling 2026-11-10).
 *
 * Tenant-scoped, all four always: SELECT and INSERT for `app_user`.
 */
export const leadFile = pgTable(
  'lead_file',
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
    fileId: uuid('file_id')
      .notNull()
      .references(() => file.id),
    name: text('name').notNull(),
    addedAt: instant('added_at').notNull(),
    addedBy: uuid('added_by')
      .notNull()
      .references(() => userAccount.id),
  },
  (table) => [
    index('lead_file_tenant_lead_idx').on(table.tenantId, table.leadId, table.addedAt),
    uniqueIndex('lead_file_tenant_file_key').on(table.tenantId, table.fileId),
  ],
);
