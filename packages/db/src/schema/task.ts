import { TASK_KINDS, TASK_PROVENANCES, TASK_STATUSES } from '@heliogrid/domain';
import { sql } from 'drizzle-orm';
import {
  check,
  index,
  pgEnum,
  pgTable,
  text,
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
export const taskKind = pgEnum('task_kind', TASK_KINDS);
export const taskStatus = pgEnum('task_status', TASK_STATUSES);
export const taskProvenance = pgEnum('task_provenance', TASK_PROVENANCES);

const instant = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

/**
 * A follow-up task (`M07-05`): an assignee, a kind, a due time and a status; overdue is derived from
 * the due time on an open task and never stored. An automatic task names the rule that raised it and
 * lands on a named person, never a pool (`M07-06`); a manual task names who raised it, and a custom
 * one carries its own words. A task may stand on a lead or alone.
 *
 * Tenant-scoped, all four always. SELECT, INSERT and UPDATE for `app_user`; a cancelled task is kept.
 */
export const task = pgTable(
  'task',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id),
    leadId: uuid('lead_id').references(() => lead.id),
    assigneeUserId: uuid('assignee_user_id')
      .notNull()
      .references(() => userAccount.id),
    kind: taskKind('kind').notNull(),
    /** What a custom task asks, in the person's words. */
    title: text('title'),
    dueAt: instant('due_at').notNull(),
    status: taskStatus('status').notNull(),
    provenance: taskProvenance('provenance').notNull(),
    createdAt: instant('created_at').notNull(),
    /** Null when a rule raised it with no person's act behind it (the sweep's wake, a resurface). */
    createdBy: uuid('created_by').references(() => userAccount.id),
    doneAt: instant('done_at'),
    doneBy: uuid('done_by').references(() => userAccount.id),
    ...creationKeyColumns(),
  },
  (table) => [
    /** A person's open tasks by due time — the picker's overdue count reads it (`M02-28`). */
    index('task_tenant_assignee_status_due_idx').on(
      table.tenantId,
      table.assigneeUserId,
      table.status,
      table.dueAt,
    ),
    index('task_tenant_lead_idx')
      .on(table.tenantId, table.leadId)
      .where(sql`${table.leadId} is not null`),
    uniqueIndex('task_tenant_creation_key')
      .on(table.tenantId, table.creationKey)
      .where(sql`${table.creationKey} is not null`),
    check(
      'task_manual_names_its_raiser',
      sql`${table.provenance} <> 'manual' or ${table.createdBy} is not null`,
    ),
    // `coalesce`: a null title would make the length null, and a null CHECK passes.
    check(
      'task_custom_has_words',
      sql`${table.kind} <> 'custom' or coalesce(char_length(btrim(${table.title})), 0) >= 1`,
    ),
    check('task_done_has_moment', sql`(${table.status} = 'done') = (${table.doneAt} is not null)`),
  ],
);
