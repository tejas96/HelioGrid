import type { MenuItem, MenuProps } from './Menu.types';

/** The list's gap from its trigger — `Menu.css`'s `calc(100% + 6px)`, both ways. */
export const MENU_GAP = 6;

/** A chosen row's own act runs first; then the menu hears its key — `key ?? label`. */
export function actOnChoice(item: MenuItem, onSelect: MenuProps['onSelect']): void {
  item.onSelect?.();
  const key = item.key ?? item.label;
  if (onSelect !== undefined && key !== undefined) {
    onSelect(key);
  }
}

/**
 * Every menu's order: the safe rows as given, then the destructive ones, last and behind a gap —
 * so a delete is never the first row the keyboard lands on, and never sits among the safe acts.
 */
export function menuInSafeOrder(items: readonly MenuItem[]): MenuItem[] {
  const safe = items.filter((item) => item.destructive !== true);
  const risky = items.filter((item) => item.destructive === true);
  while (safe.at(-1)?.separator === true) safe.pop();
  if (risky.length === 0) return safe;
  if (safe.length === 0) return risky;
  return [...safe, { key: 'destructive-gap', separator: true }, ...risky];
}
