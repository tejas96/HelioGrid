import {
  AUDIT_ACTOR_KINDS,
  AUDIT_EVENT_TYPES,
  AUDIT_SUBJECT_KINDS,
  type AuditChangePayload,
} from '@heliogrid/domain';
import { boolean, index, jsonb, pgEnum, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { uuidv7 } from '../uuid';
import { tenant } from './tenant';

/** pgEnums hand-mirror domain's tuples (`M17` proves each pair equal). */
export const auditEventType = pgEnum('audit_event_type', AUDIT_EVENT_TYPES);
export const auditActorKind = pgEnum('audit_actor_kind', AUDIT_ACTOR_KINDS);
export const auditSubjectKind = pgEnum('audit_subject_kind', AUDIT_SUBJECT_KINDS);

const instant = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

/**
 * The tenant's own append-only record of what the product performed (`F2-22`, `F2-23`): who,
 * what, when — and whether the act was refused. Every entry is written inside the transaction
 * that caused it, never reconstructed afterwards.
 *
 * Tenant-scoped, all four always, and the grants are SELECT and INSERT ALONE: no UPDATE and no
 * DELETE exists for any role, so append-only is a privilege rather than a promise.
 *
 * `actor_ref` and `subject_ref` carry NO foreign key. An entry outlives the row it records —
 * attribution survives a deactivation forever (`F2-20`) — and a platform-staff actor holds no
 * membership in the tenant whose log they appear in (`F2-24`). It is never re-pointed: a merge
 * is itself an entry.
 */
export const auditLogEntry = pgTable(
  'audit_log_entry',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id),
    eventType: auditEventType('event_type').notNull(),
    actorKind: auditActorKind('actor_kind').notNull(),
    /** A `user_account` id for both kinds — one identity table for every human (`F2-24`). */
    actorRef: uuid('actor_ref').notNull(),
    occurredAt: instant('occurred_at').notNull(),
    /** The act was REFUSED — the blocked guard-rail attempts F2-22's checklist names (`F2-19`). */
    blocked: boolean('blocked').notNull(),
    subjectKind: auditSubjectKind('subject_kind').notNull(),
    subjectRef: uuid('subject_ref').notNull(),
    /** Old → new, as its ENVELOPE; the whole is parsed in `domain`. Null when the event name is the whole change. */
    changePayload: jsonb('change_payload').$type<AuditChangePayload>(),
  },
  (table) => [
    /** The listing and the tenant's own export, newest first. */
    index('audit_log_entry_tenant_occurred_idx').on(table.tenantId, table.occurredAt.desc()),
  ],
);
