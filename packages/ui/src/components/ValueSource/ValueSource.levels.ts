/* ValueSource — WHICH LAYER SUPPLIED THIS VALUE. A separate slot from FieldOverride, on purpose.

   M01-32 fixes the resolution order — tenant override → tenant own item → platform item — and
   M01-37 makes the override SPARSE, so an unset field falls through to the platform value. Three
   fields side by side on one rates panel can therefore be:
     · overridden          — two values. FieldOverride already says this, completely.
     · tenant's own SKU    — ONE value, and it is theirs.
     · fallen through      — ONE value, and it is NOT theirs.

   `level="unmarked"` renders nothing AND RECORDS THAT THE ABSENCE IS DELIBERATE, the same
   distinction Provenance draws. */

import type { ValueSourceLevel } from './ValueSource.types';

export interface ValueSourceLevelEntry {
  word: string;
  /** `inherited` gets the two-plane layers glyph; `own` the single plane. */
  glyph: 'own' | 'inherited';
}

export const VALUE_SOURCE_LEVELS: Record<'own' | 'inherited', ValueSourceLevelEntry> = {
  own: { word: 'Your value', glyph: 'own' },
  inherited: { word: 'Platform default', glyph: 'inherited' },
};

/** Null when the spec renders nothing — `unmarked`, `none`, or no level at all. */
export function resolveValueSourceLevel(
  level?: ValueSourceLevel | string,
): ValueSourceLevelEntry | null {
  if (!level || level === 'unmarked' || level === 'none') {
    return null;
  }
  return VALUE_SOURCE_LEVELS[level === 'inherited' ? 'inherited' : 'own'];
}

/** The clamped type step. The contract is 12 or 13; never below 12 — the type floor. */
export function valueSourceStep(size: number): 12 | 13 {
  return size >= 13 ? 13 : 12;
}
