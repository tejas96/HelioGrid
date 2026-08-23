import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';

const styles = StyleSheet.create({
  right: { alignItems: 'flex-end' },
  center: { alignItems: 'center' },
  roomy: { paddingVertical: 10 },
});

/**
 * A column sized by the caller's `width` where it gave one, and an even share of the remaining room
 * otherwise. **The wide form never scrolls sideways** — below `stackBelow` the table is already a
 * list of cards, so this form only ever runs where the columns fit.
 */
export function cellBox(width: number | string | undefined): StyleProp<ViewStyle> {
  return typeof width === 'number' ? { width } : { flex: 1, minWidth: 0 };
}

/** The cell's alignment, as the style that carries it. Shared by the header and the record rows. */
export function alignStyle(align: 'left' | 'right' | 'center'): StyleProp<ViewStyle> {
  if (align === 'right') return styles.right;
  return align === 'center' ? styles.center : null;
}

/**
 * **One cell of a record row.** It holds no value of its own — the value is its child. Its job is
 * the cell's shape: the column's width, its alignment, and the room a live cell needs.
 */
export function CellShell({
  width,
  align,
  gutter,
  roomy,
  children,
}: {
  width: number | string | undefined;
  align: 'left' | 'right' | 'center';
  gutter: number;
  roomy: boolean;
  children: ReactNode;
}) {
  return (
    <View
      style={[
        cellBox(width),
        { paddingHorizontal: gutter },
        roomy ? styles.roomy : null,
        alignStyle(align),
      ]}
    >
      {children}
    </View>
  );
}
