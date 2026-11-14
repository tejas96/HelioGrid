import type { TranslatedText } from '@heliogrid/contracts';
import type { MessageRef, Translator } from '../runtime';

/**
 * The proposal document's own name — the print page's title, which the PDF carries as its title —
 * in the document's language: what it is, its number and the company it is from.
 */
const PROPOSAL_DOCUMENT_TITLE = {
  numbered: /*i18n*/ { id: 'Proposal {number} · {company}' },
  unnumbered: /*i18n*/ { id: 'Proposal · {company}' },
} satisfies Record<string, MessageRef>;

export function proposalDocumentTitle(
  t: Translator['t'],
  facts: { readonly number: string | null; readonly company: string },
): TranslatedText {
  return facts.number === null
    ? t(PROPOSAL_DOCUMENT_TITLE.unnumbered, { company: facts.company })
    : t(PROPOSAL_DOCUMENT_TITLE.numbered, { number: facts.number, company: facts.company });
}
