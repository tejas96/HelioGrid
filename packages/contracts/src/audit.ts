import { AUDIT_ACTOR_KINDS, AUDIT_EVENT_TYPES, AUDIT_SUBJECT_KINDS } from '@heliogrid/domain';
import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { paginated, paginationQuerySchema, rolePresetSchema, uuidSchema } from './common';
import { baseError, errorEnvelope } from './error';

const c = initContract();

/**
 * The act an entry records (`F2-22`). Built from `AUDIT_EVENT_TYPES` in `@heliogrid/domain`,
 * never restated: the migration mirrors the same tuple as a pgEnum (`M17`), so a value on one
 * side alone is a row the API can never return or a value the database rejects.
 */
export const auditEventTypeSchema = z.enum(AUDIT_EVENT_TYPES);
export type AuditEventType = z.infer<typeof auditEventTypeSchema>;

/** Who acted — a tenant's own person, or platform staff reading that tenant (`F2-24`). */
export const auditActorKindSchema = z.enum(AUDIT_ACTOR_KINDS);
export type AuditActorKind = z.infer<typeof auditActorKindSchema>;

/** What was acted upon: the kind half of the suite's one polymorphic pointer (`F2-22`, `F6-02`). */
export const auditSubjectKindSchema = z.enum(AUDIT_SUBJECT_KINDS);
export type AuditSubjectKind = z.infer<typeof auditSubjectKindSchema>;

/**
 * The change one entry records, old → new (`F2-22`): the presets a person held before and after.
 * An act that changes nothing beyond what its own event name says carries null, and a slice
 * whose event changes something else widens this into a union discriminated on the event type.
 */
export const auditRoleSetChangeSchema = z.object({
  from: z.array(rolePresetSchema),
  to: z.array(rolePresetSchema),
});
export type AuditRoleSetChange = z.infer<typeof auditRoleSetChangeSchema>;

export const auditChangePayloadSchema = auditRoleSetChangeSchema.nullable();
export type AuditChangePayload = z.infer<typeof auditChangePayloadSchema>;

/**
 * One line of the tenant's own append-only record (`F2-22`): who, what, when — and whether the
 * act was refused. `actorRef` and `subjectRef` are ids with no foreign key: an entry outlives
 * the row it records and is never re-pointed, so attribution survives a deactivation forever.
 */
export const auditLogEntrySchema = z.object({
  id: uuidSchema,
  eventType: auditEventTypeSchema,
  actorKind: auditActorKindSchema,
  /** A `user_account` id for BOTH kinds — one identity table for every human (`F2-24`). */
  actorRef: uuidSchema,
  occurredAt: z.string().datetime(),
  /** True when the act was REFUSED (`F2-19`): silence about a blocked act is how lockout disputes become unanswerable. */
  blocked: z.boolean(),
  subjectKind: auditSubjectKindSchema,
  subjectRef: uuidSchema,
  changePayload: auditChangePayloadSchema,
});
export type AuditLogEntry = z.infer<typeof auditLogEntrySchema>;

export const auditContract = c.router({
  entries: {
    method: 'GET',
    path: '/tenants/me/audit-log',
    query: paginationQuerySchema,
    summary:
      "The tenant's own entries, newest first — their data to export, in every billing state",
    responses: {
      200: paginated(auditLogEntrySchema),
      401: errorEnvelope(baseError('UNAUTHENTICATED')),
      403: errorEnvelope(baseError('FORBIDDEN')),
    },
  },
});
