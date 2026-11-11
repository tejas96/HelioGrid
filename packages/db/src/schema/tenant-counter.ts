import { TENANT_COUNTER_KINDS } from '@heliogrid/domain';
import { sql } from 'drizzle-orm';
import { check, integer, pgEnum, pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core';
import { tenant } from './tenant';

/** pgEnums hand-mirror domain's tuples (invariant `enum-parity` proves each pair equal). */
export const tenantCounterKind = pgEnum('tenant_counter_kind', TENANT_COUNTER_KINDS);

/**
 * A company's own number series (`M08-03`): the last number handed out per kind, bumped inside the
 * transaction that creates the record, so two creates at once queue on the row and never collide.
 *
 * Tenant-scoped, all four always: SELECT, INSERT and UPDATE for `app_user`.
 */
export const tenantCounter = pgTable(
  'tenant_counter',
  {
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id),
    kind: tenantCounterKind('kind').notNull(),
    lastNumber: integer('last_number').notNull(),
  },
  (table) => [
    primaryKey({ name: 'tenant_counter_pkey', columns: [table.tenantId, table.kind] }),
    // 0 before the first number is handed out: the row exists from a company's first win, to lock.
    check('tenant_counter_last_number_counted', sql`${table.lastNumber} >= 0`),
  ],
);
