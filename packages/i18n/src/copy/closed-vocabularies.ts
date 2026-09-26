import type { UiLanguage } from '@heliogrid/contracts';
import type { MessageRef, Translator } from '../runtime';
import { PROVENANCE_STANDING_WORD, PROVENANCE_TIER_WORD } from './provenance';

/**
 * The words one surface shows together. Every member of every vocabulary in a group must read as
 * its own word, in every language (`F3-12`) — a tier word equal to a standing word would print one
 * word twice with two meanings on the same label.
 */
export interface ClosedVocabularyGroup {
  readonly surface: string;
  readonly vocabularies: Readonly<Record<string, Readonly<Record<string, MessageRef>>>>;
}

/**
 * Every closed vocabulary with a translated display. A new one joins here: nothing else can tell
 * a vocabulary's display from a screen title, which may repeat on purpose (`copy/homes.ts`).
 */
export const CLOSED_VOCABULARY_GROUPS: readonly ClosedVocabularyGroup[] = [
  {
    surface: 'provenance label',
    vocabularies: { tier: PROVENANCE_TIER_WORD, standing: PROVENANCE_STANDING_WORD },
  },
];

const INVISIBLE_FORMAT_CHARACTER = /\p{Cf}/gu;
const SPACE_RUN = /\s+/gu;

/**
 * A word as a reader sees it: joiners, zero-width spaces and soft hyphens draw nothing, a run of
 * spaces reads as one, and one Devanagari word composed two ways is one word.
 */
export function readerForm(language: UiLanguage, word: string): string {
  return word
    .replace(INVISIBLE_FORMAT_CHARACTER, '')
    .replace(SPACE_RUN, ' ')
    .trim()
    .normalize('NFC')
    .toLocaleLowerCase(language);
}

/** Every pair of members in the group that a reader of `language` would read as one word. */
export function membersReadAsOneWord(
  language: UiLanguage,
  translate: Translator['t'],
  group: ClosedVocabularyGroup,
): [string, string][] {
  const firstMemberByWord = new Map<string, string>();
  const collisions: [string, string][] = [];
  for (const [vocabulary, words] of Object.entries(group.vocabularies)) {
    for (const [member, message] of Object.entries(words)) {
      const name = `${vocabulary}.${member}`;
      const word = readerForm(language, translate(message));
      const earlier = firstMemberByWord.get(word);
      if (earlier === undefined) firstMemberByWord.set(word, name);
      else collisions.push([earlier, name]);
    }
  }
  return collisions;
}
