import type { RolePreset } from '../authz/roles';
import type { MergeSide } from '../crm/merge-plan';
import type { MergeField } from '../crm/vocabulary';

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
  'settings.tranche_template_restored',
  'settings.tranche_template_default_changed',
  'settings.holidays_changed',
  'catalog.item_created',
  'catalog.item_changed',
  'catalog.item_archived',
  'catalog.item_unarchived',
  'catalog.override_changed',
  'catalog.override_cleared',
  'catalog.rate_recorded',
  'catalog.release_published',
  'price_book.version_published',
  'billing.goodwill_credit_issued',
  'billing.trial_extended',
  'billing.subscription_cancelled',
  'billing.refund_issued',
  'billing.reactivated',
  'billing.plan_changed',
  'billing.plan_change_scheduled',
  'billing.plan_change_withdrawn',
  /** A second lead kept on purpose despite a matching number, with its reason (`M02-12`). */
  'crm.duplicate_kept',
  /** Two customers merged onto a survivor, with every field choice (`M02-61`). */
  'crm.customers_merged',
  'payments.payment_recorded',
  'payments.payment_reversed',
  'payments.tranche_waived',
  'payments.request_shared',
  'settings.collections_changed',
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
 * The change one entry records (`F2-22`), its shape named by the event type: the presets a person
 * held before and after a role change, what a customer merge folded in, or why a duplicate was
 * kept. An act that changes nothing beyond what its own name says carries null.
 */
export interface AuditRoleSetChange {
  readonly from: readonly RolePreset[];
  readonly to: readonly RolePreset[];
}

/**
 * `crm.customers_merged` (`M02-61`): the customer merged away and the side each differing field was
 * taken from. The survivor is the entry's subject.
 */
export interface AuditCustomerMerge {
  readonly mergedId: string;
  readonly choices: readonly { readonly field: MergeField; readonly kept: MergeSide }[];
}

/**
 * `crm.duplicate_kept` (`M02-12`): why the new customer was kept beside the one its number already
 * named — the reason the person gave, and that customer. The new customer is the entry's subject.
 */
export interface AuditDuplicateKept {
  readonly reason: string;
  readonly keptBesideId: string;
}

export type AuditChangePayload = AuditRoleSetChange | AuditCustomerMerge | AuditDuplicateKept;
