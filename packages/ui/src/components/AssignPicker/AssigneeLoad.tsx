import type { CSSProperties } from 'react';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import type { AssigneeLoadProps } from './AssignPicker.types';

/** The share rides in as a custom property, so the bar's geometry stays in AssignPicker.css. */
type BarVars = CSSProperties & Record<`--${string}`, string>;

/**
 * One person's load (`M02-28`): open leads, overdue tasks — with the warning glyph when any are
 * overdue, so you do not bury someone — and a bar of their share of the busiest load. The bar
 * repeats the words and is hidden from a screen reader.
 */
export function AssigneeLoad({ openCount, overdueCount, share, words }: AssigneeLoadProps) {
  const bar: BarVars = { '--hg-assignee-load-share': `${share}` };
  return (
    <span className="hg-assignee-load">
      <span className="hg-assignee-load-counts">
        <span className="hg-assignee-load-open">{words.open(openCount)}</span>
        <span
          className="hg-assignee-load-overdue"
          data-late={overdueCount > 0 ? 'true' : undefined}
        >
          {overdueCount > 0 ? <ShellGlyph name="alert-triangle" size="sm" tone="warning" /> : null}
          {words.overdue(overdueCount)}
        </span>
      </span>
      <span className="hg-assignee-load-bar" aria-hidden="true">
        <span className="hg-assignee-load-fill" style={bar} />
      </span>
    </span>
  );
}
