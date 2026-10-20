/* Timeline's node, skeleton and message (web). Split out by responsibility — the sequence itself
   is Timeline.tsx.

   Status is never colour alone: each state carries its own glyph inside the node — a tick for
   `done`, a filled dot for `current`, a bang for `blocked`, a cross for `failed` — and `upcoming`
   is an empty disc, which is its own shape. */

import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks';
import { RetryButton } from '../Button/RetryButton';
import type { TimelineStatus } from './Timeline.types';

/** The node. `size` is the DS's own node ladder (28 page / 20 compact); it lives in Timeline.css. */
export function TimelineNode({
  status = 'upcoming',
  compact,
}: {
  status?: TimelineStatus;
  compact: boolean;
}) {
  const inner = compact ? 11 : 15;
  return (
    <span aria-hidden="true" className="hg-timeline-node" data-status={status}>
      {status === 'done' ? (
        <svg
          width={inner}
          height={inner}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="4.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <ShellGlyphMarks name="tick-small" />
        </svg>
      ) : null}
      {status === 'current' ? <span className="hg-timeline-node-core" /> : null}
      {status === 'blocked' ? (
        <svg
          width={inner}
          height={inner}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <ShellGlyphMarks name="alert-small" />
        </svg>
      ) : null}
      {status === 'failed' ? (
        <svg
          width={inner}
          height={inner}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <ShellGlyphMarks name="close-small" />
        </svg>
      ) : null}
    </span>
  );
}

export function TimelineSkeleton({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      role="status"
      aria-label="Loading activity"
      className={classNames('hg-timeline-skeleton', className)}
      style={style}
    >
      {['a', 'b', 'c', 'd'].map((row) => (
        <div key={row} className="hg-timeline-skeleton-row">
          <span className="hg-timeline-skeleton-node" />
          <div className="hg-timeline-skeleton-lines">
            <div className="hg-timeline-skeleton-bar" data-bar="title" />
            <div className="hg-timeline-skeleton-bar" data-bar="meta" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TimelineMessage({
  tone,
  title,
  message,
  onRetry,
  retryLabel,
  className,
  style,
}: {
  tone?: 'warning';
  title: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={classNames('hg-timeline-message', className)} style={style}>
      <span className="hg-timeline-message-mark" data-tone={tone ?? 'neutral'}>
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
        >
          <ShellGlyphMarks name={tone === 'warning' ? 'alert-circle' : 'clock-tall'} />
        </svg>
      </span>
      <div className="hg-timeline-message-title">{title}</div>
      {message ? <div className="hg-timeline-message-body">{message}</div> : null}
      <RetryButton onRetry={onRetry} label={retryLabel} />
    </div>
  );
}
