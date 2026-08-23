/* ReadAlongside (native) — the same arrangement rule, measured the same way: on ITS OWN width,
   never the viewport (law 4). `onLayout` is RN's ResizeObserver.

   The document is never dropped on the phone and never demoted to a thumbnail: "check this number
   against the sheet" is the whole task. */

import { theme } from '@heliogrid/theme';
import { cloneElement, isValidElement, useState } from 'react';
import type { DimensionValue, LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native';
import { Pressable as RNPressable, StyleSheet, View } from 'react-native';
import { MIN_TOUCH_TARGET } from '../../primitives/Pressable';
import { Text } from '../../primitives/Text/Text.native';
import type { ReadAlongsideProps, SourceDocumentProps } from './SourceDocument.types';

const styles = StyleSheet.create({
  root: { alignItems: 'flex-start', minWidth: 0 },
  side: { flexDirection: 'row' },
  doc: { width: '100%', minWidth: 0 },
  form: { width: '100%', minWidth: 0 },
  formSide: { flex: 1, width: 'auto' },
  toggle: {
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    marginTop: theme.spacing['sp-1'],
    paddingHorizontal: 10,
  },
  toggleWord: { fontWeight: '500', color: theme.colors.accent },
});

interface NativeReadAlongsideProps extends ReadAlongsideProps {
  style?: StyleProp<ViewStyle>;
}

export function ReadAlongside({
  document: doc,
  children,
  breakpoint = 720,
  documentWidth = '42%',
  stackedHeight = 300,
  expandedHeight = 560,
  expandLabel = 'Expand document',
  collapseLabel = 'Collapse document',
  gap = 20,
  label,
  style,
}: NativeReadAlongsideProps) {
  const [width, setWidth] = useState<number | null>(null);
  const [big, setBig] = useState(false);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const side = width === null || width >= breakpoint;
  const sized =
    isValidElement<SourceDocumentProps>(doc) && !side
      ? cloneElement(doc, { height: big ? expandedHeight : stackedHeight })
      : doc;

  /* `documentWidth` is the DS's `number | string`; RN narrows a percentage to DimensionValue. */
  const docWidth = documentWidth as DimensionValue;

  const documentColumn = (
    <View key="doc" style={[styles.doc, side ? { width: docWidth, flexShrink: 0 } : null]}>
      {sized}
      {side ? null : (
        <RNPressable
          accessibilityRole="button"
          accessibilityState={{ expanded: big }}
          onPress={() => setBig((b) => !b)}
          style={styles.toggle}
        >
          <Text variant="body-sm" style={styles.toggleWord}>
            {big ? collapseLabel : expandLabel}
          </Text>
        </RNPressable>
      )}
    </View>
  );

  const formColumn = (
    <View key="form" style={[styles.form, side ? styles.formSide : null]}>
      {children}
    </View>
  );

  /* Stacked: DOCUMENT FIRST — the source is the reference, and a reference under 40 fields is one
     nobody scrolls back to. Side by side: the form leads and the document sits on the right, the
     same visual order the web half reaches with CSS `order`. RN has no `order`, so the two columns
     are emitted in the order they are read. */
  return (
    /* `role="group"` is the web half's own element — a `<div role="group" aria-label>` — and it is
       what makes the name audible: a bare View carrying only `accessibilityLabel` is not an
       accessibility element, so the arrangement was named on paper and silent on a device. The
       role, never `accessible`: this View is two whole columns — the document with its paging and
       fit controls on one side, the caller's form on the other — and folding it would take every
       field on the screen out of the reader's reach. */
    <View
      onLayout={onLayout}
      role="group"
      accessibilityLabel={label || undefined}
      style={[styles.root, side ? styles.side : null, { gap }, style]}
    >
      {side ? [formColumn, documentColumn] : [documentColumn, formColumn]}
    </View>
  );
}
