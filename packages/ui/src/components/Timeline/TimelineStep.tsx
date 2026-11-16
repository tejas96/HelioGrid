/* One step of the sequence (web) — its place on the rail, and what it says: the label and its
   meta, the description, who did it, and any node the caller hung under it.

   `actor` is a free string and that is the limit of what this component claims about it; an entry
   whose actor is not a person belongs in `ActivityStream` (M07-03). */

import { ShellGlyph } from '../AppShell/ShellGlyph';
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
      <TimelineRailCell
        status={item.status}
        compact={compact}
        isLast={isLast}
        railLit={railLit}
        icon={item.icon}
      />
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
        {item.description ? (
          <p className="hg-timeline-description" data-tone={item.descriptionTone}>
            {item.descriptionTone === 'system' ? (
              <ShellGlyph name="spark" size="dense" tone="current" />
            ) : null}
            {item.description}
          </p>
        ) : null}
        {item.actor ? (
          <div className="hg-timeline-actor">
            <ShellGlyph name="user" size="dense" tone="current" />
            {item.actor}
          </div>
        ) : null}
        {item.content ? <div className="hg-timeline-content">{item.content}</div> : null}
      </div>
    </li>
  );
}
