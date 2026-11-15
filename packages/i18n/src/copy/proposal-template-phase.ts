import type { TranslatedText } from '@heliogrid/contracts';
/**
 * The Proposal template's field refusals (`SCR-M01-19`). The page's other words are
 * `proposal-template.ts`'s; a phase is edited on the builder's own phase sheet (`T-M01-030`).
 */
import { PHASE_NAME_LIMIT, type TemplateRefusal } from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { proposalTermsOverPages } from './proposal-builder-steps-rest';
import { TEMPLATE } from './proposal-template';

type T = Translator['t'];

/** A field's refusal in words. */
export function templateRefusalWords(
  t: T,
  field: 'name' | 'what' | 'terms',
  refusal: TemplateRefusal | null,
): TranslatedText | null {
  if (refusal === null) return null;
  if (refusal === 'too-long' && field === 'terms') return proposalTermsOverPages(t);
  if (refusal === 'too-long') return t(TEMPLATE.nameTooLong, { count: PHASE_NAME_LIMIT });
  const words = {
    name: TEMPLATE.nameNeeded,
    what: TEMPLATE.whatNeeded,
    terms: TEMPLATE.termsNeeded,
  } as const;
  return t(words[field]);
}

/** The terms' refusal, present only when the field refuses. */
export function templateFieldRefusals(
  t: T,
  refusals: { readonly terms: TemplateRefusal | null },
): { readonly termsError?: TranslatedText } {
  const terms = templateRefusalWords(t, 'terms', refusals.terms);
  return terms === null ? {} : { termsError: terms };
}

/* Proposal defaults' own words ride this file's export: the index names it whole and is at its line limit. */
export * from './proposal-defaults-words';
