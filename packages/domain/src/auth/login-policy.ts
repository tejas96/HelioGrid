/**
 * OTP login policy — the behavioural numbers both platforms obey (Law 4, Law 7).
 *
 * Each platform had authored its own copy from the same spec. Where the spec was explicit the
 * two agreed; where it was open they diverged, which is what a duplicated fact always does
 * eventually.
 */

/** Seconds before "Resend code" becomes available again. */
export const RESEND_SECONDS = 30;

/** Spec §5: auto-verify fires this long after the last digit lands (behavioural, not motion). */
export const AUTO_VERIFY_DELAY_MS = 140;

/** Resend attempts after which the "call me instead" offer appears. */
export const CALL_OFFER_AFTER_RESENDS = 2;

/**
 * How long the done step holds before handing off, so "You're signed in" is readable.
 *
 * Spec Q9 leaves this open. Web chose 1400ms and RN chose 900ms; unified here on the longer
 * value because the step exists to be READ and 900ms is short for that. Owner ruling pending
 * (docs/13 UXG-PAR-02) — if 900ms is preferred, this is the one line that changes.
 */
export const DONE_DWELL_MS = 1400;
