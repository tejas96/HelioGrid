/* Timeline's sequence, the decisions both halves share: how a step is keyed, how far the rail is
   lit, and the node's and the message's glyphs. Pick mode's own decisions are `Timeline.pick.ts`. */

import type { ShellGlyphName, ShellGlyphSize } from '../AppShell/AppShell.types';
import type { TimelineItem, TimelineStatus } from './Timeline.types';

/** A step's key: its id, else its place and its label. */
export function stepKeyOf(item: TimelineItem, index: number): string {
  return item.id ?? `${index}-${item.label}`;
}

/** The rail is lit as far as the last done-or-current step and dim beyond it; -1 when none is. */
export function lastLitIndex(items: readonly TimelineItem[]): number {
  return items.reduce(
    (acc, it, i) => (it.status === 'done' || it.status === 'current' ? i : acc),
    -1,
  );
}

/** The glyph inside a node: the smallest step in a compact node, the dense one in a page one. */
export function nodeGlyphSize(compact: boolean): ShellGlyphSize {
  return compact ? 'xs' : 'dense';
}

/** The mark a settled node draws; the current one draws its dot or its own glyph instead. */
export const NODE_GLYPH: Partial<Record<TimelineStatus, ShellGlyphName>> = {
  done: 'check',
  skipped: 'chevron-right',
  blocked: 'alert',
  failed: 'close',
};

/** The message's mark: a warning says so; an empty sequence shows the clock. */
export function messageGlyphOf(tone: 'warning' | undefined): 'alert-circle' | 'clock' {
  return tone === 'warning' ? 'alert-circle' : 'clock';
}
