import { createContext, useContext } from 'react';
import type { ProvenanceWords } from './Provenance.types';

/**
 * THE CONTEXT IS AUTHORED ONCE, here, and both platform halves read it — the way `MarketProvider`
 * carries the market. It has NO default: an English fallback inside the design system is the
 * defect this replaces (`F3-12`), and a label with no words must fail where it is first rendered,
 * not ship English to a Marathi reader.
 */
const ProvenanceWordsContext = createContext<ProvenanceWords | null>(null);

/** Mount once, beside `MarketProvider`, with words built from `@heliogrid/i18n`. */
export const ProvenanceWordsProvider = ProvenanceWordsContext.Provider;

/** The words every provenance label prints. Throws when no consumer mounted them. */
export function useProvenanceWords(): ProvenanceWords {
  const words = useContext(ProvenanceWordsContext);
  if (words === null) {
    throw new Error(
      'A provenance label rendered outside ProvenanceWordsProvider — mount it with the words from @heliogrid/i18n (tierLabel, standingLabel, energySourceLabel, freshnessLabel).',
    );
  }
  return words;
}
