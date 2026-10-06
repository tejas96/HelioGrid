import { type Db, type OutboxPayload, orchestrationOutbox } from '@heliogrid/db';
import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, inArray, isNull, lt, sql } from 'drizzle-orm';
import { ADMIN_DB } from '../db/admin.token';

/** One event still waiting for its workflow. */
export interface PendingOutboxEvent {
  readonly id: string;
  readonly workflow: string;
  readonly payload: OutboxPayload;
}

const PENDING_EVENT = {
  id: orchestrationOutbox.id,
  workflow: orchestrationOutbox.workflow,
  payload: orchestrationOutbox.payload,
};

/**
 * The dispatcher's side of the outbox: it crosses tenants, because one sweep serves every company,
 * and it is the only writer of `dispatched_at` — `app_user` holds SELECT and INSERT alone.
 */
@Injectable()
export class OutboxAdminRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(ADMIN_DB) private readonly db: Db) {}

  async pending(eventId: string): Promise<PendingOutboxEvent | undefined> {
    const [event] = await this.db
      .select(PENDING_EVENT)
      .from(orchestrationOutbox)
      .where(and(eq(orchestrationOutbox.id, eventId), isNull(orchestrationOutbox.dispatchedAt)));
    return event;
  }

  /**
   * The oldest undispatched events older than the grace, of the workflows named — the partial
   * index's own read.
   */
  async due(
    graceSeconds: number,
    limit: number,
    workflows: readonly string[],
  ): Promise<PendingOutboxEvent[]> {
    return this.db
      .select(PENDING_EVENT)
      .from(orchestrationOutbox)
      .where(
        and(
          isNull(orchestrationOutbox.dispatchedAt),
          inArray(orchestrationOutbox.workflow, [...workflows]),
          lt(orchestrationOutbox.createdAt, sql`now() - make_interval(secs => ${graceSeconds})`),
        ),
      )
      .orderBy(asc(orchestrationOutbox.createdAt))
      .limit(limit);
  }

  async markDispatched(eventId: string): Promise<void> {
    await this.db
      .update(orchestrationOutbox)
      .set({ dispatchedAt: sql`now()` })
      .where(and(eq(orchestrationOutbox.id, eventId), isNull(orchestrationOutbox.dispatchedAt)));
  }
}
