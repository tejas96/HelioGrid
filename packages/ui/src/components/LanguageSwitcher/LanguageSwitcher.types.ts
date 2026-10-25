/**
 * `authored` — written in this language. `inherited` — some sections fall through to the tenant's
 * primary (`SCR-M07-09`). `empty` — nothing written, everything falls back. Derived from `written`
 * against the section total when not stated.
 */
export type LanguageContentState = 'authored' | 'inherited' | 'empty';

export interface AgentLanguage {
  /** The tenant's language code — "hi", "mr", "bn". Identity, not display. */
  code: string;
  /** The language's name as the owner reads it — "Hindi", "Marathi". */
  label: string;
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

/**
 * Every sentence the switcher says or speaks, in the reader's language (`packages/i18n`'s
 * `languageSwitcherWords`): no English lives in this component.
 */
export interface LanguageSwitcherWords {
  /** The mark beside the primary language's name — *primary*. */
  readonly primaryMark: string;
  /** *Written in 2 of 3 languages · 8 sections each*. */
  summary(facts: {
    readonly written: number;
    readonly of: number;
    readonly each: number | null;
    readonly sectionNoun: string;
    readonly languageNoun: string;
  }): string;
  /** The selected language's sentence under the strip, by its state. */
  primary(facts: LanguageSentenceFacts): string;
  writtenHere(facts: LanguageSentenceFacts): string;
  inherited(facts: LanguageSentenceFacts): string;
  nothingWritten(facts: LanguageSentenceFacts): string;
  /** Each pill's accessible name, by its state. */
  spokenPrimary(facts: LanguageSentenceFacts): string;
  spokenWritten(facts: LanguageSentenceFacts): string;
  spokenInherited(facts: LanguageSentenceFacts): string;
  spokenEmpty(facts: LanguageSentenceFacts): string;
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
  sectionNoun: string;
  /**
   * What kind of language — "agent language" (default: the voice agent, `SCR-M07-09`) or "language"
   * (`SCR-M01-19`, `SCR-M01-21`). Names the kind in the summary line, the primary sentence and every
   * item's accessible name; the plural adds "s".
   */
  languageNoun: string;
  /** Overline above the strip, from `packages/i18n`; with `labelHidden` it still names the tablist. */
  label: string;
  /**
   * `true` drops the drawn overline and keeps `label` as the tablist's accessible name — for an
   * editor that already says what is written (`SCR-M01-19`). With `summary=""` too, no head row is
   * drawn at all.
   */
  labelHidden?: boolean;
  /** Replaces the composed summary line. */
  summary?: string;
  /** Drop the fractions where the caller has no per-language counts; the sentence stays. */
  showCounts?: boolean;
  density?: 'expressive' | 'functional';
}
