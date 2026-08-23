import type { ReactNode } from 'react';

/** Six shimmer bars — the loading form. Never a placeholder value presented as a real one. */
export function CompareSkeleton() {
  return (
    <div className="hg-compare-skeleton" role="status" aria-label="Loading the comparison">
      {['title', 'a', 'b', 'c', 'd', 'e'].map((row) => (
        <span
          className="hg-compare-shimmer"
          data-lead={row === 'title' ? 'true' : undefined}
          key={row}
        />
      ))}
    </div>
  );
}

/**
 * The centred body of a blocked surface.
 *
 * `tone="warning"` is the **error** form and carries the retry. The neutral form is both `empty`
 * ("none yet") and `unavailable` ("this was never going to be here") — and `unavailable` never
 * gets a retry, because trying again cannot change the answer.
 */
export function CompareMessage({
  tone,
  title,
  message,
  onRetry,
}: {
  tone?: 'warning';
  title: ReactNode;
  message?: ReactNode;
  onRetry?: () => void;
}) {
  return (
    <div className="hg-compare-message">
      <span className="hg-compare-message-mark" data-tone={tone}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {tone === 'warning' ? (
            <>
              <path d="M12 9v4M12 17h.01" />
              <circle cx="12" cy="12" r="9" />
            </>
          ) : (
            <>
              <rect x="3" y="4" width="7" height="16" rx="1.5" />
              <rect x="14" y="4" width="7" height="16" rx="1.5" />
            </>
          )}
        </svg>
      </span>
      <div className="hg-compare-message-title">{title}</div>
      {message === undefined ? null : <div className="hg-compare-message-body">{message}</div>}
      {onRetry === undefined ? null : (
        <button type="button" className="hg-compare-retry" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
