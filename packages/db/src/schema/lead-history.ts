import { LEAD_MOVE_KINDS, TRANSITION_CAUSES } from '@heliogrid/domain';
import { sql } from 'drizzle-orm';
import { check, index, integer, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { uuidv7 } from '../uuid';
import { userAccount } from './identity';
import { lead, leadLifecycleState, leadStage } from './lead';
import { tenant } from './tenant';

/** pgEnums hand-mirror domain's tuples (invariant `enum-parity` proves each pair equal). */
export const leadMoveKind = pgEnum('lead_move_kind', LEAD_MOVE_KINDS);
export const transitionCause = pgEnum('transition_cause', TRANSITION_CAUSES);

const instant = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

/**
 * One move of a lead's funnel or its R9 state — domain's `LeadTransition`, a row each. `move_kind`
 * says which machine moved and only that machine's pair is set, typed by its own enum: a funnel move
 * names both stages, an R9 move the state before and after (null is active). M13's time-in-stage
 * reads the funnel rows alone, so a parking spell never counts as a stage (`M13-22`, `M13-24`); a
 * reopen is a new row, never a rewrite of the close (`M02-56`). `moved_by` is null for the sweep.
 *
 * Tenant-scoped, all four always, and APPEND-ONLY: SELECT and INSERT alone for `app_user`
 * (`append-only-ledgers.ts`).
 */
export const leadStageTransition = pgTable(
  'lead_stage_transition',
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
    moveKind: leadMoveKind('move_kind').notNull(),
    fromStage: leadStage('from_stage'),
    toStage: leadStage('to_stage'),
    fromState: leadLifecycleState('from_state'),
    toState: leadLifecycleState('to_state'),
    cause: transitionCause('cause').notNull(),
    movedAt: instant('moved_at').notNull(),
    movedBy: uuid('moved_by').references(() => userAccount.id),
  },
  (table) => [
    index('lead_stage_transition_tenant_lead_idx').on(table.tenantId, table.leadId, table.movedAt),
    check(
      'lead_stage_transition_moves_its_own_pair',
      sql`(${table.moveKind} = 'funnel_stage' and ${table.fromStage} is not null and ${table.toStage} is not null and ${table.fromStage} <> ${table.toStage} and ${table.fromState} is null and ${table.toState} is null) or (${table.moveKind} = 'lifecycle_state' and ${table.fromStage} is null and ${table.toStage} is null and ${table.fromState} is distinct from ${table.toState})`,
    ),
  ],
);

/**
 * One assignment of a lead (`M02-30`): who gave it to whom, when, and the assignee's open count at
 * that moment; a reassignment carries its reason.
 *
 * Tenant-scoped, all four always, and APPEND-ONLY: SELECT and INSERT alone for `app_user`
 * (`append-only-ledgers.ts`).
 */
export const leadAssignment = pgTable(
  'lead_assignment',
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
    assignedTo: uuid('assigned_to')
      .notNull()
      .references(() => userAccount.id),
    assignedBy: uuid('assigned_by')
      .notNull()
      .references(() => userAccount.id),
    assignedAt: instant('assigned_at').notNull(),
    openCountSnapshot: integer('open_count_snapshot').notNull(),
    reason: text('reason'),
  },
  (table) => [
    index('lead_assignment_tenant_lead_idx').on(table.tenantId, table.leadId, table.assignedAt),
    check('lead_assignment_open_count_not_negative', sql`${table.openCountSnapshot} >= 0`),
  ],
);
