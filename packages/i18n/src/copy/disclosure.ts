import type { RuledDisclosure } from '@heliogrid/domain';
import type { MessageRef, Translator } from '../runtime';
import { BASIS_LINE_WORD } from './document-basis';
import { STRUCTURE_DISCLAIMER } from './structure-disclaimer';

/**
 * The staleness warning (`MS9-16`). No row gives it verbatim text: this is the design system's
 * drawn line, and an edit here changes what every printed document says about its prices.
 */
const STALENESS_LINE: MessageRef = /*i18n*/ {
  id: 'The prices and the subsidy in this document were current on the issue date. Both change, so confirm them before you pay.',
};

/**
 * The line each ruled disclosure prints. The basis lines and the structure disclaimer are THEIR
 * modules' descriptors, never copies, so the PRD's verbatim text has one home.
 */
const DISCLOSURE_LINE_WORD: Record<RuledDisclosure, MessageRef> = {
  ...BASIS_LINE_WORD,
  structure: STRUCTURE_DISCLAIMER,
  staleness: STALENESS_LINE,
};

/** The bold clause that leads each line, at the weight of the figures it qualifies. */
export const DISCLOSURE_LEAD_WORD: Record<RuledDisclosure, MessageRef> = {
  'indicative-basis': /*i18n*/ { id: 'Indicative' },
  'remote-survey': /*i18n*/ { id: 'Surveyed remotely' },
  structure: /*i18n*/ { id: 'Not a structural certification' },
  staleness: /*i18n*/ { id: 'Prices and subsidy move' },
};

/** The ruled line in the reader's language — `translate` is the mount's `t`. */
export function disclosureLine(translate: Translator['t'], kind: RuledDisclosure): string {
  return translate(DISCLOSURE_LINE_WORD[kind]);
}

/** The lead clause in the reader's language — `translate` is the mount's `t`. */
export function disclosureLead(translate: Translator['t'], kind: RuledDisclosure): string {
  return translate(DISCLOSURE_LEAD_WORD[kind]);
}
