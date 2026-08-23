/* ReorderList (native) — AN AUTHORED ORDER, arrows not drag, and the same three announcements.

   Three web mechanisms are mapped rather than dropped:
   · the polite live region has no RN element, so the same sentence goes through
     `AccessibilityInfo.announceForAccessibility` — one announcement per act, the row's name in
     every one of them;
   · `element.focus()` has no RN equivalent, so focus travels with
     `AccessibilityInfo.setAccessibilityFocus(findNodeHandle(ref))` — the same rule, walked by the
     same `ReorderList.focus.ts` as the web half: the button that was pressed, which travels with
     the row, then the opposite arrow, then the nearest delete either side, then the list itself;
   · `onTransitionEnd` — which is what CLEARS the move flash on the web half — has no RN partner
     either, so the row runs the same --dur-emphasised fade through Animated and reports its
     completion callback as `onFlashEnd`. Without it the accent stayed lit on the last-moved row
     for good, reading as a selection that could not be dismissed. */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { AccessibilityInfo, findNodeHandle, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
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
import { REORDER_PADS, ReorderRow } from './ReorderRow.native';

interface NativeReorderListProps<T> extends ReorderListProps<T> {
  style?: StyleProp<ViewStyle>;
}

type Pending =
  | { kind: 'move'; key: string | number; dir: MoveDirection }
  | { kind: 'delete'; index: number };

interface ControlRef {
  node: View | null;
  enabled: boolean;
}

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
  style,
}: NativeReorderListProps<T>) {
  const D = REORDER_PADS[density];
  const stack = (controls ?? (density === 'functional' ? 'row' : 'stack')) === 'stack';
  const [flash, setFlash] = useState<string | number | null>(null);
  const refs = useRef<Record<string, ControlRef>>({});
  const listRef = useRef<View | null>(null);
  const pending = useRef<Pending | null>(null);

  /* The row drives its own fade and reports the end of it, so this identity must be STABLE: an
     inline arrow would be a new prop on every render and restart the fade the row is in the
     middle of, which is the one way this clear could fail to arrive. */
  const clearFlash = useCallback(() => setFlash(null), []);

  /* `keyOf` is read through a ref rather than depended on, because it is only ever needed at the
     moment the effect below runs. Callers pass it inline, so depending on its identity would fire
     the effect on renders where the order did NOT change and consume the pending move early. */
  const keyOfRef = useRef(keyOf);
  keyOfRef.current = keyOf;

  /* Focus is restored AFTER the caller's new order has rendered — `items` is the only honest
     trigger, exactly as on the web half. */
  useEffect(() => {
    const p = pending.current;
    if (!p) {
      return;
    }
    pending.current = null;
    const focusOn = (node: View | null) => {
      const handle = node ? findNodeHandle(node) : null;
      if (handle !== null) {
        AccessibilityInfo.setAccessibilityFocus(handle);
      }
    };
    /* A control the end of the list has marked disabled has something to SAY; it does not receive
       focus. */
    const canFocus: FocusableControl<View> = (id) =>
      refs.current[id]?.enabled ? (refs.current[id]?.node ?? null) : null;
    const node =
      p.kind === 'move'
        ? /* Nothing on the row can take focus: the pressed arrow keeps it even disabled, and only
             then the opposite one — the list is the last resort, not the second. */
          (moveFocusTarget(p.key, p.dir, canFocus) ??
          refs.current[controlId(p.key, p.dir)]?.node ??
          refs.current[controlId(p.key, p.dir === 'up' ? 'down' : 'up')]?.node ??
          null)
        : deleteFocusTarget(
            items.map((it, i) => keyOfRef.current(it, i)),
            p.index,
            canFocus,
          );
    focusOn(node ?? listRef.current);
  }, [items]);

  const move = (i: number, dir: MoveDirection) => {
    const item = items[i];
    if (item === undefined) {
      return;
    }
    const to = dir === 'up' ? i - 1 : i + 1;
    const name = labelOf(item, i);
    if (to < 0 || to >= items.length) {
      AccessibilityInfo.announceForAccessibility(atEndSentence(name, dir));
      return;
    }
    const key = keyOf(item, i);
    pending.current = { kind: 'move', key, dir };
    setFlash(key);
    AccessibilityInfo.announceForAccessibility(movedSentence(name, to, items.length));
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
    AccessibilityInfo.announceForAccessibility(deletedSentence(name, items.length - 1, itemNoun));
    onDelete?.(key, i);
  };

  const lockFor = (it: T, i: number) => (lockOf ? lockOf(it, i) : null);
  const deletable = (it: T, i: number) =>
    Boolean(onDelete) && items.length > minItems && !lockFor(it, i) && (canDelete?.(it, i) ?? true);

  if (items.length === 0) {
    return (
      <View
        ref={listRef}
        accessible
        accessibilityLabel={emptyMessage}
        style={[{ paddingVertical: D.padding }, style]}
      >
        <Text variant="body-sm" color="secondary">
          {emptyMessage}
        </Text>
      </View>
    );
  }

  return (
    <View
      ref={listRef}
      accessibilityRole="list"
      accessibilityLabel={label}
      style={[{ rowGap: D.gap }, style]}
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
            body={renderItem ? renderItem(it, i) : <Text variant="body">{name}</Text>}
            lock={lockFor(it, i)}
            deletable={deletable(it, i)}
            stack={stack}
            density={density}
            flashing={flash === key}
            onFlashEnd={clearFlash}
            onMove={(dir) => move(i, dir)}
            onDelete={() => remove(i)}
            registerControl={(suffix, node, enabled) => {
              refs.current[controlId(key, suffix)] = { node, enabled };
            }}
          />
        );
      })}
    </View>
  );
}
