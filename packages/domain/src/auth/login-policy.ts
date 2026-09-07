/**
 * OTP login policy — the behavioural numbers both platforms obey. One definition, held
 * in parity across web and RN (Law 7).
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
 * How long the done step holds before handing off, so "You're signed in" is readable. One value
 * for both platforms: the step exists to be READ, and a beat too short to read is
 * indistinguishable from a stall. Changing the dwell changes this line and nothing else.
 */
export const DONE_DWELL_MS = 1400;
