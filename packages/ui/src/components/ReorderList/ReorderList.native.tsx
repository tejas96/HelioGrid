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

import { useEffect, useRef } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { AccessibilityInfo, findNodeHandle, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { controlsPlacement, defaultKeyOf } from './ReorderList.defaults';
import type { FocusableControl } from './ReorderList.focus';
import { controlId, deleteFocusTarget, moveFocusTarget } from './ReorderList.focus';
import type { ReorderListProps } from './ReorderList.types';
import { REORDER_PADS, ReorderRow } from './ReorderRow.native';
import { useReorderActs } from './use-reorder-acts';

interface NativeReorderListProps<T> extends ReorderListProps<T> {
  style?: StyleProp<ViewStyle>;
}

interface ControlRef {
  node: View | null;
  enabled: boolean;
}

export function ReorderList<T>(props: NativeReorderListProps<T>) {
  const {
    items = [],
    keyOf = defaultKeyOf,
    labelOf,
    renderItem,
    label,
    emptyMessage,
    words,
    controls,
    actionOf,
    density = 'expressive',
    style,
  } = props;
  const D = REORDER_PADS[density];
  const placement = controlsPlacement(controls, density);
  const { flash, clearFlash, takePending, move, remove, lockFor, deletable } = useReorderActs(
    props,
    AccessibilityInfo.announceForAccessibility,
  );
  const refs = useRef<Record<string, ControlRef>>({});
  const listRef = useRef<View | null>(null);

  /* `keyOf` is read through a ref rather than depended on, because it is only ever needed at the
     moment the effect below runs. Callers pass it inline, so depending on its identity would fire
     the effect on renders where the order did NOT change and consume the pending move early. */
  const keyOfRef = useRef(keyOf);
  keyOfRef.current = keyOf;

  /* Focus is restored AFTER the caller's new order has rendered — `items` is the only honest
     trigger, exactly as on the web half. */
  useEffect(() => {
    const p = takePending();
    if (!p) {
      return;
    }
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
  }, [items, takePending]);

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
            words={words}
            body={renderItem ? renderItem(it, i) : <Text variant="body">{name}</Text>}
            lock={lockFor(it, i)}
            deletable={deletable(it, i)}
            placement={placement}
            action={placement === 'foot' && actionOf ? actionOf(it, i) : null}
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
