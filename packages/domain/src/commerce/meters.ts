/**
 * The canonical meter set — five meters, a closed list (`BM-16`). These are the only usage lines a
 * tenant can ever be billed for, and the list is closed so that "what can this cost me?" has one
 * answer a salesperson can say out loud.
 *
 * OTP delivery and the field-location ingestion behind check-in/out are ABSORBED costs (`BM-24`):
 * measured internally for cost visibility, never metered to the tenant. Neither is a member here,
 * and adding one would put a bill on something the product promised to swallow.
 *
 * Every meter is sold one way (`BM-17`): a bundle allowance per tier, then a published per-unit
 * overage. The allowances are `TierCapacity`'s shape; the sizes and the rates are the market
 * book's (`T-FCORE-010`), never a constant here.
 *
 * `marketing_sends` and `tracked_field_seats` are the two V2 meters. They are named here because
 * a ledger and a report must be able to name them, but the IN book's rates for both are owner
 * DRAFTS pending rate-card verification (`BM-26`, `BM-41`) — a meter that exists and cannot yet
 * be sold.
 *
 * `tracked_field_seats` is the ONE place this product counts people (`BM-22`, `OV-30`). No other
 * capability is ever priced per seat, and check-in/out and visit logging never need a seat
 * (`BM-23`).
 */
export const METERS = [
  'voice_minutes',
  'ai_roof_detections',
  'storage',
  'marketing_sends',
  'tracked_field_seats',
] as const;

export type Meter = (typeof METERS)[number];

/**
 * The one meter that is a standing GAUGE rather than a per-cycle allowance (`BM-20`): storage is
 * measured, not counted, and it is a ceiling a tenant stops at rather than a bundle that runs out
 * into overage. So it carries no per-unit rate, and it never sits in the record of per-cycle
 * bundles — `BM-12` names it as its own capacity kind for exactly this reason.
 *
 * `satisfies Meter` makes renaming the meter a compile error here. Spelling the name in an
 * `Exclude<…>` directly would silently widen back to the full set instead.
 */
export const STANDING_METER = 'storage' satisfies Meter;
