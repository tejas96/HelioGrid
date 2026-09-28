import { createContext, useContext } from 'react';
import { ruledKind } from './Disclosure.lines';
import type { DisclosureKind, DisclosureWords } from './Disclosure.types';

/**
 * THE CONTEXT IS AUTHORED ONCE, here, and both platform halves read it — the way
 * `ProvenanceWordsProvider` carries the label's words. It has NO default: the ruled lines are
 * `@heliogrid/i18n`'s verbatim text, and an English fallback here would be a second copy of them.
 */
const DisclosureWordsContext = createContext<DisclosureWords | null>(null);

/** Mount once, beside `MarketProvider`, with words built from `@heliogrid/i18n`. */
export const DisclosureWordsProvider = DisclosureWordsContext.Provider;

function useDisclosureWords(): DisclosureWords {
  const words = useContext(DisclosureWordsContext);
  if (words === null) {
    throw new Error(
      'A disclosure rendered outside DisclosureWordsProvider — mount it with the words from @heliogrid/i18n (disclosureLead, disclosureLine).',
    );
  }
  return words;
}

/**
 * What a disclosure prints: the mount's lead and line for a ruled kind, the caller's `text` for
 * `custom`. A ruled line is verbatim, so a caller's `text` there is ignored, with a warning.
 */
export function useDisclosureText(
  kind: DisclosureKind,
  text: string | undefined,
): { lead: string | null; line: string | undefined } {
  const words = useDisclosureWords();
  const ruled = ruledKind(kind);
  if (ruled === null) {
    return { lead: null, line: text };
  }
  if (text !== undefined) {
    console.warn(
      `Disclosure: \`text\` is ignored for kind="${kind}". The line is verbatim and owned by @heliogrid/i18n. Put your particulars in \`detail\`, or use kind="custom" for a market pack's own required line.`,
    );
  }
  return { lead: words.lead(ruled), line: words.line(ruled) };
}
