/**
 * `ScopeNote`'s first sentence (`packages/ui`'s `ScopeNoteWords`): whose act it is, composed from
 * the holder's name and the absent acts the caller names — in three languages (`F3-07`).
 */
import type { TranslatedText } from '@heliogrid/contracts';
import type { Translator } from '../runtime';
import { assembled, NO_WORDS } from './assembled';
import { CATALOG_SETTINGS } from './catalog-settings';

export const SCOPE_NOTE = {
  onlyHolder: /*i18n*/ { id: 'Only {holder} can act on this.' },
  onlyHolderCan: /*i18n*/ { id: 'Only {holder} can {acts}.' },
  notYours: /*i18n*/ { id: '{acts} is not yours to take.' },
  twoOr: CATALOG_SETTINGS.schemesJoin,
  listOr: /*i18n*/ { id: '{list} or {last}' },
} as const;

/** "approve pricing, raise an invoice or write off a balance" — the reader's own *or*. */
function joinOr(t: Translator['t'], acts: readonly TranslatedText[]): TranslatedText {
  const [first, second] = acts;
  if (first === undefined) return NO_WORDS;
  if (second === undefined) return first;
  if (acts.length === 2) return t(SCOPE_NOTE.twoOr, { first, second });
  return t(SCOPE_NOTE.listOr, { list: acts.slice(0, -1).join(', '), last: acts[acts.length - 1] });
}

/** A sentence that opens on an act starts with a capital where the language has one. */
function capitalised(sentence: TranslatedText): TranslatedText {
  return assembled(`${sentence.charAt(0).toUpperCase()}${sentence.slice(1)}`);
}

/** The sentences `ScopeNote` composes, named as its `words` takes them. */
export function scopeNoteWords(t: Translator['t']) {
  return {
    onlyHolder: (holder: string, acts: readonly TranslatedText[]): TranslatedText =>
      acts.length === 0
        ? t(SCOPE_NOTE.onlyHolder, { holder })
        : t(SCOPE_NOTE.onlyHolderCan, { holder, acts: joinOr(t, acts) }),
    notYours: (acts: readonly TranslatedText[]): TranslatedText =>
      capitalised(t(SCOPE_NOTE.notYours, { acts: joinOr(t, acts) })),
  };
}
