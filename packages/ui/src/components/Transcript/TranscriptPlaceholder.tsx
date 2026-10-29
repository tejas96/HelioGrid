/* The four states with no document to show (web) — loading, error, unavailable, and a call that
   connected but transcribed nothing. The header stays above every one of them; only this body
   below it changes. */

import { RetryButton } from '../Button/RetryButton';
import { UnavailableNote } from '../UnavailableNote';
import { placeholderOf, TRANSCRIPT_SKELETON_BARS } from './Transcript.logic';
import type { TranscriptPlaceholderProps } from './Transcript.types';

export function TranscriptPlaceholder({
  state,
  turnCount,
  density,
  emptyTitle,
  emptyDescription,
  errorMessage,
  onRetry,
  retryLabel,
  unavailableTitle,
  unavailableMessage,
  loadingLabel,
  focusAfter,
}: TranscriptPlaceholderProps) {
  const kind = placeholderOf(state, turnCount);

  if (kind === 'loading') {
    return (
      <div
        role="status"
        aria-label={loadingLabel}
        className="hg-transcript-skeleton"
        data-density={density}
      >
        {TRANSCRIPT_SKELETON_BARS.map((bar) => (
          <span
            key={bar.key}
            className="hg-transcript-skeleton-bar"
            data-tall={bar.tall ? 'true' : undefined}
            data-density={density}
          />
        ))}
      </div>
    );
  }

  if (kind === 'error') {
    return (
      <div className="hg-transcript-error" data-density={density}>
        <p className="hg-transcript-error-body">{errorMessage}</p>
        <RetryButton onRetry={onRetry} label={retryLabel} focusAfter={focusAfter} />
      </div>
    );
  }

  if (kind === 'unavailable') {
    return <UnavailableNote title={unavailableTitle} message={unavailableMessage} />;
  }

  if (kind === 'empty') {
    return (
      <div className="hg-transcript-empty" data-density={density}>
        <p className="hg-transcript-empty-title">{emptyTitle}</p>
        {emptyDescription === undefined ? null : (
          <p className="hg-transcript-empty-body">{emptyDescription}</p>
        )}
      </div>
    );
  }

  return null;
}
