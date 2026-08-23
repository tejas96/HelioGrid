import { theme } from '@heliogrid/theme';
import type { ReactElement } from 'react';
import { Children, cloneElement, isValidElement, useEffect, useState } from 'react';
import type { LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import type { SheetActionsProps } from './Sheet.types';

interface NativeSheetActionsProps extends SheetActionsProps {
  style?: StyleProp<ViewStyle>;
}

/** Every action this row stacks is a Button-shaped child; `fullWidth` is what it hands them. */
type FullWidthChild = ReactElement<{ fullWidth?: boolean }>;

/**
 * Footer action row for Sheet/Modal/DetailPanel. Measures ITS OWN width, never the screen: below
 * `stackBelow` the actions stack full-width, primary on top, and the answer is published through
 * `onFormChange({stacked, width})` exactly as the web half publishes it.
 *
 * WEB→TOUCH MAPPING: `ResizeObserver` has no RN equivalent, so `onLayout` is the measurement — it
 * fires on mount and on every re-layout of this row, which is the same signal for the same box.
 */
export function SheetActions({
  children,
  stackBelow = 320,
  onFormChange,
  style,
}: NativeSheetActionsProps) {
  const [own, setOwn] = useState<number | null>(null);
  const stacked = own !== null && own < stackBelow;

  // biome-ignore lint/correctness/useExhaustiveDependencies: the reference publishes on the ANSWER changing, not on a new callback identity — adding onFormChange here would re-fire on every render of a caller passing an inline arrow.
  useEffect(() => {
    if (own !== null && onFormChange !== undefined) {
      onFormChange({ stacked, width: own });
    }
  }, [stacked, own]);

  const onLayout = (event: LayoutChangeEvent) => setOwn(event.nativeEvent.layout.width);

  return (
    <View onLayout={onLayout} style={[styles.row, stacked ? styles.stacked : styles.side, style]}>
      {Children.map(children, (child) =>
        isValidElement(child) ? (
          <View style={stacked ? styles.slotStacked : styles.slot}>
            {cloneElement(child as FullWidthChild, { fullWidth: true })}
          </View>
        ) : (
          child
        ),
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  /* column-reverse puts the primary — the LAST child, as the reference orders them — on top. */
  stacked: {
    flexDirection: 'column-reverse',
    gap: theme.spacing['sp-2'],
  },
  side: {
    gap: theme.spacing['sp-3'],
  },
  slot: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
    overflow: 'hidden',
  },
  slotStacked: {
    flexGrow: 0,
    flexShrink: 0,
    overflow: 'hidden',
  },
});
