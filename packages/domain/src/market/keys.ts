/**
 * The eight pack keys, the suite-wide interface (`F1-02`). A module that needs a market fact
 * names the key that supplies it and reads it off the pack. It never names a market's own
 * terms, and it never holds the fact as a module-level constant (`F1-01`).
 *
 * The set is CLOSED. §F1.2 partitions the market surface across exactly these eight with no
 * ninth key; demo content is pack CONTENT, not a key, and arrives with
 * `M01-27`. PRD order, so a reader checks this list against §F1.2 top to bottom.
 *
 * Spelled as the pack's property names: the PRD writes `pack.calling-rules`, this package
 * reads `pack.callingRules`. Suite-internal identifiers, never user-facing copy.
 */
export const PACK_KEYS = [
  'tax',
  'subsidy',
  'callingRules',
  'paymentRails',
  'certificationSchemes',
  'formats',
  'dataRights',
  'priceBook',
] as const;

export type PackKey = (typeof PACK_KEYS)[number];

export type TenantReadableKey = Exclude<PackKey, 'priceBook'>;

/**
 * What a tenant-facing read serves: every key but the book, whose interior — worst-case unit
 * COGS, benchmark provenance — is owner-only and reaches the billing path alone (`F1-25`,
 * `BM-17`). Derived from `PACK_KEYS`, so the contract, the read and the projection share one
 * list and a ninth key is served the day it is authored.
 */
export const TENANT_READABLE_KEYS: readonly TenantReadableKey[] = PACK_KEYS.filter(
  (key): key is TenantReadableKey => key !== 'priceBook',
);
