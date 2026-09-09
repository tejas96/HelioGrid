import type { RolePreset } from '../authz/roles';

/**
 * What the append-only log records (`F2-22`). The vocabulary is CLOSED to F2-22's covered-events
 * checklist — no analytics event is ever a value here — and it GROWS with the slice that performs
 * the act (Law 9): a module appends its own value, and its own pgEnum step, when its transition
 * lands. A readonly tuple, so contracts derives its `z.enum` and the migration mirrors the pgEnum
 * from this one list.
 */
export const AUDIT_EVENT_TYPES = [
  'auth.signed_in',
  'auth.signed_out',
  'auth.signed_out_everywhere',
  'team.roles_changed',
  'team.member_deactivated',
] as const;
export type AuditEventType = (typeof AUDIT_EVENT_TYPES)[number];

/**
 * Who acted (`F2-24`). Both kinds are a `user_account` — the one identity table for every human —
 * so platform staff are simply an account holding no membership in the tenant whose log the entry
 * sits in, and the entry's own tenant says whose log that is.
 */
export const AUDIT_ACTOR_KINDS = ['tenant_user', 'platform_staff'] as const;
export type AuditActorKind = (typeof AUDIT_ACTOR_KINDS)[number];

/**
 * What was acted upon — the kind half of the suite's one polymorphic pointer (`F2-22`, `F6-02`),
 * which `notification` and `file` read when they land. An audit entry records the subject as it
 * WAS and is never re-pointed; only the kinds a landed act can name are listed.
 */
export const AUDIT_SUBJECT_KINDS = ['user_account', 'tenant_membership'] as const;
export type AuditSubjectKind = (typeof AUDIT_SUBJECT_KINDS)[number];

/**
 * The change one entry records, old → new (`F2-22`). One shape exists today — the presets a
 * person held before and after — and a slice whose event changes something else widens this into
 * a union discriminated on the event type. An act that changes nothing beyond what its own name
 * says carries null.
 */
export interface AuditRoleSetChange {
  readonly from: readonly RolePreset[];
  readonly to: readonly RolePreset[];
}
export type AuditChangePayload = AuditRoleSetChange;
