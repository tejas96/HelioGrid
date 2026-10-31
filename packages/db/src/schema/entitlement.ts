import {
  ENTITLEMENT_LIMIT_KINDS,
  ENTITLEMENT_OVERRIDE_KINDS,
  ENTITLEMENT_SOURCES,
} from '@heliogrid/domain';
import { sql } from 'drizzle-orm';
import {
  bigint,
  check,
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
import { subscription } from './billing';
import { userAccount } from './identity';
import { tenant } from './tenant';

/** pgEnums hand-mirror domain's tuples (invariant `enum-parity` proves each pair equal). */
export const entitlementSource = pgEnum('entitlement_source', ENTITLEMENT_SOURCES);
export const entitlementLimitKind = pgEnum('entitlement_limit_kind', ENTITLEMENT_LIMIT_KINDS);
export const entitlementOverrideKind = pgEnum(
  'entitlement_override_kind',
  ENTITLEMENT_OVERRIDE_KINDS,
);

const instant = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

/**
 * A company's current limit per key (`M12-16`): the one runtime gate, read on the hot path by its
 * primary key. Rewritten in place by the act that changes it — the trial's start, a charge, an
 * override — on that act's transaction; it keeps no history (the causing rows are the record).
 * `entitlement_key` is open text, never an enum: domain's `ENTITLEMENT_KEYS` is what writes it.
 *
 * Tenant-scoped, all four. `app_user` holds SELECT alone: every writer crosses tenants (signup,
 * the gateway's messages, support), so the admin path writes it.
 */
export const entitlement = pgTable(
  'entitlement',
  {
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id),
    entitlementKey: text('entitlement_key').notNull(),
    limitKind: entitlementLimitKind('limit_kind').notNull(),
    /** The number, for a `count` limit only. */
    limitValue: bigint('limit_value', { mode: 'number' }),
    source: entitlementSource('source').notNull(),
    recomputedAt: instant('recomputed_at').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.tenantId, table.entitlementKey] }),
    check(
      'entitlement_count_has_value',
      sql`(${table.limitKind} = 'count') = (${table.limitValue} is not null)`,
    ),
  ],
);

/**
 * Support's audited acts on a company's limits and trial (`M12-19`, `M12-52`): who, what, why and
 * when, never a manual edit. A `goodwill_credit` raises one key for the life of its subscription;
 * a `trial_extension` moved the trial's end, once per company. Append-only: no role under
 * `app_user` holds UPDATE, DELETE or TRUNCATE (`append-only-ledgers.ts`).
 *
 * Tenant-scoped, all four; `app_user` holds SELECT alone — support acts across tenants.
 */
export const entitlementOverride = pgTable(
  'entitlement_override',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id),
    subscriptionId: uuid('subscription_id')
      .notNull()
      .references(() => subscription.id),
    kind: entitlementOverrideKind('kind').notNull(),
    /** The key a credit raises, and by how much; both null on a trial extension. */
    entitlementKey: text('entitlement_key'),
    credit: bigint('credit', { mode: 'number' }),
    reason: text('reason').notNull(),
    /** The staff member's own account (`F2-24`). */
    issuedBy: uuid('issued_by')
      .notNull()
      .references(() => userAccount.id),
    issuedAt: instant('issued_at').notNull(),
  },
  (table) => [
    /** The recompute's read: a subscription's credits. */
    index('entitlement_override_tenant_subscription_idx').on(
      table.tenantId,
      table.subscriptionId,
      table.issuedAt,
    ),
    /** `M12-52` — one trial extension per company. */
    uniqueIndex('entitlement_override_one_trial_extension')
      .on(table.tenantId)
      .where(sql`${table.kind} = 'trial_extension'`),
    check(
      'entitlement_override_kind_whole',
      sql`(${table.kind} = 'goodwill_credit') = (${table.entitlementKey} is not null and ${table.credit} is not null and ${table.credit} > 0) and (${table.kind} = 'trial_extension') = (${table.entitlementKey} is null and ${table.credit} is null)`,
    ),
    check('entitlement_override_reason_said', sql`length(trim(${table.reason})) > 0`),
  ],
);
