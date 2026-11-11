import {
  BLOCKER_CLEARS,
  BLOCKER_PARTIES,
  BLOCKER_REASONS,
  CANCEL_REASONS,
  PROJECT_MOVE_CAUSES,
  PROJECT_STAGES,
} from '@heliogrid/domain';
import { sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  check,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { uuidv7 } from '../uuid';
import { creationKeyColumns } from './creation-key';
import { customer } from './customer';
import { userAccount } from './identity';
import { lead } from './lead';
import { tenant } from './tenant';

/** pgEnums hand-mirror domain's tuples (invariant `enum-parity` proves each pair equal). */
export const projectStage = pgEnum('project_stage', PROJECT_STAGES);
export const projectMoveCause = pgEnum('project_move_cause', PROJECT_MOVE_CAUSES);
export const blockerParty = pgEnum('blocker_party', BLOCKER_PARTIES);
export const blockerReason = pgEnum('blocker_reason', BLOCKER_REASONS);
export const blockerClear = pgEnum('blocker_clear', BLOCKER_CLEARS);
export const projectCancelReason = pgEnum('project_cancel_reason', CANCEL_REASONS);

const instant = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });
const day = (name: string) => date(name, { mode: 'string' });

/**
 * A won deal's delivery (`M08-02`…`M08-05`): created by Mark won in the same transaction, it points
 * at its lead and customer and copies neither. `stage` and `stage_entered_at` are the board's
 * indexed position, rewritten only by the write that appends the move to
 * `project_stage_transition` (`M08-14`). The checklist and steps are seeded once from the pack
 * revision named in `pack_version`; `incentive_applies` is that seeding's answer for the deal.
 *
 * *Mark won* carries its retry key, so a retried send finds the project the first one made (`F4-07`).
 *
 * Tenant-scoped, all four always: SELECT, INSERT and UPDATE for `app_user`. Never deleted
 * (`M08-52`): a mistaken Won is cancelled, with its reason.
 */
export const project = pgTable(
  'project',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id),
    number: integer('number').notNull(),
    leadId: uuid('lead_id')
      .notNull()
      .references(() => lead.id),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customer.id),
    stage: projectStage('stage').notNull(),
    stageEnteredAt: instant('stage_entered_at').notNull(),
    managerId: uuid('manager_id')
      .notNull()
      .references(() => userAccount.id),
    /** Who owned the lead when it was won — the seller's read-only scope (`M08-18`). */
    soldBy: uuid('sold_by').references(() => userAccount.id),
    /** `M07-62`'s promise; past it before Installation, the project asks its manager. */
    expectedInstallOn: day('expected_install_on'),
    /** `M07-62`'s final value, in the company currency's minor unit. */
    finalValueMinor: bigint('final_value_minor', { mode: 'number' }).notNull(),
    packVersion: text('pack_version').notNull(),
    incentiveApplies: boolean('incentive_applies').notNull(),
    /** How the crew gets in (`M08-45`) until the site record exists (M04). */
    accessNote: text('access_note'),
    cancelReason: projectCancelReason('cancel_reason'),
    /** The person's words beside the reason — always there for `something_else`. */
    cancelNote: text('cancel_note'),
    cancelledAt: instant('cancelled_at'),
    cancelledBy: uuid('cancelled_by').references(() => userAccount.id),
    /**
     * How many of the handover pack's files could not be read into it; null until the pack has
     * been made. With none read, the project has no pack, and this is how a screen knows to stop
     * waiting for one.
     */
    packLeftOut: smallint('pack_left_out'),
    createdAt: instant('created_at').notNull(),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => userAccount.id),
    ...creationKeyColumns(),
  },
  (table) => [
    uniqueIndex('project_tenant_number_key').on(table.tenantId, table.number),
    uniqueIndex('project_tenant_creation_key')
      .on(table.tenantId, table.creationKey)
      .where(sql`${table.creationKey} is not null`),
    uniqueIndex('project_tenant_lead_key').on(table.tenantId, table.leadId),
    index('project_tenant_stage_idx').on(table.tenantId, table.stage, table.stageEnteredAt),
    index('project_tenant_manager_idx').on(table.tenantId, table.managerId),
    index('project_tenant_sold_by_idx').on(table.tenantId, table.soldBy),
    check('project_number_positive', sql`${table.number} >= 1`),
    check('project_final_value_positive', sql`${table.finalValueMinor} > 0`),
    check('project_pack_left_out_counts', sql`${table.packLeftOut} >= 0`),
    check(
      'project_cancel_is_whole',
      sql`(${table.stage} = 'cancelled') = (${table.cancelReason} is not null) and (${table.cancelReason} is null) = (${table.cancelledAt} is null) and (${table.cancelledAt} is null) = (${table.cancelledBy} is null)`,
    ),
    check(
      'project_cancel_something_else_is_said',
      sql`${table.cancelReason} is distinct from 'something_else' or ${table.cancelNote} is not null`,
    ),
  ],
);

