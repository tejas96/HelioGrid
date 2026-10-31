/**
 * What a record points AT — the kind half of the suite's ONE polymorphic pointer (`F2-22`,
 * `F6-02`). Every table naming a subject reads this union and declares no second one: the audit
 * entry that records the subject as it WAS, and the notification that deep-links to it.
 *
 * A readonly tuple, so contracts derives its `z.enum` and the migration mirrors the pgEnum from
 * this one list. The union GROWS with the slice that lands the row it names (Law 9) — a kind no
 * table holds yet is a pointer nothing can write.
 */
export const SUBJECT_KINDS = [
  'user_account',
  'tenant_membership',
  'invitation',
  'business_profile',
  'branding_settings',
  'proposal_template_settings',
  'timeline_template',
  'tranche_template',
  /** The tenant itself, for a setting that is a whole list rather than a row — its holidays. */
  'tenant',
  /** A tenant's own SKU (`M01-36`); the platform item an override or a rate names; a release (`M01-43`). */
  'tenant_catalog_item',
  'catalog_item',
  'catalog_release',
  /** One immutable set of a tenant's non-catalog rates (`M01-48`). */
  'price_book_version',
  /** A company's catalog as a whole — what a supplier's price list is stored against (`M01-41`). */
  'catalog',
  /** Support's audited grant on a company's limits or trial (`M12-19`). */
  'entitlement_override',
  /** One fired notice of the dunning ladder or a trial nudge (`M12-39`, `M12-42`). */
  'dunning_event',
  /** One platform invoice — what its PDF's file row is stored against (`M12-44`). */
  'subscription_invoice',
] as const;
export type SubjectKind = (typeof SUBJECT_KINDS)[number];
