/* One step of the sequence (web) — its place on the rail, and what it says: the label and its
   meta, the description, who did it, and any node the caller hung under it.

   `actor` is a free string and that is the limit of what this component claims about it; an entry
   whose actor is not a person belongs in `ActivityStream` (M07-03). */

import type { TimelineItem } from './Timeline.types';
import { TimelineRailCell } from './TimelineRailCell';

export function TimelineStep({
  item,
  compact,
  isLast,
  railLit,
}: {
  item: TimelineItem;
  compact: boolean;
  isLast: boolean;
  railLit: boolean;
}) {
  return (
    <li className="hg-timeline-step" data-last={isLast ? 'true' : undefined}>
      <TimelineRailCell status={item.status} compact={compact} isLast={isLast} railLit={railLit} />
      <div className="hg-timeline-body">
        <div className="hg-timeline-head">
          <span
            className="hg-timeline-label"
            data-current={item.status === 'current' ? 'true' : undefined}
            data-status={item.status ?? 'upcoming'}
          >
            {item.label}
          </span>
          {item.meta ? <span className="hg-timeline-meta">{item.meta}</span> : null}
        </div>
        {item.description ? <p className="hg-timeline-description">{item.description}</p> : null}
        {item.actor ? (
          <div className="hg-timeline-actor">
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="8" r="3.5" />
              <path d="M5 20a7 7 0 0 1 14 0" />
            </svg>
            {item.actor}
          </div>
        ) : null}
        {item.content ? <div className="hg-timeline-content">{item.content}</div> : null}
      </div>
    </li>
  );
}
