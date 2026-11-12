/**
 * The payments vocabulary (`M11`): a part of the price (a tranche) and what it can be, the two
 * kinds of ledger entry, and why an act on them is refused. The customer pays the company
 * straight; a person records it (owner ruling 2026-11-11), so there is no link and no
 * confirmation state anywhere in it.
 */

/** `M11-10`: read from the ledger and the stage history, never typed. `waived` is terminal. */
export const TRANCHE_STATES = ['upcoming', 'due', 'part_received', 'received', 'waived'] as const;
export type TrancheState = (typeof TRANCHE_STATES)[number];

/** `M11-40`, `M11-46`: a payment adds money; a reversal points at one and takes it back. */
export const PAYMENT_ENTRY_KINDS = ['payment', 'reversal'] as const;
export type PaymentEntryKind = (typeof PAYMENT_ENTRY_KINDS)[number];

/**
 * Where a schedule's parts came from: the company's payment terms at Mark won, until proposals
 * land and an accepted version's terms take over (ruling 2026-11-10).
 */
export const SCHEDULE_SOURCES = ['payment_terms', 'proposal_version'] as const;
export type ScheduleSource = (typeof SCHEDULE_SOURCES)[number];

/** Why a money act is refused — each one a sentence the person reads. */
export const PAYMENT_REFUSALS = [
  /** `M11-38`: money that arrived is more than zero; a mistake is a reversal. */
  'amount_not_positive',
  /** A waived part takes no more money (`M11-49`). */
  'tranche_waived',
  /** The same UTR or cheque number is already on a receipt that stands. */
  'reference_used',
  /** The mode is not one the company's market declares (`M11-35`). */
  'mode_unknown',
  /** This payment was reversed already. */
  'already_reversed',
  /** Only a payment is reversed; a reversal is never reversed again. */
  'not_a_payment',
  /** A fully received part has nothing left to waive. */
  'tranche_received',
  /** Reverse and waive say why (`M11-46`, `M11-49`). */
  'reason_needed',
  /** The received day is in the future. */
  'date_in_future',
] as const;
export type PaymentRefusal = (typeof PAYMENT_REFUSALS)[number];

/** The longest reason a person types for a reversal or a waiver. */
export const PAYMENT_REASON_LIMIT = 500;

/** The longest reference (UTR, cheque number) a person types. */
export const PAYMENT_REFERENCE_LIMIT = 40;
