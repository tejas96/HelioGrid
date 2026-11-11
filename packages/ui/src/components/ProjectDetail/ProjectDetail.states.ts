import type { TranslatedText } from '@heliogrid/contracts';
import type { FocusAfter } from '../../primitives/FocusAfter';
import type { FailedReadProps } from '../EmptyState/EmptyState.types';
import type { LoadingBarsProps } from '../LoadingBars/LoadingBars.types';

/** What a project surface says while its read is not there — the board, the page, the job. */
export interface ProjectReadWords {
  readonly loading: TranslatedText;
  readonly failedTitle: TranslatedText;
  readonly failedMessage: TranslatedText;
  readonly retry: TranslatedText;
}

/** A project read on its way: the hero's panel and the rows it will fill. */
export function projectLoadingOf(words: ProjectReadWords): LoadingBarsProps {
  return { bars: ['panel', 'row', 'row', 'row'], label: words.loading };
}

/** A read that failed: what happened, and *Try again*, which lands focus on what stays. */
export function projectFailedOf(
  words: ProjectReadWords,
  retry: () => void,
  focusAfter: FocusAfter,
): FailedReadProps {
  return {
    title: words.failedTitle,
    message: words.failedMessage,
    retryLabel: words.retry,
    onRetry: retry,
    focusAfter,
  };
}
