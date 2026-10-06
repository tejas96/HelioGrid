import { sql } from 'drizzle-orm';
import { index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { tenant } from './tenant';

/**
 * A workflow input, stored as written: ids only (`infra/temporal/README.md` §4 — history is kept
 * 30 days and readable by any operator). Its workflow's contract parses it at dispatch, the one
 * place its shape is known.
 */
export type OutboxPayload = Readonly<Record<string, unknown>>;

/**
 * The orchestration outbox (`infra/temporal/README.md` §5): an event written in the SAME
 * transaction as the product change it hands off, so the change and its handoff commit together
 * or not at all. The row id IS the event id, and the workflow id is derived from it, so a
 * dispatcher that retries after a crash joins the run it already started.
 *
 * Tenant-scoped, all four always, and append-only for `app_user` — SELECT and INSERT alone. The
 * dispatcher reads and marks rows on the admin path; a tenant session never marks one.
 */
export const orchestrationOutbox = pgTable(
  'orchestration_outbox',
  {
    /** Minted by the caller, because the workflow input it is written with already names it. */
    id: uuid('id').primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id),
    /** The workflow's permanent type name (`@heliogrid/contracts/workflows`). */
    workflow: text('workflow').notNull(),
    payload: jsonb('payload').$type<OutboxPayload>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
    dispatchedAt: timestamp('dispatched_at', { withTimezone: true, mode: 'date' }),
  },
  (table) => [
    index('orchestration_outbox_tenant_created_idx').on(table.tenantId, table.createdAt),
    // The sweep's read: undispatched events, oldest first. Partial, so it stays as small as the
    // backlog rather than growing with every event ever written.
    index('orchestration_outbox_undispatched_idx')
      .on(table.createdAt)
      .where(sql`${table.dispatchedAt} is null`),
  ],
);
