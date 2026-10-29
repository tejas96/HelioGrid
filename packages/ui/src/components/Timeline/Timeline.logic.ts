/* Timeline's sequence, the decisions both halves share: how a step is keyed, how far the rail is
   lit, and the node's and the message's glyphs. Pick mode's own decisions are `Timeline.pick.ts`. */

import type { TimelineItem } from './Timeline.types';

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

/** The glyph inside a node: 11 in a compact node, 15 in a page one. */
export function nodeGlyphSize(compact: boolean): number {
  return compact ? 11 : 15;
}

/** The message's mark: a warning says so; an empty sequence shows the clock. */
export function messageGlyphOf(tone: 'warning' | undefined): 'alert-circle' | 'clock-tall' {
  return tone === 'warning' ? 'alert-circle' : 'clock-tall';
}
