/**
 * Phone-OTP protocol constants. They described the WIRE while auth existed and shape the
 * UI now that it does not (owner ruling 2026-08-01, auth removed to greenfield). They live
 * HERE because domain is the bottom layer: when the contract is rebuilt it imports these,
 * which keeps one definition instead of a contract copy and a screen copy that drift.
 */
export const OTP_LENGTH = 6;
/** Seconds. Surfaced so client countdowns cannot disagree with the issuer. */
export const OTP_EXPIRY_SECONDS = 300;
/**
 * India NSN length behind `+91`. India-first, global-ready: when a second market lands,
 * this pair becomes market config injected at the edge — it stays ONE definition either way.
 */
export const PHONE_NSN_LENGTH = 10;
export const COUNTRY_CALLING_CODE = '+91';
