/**
 * Login flow state — the one definition both platforms use, held in parity (Law 7).
 *
 * Each platform had authored its own copy, and they had already drifted: mobile declared
 * `'mismatch' | 'transport'` inline under a comment claiming "web parity" while web declared
 * `'mismatch' | 'verify-failed' | 'resend-failed'`. Two copies of a fact disagree — that is
 * why this lives here rather than in either screen.
 */

/**
 * The steps of the OTP login flow. `switch` is the shared-device step (`F4-37`): a different
 * user verified on a device still holding another user's work, and what will be lost is named
 * before the switch completes. A device holding nothing skips it.
 */
export type LoginStep = 'phone' | 'otp' | 'switch' | 'done';

/**
 * Why an OTP attempt failed.
 * `mismatch` is the INVALID_OTP family (wrong or expired, 4xx). The other two are
 * transport/server failures, kept apart because the copy differs: a failed VERIFY asks the
 * user to try the code again, a failed RESEND asks them to request a new one.
 */
export type OtpFailure = 'mismatch' | 'verify-failed' | 'resend-failed';