/**
 * One move of a project (`M08-14`): from where (null for the creation), to where, what
 * moved it and which proof, when and by whom (null for a proof's own move). A backward move is a
 * row with the same weight; an undo is a new row, never a rewrite.
 *
 * Tenant-scoped, all four always, and APPEND-ONLY: SELECT and INSERT alone for `app_user`
 * (`append-only-ledgers.ts`).
 */
export const projectStageTransition = pgTable(
  'project_stage_transition',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id),
    projectId: uuid('project_id')
      .notNull()
      .references(() => project.id),
    fromStage: projectStage('from_stage'),
    toStage: projectStage('to_stage').notNull(),
    cause: projectMoveCause('cause').notNull(),
    proof: text('proof'),
    movedAt: instant('moved_at').notNull(),
    /** The company day the stage began — the day the person gave (Dispatched), else the day moved. */
    enteredOn: day('entered_on').notNull(),
    movedBy: uuid('moved_by').references(() => userAccount.id),
  },
  (table) => [
    index('project_stage_transition_tenant_project_idx').on(
      table.tenantId,
      table.projectId,
      table.movedAt,
    ),
    check(
      'project_stage_transition_moves',
      sql`${table.fromStage} is distinct from ${table.toStage}`,
    ),
  ],
);

/**
 * A wait (`M08-20`…`M08-29`): who the project waits on, the reason class the customer link can say,
 * the internal note it never publishes (`M08-25`), and the company day it began. One is open at a
 * time; ending it records who and how — a person, or the forward move that closed it.
 *
 * Tenant-scoped, all four always: SELECT, INSERT and UPDATE for `app_user`.
 */
export const projectBlocker = pgTable(
  'project_blocker',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id),
    projectId: uuid('project_id')
      .notNull()
      .references(() => project.id),
    party: blockerParty('party').notNull(),
    reason: blockerReason('reason').notNull(),
    note: text('note'),
    startedOn: day('started_on').notNull(),
    expectedUntil: day('expected_until'),
    openedAt: instant('opened_at').notNull(),
    openedBy: uuid('opened_by')
      .notNull()
      .references(() => userAccount.id),
    endedAt: instant('ended_at'),
    endedBy: uuid('ended_by').references(() => userAccount.id),
    endedAs: blockerClear('ended_as'),
  },
  (table) => [
    index('project_blocker_tenant_project_idx').on(table.tenantId, table.projectId, table.openedAt),
    uniqueIndex('project_blocker_one_open')
      .on(table.tenantId, table.projectId)
      .where(sql`${table.endedAt} is null`),
    check(
      'project_blocker_end_is_whole',
      sql`(${table.endedAt} is null) = (${table.endedAs} is null) and (${table.endedAs} is distinct from 'person' or ${table.endedBy} is not null)`,
    ),
  ],
);
