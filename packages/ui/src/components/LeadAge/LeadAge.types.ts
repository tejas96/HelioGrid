import type { TranslatedText } from '@heliogrid/contracts';

/**
 * Where a waiting lead stands against the 24-hour escalation (`M02-50`): well inside it, in its
 * last quarter, or past it — when the owner has been told.
 */
export type LeadAgeStanding = 'fresh' | 'nearing' | 'past';

/** The age's words, built in `@heliogrid/i18n` (`leadAgeWords`). */
export interface LeadAgeWords {
  /** How long it has waited, short — "40 min", "5 h", "2 d". */
  age: (elapsedMs: number) => TranslatedText;
  /** The same, as a screen reader says it — "Waiting 2 days, past 24 hours". */
  spoken: (elapsedMs: number) => TranslatedText;
}

/**
 * How long a lead has waited since it was captured (`M02-24`): a triage row's age. Past 24 hours
 * it carries the warning glyph, so the escalation is visible before it fires (`M02-50`); in the
 * last quarter before it, the clock turns to the warning ink.
 */
export interface LeadAgeProps {
  /** Wall-clock milliseconds since capture — the caller's clock, never a ticking interval. */
  elapsedMs: number;
  words: LeadAgeWords;
}
