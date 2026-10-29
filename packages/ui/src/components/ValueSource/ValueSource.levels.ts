/* ValueSource — WHICH LAYER SUPPLIED THIS VALUE. A separate slot from FieldOverride, on purpose.

   M01-32 fixes the resolution order — tenant override → tenant own item → platform item — and
   M01-37 makes the override SPARSE, so an unset field falls through to the platform value. Three
   fields side by side on one rates panel can therefore be:
     · overridden          — two values. FieldOverride already says this, completely.
     · tenant's own SKU    — ONE value, and it is theirs.
     · fallen through      — ONE value, and it is NOT theirs.

   `level="unmarked"` renders nothing AND RECORDS THAT THE ABSENCE IS DELIBERATE, the same
   distinction Provenance draws. */

import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';
import { isValidElement } from 'react';
import type { ShellGlyphName } from '../AppShell/AppShell.types';
import type { ValueSourceLevel, ValueSourceSpec } from './ValueSource.types';

export interface ValueSourceLevelEntry {
  /** `inherited` gets the two-plane layers glyph; `own` the single plane. */
  glyph: 'own' | 'inherited';
}

export const VALUE_SOURCE_LEVELS: Record<'own' | 'inherited', ValueSourceLevelEntry> = {
  own: { glyph: 'own' },
  inherited: { glyph: 'inherited' },
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

/** The two-plane layers for an inherited value, the single plane for the tenant's own. */
export const VALUE_SOURCE_GLYPH: Record<ValueSourceLevelEntry['glyph'], ShellGlyphName> = {
  own: 'layer',
  inherited: 'layers',
};

/**
 * The override act an inherited value offers, when its handler and words are given. Its spoken
 * name adds the field — "Override: Module price" — when there is one to name.
 */
export function overrideActOf({
  level,
  onOverride,
  overrideLabel,
  fieldName,
}: Pick<ValueSourceSpec, 'level' | 'onOverride' | 'overrideLabel' | 'fieldName'>): {
  onOverride: () => void;
  label: TranslatedText;
  spokenName: string | undefined;
} | null {
  if (level !== 'inherited' || !onOverride || !overrideLabel) {
    return null;
  }
  return {
    onOverride,
    label: overrideLabel,
    spokenName: fieldName ? `${overrideLabel}: ${fieldName}` : undefined,
  };
}

/**
 * What an `attribution` host prop draws: a ready node as it is, a spec through `draw`, or nothing.
 * A bare level names no layer, and a layer's word is the caller's, so it draws nothing: the words
 * come in a spec.
 */
export function attributionFor(
  spec: ValueSourceSpec | ValueSourceLevel | ReactNode,
  draw: (spec: ValueSourceSpec) => ReactNode,
): ReactNode {
  if (!spec) {
    return null;
  }
  if (isValidElement(spec)) {
    return spec;
  }
  if (typeof spec !== 'object') {
    return null;
  }
  return draw(spec as ValueSourceSpec);
}
