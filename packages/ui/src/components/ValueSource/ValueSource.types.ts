import type { TranslatedText } from '@heliogrid/contracts';

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
  /**
   * The layer's word — "Your SKU", "Platform catalogue", "Group price list" — or a pack's own name
   * ("India market pack"), a fact. Always drawn beside the glyph under `own` and `inherited`, so it
   * is the caller's and required.
   */
  layerName: string;
  /**
   * What it came from, after the word — "Platform catalogue · SKU MP-545". The caller's words or a
   * fact (an id, a person's name), so it stays a string.
   */
  source?: string;
  /** Named in the action's accessible label. */
  fieldName?: TranslatedText;
  /** `inherited` only — the owner's next move. Attribution carries no other action. */
  onOverride?: () => void;
  /** The act's words — "Override for this tenant". The act is drawn only with them. */
  overrideLabel?: TranslatedText;
  /** 12 (default) or 13. Never below 12 — the type floor. */
  size?: number;
}
