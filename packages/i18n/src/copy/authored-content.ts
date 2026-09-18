import type { UiLanguage } from '@heliogrid/contracts';
import { LANGUAGE_META } from '../languages';
import type { Translator } from '../runtime';

/**
 * The one sentence a surface carries when it shows a tenant's content in a language the tenant
 * has not written it in (`F3-10`, owner ruling): the original is shown, and the reader is told so.
 * Never a machine translation, never a substitute passed off as the reader's language.
 *
 * The language names are ENDONYMS — English, हिन्दी, मराठी — a proper name read identically in
 * every catalog, the way the picker already shows them; only the sentence around them is copy.
 */
const SHOWN_IN = /*i18n*/ { id: 'Shown in {shown} — not yet written in {requested}.' };

/** Null when the content IS in the reader's language: nothing to say, and the surface draws nothing. */
export function shownInNote(
  translate: Translator['t'],
  shownIn: UiLanguage,
  requested: UiLanguage,
): string | null {
  if (shownIn === requested) return null;
  return translate(SHOWN_IN, {
    shown: LANGUAGE_META[shownIn].endonym,
    requested: LANGUAGE_META[requested].endonym,
  });
}
