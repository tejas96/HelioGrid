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
] as const;
export type SubjectKind = (typeof SUBJECT_KINDS)[number];
