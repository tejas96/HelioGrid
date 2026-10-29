/**
 * The `FieldOverride` line's own words (`packages/ui`'s `FieldOverrideWords`): the marker, the
 * superseded value's words and the two buttons with their whole spoken names — so an overridden
 * field reads in the language around it (`F3-07`). A figure arrives already formatted; a field's
 * name is its label.
 */
import type { Translator } from '../runtime';

const FIELD_OVERRIDE = {
  edited: /*i18n*/ { id: 'Edited' },
  designMovedOn: /*i18n*/ { id: 'Design moved on' },
  was: /*i18n*/ { id: 'was' },
  yours: /*i18n*/ { id: 'yours' },
  designNow: /*i18n*/ { id: 'design now' },
  from: /*i18n*/ { id: 'from {source}' },
  take: /*i18n*/ { id: 'Take the new value' },
  takeSpoken: /*i18n*/ { id: 'Take the new value for {field}: {value}' },
  keepMine: /*i18n*/ { id: 'Keep mine' },
  keepMineSpoken: /*i18n*/ { id: 'Keep mine — {field} stays {value}' },
  resetToAuto: /*i18n*/ { id: 'Reset to auto' },
  resetTo: /*i18n*/ { id: 'Reset to {value}' },
  resetToAutoSpoken: /*i18n*/ { id: 'Reset to auto — {field}' },
  resetToSpoken: /*i18n*/ { id: 'Reset to {value} — {field}' },
} as const;

/** Every word `FieldOverride` draws or speaks, in the reader's language. */
export function fieldOverrideWords(t: Translator['t']) {
  return {
    edited: t(FIELD_OVERRIDE.edited),
    designMovedOn: t(FIELD_OVERRIDE.designMovedOn),
    was: t(FIELD_OVERRIDE.was),
    yours: t(FIELD_OVERRIDE.yours),
    designNow: t(FIELD_OVERRIDE.designNow),
    from: (source: string) => t(FIELD_OVERRIDE.from, { source }),
    take: t(FIELD_OVERRIDE.take),
    takeSpoken: (field: string, value: string) => t(FIELD_OVERRIDE.takeSpoken, { field, value }),
    keepMine: t(FIELD_OVERRIDE.keepMine),
    keepMineSpoken: (field: string, value: string) =>
      t(FIELD_OVERRIDE.keepMineSpoken, { field, value }),
    resetToAuto: t(FIELD_OVERRIDE.resetToAuto),
    resetTo: (value: string) => t(FIELD_OVERRIDE.resetTo, { value }),
    resetToAutoSpoken: (field: string) => t(FIELD_OVERRIDE.resetToAutoSpoken, { field }),
    resetToSpoken: (value: string, field: string) =>
      t(FIELD_OVERRIDE.resetToSpoken, { value, field }),
  };
}
