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

export interface LanguageSwitcherProps {
  /** The tenant's **enabled** agent languages (`M07-15`: up to six). Not every language HelioGrid has. */
  languages: AgentLanguage[];
  value: string;
  onChange?: (code: string) => void;
  /** How many sections the fraction is out of — `SCR-M07-09`'s eight. */
  sections?: number;
  /** The noun in every sentence — "sections" (default), "rules", "templates". */
  sectionNoun?: string;
  /** Overline above the strip. */
  label?: string;
  /** Replaces the composed summary line. */
  summary?: string;
  /** Drop the fractions where the caller has no per-language counts; the sentence stays. */
  showCounts?: boolean;
  density?: 'expressive' | 'functional';
}
