/**
 * Phone-OTP protocol constants. They described the WIRE while auth existed and shape the
 * UI now that it does not (owner ruling 2026-08-01, auth removed to greenfield). They live
 * HERE because domain is the bottom layer: when the contract is rebuilt it imports these,
 * which keeps one definition instead of a contract copy and a screen copy that drift.
 *
 * The phone pair that used to sit beside them — the `+91` calling code and the 10-digit
 * national length — is a MARKET fact, not a protocol one, and moved into `pack.formats`
 * (`format/pack.ts`, `F1-49`) when the format slice landed. Read `IN_FORMATS.phone`.
 */
export const OTP_LENGTH = 6;
/** Seconds. Surfaced so client countdowns cannot disagree with the issuer. */
export const OTP_EXPIRY_SECONDS = 300;
