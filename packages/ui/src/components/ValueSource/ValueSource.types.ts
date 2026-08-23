/**
 * `own` — the tenant's own item supplied it: one value, and it is **theirs**. `inherited` — the
 * override is sparse and this field fell through to the platform item (`M01-37`): one value, and it
 * is **not theirs**. `unmarked` renders nothing **and records that the absence is deliberate**, the
 * same distinction `Provenance` draws.
 *
 * There is no `overridden` level: an overridden value is `FieldOverride`'s, and the two slots are
 * mutually exclusive by host.
 */
export type ValueSourceLevel = 'own' | 'inherited' | 'unmarked';

export interface ValueSourceSpec {
  level?: ValueSourceLevel;
  /** Replaces the default word — "Your SKU", "Platform catalogue", "Group price list". */
  layerName?: string;
  /** What it came from, after the word — "Platform catalogue · SKU MP-545". */
  source?: string;
  /** Named in the action's accessible label. */
  fieldName?: string;
  /** `inherited` only — the owner's next move. Attribution carries no other action. */
  onOverride?: () => void;
  overrideLabel?: string;
  /** 12 (default) or 13. Never below 12 — the type floor. */
  size?: number;
}
