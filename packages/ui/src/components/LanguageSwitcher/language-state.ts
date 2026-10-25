import type {
  AgentLanguage,
  LanguageContentState,
  LanguageSentenceFacts,
  LanguageSwitcherWords,
} from './LanguageSwitcher.types';

/** The state of one language, from its own counts. `state` on the item always wins. */
export function stateOf(item: AgentLanguage, total: number | null): LanguageContentState {
  if (item.state !== undefined) {
    return item.state;
  }
  const written = item.written;
  if (written === undefined) {
    return 'authored';
  }
  if (written <= 0) {
    return 'empty';
  }
  if (total !== null && written < total) {
    return 'inherited';
  }
  return 'authored';
}

/** The fraction the strip is measured against, when the caller has not stated it. */
export function totalOf(languages: AgentLanguage[], sections: number | undefined): number | null {
  if (sections !== undefined) {
    return sections;
  }
  const widest = languages.reduce((m, l) => Math.max(m, l.of ?? 0), 0);
  return widest === 0 ? null : widest;
}

/** The nouns every sentence names, as the caller words them. */
interface Nouns {
  readonly sectionNoun: string;
  readonly languageNoun: string;
  readonly fallbackName: string;
}

function factsOf(item: AgentLanguage, total: number | null, nouns: Nouns): LanguageSentenceFacts {
  return {
    language: item.label,
    written: item.written ?? null,
    total,
    sectionNoun: nouns.sectionNoun,
    languageNoun: nouns.languageNoun,
    fallback: nouns.fallbackName,
  };
}

/** The summary is about the WORK, not the switcher: how many of the languages are written at all. */
export function summaryLine(
  languages: AgentLanguage[],
  total: number | null,
  words: LanguageSwitcherWords,
  nouns: Omit<Nouns, 'fallbackName'>,
): string {
  const written = languages.filter((l) => stateOf(l, total) !== 'empty').length;
  return words.summary({ written, of: languages.length, each: total, ...nouns });
}

/**
 * The selected language's sentence — a fraction says how much, only words say what
 * ("Marathi · 5 of 8 sections written here · 3 fall back to Hindi"), in the caller's words.
 */
export function selectedSentence(
  cur: AgentLanguage | undefined,
  total: number | null,
  words: LanguageSwitcherWords,
  nouns: Nouns,
): string {
  if (cur === undefined) {
    return '';
  }
  const facts = factsOf(cur, total, nouns);
  if (cur.primary === true) {
    return words.primary(facts);
  }
  const state = stateOf(cur, total);
  if (state === 'empty') {
    return words.nothingWritten(facts);
  }
  return state === 'inherited' ? words.inherited(facts) : words.writtenHere(facts);
}

/**
 * The whole fact in the accessible name: a screen-reader user gets the sentence the sighted reader
 * assembles from a pill, a fraction and a glyph.
 */
export function spokenName(
  item: AgentLanguage,
  total: number | null,
  words: LanguageSwitcherWords,
  nouns: Nouns,
  showFraction: boolean,
): string {
  const facts = factsOf(item, showFraction ? total : null, nouns);
  if (item.primary === true) {
    return words.spokenPrimary(facts);
  }
  const state = stateOf(item, total);
  if (state === 'empty') {
    return words.spokenEmpty(facts);
  }
  return state === 'inherited'
    ? words.spokenInherited({ ...facts, total })
    : words.spokenWritten(facts);
}
