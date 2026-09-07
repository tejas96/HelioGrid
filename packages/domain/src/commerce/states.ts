/**
 * The billing-state vocabulary — six names, fixed (`BM-33`). This is the interface `M12`'s
 * lifecycle machine implements and `M13`'s reporting segments by. The transitions, the timers,
 * the dunning and the reactivation are `M12`'s; none of them is here, and a seventh name invented
 * by a screen is a defect against this list.
 *
 * What each name carries, so a reader does not go hunting: `past_due` is a 7-day grace in two
 * phases — days 0–3 full function behind a banner, days 4–7 metered features paused; `expired` is
 * a trial that ended unconverted and behaves exactly as `halted`; `cancelled` runs to the end of
 * the paid period and then behaves as `halted`.
 *
 * Six names are ENOUGH because no state ever stops a tenant reading, exporting, opening a billing
 * screen, or their own customer opening a link — the soft-block law and its capability matrix
 * (`BM-32`, `BM-35`, `T-FCORE-014`). The vocabulary is what a state is called; the matrix is what
 * it costs you.
 */
export const BILLING_STATES = [
  'trialing',
  'active',
  'past_due',
  'halted',
  'expired',
  'cancelled',
] as const;

export type BillingState = (typeof BILLING_STATES)[number];
