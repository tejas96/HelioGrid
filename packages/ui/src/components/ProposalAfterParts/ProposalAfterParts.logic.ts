import { SHARE_LINK_SLOT, type TranslatedText } from '@heliogrid/contracts';
import type { FocusAfter } from '../../primitives/FocusAfter';

/**
 * A composed message cut into its lines — both halves draw the same: `words` as written, `link`
 * the customer's link (a figure, in the mono face), `toCome` the sentence that stands where their
 * link will go before the first share (words, never mono).
 */
export interface BubbleLine {
  readonly text: string;
  readonly kind: 'words' | 'link' | 'toCome';
}

/**
 * Before the first share no link exists: the server holds its place with `SHARE_LINK_SLOT`, and
 * the bubble says in words where it will go (`linkToCome`) — a slot is never printed.
 */
export function bubbleLines(
  text: string,
  link: string | null | undefined,
  linkToCome?: TranslatedText,
): readonly BubbleLine[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '')
    .flatMap((line): BubbleLine[] => {
      if (line === SHARE_LINK_SLOT)
        return linkToCome === undefined ? [] : [{ text: linkToCome, kind: 'toCome' as const }];
      const linked = link !== null && link !== undefined && link !== '' && line.includes(link);
      return [{ text: line, kind: linked ? ('link' as const) : ('words' as const) }];
    });
}

/** A failed read's notice, from the three words every after-build part carries for it. */
export function failedReadOf(
  words: {
    readonly failedTitle: TranslatedText;
    readonly failedMessage: TranslatedText;
    readonly retry: TranslatedText;
  },
  retry: () => void,
  focusAfter: FocusAfter,
) {
  return {
    title: words.failedTitle,
    message: words.failedMessage,
    retryLabel: words.retry,
    onRetry: retry,
    focusAfter,
  };
}
