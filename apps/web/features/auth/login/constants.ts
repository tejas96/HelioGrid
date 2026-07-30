export const RESEND_SECONDS = 30;
export const CALL_OFFER_AFTER_RESENDS = 2;
/** Spec §5: auto-verify fires 140ms after the 6th digit lands (behavioural, not motion). */
export const AUTO_VERIFY_DELAY_MS = 140;
/** Spec Q9 leaves the done-step dwell open — brief beat so "You're signed in" registers. */
export const DONE_REDIRECT_DWELL_MS = 1400;
