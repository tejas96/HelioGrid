/**
 * `LanguageSwitcher`'s own sentences (`packages/ui`'s `LanguageSwitcherWords`): the summary, the
 * selected language's line and every pill's accessible name — said in the reader's language, with
 * the language names and the nouns the caller words.
 */
import type { Translator } from '../runtime';

const SWITCHER = {
  primaryMark: /*i18n*/ { id: 'primary' },
  summary: /*i18n*/ {
    id: 'Written in {written} of {of, plural, one {# {languageNoun}} other {# {languageNoun}s}}',
  },
  summaryEach: /*i18n*/ {
    id: 'Written in {written} of {of, plural, one {# {languageNoun}} other {# {languageNoun}s}} · {each} {sectionNoun} each',
  },
  primary: /*i18n*/ {
    id: '{language} is the primary {languageNoun} · everything else falls back to it',
  },
  primaryCounted: /*i18n*/ {
    id: '{language} is the primary {languageNoun} · {written} of {total} {sectionNoun} written · nothing falls back',
  },
  writtenHere: /*i18n*/ { id: '{language} · written here' },
  writtenCounted: /*i18n*/ {
    id: '{language} · {written} of {total} {sectionNoun} written here · nothing falls back',
  },
  inherited: /*i18n*/ {
    id: '{language} · {written} of {total} {sectionNoun} written here · {left} fall back to {fallback}',
  },
  nothingWritten: /*i18n*/ {
    id: 'Nothing written in {language} yet · it falls back to {fallback}',
  },
  nothingWrittenCounted: /*i18n*/ {
    id: 'Nothing written in {language} yet · all {total} {sectionNoun} fall back to {fallback}',
  },
  spokenPrimary: /*i18n*/ { id: '{language}, primary {languageNoun}' },
  spokenPrimaryCounted: /*i18n*/ {
    id: '{language}, primary {languageNoun}, {written} of {total} {sectionNoun} written',
  },
  spokenWritten: /*i18n*/ { id: '{language}, written here' },
  spokenWrittenCounted: /*i18n*/ {
    id: '{language}, written here, {written} of {total} {sectionNoun}',
  },
  spokenInherited: /*i18n*/ {
    id: '{language}, {written} of {total} {sectionNoun} written here, {left} fall back to {fallback}',
  },
  spokenEmpty: /*i18n*/ { id: '{language}, nothing written, falls back to {fallback}' },
} as const;

export interface LanguageSentenceFacts {
  readonly language: string;
  readonly written: number | null;
  readonly total: number | null;
  readonly sectionNoun: string;
  readonly languageNoun: string;
  readonly fallback: string;
}

/** Every sentence `LanguageSwitcher` says or speaks, in the reader's language. */
export function languageSwitcherWords(t: Translator['t']) {
  const counted = (facts: LanguageSentenceFacts) => facts.written !== null && facts.total !== null;
  return {
    primaryMark: t(SWITCHER.primaryMark),
    summary: (facts: {
      readonly written: number;
      readonly of: number;
      readonly each: number | null;
      readonly sectionNoun: string;
      readonly languageNoun: string;
    }) =>
      facts.each === null
        ? t(SWITCHER.summary, { ...facts })
        : t(SWITCHER.summaryEach, { ...facts }),
    primary: (facts: LanguageSentenceFacts) =>
      counted(facts) ? t(SWITCHER.primaryCounted, { ...facts }) : t(SWITCHER.primary, { ...facts }),
    writtenHere: (facts: LanguageSentenceFacts) =>
      counted(facts)
        ? t(SWITCHER.writtenCounted, { ...facts })
        : t(SWITCHER.writtenHere, { ...facts }),
    inherited: (facts: LanguageSentenceFacts) =>
      t(SWITCHER.inherited, { ...facts, left: (facts.total ?? 0) - (facts.written ?? 0) }),
    nothingWritten: (facts: LanguageSentenceFacts) =>
      facts.total === null
        ? t(SWITCHER.nothingWritten, { ...facts })
        : t(SWITCHER.nothingWrittenCounted, { ...facts }),
    spokenPrimary: (facts: LanguageSentenceFacts) =>
      counted(facts)
        ? t(SWITCHER.spokenPrimaryCounted, { ...facts })
        : t(SWITCHER.spokenPrimary, { ...facts }),
    spokenWritten: (facts: LanguageSentenceFacts) =>
      counted(facts)
        ? t(SWITCHER.spokenWrittenCounted, { ...facts })
        : t(SWITCHER.spokenWritten, { ...facts }),
    spokenInherited: (facts: LanguageSentenceFacts) =>
      t(SWITCHER.spokenInherited, { ...facts, left: (facts.total ?? 0) - (facts.written ?? 0) }),
    spokenEmpty: (facts: LanguageSentenceFacts) => t(SWITCHER.spokenEmpty, { ...facts }),
  };
}
