import type { TranslatedText } from '@heliogrid/contracts';

/**
 * `authored` — written in this language. `inherited` — some sections fall through to the tenant's
 * primary (`SCR-M07-09`). `empty` — nothing written, everything falls back. Derived from `written`
 * against the section total when not stated.
 */
export type LanguageContentState = 'authored' | 'inherited' | 'empty';

export interface AgentLanguage {
  /** The tenant's language code — "hi", "mr", "bn". Identity, not display. */
  code: string;
  /** The language's name as the owner reads it — "Hindi", "Marathi", or named in itself. */
  label: TranslatedText;
  /** How many of the section set are authored in this language. Drives the fraction and the state. */
  written?: number;
  /** Per-language section total, where it differs. `sections` on the switcher is the usual answer. */
  of?: number;
  /** Stated outright; otherwise derived from `written` against the total. */
  state?: LanguageContentState;
  /** The tenant's primary agent language — the one everything else falls back to. */
  primary?: boolean;
}

/** The facts one language's sentence states; a count is `null` where the caller gives none. */
export interface LanguageSentenceFacts {
  readonly language: string;
  readonly written: number | null;
  readonly total: number | null;
  readonly sectionNoun: string;
  readonly languageNoun: string;
  /** The language everything else falls back to, as the strip names it. */
  readonly fallback: string;
}

/** The facts the summary line states. */
export interface LanguageSummaryFacts {
  readonly written: number;
  readonly of: number;
  readonly each: number | null;
  readonly sectionNoun: string;
  readonly languageNoun: string;
}

/**
 * Every sentence the switcher says or speaks, in the reader's language (`packages/i18n`'s
 * `languageSwitcherWords`): no English lives in this component.
 */
export interface LanguageSwitcherWords {
  /** The mark beside the primary language's name — *primary*. */
  readonly primaryMark: TranslatedText;
  /** *Written in 2 of 3 languages · 8 sections each*. */
  summary(facts: LanguageSummaryFacts): TranslatedText;
  /** The selected language's sentence under the strip, by its state. */
  primary(facts: LanguageSentenceFacts): TranslatedText;
  writtenHere(facts: LanguageSentenceFacts): TranslatedText;
  inherited(facts: LanguageSentenceFacts): TranslatedText;
  nothingWritten(facts: LanguageSentenceFacts): TranslatedText;
  /** Each pill's accessible name, by its state. */
  spokenPrimary(facts: LanguageSentenceFacts): TranslatedText;
  spokenWritten(facts: LanguageSentenceFacts): TranslatedText;
  spokenInherited(facts: LanguageSentenceFacts): TranslatedText;
  spokenEmpty(facts: LanguageSentenceFacts): TranslatedText;
}

export interface LanguageSwitcherProps {
  /** Every sentence the switcher says or speaks. */
  words: LanguageSwitcherWords;
  /** The tenant's **enabled** agent languages (`M07-15`: up to six). Not every language HelioGrid has. */
  languages: AgentLanguage[];
  value: string;
  onChange?: (code: string) => void;
  /** How many sections the fraction is out of — `SCR-M07-09`'s eight. */
  sections?: number;
  /** The noun in every sentence — "sections" (default), "rules", "templates". */
  sectionNoun: TranslatedText;
  /**
   * What kind of language — "agent language" (default: the voice agent, `SCR-M07-09`) or "language"
   * (`SCR-M01-19`, `SCR-M01-21`). Names the kind in the summary line, the primary sentence and every
   * item's accessible name; the plural adds "s".
   */
  languageNoun: TranslatedText;
  /** Overline above the strip, from `packages/i18n`; with `labelHidden` it still names the tablist. */
  label: TranslatedText;
  /**
   * `true` drops the drawn overline and keeps `label` as the tablist's accessible name — for an
   * editor that already says what is written (`SCR-M01-19`). With `summary=""` too, no head row is
   * drawn at all.
   */
  labelHidden?: boolean;
  /** Replaces the composed summary line; `''` draws none. */
  summary?: TranslatedText | '';
  /** Drop the fractions where the caller has no per-language counts; the sentence stays. */
  showCounts?: boolean;
  density?: 'expressive' | 'functional';
}
