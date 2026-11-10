import {
  BUYING_TIMELINES,
  DEAL_SEGMENTS,
  DECISION_MAKERS,
  DISQUALIFY_REASONS,
  LEAD_LIFECYCLE_STATES,
  LEAD_SOURCES,
  LEAD_STAGES,
  LOST_REASONS,
  ROOF_OWNERSHIPS,
  ROOF_TYPES,
  SHADINGS,
} from '@heliogrid/domain';
import { sql } from 'drizzle-orm';
import {
  bigint,
  check,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { uuidv7 } from '../uuid';
import { creationKeyColumns } from './creation-key';
import { customer } from './customer';
import { userAccount } from './identity';
import { tenant } from './tenant';

/** pgEnums hand-mirror domain's tuples (invariant `enum-parity` proves each pair equal). */
export const leadStage = pgEnum('lead_stage', LEAD_STAGES);
export const leadLifecycleState = pgEnum('lead_lifecycle_state', LEAD_LIFECYCLE_STATES);
export const leadSource = pgEnum('lead_source', LEAD_SOURCES);
export const dealSegment = pgEnum('deal_segment', DEAL_SEGMENTS);
export const roofOwnership = pgEnum('roof_ownership', ROOF_OWNERSHIPS);
export const roofType = pgEnum('roof_type', ROOF_TYPES);
export const shading = pgEnum('shading', SHADINGS);
export const buyingTimeline = pgEnum('buying_timeline', BUYING_TIMELINES);
export const decisionMaker = pgEnum('decision_maker', DECISION_MAKERS);
export const disqualifyReason = pgEnum('disqualify_reason', DISQUALIFY_REASONS);
export const lostReason = pgEnum('lost_reason', LOST_REASONS);

const instant = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });
/** `YYYY-MM-DD` on the tenant's clock — the day the 09:00 sweep acts on (`M02-49`). */
const day = (name: string) => date(name, { mode: 'string' });

/**
 * An enquiry or deal (`M02-41`): its customer, where it came from, its segment, the funnel stage and
 * the orthogonal R9 state (null is active), its owner (null is unassigned — not a state, `M02-50`),
 * the bill and the five qualifying answers (`M02-39`, each `assumed`).
 *
 * Only the phone is required at capture (`M02-01`, `M02-03`); the segment is a gap where an imported
 * row carries no type. The bill is the tenant currency's minor unit. A snoozed lead names its wake
 * day and only a lost one names a resurface day. The latest close is domain's `LeadClose` — the
 * terminal state, its reason where it has one, when, by whom — set together and kept through a reopen
 * (`M02-56`), so it is tied to `closed_as`, never to the current state. The counters and
 * `last_activity_at` are written by the act that changes them, so the sweep and every list read one
 * row (decision 7).
 *
 * Tenant-scoped, all four always. SELECT, INSERT and UPDATE for `app_user`; no state ever deletes a
 * lead (`M02-49`).
 */
