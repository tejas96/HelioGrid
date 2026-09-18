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
  'team.invite_sent',
  'team.invite_revoked',
  'team.invite_accepted',
  'settings.business_profile_changed',
  'settings.tax_registrations_changed',
  'settings.branding_changed',
  'settings.proposal_template_changed',
  'settings.timeline_template_changed',
  'settings.tranche_template_created',
  'settings.tranche_template_changed',
  'settings.tranche_template_archived',
  'settings.tranche_template_default_changed',
  'settings.holidays_changed',
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
