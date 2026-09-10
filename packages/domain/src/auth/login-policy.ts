/**
 * OTP login policy — the behavioural numbers both platforms obey. One definition, held
 * in parity across web and RN (Law 7).
 */

/** Seconds before "Resend code" becomes available again (`M01-04`, the ruled 30 s). */
export const RESEND_SECONDS = 30;

/**
 * How long the success beat holds before handing off to the home, so "You are in" is READ on a
 * slow hand-off — a silent beat is indistinguishable from a stall. One value for both platforms
 * (`SCR-M01-01` decision 6, the brief's 1.2 s). Changing the dwell changes this line and nothing else.
 */
export const DONE_DWELL_MS = 1200;

const MS_PER_SECOND = 1_000;

/** How often the door re-reads the clock while the gap runs — the sentence counts in seconds. */
export const COUNTDOWN_TICK_MS = MS_PER_SECOND;

/** The instant a resend opens after a send answered at `sentAt` — the device's clock, never the server's. */
export function resendOpensAt(sentAt: number): number {
  return sentAt + RESEND_SECONDS * MS_PER_SECOND;
}

/**
 * Whole seconds until `opensAt`, rounded UP so the sentence never reads 0 while the gap still
 * runs; 0 once it is open, and 0 when no gap runs at all.
 */
export function resendSecondsLeft(opensAt: number | null, now: number): number {
  if (opensAt === null) return 0;
  return Math.max(0, Math.ceil((opensAt - now) / MS_PER_SECOND));
}
