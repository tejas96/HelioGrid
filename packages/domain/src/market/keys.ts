/**
 * The eight pack keys, the suite-wide interface (`F1-02`). A module that needs a market fact
 * names the key that supplies it and reads it off the pack. It never names a market's own
 * terms, and it never holds the fact as a module-level constant (`F1-01`).
 *
 * The set is CLOSED. §F1.2 partitions the market surface across exactly these eight with no
 * ninth key; demo content (owner ruling `Q19`) is pack CONTENT, not a key, and arrives with
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
