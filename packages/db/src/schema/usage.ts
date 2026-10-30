import { BILLED_LEDGER_METERS, LEDGER_METERS } from '@heliogrid/domain';
import { sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  check,
  date,
  index,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { uuidv7 } from '../uuid';
import { subjectKind } from './subject';
import { tenant } from './tenant';

/** Hand-mirrors domain's tuple (invariant `enum-parity`). */
export const usageMeter = pgEnum('usage_meter', LEDGER_METERS);

const BILLED_METERS = sql.raw(BILLED_LEDGER_METERS.map((meter) => `'${meter}'`).join(', '));

const instant = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

/**
 * The usage ledger (`M12-32`): one row per metered unit of work, and the only counter there is —
 * every usage figure is a rollup of these rows. Append-only: `app_user` holds SELECT alone, and
 * the outbox step writes on the admin path (`usageRecord`).
 *
 * `quantity` is whole, in the meter's unit (`METER_UNITS`). A row bills only when its meter is a
 * billed one, and the CHECK refuses a billable cost line (`M12-37`). `period_key` is the UTC month
 * of `occurred_at`, computed by the writer alone, so a retried event hits the same unique key.
 *
 * Tenant-scoped, all four always.
 */
export const usageEvent = pgTable(
  'usage_event',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id),
    meter: usageMeter('meter').notNull(),
    quantity: bigint('quantity', { mode: 'number' }).notNull(),
    billable: boolean('billable').notNull(),
    /** What the unit came from — the call, the detection, the send (`F2-22`'s one pointer). */
    subjectKind: subjectKind('subject_kind').notNull(),
    subjectRef: uuid('subject_ref').notNull(),
    idempotencyKey: text('idempotency_key').notNull(),
    periodKey: text('period_key').notNull(),
    occurredAt: instant('occurred_at').notNull(),
    recordedAt: instant('recorded_at').notNull(),
  },
  (table) => [
    check('usage_event_quantity_positive', sql`${table.quantity} >= 1`),
    check(
      'usage_event_bills_a_billed_meter',
      sql`not ${table.billable} or ${table.meter} in (${BILLED_METERS})`,
    ),
    check('usage_event_period_key_month', sql`${table.periodKey} ~ '^[0-9]{4}-[0-9]{2}$'`),
    /**
     * A retried job or a repeated webhook writes nothing (`M12-32`). The meter is in the key, so
     * one call keyed by its id can meter both its billed minutes and its speech cost.
     */
    uniqueIndex('usage_event_tenant_idempotency_key').on(
      table.tenantId,
      table.meter,
      table.idempotencyKey,
      table.periodKey,
    ),
    /** The one rollup: a company's meters over a window. */
    index('usage_event_tenant_meter_occurred_idx').on(
      table.tenantId,
      table.meter,
      table.occurredAt,
    ),
  ],
);

/**
 * The nightly storage gauge (`M12-33`, `BM-20`): what a company's stored files weighed, once a
 * night. A reading, never a counter — the storage gate and the usage screen read the latest one.
 * Append-only like the ledger: `app_user` holds SELECT alone; the nightly step writes on the
 * admin path.
 *
 * Tenant-scoped, all four always.
 */
export const storageGaugeSnapshot = pgTable(
  'storage_gauge_snapshot',
  {
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id),
    /** The UTC night it was taken: one reading a night. */
    snapshotDate: date('snapshot_date', { mode: 'string' }).notNull(),
    gaugeBytes: bigint('gauge_bytes', { mode: 'number' }).notNull(),
    takenAt: instant('taken_at').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.tenantId, table.snapshotDate] }),
    check('storage_gauge_snapshot_bytes_whole', sql`${table.gaugeBytes} >= 0`),
  ],
);
