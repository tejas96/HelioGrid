/* Timeline (web) — a SEQUENCE, not a stream. A continuous rail runs through the nodes, lit up to
   the current step and dim beyond it, so it reads as a sequence rather than a list of dots.
   `variant="compact"` restores the v1 four-row form for sheets.

   An append-only activity log (13+ kinds, four actor CLASSES, hundreds of entries all `done`) is
   `ActivityStream`: the rail would light every node and say nothing, and `actor` as a free string
   cannot tell a person from the agent, the system or the customer (M07-03). */

import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import { UnavailableNote } from '../UnavailableNote';
import type { TimelineProps } from './Timeline.types';
import { TimelineMessage, TimelineSkeleton } from './TimelineParts';
import { TimelineStep } from './TimelineStep';

interface WebTimelineProps extends TimelineProps {
  className?: string;
  style?: CSSProperties;
}

export function Timeline({
  items = [],
  variant = 'page',
  density = 'expressive',
  state = 'ready',
  emptyTitle = 'No activity yet',
  emptyDescription = 'Steps appear here as the job moves.',
  errorTitle = "Couldn't load the activity",
  errorMessage = 'Tap Try again. If it keeps failing, tell your admin what you were doing.',
  onRetry,
  unavailableTitle = 'No sequence here',
  unavailableMessage,
  className,
  style,
}: WebTimelineProps) {
  if (state === 'loading') {
    return <TimelineSkeleton className={className} style={style} />;
  }
  if (state === 'error') {
    return (
      <TimelineMessage
        tone="warning"
        title={errorTitle}
        message={errorMessage}
        onRetry={onRetry}
        className={className}
        style={style}
      />
    );
  }
  if (state === 'unavailable') {
    return (
      <div className={className} style={style}>
        <UnavailableNote variant="region" title={unavailableTitle} message={unavailableMessage} />
      </div>
    );
  }
  if (state === 'empty' || items.length === 0) {
    return (
      <TimelineMessage
        title={emptyTitle}
        message={emptyDescription}
        className={className}
        style={style}
      />
    );
  }

  const compact = variant === 'compact';
  /* The rail is lit as far as the last done-or-current step and dim beyond it. */
  const lastLit = items.reduce(
    (acc, it, i) => (it.status === 'done' || it.status === 'current' ? i : acc),
    -1,
  );

  return (
    <ol
      className={classNames('hg-timeline', className)}
      data-variant={variant}
      data-density={density}
      style={style}
    >
      {items.map((it, i) => (
        <TimelineStep
          key={it.id ?? `${i}-${it.label}`}
          item={it}
          compact={compact}
          isLast={i === items.length - 1}
          railLit={i < lastLit}
        />
      ))}
    </ol>
  );
}
