import { ACTIVITY_ACTORS, ACTIVITY_KINDS } from '@heliogrid/domain';
import { sql } from 'drizzle-orm';
import {
  bigint,
  check,
  index,
  jsonb,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { uuidv7 } from '../uuid';
import { creationKeyColumns } from './creation-key';
import { customer } from './customer';
import { lead } from './lead';
import { tenant } from './tenant';

/** pgEnums hand-mirror domain's tuples (invariant `enum-parity` proves each pair equal). */
export const activityKind = pgEnum('activity_kind', ACTIVITY_KINDS);
export const activityActor = pgEnum('activity_actor', ACTIVITY_ACTORS);

/**
 * A timeline entry's body as the column holds it: one object whose shape its kind decides, parsed
 * in domain on read. The kind set grows, so an older reader meets bodies it cannot parse and shows
 * them as a plain system entry.
 */
export type ActivityBodyEnvelope = Readonly<Record<string, unknown>>;

const instant = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

/**
 * One entry of the one stream a customer and their leads show (`M02-35`): anchored on its customer,
 * with an optional lead. `sequence` is the order — numbered by the database in apply order, so the
 * server decides and the device clock never does (`F4-19`); `captured_at` is shown, never sorted by.
 * `actor_ref` carries no key, as the audit log's does not: an entry outlives what it names, and the
 * agent and the customer hold no account. A merge changes no entry: the survivor's stream reads every
 * customer merged into it (RFC decision 17).
 *
 * An entry a person's create wrote — a call, a note, an enquiry, a message copied — carries that
 * create's retry key, so a retried send finds it (`F4-07`); an entry a create wrote beside its own
 * keyed row carries none.
 *
 * Tenant-scoped, all four always, and APPEND-ONLY: SELECT and INSERT alone for `app_user`
 * (`append-only-ledgers.ts`); a correction is a new entry.
 */
export const activity = pgTable(
  'activity',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id),
    sequence: bigint('sequence', { mode: 'number' }).generatedAlwaysAsIdentity(),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customer.id),
    leadId: uuid('lead_id').references(() => lead.id),
    kind: activityKind('kind').notNull(),
    actorKind: activityActor('actor_kind').notNull(),
    /** A `user_account` id when the actor is a person; null for the system. */
    actorRef: uuid('actor_ref'),
    capturedAt: instant('captured_at').notNull(),
    appliedAt: instant('applied_at').notNull().defaultNow(),
    body: jsonb('body').$type<ActivityBodyEnvelope>().notNull(),
    ...creationKeyColumns(),
  },
  (table) => [
    index('activity_tenant_customer_sequence_idx').on(
      table.tenantId,
      table.customerId,
      table.sequence.desc(),
    ),
    index('activity_tenant_lead_sequence_idx')
      .on(table.tenantId, table.leadId, table.sequence.desc())
      .where(sql`${table.leadId} is not null`),
    uniqueIndex('activity_tenant_creation_key')
      .on(table.tenantId, table.creationKey)
      .where(sql`${table.creationKey} is not null`),
    check(
      'activity_person_is_named',
      sql`${table.actorKind} <> 'person' or ${table.actorRef} is not null`,
    ),
    check('activity_body_is_object', sql`jsonb_typeof(${table.body}) = 'object'`),
  ],
);
