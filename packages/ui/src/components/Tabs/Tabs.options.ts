/**
 * A tab count is NAVIGATIONAL — the reader needs to know there are more than they will read,
 * not how many. A total that must be read exactly belongs on a control that does not clamp.
 */
export const TAB_COUNT_MAX = 99;

import type { Tab, TabsProps } from './Tabs.types';

/** A bare string is `{value, label}` — the design system's own shorthand, in one declaration. */
export function normalise(tabs: TabsProps['tabs']): Tab[] {
  return tabs.map((tab) => (typeof tab === 'string' ? { value: tab, label: tab } : tab));
}

/**
 * Mirrors `!spec` at the design system's own call sites: a tab is "reasoned" only when there is
 * something to say, and that is what keeps it `aria-disabled` and focusable rather than natively
 * `disabled` (law 9). The sentence itself is `ActionReason`'s and the marks are `MarkRow`'s.
 */
export function hasReason(tab: Tab): boolean {
  const spec = tab.disabledReason;
  return spec !== undefined && spec !== null && spec !== false && spec !== '';
}
