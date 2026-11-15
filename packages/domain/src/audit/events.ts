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
  /** A saved cable, electrical or structure part added, changed, archived or restored (`M06-28`). */
  'saved_parts.part_added',
  'saved_parts.part_changed',
  'saved_parts.part_archived',
  'saved_parts.part_restored',
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
  /** A lead closed lost with its reason (`F2-22`'s Won/Lost, `M07-63`). */
  'crm.lead_lost',
  /** A deal marked won — the project it starts is the subject (`F2-22`, `M07-62`). */
  'projects.project_won',
  /** A project cancelled after Won, with its reason (`F2-22`, `M13-04`). */
  'projects.project_cancelled',
  'payments.payment_recorded',
  'payments.payment_reversed',
  'payments.tranche_waived',
  'payments.request_shared',
  'settings.collections_changed',
  /** The company's monthly target set or cleared on the dashboard (`M13-17`). */
  'settings.monthly_target_changed',
  /** A proposal's audited acts (`F2-22`, `M06` §M06.4): generate, a discount with its amount, a version. */
  'proposals.proposal_generated',
  'proposals.discount_applied',
  'proposals.version_created',
  'proposals.proposal_shared',
  'proposals.proposal_withdrawn',
  /** A newer accepted version put in force on the project, with who said the customer agreed (`M08-50`). */
  'proposals.version_put_in_force',
  /** Every act on a customer link (`F5-31`, `F5-79`); the customer's own carry the `customer_link` actor. */
  'customer_link.minted',
  'customer_link.reminted',
  'customer_link.revoked',
  'customer_link.opened',
  'customer_link.accepted',
  'customer_link.negotiation_requested',
  'customer_link.declined',
] as const;
export type AuditEventType = (typeof AUDIT_EVENT_TYPES)[number];

/**
 * Who acted (`F2-24`). The first two kinds are a `user_account` — the one identity table for every
 * human — so platform staff are simply an account holding no membership in the tenant whose log the
 * entry sits in, and the entry's own tenant says whose log that is. `customer_link` is the one actor
 * that is no account: a customer's act is attributed to the link and its contact (`F5-31`), since
 * the customer never has an identity here (`F5-01`).
 */
export const AUDIT_ACTOR_KINDS = ['tenant_user', 'platform_staff', 'customer_link'] as const;
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

/**
 * A proposal's money acts (`F2-22`, `M06-23`): the amount a Generate froze, a discount applied or
 * a version created — in the company's currency, as a decimal, with the version where one exists.
 * The proposal is the entry's subject.
 */
export interface AuditProposalAmount {
  readonly version: number | null;
  readonly amount: string;
  readonly currencyCode: string;
}

export type AuditChangePayload =
  | AuditRoleSetChange
  | AuditCustomerMerge
  | AuditDuplicateKept
  | AuditProposalAmount;
