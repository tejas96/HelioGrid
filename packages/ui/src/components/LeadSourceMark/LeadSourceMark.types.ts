import type { TranslatedText } from '@heliogrid/contracts';
import type { LeadSource } from '@heliogrid/domain';

/** `word` draws the glyph and the word; `glyph` draws the glyph alone, the word spoken. */
export type LeadSourceMarkForm = 'word' | 'glyph';

/**
 * Where an enquiry came from (`M02-13`), shown wherever a lead is listed so triage sees it at a
 * glance: one glyph per source and its word. A source a newer server has learned draws the plain
 * dot under the word the caller gives it.
 */
export interface LeadSourceMarkProps {
  source: LeadSource | (string & {});
  /** The source's word, from `@heliogrid/i18n` (`leadSourceWord`) — drawn, or spoken alone. */
  label: TranslatedText;
  form?: LeadSourceMarkForm;
}
