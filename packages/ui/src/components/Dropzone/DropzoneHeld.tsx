import type { ReactNode } from 'react';
import { type HeldRetry, heldFailureWords, heldSentence, useHeldFlush } from './dropzone-held';

interface DropzoneHeldProps {
  /** An upload already in flight takes the retry out of reach — there is nothing to flush yet. */
  busy: boolean;
  countWords: string | null;
  failedMessage: string;
  heldMessage?: ReactNode;
  /** The surface's `aria-describedby` points here, alongside any error. */
  id: string;
  onRetry?: HeldRetry;
  retryLabel: string;
  retryTimeout: number;
  timeoutMessage: string;
}

/**
 * THE WAITING COUNT AND THE RETRY, ON THE CAPTURE SCREEN ITSELF (`M11-37` P0 / `SCR-M11-03`,
 * `F4-21`). `heldOnDevice` alone is a bare boolean, so the two things `M11-37` requires this screen
 * to show were the two things the component could not show.
 *
 * The count is its OWN element above the sentence, so `heldMessage` replaces the wording and never
 * the number — and the words name what is waiting in the caller's noun, because this component is
 * on the document checklist too.
 */
export function DropzoneHeld({
  busy,
  countWords,
  failedMessage,
  heldMessage,
  id,
  onRetry,
  retryLabel,
  retryTimeout,
  timeoutMessage,
}: DropzoneHeldProps) {
  const { failure, flushing, run } = useHeldFlush(onRetry, retryTimeout);
  const failureWords = heldFailureWords(failure, { failedMessage, timeoutMessage });

  return (
    <div className="hg-dropzone-held" id={id} role="status">
      <div className="hg-dropzone-held-words">
        {countWords === null ? null : <p className="hg-dropzone-held-count">{countWords}</p>}
        <p className="hg-dropzone-held-line">{heldSentence(heldMessage)}</p>
        {/* What actually happened last time — NoConnection's rule, and the reason `onRetry` may
            report a failure at all. */}
        {failureWords === null ? null : <p className="hg-dropzone-held-failure">{failureWords}</p>}
      </div>
      {onRetry === undefined ? null : (
        <button
          className="hg-dropzone-retry"
          type="button"
          disabled={flushing || busy}
          onClick={run}
        >
          {/* The label stays. A spinner beside it, never instead of it. */}
          {flushing ? <span className="hg-dropzone-retry-spinner" aria-hidden="true" /> : null}
          {retryLabel}
        </button>
      )}
    </div>
  );
}
