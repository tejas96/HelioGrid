import { clampCount } from '../../utils/count';
import { reasonText } from '../ActionReason/ActionReason.logic';
import type { Tab } from './Tabs.types';

/**
 * A tab count is NAVIGATIONAL — the reader needs to know there are more than they will read,
 * not how many. A total that must be read exactly belongs on a control that does not clamp.
 */
export const TAB_COUNT_MAX = 99;

/** A tab's count as drawn — `99+` above `TAB_COUNT_MAX`. */
export function tabCountText(count: number): string {
  return clampCount(count, TAB_COUNT_MAX);
}

/**
 * Mirrors `!spec` at the design system's own call sites: a tab is "reasoned" only when there is
 * something to say, and that is what keeps it `aria-disabled` and focusable rather than natively
 * `disabled` (law 9). The sentence itself is `ActionReason`'s and the marks are `MarkRow`'s.
 */
export function hasReason(tab: Tab): boolean {
  return reasonText(tab.disabledReason) !== null;
}

/** The off tabs that say why — each one's sentence is drawn under the strip. */
export function reasonedTabs(tabs: Tab[]): Tab[] {
  return tabs.filter((tab) => tab.disabled === true && hasReason(tab));
}
