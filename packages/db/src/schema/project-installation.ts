import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { uuidv7 } from '../uuid';
import { userAccount } from './identity';
import { project } from './project';
import { tenant } from './tenant';

const instant = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

/**
 * One installation step (`M08-41`, `M08-42`): seeded from the pack, ticked by a named person, with
 * an optional free-text "done by" for who did the work.
 *
 * Tenant-scoped, all four always: SELECT, INSERT and UPDATE for `app_user`.
 */
export const projectInstallStep = pgTable(
  'project_install_step',
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
    stepKey: text('step_key').notNull(),
    position: integer('position').notNull(),
    tickedAt: instant('ticked_at'),
    tickedBy: uuid('ticked_by').references(() => userAccount.id),
    doneBy: text('done_by'),
  },
  (table) => [
    uniqueIndex('project_install_step_tenant_project_step_key').on(
      table.tenantId,
      table.projectId,
      table.stepKey,
    ),
    check(
      'project_install_step_tick_is_whole',
      sql`(${table.tickedAt} is null) = (${table.tickedBy} is null)`,
    ),
  ],
);

/**
 * The crew on a project (ruling 2026-11-10): picked when it is dispatched, and the installers'
 * whole reach — an installer sees the jobs naming them and nothing else (`F2-14`).
 *
 * Tenant-scoped, all four always: SELECT, INSERT and DELETE for `app_user` — a new pick replaces
 * the crew.
 */
export const projectCrewMember = pgTable(
  'project_crew_member',
  {
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id),
    projectId: uuid('project_id')
      .notNull()
      .references(() => project.id),
    userId: uuid('user_id')
      .notNull()
      .references(() => userAccount.id),
    addedAt: instant('added_at').notNull(),
    addedBy: uuid('added_by')
      .notNull()
      .references(() => userAccount.id),
  },
  (table) => [
    primaryKey({ name: 'project_crew_member_pkey', columns: [table.projectId, table.userId] }),
    index('project_crew_member_tenant_user_idx').on(table.tenantId, table.userId),
  ],
);
