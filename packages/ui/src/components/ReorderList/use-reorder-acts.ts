import type { TranslatedText } from '@heliogrid/contracts';
import { useCallback, useRef, useState } from 'react';
import type { MoveDirection } from './ReorderList.defaults';
import { atEndSentence, defaultKeyOf } from './ReorderList.defaults';
import type { ReorderListProps } from './ReorderList.types';

/** The act whose focus is restored once the caller's new order has rendered. */
export type PendingFocus =
  | { kind: 'move'; key: string | number; dir: MoveDirection }
  | { kind: 'delete'; index: number };

/**
 * The list's two acts and what each says, the same on both platforms; `say` is the half's own
 * channel — a live region on the web, an announcement on the phone. A move flashes the row it
 * moved; either act leaves its focus pending for the half to restore after the new order renders.
 */
export function useReorderActs<T>(
  {
    items = [],
    keyOf = defaultKeyOf,
    labelOf,
    onMove,
    onDelete,
    canDelete,
    lockOf,
    minItems = 0,
    itemNoun,
    words,
  }: ReorderListProps<T>,
  say: (sentence: TranslatedText) => void,
) {
  const [flash, setFlash] = useState<string | number | null>(null);
  const pending = useRef<PendingFocus | null>(null);
  /* The row reports the end of its fade through this, so its identity must be STABLE: an inline
     arrow would be a new prop on every render and restart the fade the row is in the middle of,
     which is the one way this clear could fail to arrive. */
  const clearFlash = useCallback(() => setFlash(null), []);
  /** The pending focus, handed over once — the half restores it after the new order renders. */
  const takePending = useCallback(() => {
    const p = pending.current;
    pending.current = null;
    return p;
  }, []);

  const move = (i: number, dir: MoveDirection) => {
    const item = items[i];
    if (item === undefined) {
      return;
    }
    const to = dir === 'up' ? i - 1 : i + 1;
    const name = labelOf(item, i);
    if (to < 0 || to >= items.length) {
      say(atEndSentence(words, name, dir));
      return;
    }
    const key = keyOf(item, i);
    pending.current = { kind: 'move', key, dir };
    setFlash(key);
    say(words.moved(name, to + 1, items.length));
    onMove?.(key, i, to);
  };

  const remove = (i: number) => {
    const item = items[i];
    if (item === undefined) {
      return;
    }
    const name = labelOf(item, i);
    const key = keyOf(item, i);
    pending.current = { kind: 'delete', index: i };
    say(words.deleted(name, items.length - 1, itemNoun));
    onDelete?.(key, i);
  };

  const lockFor = (it: T, i: number) => (lockOf ? lockOf(it, i) : null);
  const deletable = (it: T, i: number) =>
    Boolean(onDelete) && items.length > minItems && !lockFor(it, i) && (canDelete?.(it, i) ?? true);

  return { flash, clearFlash, takePending, move, remove, lockFor, deletable };
}
