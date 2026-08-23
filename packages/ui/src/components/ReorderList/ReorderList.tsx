/* ReorderList (web) — AN AUTHORED ORDER, and the only component in the system that changes one.

   ARROWS, NOT DRAG: HTML5 drag fires on neither a keyboard nor a touch screen, and this list's
   stated home is 375px. Every target is 44×44 and nothing is hover-only — `ReorderRow` owns that.

   WHERE FOCUS GOES is `ReorderList.focus.ts`: on the button that was pressed, WHICH TRAVELS WITH
   THE ROW — the row is keyed by id, so pressing ⌄ three times moves one row three places under one
   finger. If that button is now aria-disabled, focus moves to the OPPOSITE arrow of the same row.
   After a delete it lands on the delete button of the row that took its place — or, when that row
   is LOCKED and therefore has no delete button, on that row's own move arrow, then the nearest
   delete either side, and only then the list itself, which is focusable for exactly that case. */

import type { CSSProperties } from 'react';
import { useEffect, useRef, useState } from 'react';
import { classNames } from '../../primitives/class-names';
import type { MoveDirection } from './ReorderList.defaults';
import {
  atEndSentence,
  defaultKeyOf,
  defaultLabelOf,
  deletedSentence,
  movedSentence,
} from './ReorderList.defaults';
import type { FocusableControl } from './ReorderList.focus';
import { controlId, deleteFocusTarget, moveFocusTarget } from './ReorderList.focus';
import type { ReorderListProps } from './ReorderList.types';
import { ReorderRow } from './ReorderRow';

interface WebReorderListProps<T> extends ReorderListProps<T> {
  className?: string;
  style?: CSSProperties;
}

type Pending =
  | { kind: 'move'; key: string | number; dir: MoveDirection }
  | { kind: 'delete'; index: number };

export function ReorderList<T>({
  items = [],
  keyOf = defaultKeyOf,
  labelOf = defaultLabelOf,
  renderItem,
  onMove,
  onDelete,
  canDelete,
  lockOf,
  minItems = 0,
  label = 'Ordered list',
  itemNoun = 'rows',
  emptyMessage = 'No rows yet.',
  controls,
  density = 'expressive',
  className,
  style,
}: WebReorderListProps<T>) {
  const stack = (controls ?? (density === 'functional' ? 'row' : 'stack')) === 'stack';
  const [say, setSay] = useState('');
  const [flash, setFlash] = useState<string | number | null>(null);
  const btns = useRef<Record<string, HTMLButtonElement | null>>({});
  const listRef = useRef<HTMLElement | null>(null);
  const pending = useRef<Pending | null>(null);

  /* `keyOf` is read through a ref rather than depended on, because it is only ever needed at the
     moment the effect below runs. Callers pass it inline, so depending on its identity would fire
     the effect on renders where the order did NOT change and consume the pending move early. */
  const keyOfRef = useRef(keyOf);
  keyOfRef.current = keyOf;

  /* Focus is restored AFTER the caller's new order has rendered, because the button that must hold
     focus is the one that moved. `items` is the only honest trigger. */
  useEffect(() => {
    const p = pending.current;
    if (!p) {
      return;
    }
    pending.current = null;
    /* A control the end of the list has aria-disabled has something to SAY; it does not receive
       focus. That is why this reads the attribute rather than the native `disabled`. */
    const canFocus: FocusableControl<HTMLButtonElement> = (id) => {
      const b = btns.current[id];
      return b && b.getAttribute('aria-disabled') !== 'true' ? b : null;
    };
    const el =
      p.kind === 'move'
        ? /* Nothing on the row can take focus: the pressed arrow keeps it even disabled, and only
             then the opposite one — the list is the last resort, not the second. */
          (moveFocusTarget(p.key, p.dir, canFocus) ??
          btns.current[controlId(p.key, p.dir)] ??
          btns.current[controlId(p.key, p.dir === 'up' ? 'down' : 'up')] ??
          null)
        : deleteFocusTarget(
            items.map((it, i) => keyOfRef.current(it, i)),
            p.index,
            canFocus,
          );
    if (el) {
      el.focus();
    } else {
      listRef.current?.focus();
    }
  }, [items]);

  const move = (i: number, dir: MoveDirection) => {
    const item = items[i];
    if (item === undefined) {
      return;
    }
    const to = dir === 'up' ? i - 1 : i + 1;
    const name = labelOf(item, i);
    if (to < 0 || to >= items.length) {
      setSay(atEndSentence(name, dir));
      return;
    }
    const key = keyOf(item, i);
    pending.current = { kind: 'move', key, dir };
    setFlash(key);
    setSay(movedSentence(name, to, items.length));
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
    setSay(deletedSentence(name, items.length - 1, itemNoun));
    onDelete?.(key, i);
  };

  const lockFor = (it: T, i: number) => (lockOf ? lockOf(it, i) : null);
  const deletable = (it: T, i: number) =>
    Boolean(onDelete) && items.length > minItems && !lockFor(it, i) && (canDelete?.(it, i) ?? true);

  return (
    <div className={classNames('hg-reorder-list', className)} style={style}>
      {/* One live region for the list. Assertive would interrupt a field the user is typing in. */}
      <span role="status" aria-live="polite" className="hg-reorder-sr">
        {say}
      </span>

      {items.length === 0 ? (
        <p
          ref={(el) => {
            listRef.current = el;
          }}
          tabIndex={-1}
          className="hg-reorder-empty"
          data-density={density}
        >
          {emptyMessage}
        </p>
      ) : (
        <ol
          ref={(el) => {
            listRef.current = el;
          }}
          tabIndex={-1}
          aria-label={label}
          className="hg-reorder-rows"
          data-density={density}
        >
          {items.map((it, i) => {
            const key = keyOf(it, i);
            const name = labelOf(it, i);
            return (
              <ReorderRow
                key={key}
                index={i}
                total={items.length}
                name={name}
                body={renderItem ? renderItem(it, i) : name}
                lock={lockFor(it, i)}
                deletable={deletable(it, i)}
                stack={stack}
                density={density}
                flashing={flash === key}
                onFlashEnd={() => setFlash(null)}
                onMove={(dir) => move(i, dir)}
                onDelete={() => remove(i)}
                registerControl={(suffix, el) => {
                  btns.current[controlId(key, suffix)] = el;
                }}
              />
            );
          })}
        </ol>
      )}
    </div>
  );
}