export const lead = pgTable(
  'lead',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customer.id),
    source: leadSource('source').notNull(),
    segment: dealSegment('segment'),
    stage: leadStage('stage').notNull(),
    lifecycleState: leadLifecycleState('lifecycle_state'),
    ownerUserId: uuid('owner_user_id').references(() => userAccount.id),
    monthlyBillMinor: bigint('monthly_bill_minor', { mode: 'number' }),
    roofOwnership: roofOwnership('roof_ownership'),
    roofType: roofType('roof_type'),
    shading: shading('shading'),
    buyingTimeline: buyingTimeline('buying_timeline'),
    decisionMaker: decisionMaker('decision_maker'),
    /** The "came from" of a referrer who is not a customer (`M02-16`). */
    referredByName: text('referred_by_name'),
    snoozeWakeOn: day('snooze_wake_on'),
    resurfaceOn: day('resurface_on'),
    disqualifyReason: disqualifyReason('disqualify_reason'),
    lostReason: lostReason('lost_reason'),
    /** The terminal state of the latest close: disqualified, lost or junk. */
    closedAs: leadLifecycleState('closed_as'),
    closedAt: instant('closed_at'),
    closedBy: uuid('closed_by').references(() => userAccount.id),
    /** The last day no call task is raised, after a loss for *not interested* (`M02-54`). */
    noCallUntil: day('no_call_until'),
    reopenCount: integer('reopen_count').notNull().default(0),
    /** Failed tries since the last answered call (`M02-43`). */
    unansweredCalls: integer('unanswered_calls').notNull().default(0),
    lastActivityAt: instant('last_activity_at').notNull(),
    /** When the owner was told it sat unassigned past 24 hours — once per lead (`M02-50`). */
    unassignedEscalatedAt: instant('unassigned_escalated_at'),
    /** When the device captured it — shown, never sorted by (`F4-19`). */
    capturedAt: instant('captured_at').notNull(),
    createdAt: instant('created_at').notNull(),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => userAccount.id),
    ...creationKeyColumns(),
  },
  (table) => [
    index('lead_tenant_customer_idx').on(table.tenantId, table.customerId),
    index('lead_tenant_created_idx').on(table.tenantId, table.createdAt.desc()),
    /** The inbox: unassigned active leads, newest first (`M02-23`). */
    index('lead_tenant_inbox_idx')
      .on(table.tenantId, table.createdAt.desc())
      .where(sql`${table.ownerUserId} is null and ${table.lifecycleState} is null`),
    index('lead_tenant_owner_idx').on(
      table.tenantId,
      table.ownerUserId,
      table.lifecycleState,
      table.stage,
    ),
    index('lead_tenant_bill_idx').on(table.tenantId, table.monthlyBillMinor),
    /** The sweep's dormant flag (`M02-52`). */
    index('lead_tenant_last_activity_idx').on(table.tenantId, table.lastActivityAt),
    index('lead_tenant_snooze_wake_idx')
      .on(table.tenantId, table.snoozeWakeOn)
      .where(sql`${table.snoozeWakeOn} is not null`),
    index('lead_tenant_resurface_idx')
      .on(table.tenantId, table.resurfaceOn)
      .where(sql`${table.resurfaceOn} is not null`),
    uniqueIndex('lead_tenant_creation_key')
      .on(table.tenantId, table.creationKey)
      .where(sql`${table.creationKey} is not null`),
    check('lead_bill_not_negative', sql`${table.monthlyBillMinor} >= 0`),
    check(
      'lead_counts_not_negative',
      sql`${table.reopenCount} >= 0 and ${table.unansweredCalls} >= 0`,
    ),
    // `is not distinct from`: an active lead's null state would turn `=` into a null CHECK, which passes.
    check(
      'lead_snoozed_has_wake_date',
      sql`(${table.lifecycleState} is not distinct from 'snoozed') = (${table.snoozeWakeOn} is not null)`,
    ),
    check(
      'lead_resurfaces_only_when_lost',
      sql`${table.resurfaceOn} is null or ${table.lifecycleState} is not distinct from 'lost'`,
    ),
    check(
      'lead_close_is_whole',
      sql`(${table.closedAs} is null or ${table.closedAs} in ('disqualified', 'lost', 'junk')) and (${table.closedAs} is null) = (${table.closedAt} is null) and (${table.closedAt} is null) = (${table.closedBy} is null) and (${table.closedAs} is not distinct from 'disqualified') = (${table.disqualifyReason} is not null) and (${table.closedAs} is not distinct from 'lost') = (${table.lostReason} is not null)`,
    ),
  ],
);

/**
 * A referring customer linked to the lead they sent (`M02-16`), shown on both records. One per lead.
 * Attribution only: no credit, redemption or balance column exists, and none may (`§5`).
 *
 * Tenant-scoped, all four always. SELECT, INSERT and UPDATE for `app_user` (a merge re-points the
 * referrer); never deleted.
 */
export const referral = pgTable(
  'referral',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id),
    referringCustomerId: uuid('referring_customer_id')
      .notNull()
      .references(() => customer.id),
    referredLeadId: uuid('referred_lead_id')
      .notNull()
      .references(() => lead.id),
    createdAt: instant('created_at').notNull(),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => userAccount.id),
  },
  (table) => [
    uniqueIndex('referral_tenant_referred_lead_key').on(table.tenantId, table.referredLeadId),
    index('referral_tenant_referring_customer_idx').on(table.tenantId, table.referringCustomerId),
  ],
);
