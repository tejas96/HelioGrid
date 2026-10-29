import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';
import type { FieldOverrideWords } from './FieldOverride.types';

/* The buttons' words and spoken names, one rule for both halves. A spoken name holds the visible
   words (WCAG 2.5.3) and names the field, so a screen reader hears WHICH field it restores; with
   no field name the visible words are the name. */

const shown = (value: ReactNode) => String(value ?? '');
const absent = (value: ReactNode) => value === undefined || value === null;

/** The take's spoken name — the field and the design's figure it takes. */
export function takeName(
  words: FieldOverrideWords,
  fieldName: TranslatedText | undefined,
  newValue: ReactNode,
): TranslatedText | undefined {
  return fieldName === undefined ? undefined : words.takeSpoken(fieldName, shown(newValue));
}

/**
 * The reset's visible words. Under `stale` it is *Keep mine* and what it keeps is the person's own
 * figure — `autoValue`, the "yours" side; otherwise it names the figure it restores.
 */
export function resetWords(
  words: FieldOverrideWords,
  stale: boolean,
  autoValue: ReactNode,
): TranslatedText {
  if (stale) return words.keepMine;
  return absent(autoValue) ? words.resetToAuto : words.resetTo(shown(autoValue));
}

/** The reset's spoken name — its visible words and the field. */
export function resetName(
  words: FieldOverrideWords,
  stale: boolean,
  fieldName: TranslatedText | undefined,
  autoValue: ReactNode,
): TranslatedText | undefined {
  if (fieldName === undefined) return undefined;
  if (stale) return words.keepMineSpoken(fieldName, shown(autoValue));
  return absent(autoValue)
    ? words.resetToAutoSpoken(fieldName)
    : words.resetToSpoken(shown(autoValue), fieldName);
}
