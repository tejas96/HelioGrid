/* Timeline (web) — a SEQUENCE, not a stream. A continuous rail runs through the nodes, lit up to
   the current step and dim beyond it, so it reads as a sequence rather than a list of dots.
   `variant="compact"` restores the v1 four-row form for sheets. With `onChange` the chain is a
   radio group instead (`TimelinePick.tsx`).

   An append-only activity log (13+ kinds, four actor CLASSES, hundreds of entries all `done`) is
   `ActivityStream`: the rail would light every node and say nothing, and `actor` as a free string
   cannot tell a person from the agent, the system or the customer (M07-03). */

import type { CSSProperties } from 'react';
import { useRef } from 'react';
import { classNames } from '../../primitives/class-names';
import type { FocusAfter } from '../../primitives/FocusAfter';
import { UnavailableNote } from '../UnavailableNote';
import { retryOf, surfaceStateOf } from '../UnavailableNote/UnavailableNote.read';
import { lastLitIndex, stepKeyOf } from './Timeline.logic';
import type { TimelineProps } from './Timeline.types';
import type { TimelineRoot } from './TimelineParts';
import { TimelineMessage, TimelineSkeleton } from './TimelineParts';
import { TimelinePick } from './TimelinePick';
import { TimelineStep } from './TimelineStep';

type WebTimelineProps = TimelineProps & {
  className?: string;
  style?: CSSProperties;
};

export function Timeline(props: WebTimelineProps) {
  const { read, className, style } = props;
  const frame = useRef<HTMLDivElement>(null);
  /* A timeline that shows no read is no stop at all: its one state is its root, with no tabindex. */
  if (read === undefined) {
    return <TimelineState {...props} root={{ className, style }} focusAfter={frame} />;
  }
  /* A read's states share one frame, which outlives every one of them: focus lands here once the
     retry has left, and stays while the list replaces the skeleton. */
  return (
    <div
      ref={frame}
      tabIndex={-1}
      className={classNames('hg-focus-target', className)}
      style={style}
    >
      <TimelineState {...props} root={{}} focusAfter={frame} />
    </div>
  );
}

function TimelineState({
  items = [],
  variant = 'page',
  density = 'expressive',
  read,
  loadingLabel,
  emptyTitle,
  emptyDescription,
  errorTitle,
  errorMessage,
  retryLabel,
  unavailableTitle,
  unavailableMessage,
  value,
  onChange,
  label,
  root,
  focusAfter,
}: TimelineProps & { root: TimelineRoot; focusAfter: FocusAfter }) {
  const state = surfaceStateOf(read);
  const onRetry = retryOf(read);
  if (state === 'loading') {
    return <TimelineSkeleton label={loadingLabel} root={root} />;
  }
  if (state === 'error') {
    return (
      <TimelineMessage
        tone="warning"
        title={errorTitle}
        message={errorMessage}
        onRetry={onRetry}
        retryLabel={retryLabel}
        focusAfter={focusAfter}
        root={root}
      />
    );
  }
  if (state === 'unavailable') {
    return (
      <div className={root.className} style={root.style}>
        {unavailableTitle !== undefined ? (
          <UnavailableNote variant="region" title={unavailableTitle} message={unavailableMessage} />
        ) : null}
      </div>
    );
  }
  if (state === 'empty' || items.length === 0) {
    return (
      <TimelineMessage
        title={emptyTitle}
        message={emptyDescription}
        focusAfter={focusAfter}
        root={root}
      />
    );
  }

  if (onChange) {
    return (
      <TimelinePick
        items={items}
        value={value}
        onChange={onChange}
        label={label}
        density={density}
        root={root}
      />
    );
  }

  const compact = variant === 'compact';
  const lastLit = lastLitIndex(items);

  return (
    <ol
      className={classNames('hg-timeline', root.className)}
      data-variant={variant}
      data-density={density}
      style={root.style}
    >
      {items.map((it, i) => (
        <TimelineStep
          key={stepKeyOf(it, i)}
          item={it}
          compact={compact}
          isLast={i === items.length - 1}
          railLit={i < lastLit}
        />
      ))}
    </ol>
  );
}
