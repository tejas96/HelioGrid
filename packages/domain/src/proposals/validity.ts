import type { RichTextValue } from '../commerce/rich-text';
import { sameContent } from '../tenancy/settings-page';
import { PROPOSAL_VALIDITY_DAYS } from './vocabulary';

/**
 * The days a proposal's terms state (`M06-15`): the platform's while they are its default terms
 * word for word in a language they can be filled in, and none for any other words, which no page
 * can read a number out of. The caller passes the default terms in the language the terms were
 * filled in — the api passes every launch language, so the reader's language plays no part.
 */
export function termsValidityDays(
  terms: RichTextValue,
  platformTerms: readonly RichTextValue[],
): number | null {
  return platformTerms.some((words) => sameContent(terms, words)) ? PROPOSAL_VALIDITY_DAYS : null;
}
