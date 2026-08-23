import type { MenuItem } from './Menu.types';

export interface MenuWalkEntry {
  item: MenuItem;
  /** Position in the ORIGINAL items array — separators and skipped items keep their slots. */
  index: number;
}

/** True when the item states why it is off. Matches what `renderActionReason` will actually draw. */
export function hasReason(item: MenuItem): boolean {
  return Boolean(item.disabledReason);
}

/**
 * The roving walk. An item with a stated reason STAYS REACHABLE — it must be landed on, or the
 * sentence explaining it is announced to nobody. An item that is off with no reason is skipped.
 */
export function walkableItems(items: readonly MenuItem[]): MenuWalkEntry[] {
  return items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.separator !== true && (item.disabled !== true || hasReason(item)));
}

/** Arrow-key movement with wrap, in the ORIGINAL index space. `null` = nothing to move to. */
export function moveActive(
  entries: readonly MenuWalkEntry[],
  active: number,
  direction: 1 | -1,
): number | null {
  if (entries.length === 0) {
    return null;
  }
  const position = entries.findIndex((entry) => entry.index === active);
  const next = entries[(position + direction + entries.length) % entries.length];
  return next === undefined ? null : next.index;
}

/** Type-ahead on the first letter, exactly as the reference matches it. */
export function findByFirstLetter(entries: readonly MenuWalkEntry[], key: string): number | null {
  const hit = entries.find(({ item }) =>
    (item.label ?? '').toLowerCase().startsWith(key.toLowerCase()),
  );
  return hit === undefined ? null : hit.index;
}

export type MenuKeyAction = 'close-restore' | 'close-quiet' | 'move' | 'none';

export interface MenuKeyResult {
  action: MenuKeyAction;
  /** Set when `action` is `move`: the ORIGINAL index the walk lands on. */
  index?: number;
  preventDefault: boolean;
}

const IDLE: MenuKeyResult = { action: 'none', preventDefault: false };

function move(index: number | null): MenuKeyResult {
  return index === null
    ? { ...IDLE, preventDefault: true }
    : { action: 'move', index, preventDefault: true };
}

/**
 * The whole keyboard contract in one pure function, shared by both platform halves so the walk
 * cannot drift: Escape closes and restores focus, arrows wrap, Home/End jump, Tab closes WITHOUT
 * pulling focus back (it is already going somewhere), and any single character types ahead.
 */
export function resolveMenuKey(
  key: string,
  entries: readonly MenuWalkEntry[],
  active: number,
): MenuKeyResult {
  if (key === 'Escape') {
    return { action: 'close-restore', preventDefault: true };
  }
  if (key === 'ArrowDown') {
    return move(moveActive(entries, active, 1));
  }
  if (key === 'ArrowUp') {
    return move(moveActive(entries, active, -1));
  }
  if (key === 'Home') {
    return move(entries[0]?.index ?? null);
  }
  if (key === 'End') {
    return move(entries[entries.length - 1]?.index ?? null);
  }
  if (key === 'Tab') {
    return { action: 'close-quiet', preventDefault: false };
  }
  if (key.length === 1) {
    const index = findByFirstLetter(entries, key);
    return index === null ? IDLE : { action: 'move', index, preventDefault: false };
  }
  return IDLE;
}

/** The React key for a row. `key ?? label` is the reference's identity, index the last resort. */
export function menuRowKey(item: MenuItem, index: number): string {
  return item.key ?? item.label ?? `item-${index}`;
}
