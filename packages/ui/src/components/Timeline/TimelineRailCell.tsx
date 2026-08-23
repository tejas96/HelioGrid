/* Where one step sits on the rail (web) — its node, and the segment of rail that runs on to the
   next step. Lit as far as the last done-or-current step, dim beyond it; the last step draws no
   segment at all, because a rail that runs past the end says there is more sequence. */

import type { TimelineStatus } from './Timeline.types';
import { TimelineNode } from './TimelineParts';

export function TimelineRailCell({
  status,
  compact,
  isLast,
  railLit,
}: {
  status?: TimelineStatus;
  compact: boolean;
  isLast: boolean;
  railLit: boolean;
}) {
  return (
    <div className="hg-timeline-rail-cell">
      <TimelineNode status={status} compact={compact} />
      {isLast ? null : (
        <span
          aria-hidden="true"
          className="hg-timeline-rail"
          data-lit={railLit ? 'true' : undefined}
        />
      )}
    </div>
  );
}
