/* Timeline's node, skeleton and message (web). Split out by responsibility — the sequence itself
   is Timeline.tsx.

   Status is never colour alone: each state carries its own glyph inside the node — a tick for
   `done`, a filled dot for `current`, a bang for `blocked`, a cross for `failed` — and `upcoming`
   is hollow, which is its own shape. */

import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import { Pressable } from '../../primitives/Pressable';
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
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M2.5 6.5 5 9l4.5-5" />
        </svg>
      ) : null}
      {status === 'current' ? <span className="hg-timeline-node-core" /> : null}
      {status === 'blocked' ? (
        <svg
          width={inner}
          height={inner}
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M6 3v3.5M6 9h.01" />
        </svg>
      ) : null}
      {status === 'failed' ? (
        <svg
          width={inner}
          height={inner}
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M3.5 3.5l5 5M8.5 3.5l-5 5" />
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
  className,
  style,
}: {
  tone?: 'warning';
  title: string;
  message?: string;
  onRetry?: () => void;
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
          {tone === 'warning' ? (
            <>
              <path d="M12 9v4M12 17h.01" />
              <circle cx="12" cy="12" r="9" />
            </>
          ) : (
            <>
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </>
          )}
        </svg>
      </span>
      <div className="hg-timeline-message-title">{title}</div>
      {message ? <div className="hg-timeline-message-body">{message}</div> : null}
      {onRetry ? (
        <Pressable className="hg-timeline-retry" onPress={onRetry}>
          Try again
        </Pressable>
      ) : null}
    </div>
  );
}
