import type { TranslatedText } from '@heliogrid/contracts';
import type { CSSProperties, ReactNode } from 'react';
import type { FocusAfter } from '../../primitives/FocusAfter';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks';
import { RetryButton } from '../Button/RetryButton';
import { STREAM_SKELETON } from './ActivityStream.logic';

/** A shimmer bar; width and height are per-line measurements, not scale steps. */
export function StreamShimmer({ width, height }: { width: string; height: number }) {
  const vars = {
    '--hg-stream-shimmer-w': width,
    '--hg-stream-shimmer-h': `${height}px`,
  } as CSSProperties;
  return <span className="hg-stream-shimmer" style={vars} />;
}

/** Four entry-shaped rows: the stream keeps its shape while its content is coming. */
export function StreamSkeleton({ label }: { label: TranslatedText }) {
  return (
    <div role="status" aria-label={label} className="hg-stream-skeleton">
      {STREAM_SKELETON.rows.map((row) => (
        <div key={row} className="hg-stream-skeleton-row">
          <span className="hg-stream-skeleton-mark" />
          <div className="hg-stream-skeleton-lines">
            {STREAM_SKELETON.lines.map((line) => (
              <StreamShimmer key={line.key} width={line.width} height={line.height} />
            ))}
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
      <ShellGlyphMarks name={warning ? 'alert-circle' : 'lines'} />
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
  retryLabel,
  focusAfter,
}: {
  tone?: 'warning';
  title: TranslatedText;
  message?: TranslatedText;
  action?: ReactNode;
  onRetry?: () => void;
  retryLabel?: TranslatedText;
  /** Where focus lands once *Try again* has gone with this message. */
  focusAfter: FocusAfter;
}) {
  return (
    <div className="hg-stream-message">
      <span className="hg-stream-message-mark" data-tone={tone}>
        <MessageGlyph warning={tone === 'warning'} />
      </span>
      <div className="hg-stream-message-title">{title}</div>
      {message !== undefined ? <div className="hg-stream-message-text">{message}</div> : null}
      <RetryButton onRetry={onRetry} label={retryLabel} focusAfter={focusAfter} />
      {action !== undefined && action !== null ? (
        <div className="hg-stream-message-extra">{action}</div>
      ) : null}
    </div>
  );
}
