import type { BasisLine } from '@heliogrid/domain';
import type { MessageRef } from '../runtime';

/**
 * The two basis lines (`F8-20`, `F8-22`), fixed copy. The English is the canonical identity of each
 * line, verbatim from the PRD: an edit here is a change to the product's promise, never a tidy-up.
 * A translation keeps every clause — the confirming step included (§F8.4 Localization notes).
 * Which line a document carries is `basisLineOf`'s, in `@heliogrid/domain`.
 */
export const BASIS_LINE_WORD: Record<BasisLine, MessageRef> = {
  indicative: /*i18n*/ {
    id: 'Indicative proposal. Generation and savings are estimated from system size and location. A site survey and shadow analysis will confirm the final figures.',
  },
  imageryBasis: /*i18n*/ {
    id: 'Roof measured from satellite imagery. A site visit will confirm dimensions, shading and electrical access.',
  },
};
