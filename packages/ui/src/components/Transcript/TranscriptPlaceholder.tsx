/* The four states with no document to show (web) — loading, error, unavailable, and a call that
   connected but transcribed nothing. The header stays above every one of them; only this body
   below it changes. */

import type { SurfaceState } from '../UnavailableNote';
import { UnavailableNote } from '../UnavailableNote';
import { TranscriptPlainButton } from './TranscriptChrome';

interface TranscriptPlaceholderProps {
  state: SurfaceState;
  turnCount: number;
  density: 'expressive' | 'functional';
  emptyTitle: string;
  emptyDescription: string;
  errorMessage: string;
  onRetry?: () => void;
  unavailableTitle: string;
  unavailableMessage: string;
}

export function TranscriptPlaceholder({
  state,
  turnCount,
  density,
  emptyTitle,
  emptyDescription,
  errorMessage,
  onRetry,
  unavailableTitle,
  unavailableMessage,
}: TranscriptPlaceholderProps) {
  if (state === 'loading') {
    return (
      <div
        role="status"
        aria-label="Loading the transcript"
        className="hg-transcript-skeleton"
        data-density={density}
      >
        {['a', 'b', 'c', 'd'].map((row, i) => (
          <span
            key={row}
            className="hg-transcript-skeleton-bar"
            data-tall={i % 2 ? undefined : 'true'}
            data-density={density}
          />
        ))}
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="hg-transcript-error" data-density={density}>
        <p className="hg-transcript-error-body">{errorMessage}</p>
        {onRetry ? (
          <TranscriptPlainButton onPress={onRetry}>Try again</TranscriptPlainButton>
        ) : null}
      </div>
    );
  }

  if (state === 'unavailable') {
    return <UnavailableNote title={unavailableTitle} message={unavailableMessage} />;
  }

  if (turnCount === 0) {
    return (
      <div className="hg-transcript-empty" data-density={density}>
        <p className="hg-transcript-empty-title">{emptyTitle}</p>
        <p className="hg-transcript-empty-body">{emptyDescription}</p>
      </div>
    );
  }

  return null;
}
