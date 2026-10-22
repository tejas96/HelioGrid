import { index, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { file } from './file';
import { tenantMembership } from './identity';
import { tenant } from './tenant';

/**
 * A person's photo in one company (`M01-14`, brief ruling 16): a membership points at one of that
 * company's files, stored against the person's own `user_account`. Tenant-scoped, all four always.
 * Its own file because `identity.ts` cannot import `file.ts`, which imports it. The pointer names
 * no tenant in its key, so the api checks the file is this company's before it writes (`FileService.confirmed`).
 */
export const memberPhoto = pgTable(
  'member_photo',
  {
    membershipId: uuid('membership_id')
      .primaryKey()
      .references(() => tenantMembership.id),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id),
    fileId: uuid('file_id')
      .notNull()
      .references(() => file.id),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [index('member_photo_tenant_membership_idx').on(table.tenantId, table.membershipId)],
);
