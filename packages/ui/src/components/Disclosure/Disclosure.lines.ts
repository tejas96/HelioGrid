import type { DisclosureKind, DisclosureLine } from './Disclosure.types';

/** The four kinds whose wording the component owns. `custom` is the caller's own line. */
export type RuledDisclosureKind = Exclude<DisclosureKind, 'custom'>;

/**
 * THE WORDING IS THE COMPONENT'S, NOT THE CALLER'S. "Verbatim" is only true if one place owns the
 * words, so this table holds them and `text` is IGNORED for the four ruled kinds (with a console
 * warning). A caller adds particulars through `detail` — which figures, whose survey, as of when —
 * and cannot edit, soften or shorten the line itself.
 */
export const DISCLOSURE_LINES: Record<RuledDisclosureKind, DisclosureLine> = {
  'indicative-basis': {
    lead: 'Indicative',
    line: 'This proposal was prepared without a site design. The system size, the generation figures and the price in it are indicative, and all three can change once a design is done.',
    subject: 'the indicative basis of this proposal',
  },
  'remote-survey': {
    lead: 'Surveyed remotely',
    line: 'This quote is based on a remote survey — satellite imagery and the photographs you sent — and not on a visit to the roof.',
    subject: 'the remote-survey basis',
  },
  structure: {
    lead: 'Not a structural certification',
    line: 'Structure and mounting are quoted on typical roof conditions. This is not a structural certification, and a structural engineer must sign off on the roof before installation.',
    subject: 'the structure disclaimer',
  },
  staleness: {
    lead: 'Prices and subsidy move',
    line: 'The prices and the subsidy in this document were current on the issue date. Both change, so confirm them before you pay.',
    subject: 'the staleness warning',
  },
};

/** The canonical document order. Basis first, because it qualifies everything after it. */
export const DISCLOSURE_ORDER: readonly DisclosureKind[] = [
  'indicative-basis',
  'remote-survey',
  'structure',
  'staleness',
  'custom',
];

export function ruledLine(kind: DisclosureKind): DisclosureLine | undefined {
  return kind === 'custom' ? undefined : DISCLOSURE_LINES[kind];
}

/** The verbatim lines, frozen and readable — so a review can compare them without running anything. */
export const DISCLOSURE_TEXT: Readonly<Record<RuledDisclosureKind, string>> = Object.freeze({
  'indicative-basis': DISCLOSURE_LINES['indicative-basis'].line,
  'remote-survey': DISCLOSURE_LINES['remote-survey'].line,
  structure: DISCLOSURE_LINES.structure.line,
  staleness: DISCLOSURE_LINES.staleness.line,
});
