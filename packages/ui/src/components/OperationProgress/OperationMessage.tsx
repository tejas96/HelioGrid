import type { ReactNode } from 'react';
import type { OperationState } from './OperationProgress.types';

function MessageGlyph({ state }: { state: OperationState }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {state === 'failed' ? (
        <>
          <path d="M12 9v4M12 17h.01" />
          <circle cx="12" cy="12" r="9" />
        </>
      ) : null}
      {state === 'cancelled' ? (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M8 12h8" />
        </>
      ) : null}
      {state !== 'failed' && state !== 'cancelled' ? <path d="m5 13 4 4L19 7" /> : null}
    </svg>
  );
}

/**
 * The finishing sentence: the report line, the failure, or what a cancel left behind. `failed`
 * takes `role="alert"` because it interrupts; everything else is a polite `status`.
 */
export function OperationMessage({
  state,
  message,
}: {
  state: OperationState;
  message: ReactNode;
}) {
  return (
    <p
      role={state === 'failed' ? 'alert' : 'status'}
      data-state={state}
      className="hg-operation-progress-message"
    >
      <span className="hg-operation-progress-message-mark" aria-hidden="true">
        <MessageGlyph state={state} />
      </span>
      <span className="hg-operation-progress-message-words">{message}</span>
    </p>
  );
}
