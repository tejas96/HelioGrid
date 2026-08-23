import type { CSSProperties, ReactNode } from 'react';

/** A shimmer bar; width and height are per-line measurements, not scale steps. */
export function StreamShimmer({ width, height }: { width: string; height: number }) {
  const vars = {
    '--hg-stream-shimmer-w': width,
    '--hg-stream-shimmer-h': `${height}px`,
  } as CSSProperties;
  return <span className="hg-stream-shimmer" style={vars} />;
}

/** Four entry-shaped rows: the stream keeps its shape while its content is coming. */
export function StreamSkeleton() {
  return (
    <div role="status" aria-label="Loading activity" className="hg-stream-skeleton">
      {['a', 'b', 'c', 'd'].map((row) => (
        <div key={row} className="hg-stream-skeleton-row">
          <span className="hg-stream-skeleton-mark" />
          <div className="hg-stream-skeleton-lines">
            <StreamShimmer width="34%" height={11} />
            <StreamShimmer width="76%" height={14} />
            <StreamShimmer width="28%" height={11} />
          </div>
        </div>
      ))}
    </div>
  );
}

function MessageGlyph({ warning }: { warning: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      role="presentation"
    >
      {warning ? (
        <>
          <path d="M12 9v4M12 17h.01" />
          <circle cx="12" cy="12" r="9" />
        </>
      ) : (
        <path d="M4 6h16M4 12h16M4 18h10" />
      )}
    </svg>
  );
}

/**
 * The centred sentence the empty and error states share. `timeline-filtered` with nothing in it is
 * NOT "no activity yet" — the record is not empty, the filter is narrow, and the sentence has to
 * say which is true or the reader clears the wrong thing.
 */
export function StreamMessage({
  tone,
  title,
  message,
  action,
  onRetry,
}: {
  tone?: 'warning';
  title: string;
  message?: string;
  action?: ReactNode;
  onRetry?: () => void;
}) {
  return (
    <div className="hg-stream-message">
      <span className="hg-stream-message-mark" data-tone={tone}>
        <MessageGlyph warning={tone === 'warning'} />
      </span>
      <div className="hg-stream-message-title">{title}</div>
      {message !== undefined ? <div className="hg-stream-message-text">{message}</div> : null}
      {onRetry !== undefined ? (
        <button type="button" className="hg-stream-button" onClick={onRetry}>
          Try again
        </button>
      ) : null}
      {action !== undefined && action !== null ? (
        <div className="hg-stream-message-extra">{action}</div>
      ) : null}
    </div>
  );
}
